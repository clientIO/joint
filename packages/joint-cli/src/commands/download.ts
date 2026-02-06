import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { listDemoFolders } from '../lib/github.js';
import { sparseCheckout } from '../lib/git.js';
import * as logger from '../lib/logger.js';

export async function download(folder: string): Promise<void> {
    logger.info(`Validating demo "${folder}"...\n`);

    const folders = await listDemoFolders();

    if (!folders.includes(folder)) {
        logger.error(`Demo "${folder}" not found.`);

        if (folders.length > 0) {
            console.log(`\n${logger.bold('Available demos:')}\n`);
            for (const f of folders) {
                console.log(`  - ${f}`);
            }
            console.log();
        } else {
            logger.warn('No demos are available yet.');
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

    await sparseCheckout(folder, dest);

    logger.success(`\nDone! Demo downloaded to ./${dirName}`);
}
