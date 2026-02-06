#!/usr/bin/env node

import { createRequire } from 'node:module';
import { list } from './commands/list.js';
import { download } from './commands/download.js';
import { DEFAULT_OWNER, DEFAULT_BRANCH, type RepoOptions } from './constants.js';
import * as logger from './lib/logger.js';

const require = createRequire(import.meta.url);
const { version: VERSION } = require('../package.json');

const HELP = `
${logger.bold('joint')} — Command-line tool for JointJS

${logger.bold('Usage:')}
  joint <command> [options]

${logger.bold('Commands:')}
  list                List available examples
  download <name> [dest]  Download an example

${logger.bold('Options:')}
  --help, -h          Show this help message
  --version, -v       Show version number
  --owner <name>      GitHub repo owner (default: ${DEFAULT_OWNER})
  --branch <name>     GitHub repo branch (default: ${DEFAULT_BRANCH})

${logger.bold('Environment:')}
  GITHUB_TOKEN        Optional GitHub token to avoid rate limiting
`;

function getFlag(args: string[], name: string): string | undefined {
    const index = args.indexOf(name);
    if (index === -1) return undefined;

    const value = args[index + 1];
    if (index + 1 >= args.length || !value || value.startsWith('--')) {
        logger.error(`Missing value for option "${name}".`);
        process.exit(1);
    }

    return value;
}

function stripFlags(args: string[]): string[] {
    const result: string[] = [];
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--owner' || args[i] === '--branch') {
            i++; // skip the value
        } else {
            result.push(args[i]);
        }
    }
    return result;
}

async function main(): Promise<void> {
    const rawArgs = process.argv.slice(2);

    if (rawArgs.length === 0 || rawArgs.includes('--help') || rawArgs.includes('-h')) {
        console.log(HELP);
        return;
    }

    if (rawArgs.includes('--version') || rawArgs.includes('-v')) {
        console.log(VERSION);
        return;
    }

    const options: RepoOptions = {
        owner: getFlag(rawArgs, '--owner') ?? DEFAULT_OWNER,
        branch: getFlag(rawArgs, '--branch') ?? DEFAULT_BRANCH,
    };

    const args = stripFlags(rawArgs);
    const command = args[0];

    switch (command) {
        case 'list':
            await list(options);
            break;

        case 'download': {
            const folder = args[1];
            if (!folder) {
                logger.error('Missing required argument: <name>\n');
                logger.info('Usage: joint download <name> [dest]');
                process.exit(1);
            }
            const target = args[2];
            await download(folder, target, options);
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
