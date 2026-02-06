const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';

export function info(msg: string): void {
    console.log(`${CYAN}${msg}${RESET}`);
}

export function success(msg: string): void {
    console.log(`${GREEN}${msg}${RESET}`);
}

export function warn(msg: string): void {
    console.log(`${YELLOW}${msg}${RESET}`);
}

export function error(msg: string): void {
    console.error(`${RED}${msg}${RESET}`);
}

export function bold(msg: string): string {
    return `${BOLD}${msg}${RESET}`;
}
