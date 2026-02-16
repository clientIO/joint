import type { RepoOptions } from '../constants.js';
import { listDemoFolders } from '../lib/github.js';
import * as logger from '../lib/logger.js';

export async function list(options: RepoOptions): Promise<void> {
    logger.info('Fetching available examples...\n');

    const folders = await listDemoFolders(options);

    if (folders.length === 0) {
        logger.warn('No examples available yet.');
        return;
    }

    logger.log(logger.bold('Available examples:\n'));
    for (const folder of folders) {
        logger.log(`  - ${folder}`);
    }
    logger.log('');
}
