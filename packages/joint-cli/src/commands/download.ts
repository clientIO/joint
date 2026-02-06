import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { RepoOptions } from '../constants.js';
import { listDemoFolders } from '../lib/github.js';
import { sparseCheckout } from '../lib/git.js';
import * as logger from '../lib/logger.js';

export async function download(folder: string, options: RepoOptions): Promise<void> {
    logger.info(`Validating example "${folder}"...\n`);

    const folders = await listDemoFolders(options);

    if (!folders.includes(folder)) {
        logger.error(`Example "${folder}" not found.`);

        if (folders.length > 0) {
            console.log(`\n${logger.bold('Available examples:')}\n`);
            for (const f of folders) {
                console.log(`  - ${f}`);
            }
            console.log();
        } else {
            logger.warn('No examples are available yet.');
        }

        process.exit(1);
    }

    const dirName = folder.replace(/\//g, '-');
    const dest = resolve(process.cwd(), dirName);

    if (existsSync(dest)) {
        logger.error(`Directory "${dirName}" already exists in the current directory.`);
        process.exit(1);
    }

    logger.info(`Downloading "${folder}"...`);

    await sparseCheckout(folder, dest, options);

    logger.success(`\nDone! Example downloaded to ./${dirName}`);
}
