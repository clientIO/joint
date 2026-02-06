import { listDemoFolders } from '../lib/github.js';
import * as logger from '../lib/logger.js';

export async function list(): Promise<void> {
    logger.info('Fetching available examples...\n');

    const folders = await listDemoFolders();

    if (folders.length === 0) {
        logger.warn('No examples available yet.');
        return;
    }

    console.log(logger.bold('Available examples:\n'));
    for (const folder of folders) {
        console.log(`  - ${folder}`);
    }
    console.log();
}
