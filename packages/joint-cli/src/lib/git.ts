import { execFile } from 'node:child_process';
import { mkdtemp, rm, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { REPO_URL, REPO_BRANCH } from '../constants.js';

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

export async function sparseCheckout(folder: string, dest: string): Promise<void> {
    const tmp = await mkdtemp(join(tmpdir(), 'joint-cli-'));

    try {
        await run('git', ['init', tmp]);
        await run('git', ['remote', 'add', 'origin', REPO_URL], tmp);
        await run('git', ['sparse-checkout', 'init', '--cone'], tmp);
        await run('git', ['sparse-checkout', 'set', folder], tmp);
        await run('git', ['pull', 'origin', REPO_BRANCH, '--depth=1'], tmp);

        // Move only the target folder to the destination
        await rename(join(tmp, folder), dest);
    } finally {
        await rm(tmp, { recursive: true, force: true });
    }
}
