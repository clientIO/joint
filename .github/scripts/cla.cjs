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
 * opened it, and the authors of its commits (by the GitHub account of their email);
 * and the commits whose author email is linked to no account (they cannot agree).
 *
 * A commit author is known by an email anyone can write into a commit, so the one who
 * opened the pull request (signed in to GitHub) is always among them. A bot is not
 * asked; a bot's email on a commit of a person's pull request leaves that person asked.
 */
async function participantsOf(github, repo, pull) {
    if (typeof pull.commits !== 'number' || pull.commits > MAX_COMMITS) {
        return { users: [], unlinked: [], isTooLarge: true };
    }
    const users = new Map();
    if (!isBot(pull.user)) {
        users.set(pull.user.id, { id: pull.user.id, login: pull.user.login, isOpener: true });
    }
    const commits = await github.paginate(github.rest.pulls.listCommits, { ...repo, pull_number: pull.number, per_page: 100 });
    if (commits.length < pull.commits) {
        return { users: [], unlinked: [], isTooLarge: true };
    }
    const unlinked = [];
    for (const commit of commits) {
        const { author } = commit;
        if (!author || typeof author.login !== 'string') {
            unlinked.push({ sha: commit.sha });
        } else if (!isBot(author) && !users.has(author.id)) {
            users.set(author.id, { id: author.id, login: author.login, isOpener: false });
        }
    }
    return { users: [...users.values()], unlinked, isTooLarge: false };
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
        ({ data: file } = await github.rest.repos.getContent({ ...repo, path: SIGNATURES_PATH, ref: SIGNATURES_BRANCH }));
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
    const { users, unlinked, isTooLarge } = await participantsOf(github, repo, pull);
    if (isTooLarge) {
        return { isTooLarge: true, pending: [], unlinked: [] };
    }
    const { signatures } = await readSignatures(github, repo);
    const pending = [];
    for (const user of users) {
        if (!hasSigned(signatures, user) && !await isTeamMember(github, repo, user.login)) {
            pending.push(user);
        }
    }
    return { isTooLarge: false, pending, unlinked };
}

function agreementUrl(repo, defaultBranch) {
    return `https://github.com/${repo.owner}/${repo.repo}/blob/${defaultBranch}/${AGREEMENT_PATH}`;
}

function isComplete(result) {
    return !result.isTooLarge && result.pending.length === 0 && result.unlinked.length === 0;
}

/**
 * A pending person as the comment names them: the one who opened the pull request is
 * mentioned (notified); a commit author is not - their email may be someone else's.
 */
function nameOf(user) {
    return user.isOpener ? `@${user.login}` : `\`${user.login}\``;
}

/** The comment asking for the agreement (or saying it is complete). */
function commentBody(result, url) {
    if (result.isTooLarge) {
        return `${MARKER}\nThis pull request has more than ${MAX_COMMITS} commits, so the Contributor License Agreement check cannot read all of their authors. Please split it, or ask a maintainer.`;
    }
    if (isComplete(result)) {
        return `${MARKER}\nThank you! Everyone on this pull request has agreed to the [Contributor License Agreement](${url}).`;
    }
    const lines = [MARKER, 'Thank you for your contribution!'];
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

/** The comment of this check on the pull request, if it posted one. */
async function findComment(github, repo, number) {
    const comments = await github.paginate(github.rest.issues.listComments, { ...repo, issue_number: number, per_page: 100 });
    return comments.find((comment) => comment.user?.login === COMMENT_AUTHOR && typeof comment.body === 'string' && comment.body.startsWith(MARKER));
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

/** The result on the pull request: its comment (only where there is something to say) and status. */
async function report(github, repo, pull, defaultBranch, evaluated) {
    let result = evaluated;
    // An agreement recorded meanwhile (by a concurrent comment) is not reported as missing.
    if (result.pending.length > 0) {
        const { signatures } = await readSignatures(github, repo);
        result = { ...result, pending: result.pending.filter((user) => !hasSigned(signatures, user)) };
    }
    const url = agreementUrl(repo, defaultBranch);
    const body = commentBody(result, url);
    const existing = await findComment(github, repo, pull.number);
    let commentUrl = existing?.html_url;
    if (existing) {
        if (existing.body !== body) {
            await github.rest.issues.updateComment({ ...repo, comment_id: existing.id, body });
        }
    } else if (!isComplete(result)) {
        const { data } = await github.rest.issues.createComment({ ...repo, issue_number: pull.number, body });
        commentUrl = data.html_url;
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
        const status = await report(github, repo, pull, defaultBranch, result);
        core.info(`#${pull.number} ${pull.head.sha}: ${status.state} - ${status.description}`);
        return status;
    } catch (error) {
        await setStatus(github, repo, pull.head.sha, 'error', 'The CLA check failed: see the workflow run', runUrl);
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
    if (candidates.length === 0 && run.head_repository && run.head_branch) {
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

/** The other open pull requests into the checked branches opened by the user: checked again after they agree. */
async function otherPullsOf(github, repo, user, number) {
    const open = await github.paginate(github.rest.pulls.list, { ...repo, state: 'open', per_page: 100 });
    return open.filter((pull) => pull.number !== number && pull.user?.id === user.id && CHECKED_BASES.has(pull.base.ref));
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
            signedAt: comment.updated_at ?? comment.created_at,
            pullRequest: pull.number,
            commentId: comment.id,
            comment: comment.html_url,
        });
        core.info(isRecorded ? `Recorded the agreement of ${signer.login}` : `${signer.login} has agreed already`);
    } else {
        core.info(`${comment.user.login} is not on this pull request, or does not have to agree: not recorded`);
    }
    const status = await checkPull(github, repo, pull, defaultBranch, core, runUrl);
    if (isRecorded) {
        for (const other of await otherPullsOf(github, repo, signer, pull.number)) {
            const { data: full } = await github.rest.pulls.get({ ...repo, pull_number: other.number });
            await checkPull(github, repo, full, defaultBranch, core, runUrl);
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
