import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { listDemoFolders } from '../lib/github.js';
import type { RepoOptions } from '../constants.js';

const defaultOptions: RepoOptions = { owner: 'clientIO', branch: 'main' };

describe('listDemoFolders', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        delete process.env.GITHUB_TOKEN;
    });

    it('returns sorted 2-level deep directories', async () => {
        globalThis.fetch = mock.fn(async () => ({
            ok: true,
            json: async () => ({
                tree: [
                    { path: 'scada', type: 'tree' },
                    { path: 'scada/js', type: 'tree' },
                    { path: 'scada/ts', type: 'tree' },
                    { path: 'scada/js/package.json', type: 'blob' },
                    { path: 'kitchen-sink', type: 'tree' },
                    { path: 'kitchen-sink/js', type: 'tree' },
                ],
            }),
        })) as typeof fetch;

        const result = await listDemoFolders(defaultOptions);
        assert.deepEqual(result, ['kitchen-sink/js', 'scada/js', 'scada/ts']);
    });

    it('filters out blobs and top-level directories', async () => {
        globalThis.fetch = mock.fn(async () => ({
            ok: true,
            json: async () => ({
                tree: [
                    { path: 'README.md', type: 'blob' },
                    { path: 'scada', type: 'tree' },
                    { path: 'scada/js', type: 'tree' },
                    { path: 'scada/js/src', type: 'tree' },
                ],
            }),
        })) as typeof fetch;

        const result = await listDemoFolders(defaultOptions);
        assert.deepEqual(result, ['scada/js']);
    });

    it('returns empty array when tree is empty', async () => {
        globalThis.fetch = mock.fn(async () => ({
            ok: true,
            json: async () => ({ tree: [] }),
        })) as typeof fetch;

        const result = await listDemoFolders(defaultOptions);
        assert.deepEqual(result, []);
    });

    it('throws on 404', async () => {
        globalThis.fetch = mock.fn(async () => ({
            ok: false,
            status: 404,
            statusText: 'Not Found',
        })) as typeof fetch;

        await assert.rejects(
            () => listDemoFolders(defaultOptions),
            { message: 'Repository or branch not found. Please verify the --owner and --branch options.' }
        );
    });

    it('throws on other HTTP errors', async () => {
        globalThis.fetch = mock.fn(async () => ({
            ok: false,
            status: 403,
            statusText: 'rate limit exceeded',
        })) as typeof fetch;

        await assert.rejects(
            () => listDemoFolders(defaultOptions),
            { message: 'GitHub API request failed: 403 rate limit exceeded' }
        );
    });

    it('uses correct URL with custom owner and branch', async () => {
        const mockFetch = mock.fn(async () => ({
            ok: true,
            json: async () => ({ tree: [] }),
        }));
        globalThis.fetch = mockFetch as typeof fetch;

        await listDemoFolders({ owner: 'myFork', branch: 'dev' });

        const calledUrl = mockFetch.mock.calls[0].arguments[0] as string;
        assert.ok(calledUrl.includes('/myFork/'));
        assert.ok(calledUrl.endsWith('/git/trees/dev?recursive=1'));
    });

    it('includes Authorization header when GITHUB_TOKEN is set', async () => {
        process.env.GITHUB_TOKEN = 'test-token';

        const mockFetch = mock.fn(async () => ({
            ok: true,
            json: async () => ({ tree: [] }),
        }));
        globalThis.fetch = mockFetch as typeof fetch;

        await listDemoFolders(defaultOptions);

        const calledHeaders = mockFetch.mock.calls[0].arguments[1] as { headers: Record<string, string> };
        assert.equal(calledHeaders.headers['Authorization'], 'Bearer test-token');
    });
});
