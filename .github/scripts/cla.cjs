'use strict';

/*
 * Contributor License Agreement check.
 *
 * The person who opened a pull request and every author of its commits needs to be on
 * the team (anyone with access to this repository) or to have agreed to the CLA.
 * Agreeing is a comment on the pull request with the exact sentence below, by the
 * person themselves; the agreement is recorded in `signatures.json` on the
 * `cla-signatures` branch, so it is asked for once. The result is the `license/cla`
 * commit status of the pull request head.
 *
 * Runs only from the default branch (`workflow_run`, `issue_comment`) and never
 * checks out or runs pull request code: it reads the pull request through the API.
 */

const STATUS_CONTEXT = 'license/cla';
const SIGNATURES_BRANCH = 'cla-signatures';
const SIGNATURES_PATH = 'signatures.json';
const AGREEMENT_PATH = 'CLA.md';
// Raised with every change of the agreement, with the version line of CLA.md: earlier signatures no longer count.
const AGREEMENT_VERSION = 1;
const SENTENCE = 'I have read the JointJS Contributor License Agreement and I agree to it.';
// Identifies the comment of this check on a pull request, to update it.
const MARKER = '<!-- jointjs-cla-check -->';
// The separate comment thanking everyone once they have all agreed.
const THANKS_MARKER = '<!-- jointjs-cla-thanks -->';
// In the request once anyone was asked to agree, kept by every later update of it: whether
// the pull request gets the thanks, or only had a notice (too many commits, unlinked emails).
const ASKED_FLAG = '<!-- jointjs-cla-asked -->';
// The account the workflows comment as (their GITHUB_TOKEN).
const COMMENT_AUTHOR = 'github-actions[bot]';
// The pull request commits API returns at most this many commits.
const MAX_COMMITS = 250;
// Concurrent signatures: the file is written with the version it replaces, and retried.
const MAX_WRITE_ATTEMPTS = 5;
const RETRY_DELAY_MS = 250;
const CHECKED_BASES = new Set(['master', 'dev']);
const STATUS_DESCRIPTION_LENGTH = 140;

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

/** A text compared with the sentence: lower case, single spaces, no trailing period. */
function normalize(text) {
    return text.toLowerCase().replace(/\s+/g, ' ').trim().replace(/\.$/, '');
}

/**
 * Whether a comment agrees to the CLA: a line of it is the sentence - not a quotation,
 * nor inside an HTML comment (not shown on the page).
 */
function isSigningComment(body) {
    if (typeof body !== 'string') {
        return false;
    }
    const sentence = normalize(SENTENCE);
    const shown = body.replace(/<!--[\s\S]*?(-->|$)/g, '');
    return shown.split(/\r?\n/).some((line) => !line.trim().startsWith('>') && normalize(line) === sentence);
}

/** Whether an account is a bot. */
function isBot(user) {
    return user.type === 'Bot' || user.login.endsWith('[bot]');
}

/**
 * The people of a pull request who must be on the team or have agreed: the one who
 * opened it, the user whose fork holds its head branch, and the authors of its commits
 * (by the GitHub account of their email); and the commits whose author email is linked
 * to no account (they cannot agree).
 *
 * A commit author is known by an email anyone can write into a commit, so the accounts
 * GitHub vouches for - the one who opened the pull request and the owner of the fork
 * who pushes to it - are always among them, and mentioned in the comment. A bot is not
 * asked; a bot's email on a commit of a person's pull request leaves that person asked.
 *
 * `isStale`: the head moved on while the commits were read - a later run checks it.
 */
async function participantsOf(github, repo, pull) {
    if (typeof pull.commits !== 'number' || pull.commits > MAX_COMMITS) {
        return { users: [], unlinked: [], isTooLarge: true, isStale: false };
    }
    const users = new Map();
    const addAccount = (user) => {
        if (user && !isBot(user) && !users.has(user.id)) {
            users.set(user.id, { id: user.id, login: user.login, isMentioned: true });
        }
    };
    addAccount(pull.user);
    const headOwner = pull.head.repo?.owner;
    // A fork of an organization is pushed to by its members: none of them is known here.
    if (headOwner?.type === 'User' && headOwner.id !== pull.base.repo?.owner?.id) {
        addAccount(headOwner);
    }
    const commits = await github.paginate(github.rest.pulls.listCommits, { ...repo, pull_number: pull.number, per_page: 100 });
    if (!commits.some((commit) => commit.sha === pull.head.sha)) {
        return { users: [...users.values()], unlinked: [], isTooLarge: false, isStale: true };
    }
    if (commits.length < pull.commits) {
        return { users: [], unlinked: [], isTooLarge: true, isStale: false };
    }
    const unlinked = [];
    for (const commit of commits) {
        const { author } = commit;
        if (!author || typeof author.login !== 'string') {
            unlinked.push({ sha: commit.sha });
        } else if (!isBot(author) && !users.has(author.id)) {
            users.set(author.id, { id: author.id, login: author.login, isMentioned: false });
        }
    }
    return { users: [...users.values()], unlinked, isTooLarge: false, isStale: false };
}

/** Whether a user has access to this repository: the team does not sign. */
async function isTeamMember(github, repo, login) {
    try {
        await github.rest.repos.checkCollaborator({ ...repo, username: login });
        return true;
    } catch (error) {
        if (error.status === 404) {
            return false;
        }
        throw error;
    }
}

/** The recorded signatures and the version (blob SHA) of their file, none before the first. */
async function readSignatures(github, repo) {
    let file;
    try {
        // The full name: a tag of the same name never stands in for the branch.
        ({ data: file } = await github.rest.repos.getContent({ ...repo, path: SIGNATURES_PATH, ref: `refs/heads/${SIGNATURES_BRANCH}` }));
    } catch (error) {
        if (error.status === 404) {
            return { signatures: [], sha: null };
        }
        throw error;
    }
    let { content, encoding } = file;
    // Over 1 MB the contents API leaves the content out: it is read as a blob.
    if (encoding === 'none') {
        ({ data: { content, encoding } } = await github.rest.git.getBlob({ ...repo, file_sha: file.sha }));
    }
    const text = encoding === 'base64' ? Buffer.from(content, 'base64').toString('utf8') : content;
    let signatures;
    try {
        signatures = JSON.parse(text);
    } catch {
        throw new Error(`${SIGNATURES_PATH} on the ${SIGNATURES_BRANCH} branch is not valid JSON`);
    }
    if (!Array.isArray(signatures)) {
        throw new Error(`${SIGNATURES_PATH} on the ${SIGNATURES_BRANCH} branch is not a list`);
    }
    return { signatures, sha: file.sha };
}

/** Whether a user agreed to the current version of the CLA. */
function hasSigned(signatures, user) {
    return signatures.some((signature) => signature && signature.id === user.id && signature.version === AGREEMENT_VERSION);
}

/** Who of the pull request still has to agree, or why the check cannot pass. */
async function evaluate(github, repo, pull) {
    const { users, unlinked, isTooLarge, isStale } = await participantsOf(github, repo, pull);
    if (isTooLarge || isStale) {
        return { isTooLarge, isStale, pending: [], unlinked: [] };
    }
    const { signatures } = await readSignatures(github, repo);
    const pending = [];
    for (const user of users) {
        if (!hasSigned(signatures, user) && !await isTeamMember(github, repo, user.login)) {
            pending.push(user);
        }
    }
    return { isTooLarge: false, isStale: false, pending, unlinked };
}

function agreementUrl(repo, defaultBranch) {
    return `https://github.com/${repo.owner}/${repo.repo}/blob/${defaultBranch}/${AGREEMENT_PATH}`;
}

function isComplete(result) {
    return !result.isTooLarge && result.pending.length === 0 && result.unlinked.length === 0;
}

/**
 * A pending person as the comment names them: the one who opened the pull request (and
 * the owner of its fork) is mentioned (notified); a commit author is not - their email
 * may be someone else's.
 */
function nameOf(user) {
    return user.isMentioned ? `@${user.login}` : `\`${user.login}\``;
}

function thanksBody(url) {
    return `${THANKS_MARKER}\n✅ Thank you! Everyone on this pull request has agreed to the [Contributor License Agreement](${url}).`;
}

/** The comment asking for the agreement, or explaining why it cannot be checked. */
function commentBody(result, url, wasAsked) {
    const header = wasAsked || result.pending.length > 0 ? `${MARKER}\n${ASKED_FLAG}` : MARKER;
    if (result.isTooLarge) {
        return `${header}\nThis pull request has more than ${MAX_COMMITS} commits, so the Contributor License Agreement check cannot read all of their authors. Please split it, or ask a maintainer.`;
    }
    const lines = [header, 'Thank you for your contribution!'];
    if (result.pending.length > 0) {
        lines.push(
            '',
            `Before we can merge it, ${result.pending.map(nameOf).join(', ')}, please read our [Contributor License Agreement](${url}) and agree to it by replying to this pull request with this sentence:`,
            '',
            '```',
            SENTENCE,
            '```',
            '',
            'Everyone agrees once, from their own GitHub account; the agreement then covers their later pull requests too.',
        );
    }
    if (result.unlinked.length > 0) {
        // Only the SHAs: the author name of a commit is free text.
        const commits = result.unlinked.map((commit) => commit.sha.slice(0, 7)).join(', ');
        lines.push(
            '',
            `These commits have an author email that is not linked to a GitHub account, so their author cannot agree: ${commits}. Please add the email to your GitHub account (Settings - Emails), or amend the commits with a linked email.`,
        );
    }
    return lines.join('\n');
}

function statusOf(result) {
    if (result.isTooLarge) {
        return { state: 'failure', description: `More than ${MAX_COMMITS} commits: cannot check their authors` };
    }
    if (result.pending.length > 0) {
        return { state: 'failure', description: `Waiting for the CLA agreement of ${result.pending.map((user) => user.login).join(', ')}` };
    }
    if (result.unlinked.length > 0) {
        return { state: 'failure', description: 'Some commit authors are not linked to a GitHub account' };
    }
    return { state: 'success', description: 'Everyone has agreed to the CLA, or is on the team' };
}

/** The comments of this check on the pull request, oldest first. */
async function ownComments(github, repo, number) {
    const comments = await github.paginate(github.rest.issues.listComments, { ...repo, issue_number: number, per_page: 100 });
    return comments
        .filter((comment) => comment.user?.login === COMMENT_AUTHOR && typeof comment.body === 'string')
        .sort((a, b) => a.id - b.id);
}

function withMarker(comments, marker) {
    return comments.filter((comment) => comment.body.startsWith(marker));
}

/** Updates a comment of this check; false when a concurrent run deleted it. */
async function updateComment(github, repo, commentId, body) {
    try {
        await github.rest.issues.updateComment({ ...repo, comment_id: commentId, body });
        return true;
    } catch (error) {
        if (error.status !== 404) {
            throw error;
        }
        return false;
    }
}

/** Deletes a comment of this check; one already deleted by a concurrent run is fine. */
async function deleteComment(github, repo, commentId) {
    try {
        await github.rest.issues.deleteComment({ ...repo, comment_id: commentId });
    } catch (error) {
        if (error.status !== 404) {
            throw error;
        }
    }
}

async function setStatus(github, repo, sha, state, description, targetUrl) {
    await github.rest.repos.createCommitStatus({
        ...repo,
        sha,
        state,
        context: STATUS_CONTEXT,
        description: description.slice(0, STATUS_DESCRIPTION_LENGTH),
        target_url: targetUrl,
    });
}

/** The result without the people whose agreement was recorded since it was evaluated. */
async function withCurrentSignatures(github, repo, result) {
    if (result.pending.length === 0) {
        return result;
    }
    const { signatures } = await readSignatures(github, repo);
    return { ...result, pending: result.pending.filter((user) => !hasSigned(signatures, user)) };
}

/**
 * Posts a comment with the marker; a concurrent run may have posted one too, and only the
 * oldest stays. The comment that stays.
 */
async function postOnce(github, repo, number, marker, body) {
    const { data } = await github.rest.issues.createComment({ ...repo, issue_number: number, body });
    const [oldest] = withMarker(await ownComments(github, repo, number), marker);
    if (oldest && oldest.id !== data.id) {
        await deleteComment(github, repo, data.id);
        return oldest;
    }
    return data;
}

/**
 * Thanks everyone once, in a comment of its own: the request stays as it was, so the pull
 * request still shows what was agreed to and how. Its URL.
 */
async function writeThanks(github, repo, number, url, comments) {
    const [existing] = withMarker(comments, THANKS_MARKER);
    const thanks = existing ?? await postOnce(github, repo, number, THANKS_MARKER, thanksBody(url));
    return thanks.html_url;
}

/**
 * Writes the comments of the result: the request (a new one only where there is something
 * to ask), or the thanks once everyone who was asked has agreed. Their URL.
 */
async function writeComment(github, repo, number, result, url) {
    const comments = await ownComments(github, repo, number);
    const [request] = withMarker(comments, MARKER);
    if (isComplete(result)) {
        // Nobody was asked (the team, or people who agreed before): nothing to say.
        if (!request) {
            return undefined;
        }
        // Only a notice (too many commits, unlinked emails) that no longer holds: no thanks.
        if (!request.body.includes(ASKED_FLAG)) {
            await deleteComment(github, repo, request.id);
            return undefined;
        }
        return writeThanks(github, repo, number, url, comments);
    }
    // Someone has to agree again (a new commit author): an earlier thanks no longer holds.
    for (const thanks of withMarker(comments, THANKS_MARKER)) {
        await deleteComment(github, repo, thanks.id);
    }
    const body = commentBody(result, url, request?.body.includes(ASKED_FLAG) ?? false);
    if (request && (request.body === body || await updateComment(github, repo, request.id, body))) {
        return request.html_url;
    }
    return (await postOnce(github, repo, number, MARKER, body)).html_url;
}

/** Whether the pull request is still open with the head and base that were checked. */
async function isUnchanged(github, repo, pull) {
    const { data: current } = await github.rest.pulls.get({ ...repo, pull_number: pull.number });
    return current.state === 'open' && current.head.sha === pull.head.sha && current.base.ref === pull.base.ref;
}

/**
 * The result on the pull request: its comment and status. An agreement recorded by a
 * concurrent comment is never reported as missing: the signatures are read again right
 * before the status. Nothing is reported for a head or base the pull request has left -
 * the run of that change reports it. (Runs of two heads can still interleave, so the
 * comment is a courtesy; the status is what counts, and is set for its own head only.)
 */
async function report(github, repo, pull, defaultBranch, evaluated) {
    if (!await isUnchanged(github, repo, pull)) {
        return null;
    }
    const url = agreementUrl(repo, defaultBranch);
    let result = await withCurrentSignatures(github, repo, evaluated);
    let commentUrl = await writeComment(github, repo, pull.number, result, url);
    const latest = await withCurrentSignatures(github, repo, result);
    if (latest.pending.length !== result.pending.length) {
        result = latest;
        commentUrl = await writeComment(github, repo, pull.number, result, url);
    }
    if (!await isUnchanged(github, repo, pull)) {
        return null;
    }
    const { state, description } = statusOf(result);
    await setStatus(github, repo, pull.head.sha, state, description, commentUrl ?? url);
    return { state, description };
}

/**
 * Checks a pull request into a checked branch and reports the result. When the check
 * itself fails (an API error, a broken signatures file), the status says so and the
 * error is raised: the pull request is never left looking checked.
 */
async function checkPull(github, repo, pull, defaultBranch, core, runUrl) {
    if (!CHECKED_BASES.has(pull.base.ref)) {
        core.info(`#${pull.number} targets ${pull.base.ref}: not checked`);
        return null;
    }
    try {
        const result = await evaluate(github, repo, pull);
        const status = result.isStale ? null : await report(github, repo, pull, defaultBranch, result);
        if (status) {
            core.info(`#${pull.number} ${pull.head.sha}: ${status.state} - ${status.description}`);
        } else {
            core.info(`#${pull.number} moved on from ${pull.head.sha} (${pull.base.ref}): its newer run reports it`);
        }
        return status;
    } catch (error) {
        core.error(`#${pull.number}: the CLA check failed: ${error.message}`);
        try {
            await setStatus(github, repo, pull.head.sha, 'error', 'The CLA check failed: see the workflow run', runUrl);
        } catch (statusError) {
            core.error(`#${pull.number}: the error status could not be set either: ${statusError.message}`);
        }
        throw error;
    }
}

/** The URL of the workflow run, for the status of a failed check. */
function runUrlOf(context) {
    return `${context.serverUrl ?? 'https://github.com'}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
}

/**
 * After the pull request trigger workflow ran: checks the pull request of its head
 * commit. A fork's pull request is not listed in the event, so it is looked up by its
 * head branch; it is read again whole (a listed one has no commit count) and verified
 * by its head commit and base.
 */
async function checkFromWorkflowRun({ github, context, core }) {
    const repo = context.repo;
    const run = context.payload.workflow_run;
    const defaultBranch = context.payload.repository.default_branch;
    const candidates = (run.pull_requests ?? []).map((listed) => listed.number);
    if (candidates.length === 0 && !run.head_repository) {
        // A deleted fork: its pull request is checked again on its next comment or event.
        core.info(`The head repository of ${run.head_sha} is gone: its pull request cannot be looked up`);
        return [];
    }
    if (candidates.length === 0 && run.head_branch) {
        const listed = await github.paginate(github.rest.pulls.list, {
            ...repo,
            state: 'open',
            head: `${run.head_repository.owner.login}:${run.head_branch}`,
            per_page: 100,
        });
        candidates.push(...listed.filter((pull) => pull.head.sha === run.head_sha).map((pull) => pull.number));
    }
    const statuses = [];
    for (const number of candidates) {
        const { data: pull } = await github.rest.pulls.get({ ...repo, pull_number: number });
        if (pull.state === 'open' && pull.head.sha === run.head_sha) {
            statuses.push(await checkPull(github, repo, pull, defaultBranch, core, runUrlOf(context)));
        }
    }
    if (statuses.length === 0) {
        core.info(`No open pull request has the head ${run.head_sha} (pushed over since): nothing to check`);
    }
    return statuses;
}

/** Records the signature of the user (once; a concurrent write is retried). */
async function recordSignature(github, repo, signature) {
    for (let attempt = 1; ; attempt++) {
        const { signatures, sha } = await readSignatures(github, repo);
        if (hasSigned(signatures, signature)) {
            return false;
        }
        const content = Buffer.from(`${JSON.stringify([...signatures, signature], null, 4)}\n`, 'utf8').toString('base64');
        try {
            if (sha === null) {
                await ensureSignaturesBranch(github, repo);
            }
            await github.rest.repos.createOrUpdateFileContents({
                ...repo,
                path: SIGNATURES_PATH,
                branch: SIGNATURES_BRANCH,
                message: `cla: ${signature.login} agrees to the CLA (version ${AGREEMENT_VERSION})`,
                content,
                ...(sha === null ? {} : { sha }),
            });
            return true;
        } catch (error) {
            // Written meanwhile by another signature: read it again, a little later.
            if ((error.status === 409 || error.status === 422) && attempt < MAX_WRITE_ATTEMPTS) {
                await wait(RETRY_DELAY_MS * attempt * (1 + Math.random()));
                continue;
            }
            throw error;
        }
    }
}

/** The signatures branch, created without history on the first signature. */
async function ensureSignaturesBranch(github, repo) {
    try {
        await github.rest.git.getRef({ ...repo, ref: `heads/${SIGNATURES_BRANCH}` });
        return;
    } catch (error) {
        if (error.status !== 404) {
            throw error;
        }
    }
    const readme = 'Signatures of the Contributor License Agreement, recorded by the `license/cla` check. Do not edit by hand.\n';
    const { data: tree } = await github.rest.git.createTree({
        ...repo,
        tree: [{ path: 'README.md', mode: '100644', type: 'blob', content: readme }],
    });
    const { data: commit } = await github.rest.git.createCommit({ ...repo, message: 'cla: start the signatures', tree: tree.sha, parents: [] });
    try {
        await github.rest.git.createRef({ ...repo, ref: `refs/heads/${SIGNATURES_BRANCH}`, sha: commit.sha });
    } catch (error) {
        // Created meanwhile by another signature.
        if (error.status !== 422) {
            throw error;
        }
    }
}

/** The version (blob SHA) of the agreement on the default branch: what is agreed to. */
async function agreementBlobOf(github, repo, defaultBranch) {
    const { data } = await github.rest.repos.getContent({ ...repo, path: AGREEMENT_PATH, ref: `refs/heads/${defaultBranch}` });
    return `${AGREEMENT_PATH}@${data.sha}`;
}

/**
 * The other open pull requests into the checked branches opened by the user: checked
 * again after they agree. (A pull request of someone else with the user's commits is
 * checked again on its next push or comment.)
 */
async function otherPullsOf(github, repo, user, number) {
    const open = await github.paginate(github.rest.pulls.list, { ...repo, state: 'open', per_page: 100 });
    return open.filter((pull) => pull.number !== number && pull.user?.id === user.id && CHECKED_BASES.has(pull.base.ref));
}

/**
 * A 👍 on the comment of the agreement: the person sees it counted. Only a courtesy - the
 * agreement is recorded already - so a failure is a warning.
 */
async function acknowledge(github, repo, comment, core) {
    try {
        await github.rest.reactions.createForIssueComment({ ...repo, comment_id: comment.id, content: '+1' });
    } catch (error) {
        core.warning(`Could not react to the comment of the agreement: ${error.message}`);
    }
}

/**
 * After a comment on a pull request: records the agreement of its author - when the
 * comment is the sentence, written (or edited) by that person, who is on the pull
 * request and has to agree - then checks the pull request again, and the person's
 * other open pull requests.
 */
async function signFromComment({ github, context, core }) {
    const repo = context.repo;
    const { comment, issue, sender } = context.payload;
    const defaultBranch = context.payload.repository.default_branch;
    const runUrl = runUrlOf(context);
    // Someone with write access can edit another's comment: only the author's own words count.
    if (!issue.pull_request || !comment.user || isBot(comment.user) || sender?.id !== comment.user.id || !isSigningComment(comment.body)) {
        core.info('Not an agreement: nothing to do');
        return null;
    }
    const { data: pull } = await github.rest.pulls.get({ ...repo, pull_number: issue.number });
    if (pull.state !== 'open' || !CHECKED_BASES.has(pull.base.ref)) {
        core.info(`#${pull.number} is not an open pull request into a checked branch`);
        return null;
    }
    const { users, isTooLarge } = await participantsOf(github, repo, pull);
    const signer = users.find((user) => user.id === comment.user.id);
    let isRecorded = false;
    if (!isTooLarge && signer && !await isTeamMember(github, repo, signer.login)) {
        isRecorded = await recordSignature(github, repo, {
            id: signer.id,
            login: signer.login,
            version: AGREEMENT_VERSION,
            // The text agreed to: the comment itself can be edited or deleted later.
            agreement: await agreementBlobOf(github, repo, defaultBranch),
            sentence: SENTENCE,
            signedAt: comment.updated_at ?? comment.created_at,
            pullRequest: pull.number,
            commentId: comment.id,
            comment: comment.html_url,
        });
        core.info(isRecorded ? `Recorded the agreement of ${signer.login}` : `${signer.login} has agreed already`);
        await acknowledge(github, repo, comment, core);
    } else {
        core.info(`${comment.user.login} is not on this pull request, or does not have to agree: not recorded`);
    }
    const status = await checkPull(github, repo, pull, defaultBranch, core, runUrl);
    if (isRecorded) {
        // One failing pull request does not keep the others from being checked.
        const errors = [];
        for (const other of await otherPullsOf(github, repo, signer, pull.number)) {
            try {
                const { data: full } = await github.rest.pulls.get({ ...repo, pull_number: other.number });
                await checkPull(github, repo, full, defaultBranch, core, runUrl);
            } catch (error) {
                errors.push(error);
            }
        }
        if (errors.length > 0) {
            throw errors[0];
        }
    }
    return status;
}

module.exports = {
    AGREEMENT_VERSION,
    MARKER,
    SENTENCE,
    STATUS_CONTEXT,
    checkFromWorkflowRun,
    isSigningComment,
    signFromComment,
};
