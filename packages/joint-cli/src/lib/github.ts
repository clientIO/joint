import { getGitHubApiUrl, type RepoOptions } from '../constants.js';

interface GitHubTreeItem {
    path: string;
    type: 'blob' | 'tree';
}

interface GitHubTreeResponse {
    tree: GitHubTreeItem[];
}

function buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'joint-cli',
    };

    const token = process.env.GITHUB_TOKEN;
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

export async function listDemoFolders(options: RepoOptions): Promise<string[]> {
    const apiUrl = getGitHubApiUrl(options);
    const url = `${apiUrl}/git/trees/${options.branch}?recursive=1`;

    const response = await fetch(url, { headers: buildHeaders() });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Repository or branch not found. Please verify the --owner and --branch options.');
        }
        throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as GitHubTreeResponse;

    if (!Array.isArray(data.tree)) {
        return [];
    }

    // Return only 2-level deep directories (e.g. "scada/js", "kitchen-sink/ts")
    return data.tree
        .filter((item) => item.type === 'tree' && item.path.split('/').length === 2)
        .map((item) => item.path)
        .sort();
}
