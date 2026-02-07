/* eslint-disable no-console */
import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { list } from '../commands/list.js';

const defaultOptions = { owner: 'clientIO', branch: 'main' };

describe('list command', () => {
    let originalFetch: typeof globalThis.fetch;
    const logOutput: string[] = [];
    const originalLog = console.log;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        logOutput.length = 0;
        console.log = (...args: unknown[]) => {
            logOutput.push(args.join(' '));
        };
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        console.log = originalLog;
    });

    it('prints available examples', async() => {
        globalThis.fetch = mock.fn(async() => ({
            ok: true,
            json: async() => ({
                tree: [
                    { path: 'demo-a', type: 'tree' },
                    { path: 'demo-a/js', type: 'tree' },
                    { path: 'demo-b', type: 'tree' },
                    { path: 'demo-b/ts', type: 'tree' },
                ],
            }),
        })) as typeof fetch;

        await list(defaultOptions);

        assert.ok(logOutput.some((line) => line.includes('demo-a/js')));
        assert.ok(logOutput.some((line) => line.includes('demo-b/ts')));
    });

    it('handles empty tree', async() => {
        globalThis.fetch = mock.fn(async() => ({
            ok: true,
            json: async() => ({ tree: [] }),
        })) as typeof fetch;

        await list(defaultOptions);

        assert.ok(!logOutput.some((line) => line.includes('  - ')));
    });

    it('passes options to the API call', async() => {
        const mockFetch = mock.fn(async() => ({
            ok: true,
            json: async() => ({ tree: [] }),
        }));
        globalThis.fetch = mockFetch as typeof fetch;

        await list({ owner: 'myFork', branch: 'dev' });

        const calledUrl = mockFetch.mock.calls[0].arguments[0] as string;
        assert.ok(calledUrl.includes('/myFork/'));
        assert.ok(calledUrl.includes('/dev?'));
    });
});
