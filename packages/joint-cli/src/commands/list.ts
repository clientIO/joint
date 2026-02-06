import { listDemoFolders } from '../lib/github.js';
import * as logger from '../lib/logger.js';

export async function list(): Promise<void> {
    logger.info('Fetching available demos...\n');

    const folders = await listDemoFolders();

    if (folders.length === 0) {
        logger.warn('No demos available yet.');
        return;
    }

    console.log(logger.bold('Available demos:\n'));
    for (const folder of folders) {
        console.log(`  - ${folder}`);
    }
    console.log();
}
