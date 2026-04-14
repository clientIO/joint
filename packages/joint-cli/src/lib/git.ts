import { execFile } from 'node:child_process';
import { mkdtemp, rm, cp, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';
import { getRepoUrl, type RepoOptions } from '../constants.js';

function run(command: string, args: string[], cwd?: string): Promise<string> {
    return new Promise((resolve, reject) => {
        execFile(command, args, { cwd }, (err, stdout, stderr) => {
            if (err) {
                reject(new Error(stderr || err.message));
                return;
            }
            resolve(stdout);
        });
    });
}

export async function sparseCheckout(folder: string, dest: string, options: RepoOptions): Promise<void> {
    const repoUrl = getRepoUrl(options);
    const tmp = await mkdtemp(join(tmpdir(), 'joint-cli-'));

    try {
        await run('git', ['init', tmp]);
        await run('git', ['remote', 'add', 'origin', repoUrl], tmp);
        await run('git', ['sparse-checkout', 'init', '--cone'], tmp);
        await run('git', ['sparse-checkout', 'set', '--', folder], tmp);
        await run('git', ['pull', 'origin', '--depth=1', '--', options.branch], tmp);

        const src = join(tmp, folder);

        if (existsSync(dest)) {
            // Copy each entry individually into the existing directory
            const entries = await readdir(src);
            for (const entry of entries) {
                await cp(join(src, entry), join(dest, entry), { recursive: true });
            }
        } else {
            await cp(src, dest, { recursive: true });
        }
    } finally {
        await rm(tmp, { recursive: true, force: true });
    }
}
