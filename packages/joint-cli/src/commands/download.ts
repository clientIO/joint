import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { RepoOptions } from '../constants.js';
import { listDemoFolders } from '../lib/github.js';
import { sparseCheckout } from '../lib/git.js';
import * as logger from '../lib/logger.js';

export interface DownloadOptions extends RepoOptions {
    force?: boolean;
}

export async function download(folder: string, target: string | undefined, options: DownloadOptions): Promise<void> {
    logger.info(`Validating example "${folder}"...\n`);

    const folders = await listDemoFolders(options);

    if (!folders.includes(folder)) {
        logger.error(`Example "${folder}" not found.`);

        if (folders.length > 0) {
            logger.log(`\n${logger.bold('Available examples:')}\n`);
            for (const f of folders) {
                logger.log(`  - ${f}`);
            }
            logger.log('');
        } else {
            logger.warn('No examples are available yet.');
        }

        process.exit(1);
    }

    const dirName = target ?? folder.replace(/\//g, '-');
    const dest = resolve(process.cwd(), dirName);

    if (existsSync(dest)) {
        if (dirName !== '.' && !options.force) {
            logger.error(`Directory "${dirName}" already exists. Use --force to overwrite.`);
            process.exit(1);
        }

        if (dirName === '.' && readdirSync(dest).length > 0 && !options.force) {
            logger.error('Current directory is not empty. Use --force to overwrite existing files.');
            process.exit(1);
        }
    }

    logger.info(`Downloading "${folder}"...`);

    await sparseCheckout(folder, dest, options);

    const displayPath = dirName === '.' ? 'current directory' : `./${dirName}`;
    logger.success(`\nDone! Example downloaded to ${displayPath}`);
}
