import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { listDemoFolders, getUnlistedDemos } from '../lib/github.js';
import type { RepoOptions } from '../constants.js';

const defaultOptions: RepoOptions = { owner: 'clientIO', branch: 'main' };

function createMockFetch(tree: { path: string; type: string }[], config?: { demos: Record<string, { unlisted?: boolean }> }) {
    return mock.fn(async(url: string) => {
        if (url.includes('/contents/demos.config.json')) {
            if (config === undefined) {
                return { ok: false, status: 404, statusText: 'Not Found' };
            }
            return { ok: true, json: async() => config };
        }
        return { ok: true, json: async() => ({ tree }) };
    }) as typeof fetch;
}

describe('listDemoFolders', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        delete process.env.GITHUB_TOKEN;
    });

    it('returns sorted 2-level deep directories', async() => {
        globalThis.fetch = createMockFetch([
            { path: 'demo-a', type: 'tree' },
            { path: 'demo-a/js', type: 'tree' },
            { path: 'demo-a/ts', type: 'tree' },
            { path: 'demo-a/js/package.json', type: 'blob' },
            { path: 'demo-b', type: 'tree' },
            { path: 'demo-b/js', type: 'tree' },
        ]);

        const result = await listDemoFolders(defaultOptions);
        assert.deepEqual(result, ['demo-a/js', 'demo-a/ts', 'demo-b/js']);
    });

    it('filters out blobs and top-level directories', async() => {
        globalThis.fetch = createMockFetch([
            { path: 'README.md', type: 'blob' },
            { path: 'demo-a', type: 'tree' },
            { path: 'demo-a/js', type: 'tree' },
            { path: 'demo-a/js/src', type: 'tree' },
        ]);

        const result = await listDemoFolders(defaultOptions);
        assert.deepEqual(result, ['demo-a/js']);
    });

    it('returns empty array when tree is empty', async() => {
        globalThis.fetch = createMockFetch([]);

        const result = await listDemoFolders(defaultOptions);
        assert.deepEqual(result, []);
    });

    it('throws on 404', async() => {
        globalThis.fetch = mock.fn(async() => ({
            ok: false,
            status: 404,
            statusText: 'Not Found',
        })) as typeof fetch;

        await assert.rejects(
            () => listDemoFolders(defaultOptions),
            { message: 'Repository or branch not found. Please verify the --owner and --branch options.' }
        );
    });

    it('throws on other HTTP errors', async() => {
        globalThis.fetch = mock.fn(async() => ({
            ok: false,
            status: 403,
            statusText: 'rate limit exceeded',
        })) as typeof fetch;

        await assert.rejects(
            () => listDemoFolders(defaultOptions),
            { message: 'GitHub API request failed: 403 rate limit exceeded' }
        );
    });

    it('uses correct URL with custom owner and branch', async() => {
        const mockFetch = mock.fn(async(url: string) => {
            if (url.includes('/contents/demos.config.json')) {
                return { ok: false, status: 404, statusText: 'Not Found' };
            }
            return { ok: true, json: async() => ({ tree: [] }) };
        });
        globalThis.fetch = mockFetch as typeof fetch;

        await listDemoFolders({ owner: 'myFork', branch: 'dev' });

        const treeCall = mockFetch.mock.calls.find((c) => !(c.arguments[0] as string).includes('/contents/'));
        assert.ok(treeCall);
        const calledUrl = treeCall.arguments[0] as string;
        assert.ok(calledUrl.includes('/myFork/'));
        assert.ok(calledUrl.endsWith('/git/trees/dev?recursive=1'));
    });

    it('includes Authorization header when GITHUB_TOKEN is set', async() => {
        process.env.GITHUB_TOKEN = 'test-token';

        const mockFetch = mock.fn(async(url: string) => {
            if (url.includes('/contents/demos.config.json')) {
                return { ok: false, status: 404, statusText: 'Not Found' };
            }
            return { ok: true, json: async() => ({ tree: [] }) };
        });
        globalThis.fetch = mockFetch as typeof fetch;

        await listDemoFolders(defaultOptions);

        const treeCall = mockFetch.mock.calls.find((c) => !(c.arguments[0] as string).includes('/contents/'));
        assert.ok(treeCall);
        const calledHeaders = treeCall.arguments[1] as { headers: Record<string, string> };
        assert.equal(calledHeaders.headers['Authorization'], 'Bearer test-token');
    });

    it('excludes demos marked as unlisted', async() => {
        globalThis.fetch = createMockFetch(
            [
                { path: 'demo-a', type: 'tree' },
                { path: 'demo-a/js', type: 'tree' },
                { path: 'demo-b', type: 'tree' },
                { path: 'demo-b/ts', type: 'tree' },
                { path: 'demo-c', type: 'tree' },
                { path: 'demo-c/js', type: 'tree' },
            ],
            { demos: { 'demo-b': { unlisted: true }}}
        );

        const result = await listDemoFolders(defaultOptions);
        assert.deepEqual(result, ['demo-a/js', 'demo-c/js']);
    });

    it('includes demos with unlisted: false or without unlisted', async() => {
        globalThis.fetch = createMockFetch(
            [
                { path: 'demo-a', type: 'tree' },
                { path: 'demo-a/js', type: 'tree' },
                { path: 'demo-b', type: 'tree' },
                { path: 'demo-b/ts', type: 'tree' },
            ],
            { demos: { 'demo-a': { unlisted: false }, 'demo-b': {}}}
        );

        const result = await listDemoFolders(defaultOptions);
        assert.deepEqual(result, ['demo-a/js', 'demo-b/ts']);
    });

    it('returns all demos when demos.config.json is missing (404)', async() => {
        globalThis.fetch = createMockFetch(
            [
                { path: 'demo-a', type: 'tree' },
                { path: 'demo-a/js', type: 'tree' },
                { path: 'demo-b', type: 'tree' },
                { path: 'demo-b/ts', type: 'tree' },
            ],
            // undefined means 404
        );

        const result = await listDemoFolders(defaultOptions);
        assert.deepEqual(result, ['demo-a/js', 'demo-b/ts']);
    });
});

describe('getUnlistedDemos', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it('returns set of unlisted demo names', async() => {
        globalThis.fetch = mock.fn(async() => ({
            ok: true,
            json: async() => ({
                demos: {
                    'demo-a': { unlisted: true },
                    'demo-b': { unlisted: false },
                    'demo-c': {},
                    'demo-d': { unlisted: true },
                },
            }),
        })) as typeof fetch;

        const result = await getUnlistedDemos(defaultOptions);
        assert.deepEqual(result, new Set(['demo-a', 'demo-d']));
    });

    it('returns empty set when config is missing', async() => {
        globalThis.fetch = mock.fn(async() => ({
            ok: false,
            status: 404,
            statusText: 'Not Found',
        })) as typeof fetch;

        const result = await getUnlistedDemos(defaultOptions);
        assert.deepEqual(result, new Set());
    });
});
