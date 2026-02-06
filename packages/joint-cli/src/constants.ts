export const DEFAULT_OWNER = 'clientIO';
export const DEFAULT_REPO = 'joint-demos';
export const DEFAULT_BRANCH = 'main';

export interface RepoOptions {
    owner: string;
    branch: string;
}

export function getRepoUrl({ owner }: RepoOptions): string {
    return `https://github.com/${owner}/${DEFAULT_REPO}.git`;
}

export function getGitHubApiUrl({ owner }: RepoOptions): string {
    return `https://api.github.com/repos/${owner}/${DEFAULT_REPO}`;
}
