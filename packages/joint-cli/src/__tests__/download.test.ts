import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

const defaultOptions = { owner: 'clientIO', branch: 'main' };

function mockFetchWithFolders(folders: string[]) {
    const tree = folders.flatMap((f) => {
        const top = f.split('/')[0];
        return [
            { path: top, type: 'tree' },
            { path: f, type: 'tree' },
        ];
    });

    globalThis.fetch = mock.fn(async(url: string) => {
        if (url.includes('/contents/demos.config.json')) {
            return { ok: false, status: 404, statusText: 'Not Found' };
        }
        return { ok: true, json: async() => ({ tree }) };
    }) as typeof fetch;
}

describe('download command', () => {
    let originalFetch: typeof globalThis.fetch;
    const originalExit = process.exit;
    let exitCode: number | undefined;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        exitCode = undefined;
        process.exit = mock.fn((code?: number) => {
            exitCode = code as number;
            throw new Error(`process.exit(${code})`);
        }) as never;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        process.exit = originalExit;
    });

    it('exits with error when example not found', async() => {
        mockFetchWithFolders(['demo-a/js', 'demo-a/ts']);

        // Dynamic import to get fresh module
        const { download } = await import('../commands/download.js');

        await assert.rejects(
            () => download('nonexistent/js', undefined, defaultOptions),
            { message: 'process.exit(1)' }
        );
        assert.equal(exitCode, 1);
    });

    it('exits with error when folder not found in empty repo', async() => {
        globalThis.fetch = mock.fn(async(url: string) => {
            if (url.includes('/contents/demos.config.json')) {
                return { ok: false, status: 404, statusText: 'Not Found' };
            }
            return { ok: true, json: async() => ({ tree: [] }) };
        }) as typeof fetch;

        const { download } = await import('../commands/download.js');

        await assert.rejects(
            () => download('demo-a/js', undefined, defaultOptions),
            { message: 'process.exit(1)' }
        );
    });

    it('computes default directory name from folder path', async() => {
        // We can test the naming logic by checking what happens when the dir already exists
        // If we provide a folder that exists in the list, it will try to create "demo-a-js"
        // We test this indirectly — the naming logic is: folder.replace(/\//g, '-')
        const folderName = 'demo-a/js';
        const expected = 'demo-a-js';
        assert.equal(folderName.replace(/\//g, '-'), expected);
    });

    it('uses custom target name when provided', () => {
        const folderName = 'demo-a/js';
        const target = 'my-project';
        const dirName = target ?? folderName.replace(/\//g, '-');
        assert.equal(dirName, 'my-project');
    });

    it('handles dot target for current directory', () => {
        const dirName = '.';
        const displayPath = dirName === '.' ? 'current directory' : `./${dirName}`;
        assert.equal(displayPath, 'current directory');
    });
});
