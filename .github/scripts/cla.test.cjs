'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const cla = require('./cla.cjs');

const OWNER = 'clientIO';
const REPO = 'joint';
const TEAM = { id: 1, login: 'teammate', type: 'User' };
const OUTSIDER = { id: 2, login: 'outsider', type: 'User' };
const OTHER = { id: 3, login: 'other', type: 'User' };
const BOT = { id: 4, login: 'dependabot[bot]', type: 'Bot' };
const ACTIONS_BOT = { id: 5, login: 'github-actions[bot]', type: 'Bot' };
const OTHER_BOT = { id: 6, login: 'some-app[bot]', type: 'Bot' };
const ORG = { id: 1000, login: OWNER, type: 'Organization' };
const AGREEMENT_SHA = 'agreement-blob';

function httpError(status) {
    return Object.assign(new Error(`HTTP ${status}`), { status });
}

/** A pull request as the list endpoint returns it: without the commit count of `pulls.get`. */
function listed(pull) {
    const { commits: _commits, ...rest } = pull;
    return rest;
}

/** A GitHub API with the state of one repository: what the check reads and writes. */
class FakeGitHub {
    constructor() {
        this.collaborators = new Set([TEAM.login]);
        this.pulls = new Map();
        this.commits = new Map();
        this.comments = [];
        this.statuses = [];
        this.refs = new Map();
        this.files = new Map();
        this.nextId = 100;
        this.conflictsToRaise = 0;
        this.collaboratorError = null;
        this.isLargeFile = false;
        // Called on every read of the comments: what happens meanwhile.
        this.onListComments = null;
        const fake = this;
        this.rest = {
            pulls: {
                async get({ pull_number }) {
                    const pull = fake.pulls.get(pull_number);
                    if (!pull) {
                        throw httpError(404);
                    }
                    return { data: structuredClone(pull) };
                },
                async list({ head, state }) {
                    return {
                        data: [...fake.pulls.values()]
                            .filter((pull) => pull.state === state && (!head || `${pull.head.user.login}:${pull.head.ref}` === head))
                            .map(listed),
                    };
                },
                async listCommits({ pull_number }) {
                    // At most 250 commits, as the API.
                    return { data: (fake.commits.get(pull_number) ?? []).slice(0, 250) };
                },
            },
            repos: {
                async checkCollaborator({ username }) {
                    if (fake.collaboratorError) {
                        throw httpError(fake.collaboratorError);
                    }
                    if (!fake.collaborators.has(username)) {
                        throw httpError(404);
                    }
                    return { status: 204 };
                },
                async getContent({ path, ref }) {
                    assert.ok(ref.startsWith('refs/heads/'), 'reads a branch by its full name');
                    const branch = ref.replace('refs/heads/', '');
                    if (branch === 'master' && path === 'CLA.md') {
                        return { data: { content: '', encoding: 'base64', sha: AGREEMENT_SHA } };
                    }
                    const file = fake.files.get(`${branch}:${path}`);
                    if (!file) {
                        throw httpError(404);
                    }
                    // Over 1 MB the API leaves the content out.
                    if (fake.isLargeFile) {
                        return { data: { content: '', encoding: 'none', sha: file.sha } };
                    }
                    return { data: { content: Buffer.from(file.text).toString('base64'), encoding: 'base64', sha: file.sha } };
                },
                async createOrUpdateFileContents({ path, branch, content, sha }) {
                    if (!fake.refs.has(branch)) {
                        throw httpError(404);
                    }
                    if (fake.conflictsToRaise > 0) {
                        fake.conflictsToRaise--;
                        // Another signature written meanwhile: the file changed under this write.
                        const current = fake.readSignatureList();
                        fake.writeFile(branch, path, JSON.stringify([...current, { id: OTHER.id, login: OTHER.login, version: cla.AGREEMENT_VERSION }]));
                        throw httpError(409);
                    }
                    const existing = fake.files.get(`${branch}:${path}`);
                    if (existing && existing.sha !== sha) {
                        throw httpError(sha === undefined ? 422 : 409);
                    }
                    fake.writeFile(branch, path, Buffer.from(content, 'base64').toString('utf8'));
                    return { data: {} };
                },
                async createCommitStatus(status) {
                    fake.statuses.push(status);
                    return { data: {} };
                },
            },
            git: {
                async getRef({ ref }) {
                    if (!fake.refs.has(ref.replace('heads/', ''))) {
                        throw httpError(404);
                    }
                    return { data: {} };
                },
                async getBlob({ file_sha }) {
                    const file = [...fake.files.values()].find((candidate) => candidate.sha === file_sha);
                    return { data: { content: Buffer.from(file.text).toString('base64'), encoding: 'base64' } };
                },
                async createTree() {
                    return { data: { sha: 'tree-sha' } };
                },
                async createCommit({ parents }) {
                    assert.deepEqual(parents, []);
                    return { data: { sha: 'root-sha' } };
                },
                async createRef({ ref }) {
                    const branch = ref.replace('refs/heads/', '');
                    if (fake.refs.has(branch)) {
                        throw httpError(422);
                    }
                    fake.refs.set(branch, true);
                    return { data: {} };
                },
            },
            issues: {
                async listComments({ issue_number }) {
                    await fake.onListComments?.(issue_number);
                    return { data: fake.comments.filter((comment) => comment.issue === issue_number) };
                },
                async createComment({ issue_number, body }) {
                    const comment = { id: fake.nextId++, issue: issue_number, body, user: ACTIONS_BOT, html_url: `https://github.com/c/${fake.nextId}` };
                    fake.comments.push(comment);
                    return { data: comment };
                },
                async updateComment({ comment_id, body }) {
                    const comment = fake.comments.find((candidate) => candidate.id === comment_id);
                    if (comment.user !== ACTIONS_BOT) {
                        throw httpError(403);
                    }
                    comment.body = body;
                    return { data: {} };
                },
            },
        };
    }

    async paginate(method, params) {
        return (await method(params)).data;
    }

    writeFile(branch, path, text) {
        this.files.set(`${branch}:${path}`, { text, sha: `sha-${this.nextId++}` });
    }

    readSignatureList() {
        const file = this.files.get('cla-signatures:signatures.json');
        return file ? JSON.parse(file.text) : [];
    }

    /** A pull request opened by `opener` with commits by `authors` (GitHub accounts of their emails). */
    addPull(number, opener, { base = 'master', authors = [opener], unlinked = 0, commitCount, headOwner = opener } = {}) {
        const commits = [
            ...authors.map((user, index) => ({ sha: `${number}-c${index}-0000000`, author: user, commit: { author: { name: user.login } } })),
            ...Array.from({ length: unlinked }, (_, index) => ({ sha: `${number}-u${index}-1111111`, author: null, commit: { author: { name: '@everyone [x](https://evil.example)' } } })),
        ];
        // The head is the last commit, as on GitHub.
        const sha = commits.at(-1).sha;
        const pull = {
            number,
            state: 'open',
            user: opener,
            base: { ref: base, repo: { owner: ORG } },
            head: { sha, ref: `branch-${number}`, user: { login: headOwner.login }, repo: { owner: headOwner } },
            commits: commitCount ?? commits.length,
        };
        this.pulls.set(number, pull);
        this.commits.set(number, commits);
        return pull;
    }

    lastStatus(number) {
        const sha = this.pulls.get(number).head.sha;
        return [...this.statuses].reverse().find((status) => status.sha === sha);
    }

    checkComment(number) {
        return this.comments.find((comment) => comment.issue === number && comment.user === ACTIONS_BOT);
    }
}

const core = { info() {}, error() {} };
const base = { repo: { owner: OWNER, repo: REPO }, serverUrl: 'https://github.com', runId: 7 };

function runContext(fake, number, { listedPulls = [] } = {}) {
    const pull = fake.pulls.get(number);
    return {
        ...base,
        payload: {
            repository: { default_branch: 'master' },
            workflow_run: { event: 'pull_request', head_sha: pull.head.sha, head_branch: pull.head.ref, head_repository: { owner: { login: pull.head.user.login } }, pull_requests: listedPulls },
        },
    };
}

function commentContext(number, user, body, { sender = user } = {}) {
    return {
        ...base,
        payload: {
            repository: { default_branch: 'master' },
            issue: { number, pull_request: {} },
            sender,
            comment: { id: 42, user, body, created_at: '2026-11-27T10:00:00Z', updated_at: '2026-11-27T10:05:00Z', html_url: `https://github.com/clientIO/joint/pull/${number}#issuecomment-42` },
        },
    };
}

const check = (fake, number, options) => cla.checkFromWorkflowRun({ github: fake, context: runContext(fake, number, options), core });
const sign = (fake, number, user, body = cla.SENTENCE, options) => cla.signFromComment({ github: fake, context: commentContext(number, user, body, options), core });

describe('the CLA check of a pull request', () => {
    it('passes a team member without a comment', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, TEAM);
        await check(fake, 1);
        assert.equal(fake.lastStatus(1).state, 'success');
        assert.equal(fake.lastStatus(1).context, 'license/cla');
        assert.equal(fake.checkComment(1), undefined);
    });

    it('fails an outsider and asks for the sentence', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER);
        await check(fake, 1);
        assert.equal(fake.lastStatus(1).state, 'failure');
        const comment = fake.checkComment(1);
        assert.ok(comment.body.startsWith(cla.MARKER));
        assert.ok(comment.body.includes('@outsider'));
        assert.ok(comment.body.includes(cla.SENTENCE));
        assert.ok(comment.body.includes('https://github.com/clientIO/joint/blob/master/CLA.md'));
        assert.equal(fake.lastStatus(1).target_url, comment.html_url);
    });

    it('fails closed on a pull request of more than 250 commits, read whole after the lookup by its head', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER, { authors: Array(300).fill(TEAM), commitCount: 300 });
        await check(fake, 1);
        assert.equal(fake.lastStatus(1).state, 'failure');
        assert.ok(fake.lastStatus(1).description.includes('250'));
    });

    it('fails closed when the commit count of a pull request is unknown', async () => {
        const fake = new FakeGitHub();
        delete fake.addPull(1, TEAM).commits;
        await check(fake, 1);
        assert.equal(fake.lastStatus(1).state, 'failure');
    });

    it('fails closed when fewer commits are read than the pull request has', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, TEAM, { commitCount: 5 });
        await check(fake, 1);
        assert.equal(fake.lastStatus(1).state, 'failure');
    });

    it('checks a pull request listed in the event', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER);
        await check(fake, 1, { listedPulls: [{ number: 1 }] });
        assert.equal(fake.lastStatus(1).state, 'failure');
    });

    it('records the agreement of the outsider, then passes', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER);
        await check(fake, 1);
        await sign(fake, 1, OUTSIDER);
        assert.equal(fake.lastStatus(1).state, 'success');
        assert.deepEqual(fake.readSignatureList(), [{
            id: OUTSIDER.id,
            login: OUTSIDER.login,
            version: cla.AGREEMENT_VERSION,
            agreement: `CLA.md@${AGREEMENT_SHA}`,
            sentence: cla.SENTENCE,
            signedAt: '2026-11-27T10:05:00Z',
            pullRequest: 1,
            commentId: 42,
            comment: 'https://github.com/clientIO/joint/pull/1#issuecomment-42',
        }]);
        assert.ok(fake.checkComment(1).body.includes('Thank you! Everyone'));
        assert.equal(fake.comments.filter((comment) => comment.issue === 1).length, 1);
    });

    it('passes the next pull request of a signed outsider without a comment', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER);
        await sign(fake, 1, OUTSIDER);
        fake.addPull(2, OUTSIDER);
        await check(fake, 2);
        assert.equal(fake.lastStatus(2).state, 'success');
        assert.equal(fake.checkComment(2), undefined);
    });

    it('checks the other open pull requests of the outsider again after the agreement', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER);
        fake.addPull(2, OUTSIDER);
        await check(fake, 1);
        await check(fake, 2);
        await sign(fake, 1, OUTSIDER);
        assert.equal(fake.lastStatus(2).state, 'success');
        assert.ok(fake.checkComment(2).body.includes('Thank you! Everyone'));
    });

    it('does not take the agreement from someone else', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER);
        await sign(fake, 1, OTHER);
        await sign(fake, 1, TEAM);
        assert.equal(fake.lastStatus(1)?.state ?? 'failure', 'failure');
        assert.deepEqual(fake.readSignatureList(), []);
    });

    it('does not take an agreement edited into the comment by someone else', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER);
        await sign(fake, 1, OUTSIDER, cla.SENTENCE, { sender: TEAM });
        assert.deepEqual(fake.readSignatureList(), []);
        assert.equal(fake.statuses.length, 0);
    });

    it('does not take the sentence hidden in an HTML comment', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER);
        await sign(fake, 1, OUTSIDER, `Thanks!\n<!--\n${cla.SENTENCE}\n-->`);
        assert.deepEqual(fake.readSignatureList(), []);
    });

    it('does not record a team member who comments the sentence', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, TEAM);
        await sign(fake, 1, TEAM);
        assert.equal(fake.lastStatus(1).state, 'success');
        assert.deepEqual(fake.readSignatureList(), []);
    });

    it('asks the outsider who opened a pull request of commits under team or bot emails', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER, { authors: [TEAM] });
        fake.addPull(2, OUTSIDER, { authors: [ACTIONS_BOT] });
        await check(fake, 1);
        await check(fake, 2);
        assert.equal(fake.lastStatus(1).state, 'failure');
        assert.equal(fake.lastStatus(2).state, 'failure');
        assert.ok(fake.checkComment(2).body.includes('@outsider'));
    });

    it('asks every outside author, mentions only the opener, and passes when all agreed', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER, { authors: [TEAM, OUTSIDER, OTHER] });
        await check(fake, 1);
        const { body } = fake.checkComment(1);
        assert.ok(body.includes('@outsider, `other`'));
        assert.ok(!body.includes('@other'));
        await sign(fake, 1, OUTSIDER);
        assert.equal(fake.lastStatus(1).state, 'failure');
        assert.ok(fake.lastStatus(1).description.includes('other'));
        await sign(fake, 1, OTHER);
        assert.equal(fake.lastStatus(1).state, 'success');
    });

    it('does not ask a bot that opened a pull request', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, BOT, { authors: [BOT] });
        await check(fake, 1);
        assert.equal(fake.lastStatus(1).state, 'success');
    });

    it('blocks commits not linked to a GitHub account, naming only their SHAs', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, TEAM, { unlinked: 1 });
        await check(fake, 1);
        assert.equal(fake.lastStatus(1).state, 'failure');
        const { body } = fake.checkComment(1);
        assert.ok(body.includes('1-u0-11'));
        assert.ok(!body.includes('evil.example'));
        assert.ok(!body.includes('@everyone'));
    });

    it('does not check a pull request into another branch', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER, { base: 'feature' });
        await check(fake, 1);
        assert.equal(fake.statuses.length, 0);
        assert.equal(fake.comments.length, 0);
    });

    it('checks nothing when the head was pushed over since', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER);
        const context = runContext(fake, 1);
        context.payload.workflow_run.head_sha = 'older-sha';
        await cla.checkFromWorkflowRun({ github: fake, context, core });
        assert.equal(fake.statuses.length, 0);
    });

    it('updates its own comment, never another bot comment with the marker', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER);
        fake.comments.push({ id: 1, issue: 1, body: `${cla.MARKER}\nfake`, user: OTHER_BOT, html_url: 'x' });
        await check(fake, 1);
        await check(fake, 1);
        assert.equal(fake.comments.filter((comment) => comment.issue === 1 && comment.user === ACTIONS_BOT).length, 1);
    });

    it('asks again after a new version of the agreement', async () => {
        const fake = new FakeGitHub();
        fake.refs.set('cla-signatures', true);
        fake.writeFile('cla-signatures', 'signatures.json', JSON.stringify([{ id: OUTSIDER.id, login: OUTSIDER.login, version: cla.AGREEMENT_VERSION - 1 }]));
        fake.addPull(1, OUTSIDER);
        await check(fake, 1);
        assert.equal(fake.lastStatus(1).state, 'failure');
        await sign(fake, 1, OUTSIDER);
        assert.equal(fake.lastStatus(1).state, 'success');
        assert.equal(fake.readSignatureList().length, 2);
    });

    it('keeps an agreement written concurrently by another comment', async () => {
        const fake = new FakeGitHub();
        fake.refs.set('cla-signatures', true);
        fake.writeFile('cla-signatures', 'signatures.json', '[]');
        fake.addPull(1, OUTSIDER);
        fake.conflictsToRaise = 1;
        await sign(fake, 1, OUTSIDER);
        assert.deepEqual(fake.readSignatureList().map((signature) => signature.login).sort(), ['other', 'outsider']);
        assert.equal(fake.lastStatus(1).state, 'success');
    });

    it('records an agreement once', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER);
        await sign(fake, 1, OUTSIDER);
        await sign(fake, 1, OUTSIDER);
        assert.equal(fake.readSignatureList().length, 1);
    });

    it('reads a signatures file over 1 MB', async () => {
        const fake = new FakeGitHub();
        fake.refs.set('cla-signatures', true);
        fake.writeFile('cla-signatures', 'signatures.json', JSON.stringify([{ id: OUTSIDER.id, login: OUTSIDER.login, version: cla.AGREEMENT_VERSION }]));
        fake.isLargeFile = true;
        fake.addPull(1, OUTSIDER);
        await check(fake, 1);
        assert.equal(fake.lastStatus(1).state, 'success');
    });

    it('reports an error, never success, when the signatures file is broken', async () => {
        const fake = new FakeGitHub();
        fake.refs.set('cla-signatures', true);
        fake.writeFile('cla-signatures', 'signatures.json', '{ broken');
        fake.addPull(1, OUTSIDER);
        await assert.rejects(check(fake, 1), /not valid JSON/);
        assert.equal(fake.lastStatus(1).state, 'error');
        assert.equal(fake.lastStatus(1).target_url, 'https://github.com/clientIO/joint/actions/runs/7');
    });

    it('reports an error, never success, when GitHub cannot tell who is on the team', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER);
        fake.collaboratorError = 403;
        await assert.rejects(check(fake, 1), { status: 403 });
        assert.deepEqual(fake.statuses.map((status) => status.state), ['error']);
    });

    it('asks the owner of the fork that holds the head branch', async () => {
        const fake = new FakeGitHub();
        // A team member opens a pull request from an outsider's fork, whose commits carry the team member's email.
        fake.addPull(1, TEAM, { authors: [TEAM], headOwner: OUTSIDER });
        await check(fake, 1);
        assert.equal(fake.lastStatus(1).state, 'failure');
        assert.ok(fake.checkComment(1).body.includes('@outsider'));
        await sign(fake, 1, OUTSIDER);
        assert.equal(fake.lastStatus(1).state, 'success');
    });

    it('does not ask the organization of a branch in this repository, or of an organization fork', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, TEAM, { headOwner: ORG });
        fake.addPull(2, TEAM, { headOwner: { id: 2000, login: 'some-org', type: 'Organization' } });
        await check(fake, 1);
        await check(fake, 2);
        assert.equal(fake.lastStatus(1).state, 'success');
        assert.equal(fake.lastStatus(2).state, 'success');
    });

    it('sets no status when the commits read are not of the head checked', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, TEAM);
        // Force-pushed between reading the pull request and its commits.
        fake.commits.set(1, [{ sha: 'pushed-later', author: OUTSIDER }]);
        await check(fake, 1);
        assert.equal(fake.statuses.length, 0);
    });

    it('does not report an agreement recorded while it commented as missing', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER);
        fake.onListComments = async () => {
            fake.onListComments = null;
            await sign(fake, 1, OUTSIDER);
        };
        await check(fake, 1);
        assert.equal(fake.lastStatus(1).state, 'success');
        assert.ok(fake.checkComment(1).body.includes('Thank you! Everyone'));
    });

    it('reports nothing when the pull request was pushed to before its commits were read', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER, { authors: [OUTSIDER, OUTSIDER, OUTSIDER] });
        // Force-pushed to a single commit: fewer commits than counted, none of them the head.
        fake.commits.set(1, [{ sha: 'pushed-later', author: OUTSIDER }]);
        await check(fake, 1);
        assert.equal(fake.statuses.length, 0);
        assert.equal(fake.comments.length, 0);
    });

    it('does not comment for a head the pull request has left while it was checked', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER);
        const realListCommits = fake.rest.pulls.listCommits;
        fake.rest.pulls.listCommits = async (params) => {
            const listedCommits = await realListCommits(params);
            fake.pulls.get(1).head.sha = 'pushed-later';
            return listedCommits;
        };
        await check(fake, 1);
        assert.equal(fake.comments.length, 0);
        assert.equal(fake.statuses.length, 0);
    });

    it('sets no status for a head the pull request has left while it commented', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, TEAM);
        fake.onListComments = async () => {
            fake.pulls.get(1).head.sha = 'pushed-later';
        };
        await check(fake, 1);
        assert.equal(fake.statuses.length, 0);
    });

    it('fails closed, recording nothing, when the agreement file is missing', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER);
        const realGetContent = fake.rest.repos.getContent;
        fake.rest.repos.getContent = async (params) => {
            if (params.path === 'CLA.md') {
                throw httpError(404);
            }
            return realGetContent(params);
        };
        await assert.rejects(sign(fake, 1, OUTSIDER), { status: 404 });
        assert.deepEqual(fake.readSignatureList(), []);
        assert.notEqual(fake.lastStatus(1)?.state, 'success');
    });

    it('sets no status for a base the pull request has left meanwhile', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, TEAM);
        fake.onListComments = async () => {
            fake.pulls.get(1).base.ref = 'dev';
        };
        await check(fake, 1);
        assert.equal(fake.statuses.length, 0);
    });

    it('checks every other pull request of the signer when one of them fails', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER);
        fake.addPull(2, OUTSIDER);
        fake.addPull(3, OUTSIDER);
        const realGet = fake.rest.pulls.get;
        fake.rest.pulls.get = async (params) => {
            if (params.pull_number === 2) {
                throw httpError(502);
            }
            return realGet(params);
        };
        await assert.rejects(sign(fake, 1, OUTSIDER), { status: 502 });
        assert.equal(fake.lastStatus(1).state, 'success');
        assert.equal(fake.lastStatus(3).state, 'success');
    });

    it('keeps the original error when the error status cannot be set either', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER);
        fake.collaboratorError = 403;
        fake.rest.repos.createCommitStatus = async () => {
            throw httpError(500);
        };
        await assert.rejects(check(fake, 1), { status: 403 });
    });

    it('checks nothing when the fork of the head was deleted', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER);
        const context = runContext(fake, 1);
        context.payload.workflow_run.head_repository = null;
        assert.deepEqual(await cla.checkFromWorkflowRun({ github: fake, context, core }), []);
        assert.equal(fake.statuses.length, 0);
    });

    it('ignores comments on a closed pull request', async () => {
        const fake = new FakeGitHub();
        fake.addPull(1, OUTSIDER).state = 'closed';
        await sign(fake, 1, OUTSIDER);
        assert.deepEqual(fake.readSignatureList(), []);
    });
});

describe('the sentence of the agreement', () => {
    it('is recognized alone, in any case, spacing, with or without the period', () => {
        assert.ok(cla.isSigningComment(cla.SENTENCE));
        assert.ok(cla.isSigningComment(`  ${cla.SENTENCE.toUpperCase().replace(/ /g, '   ').replace(/\.$/, '')}  `));
        assert.ok(cla.isSigningComment(`Sure!\n\n${cla.SENTENCE}\n\nThanks`));
    });

    it('is not recognized quoted, hidden, changed or in other text', () => {
        assert.ok(!cla.isSigningComment(`> ${cla.SENTENCE}`));
        assert.ok(!cla.isSigningComment(`<!-- ${cla.SENTENCE} -->`));
        assert.ok(!cla.isSigningComment(`I do not agree: ${cla.SENTENCE}`));
        assert.ok(!cla.isSigningComment(cla.SENTENCE.replace('agree', 'disagree')));
        assert.ok(!cla.isSigningComment('ok'));
        assert.ok(!cla.isSigningComment(undefined));
    });

    it('contains the word the workflow filters comments by', () => {
        assert.ok(cla.SENTENCE.toLowerCase().includes('agree'));
    });
});
