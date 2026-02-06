#!/usr/bin/env node

import { list } from './commands/list.js';
import { download } from './commands/download.js';
import * as logger from './lib/logger.js';

const VERSION = '0.1.0';

const HELP = `
${logger.bold('joint')} — Download JointJS demo applications

${logger.bold('Usage:')}
  joint <command> [options]

${logger.bold('Commands:')}
  list                List available demo folders
  download <folder>   Download a demo folder

${logger.bold('Options:')}
  --help, -h          Show this help message
  --version, -v       Show version number

${logger.bold('Environment:')}
  GITHUB_TOKEN        Optional GitHub token to avoid rate limiting
`;

async function main(): Promise<void> {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(HELP);
        return;
    }

    if (args.includes('--version') || args.includes('-v')) {
        console.log(VERSION);
        return;
    }

    const command = args[0];

    switch (command) {
        case 'list':
            await list();
            break;

        case 'download': {
            const folder = args[1];
            if (!folder) {
                logger.error('Missing required argument: <folder>\n');
                logger.info('Usage: joint download <folder>');
                process.exit(1);
            }
            await download(folder);
            break;
        }

        default:
            logger.error(`Unknown command: "${command}"\n`);
            logger.info('Run "joint --help" to see available commands.');
            process.exit(1);
    }
}

main().catch((err: Error) => {
    logger.error(err.message);
    process.exit(1);
});
