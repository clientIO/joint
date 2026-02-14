import { getGitHubApiUrl, type RepoOptions } from '../constants.js';

interface GitHubTreeItem {
    path: string;
    type: 'blob' | 'tree';
}

interface GitHubTreeResponse {
    tree: GitHubTreeItem[];
}

interface DemosConfig {
    demos: Record<string, { unlisted?: boolean }>;
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

async function fetchDemosConfig(options: RepoOptions): Promise<DemosConfig> {
    const apiUrl = getGitHubApiUrl(options);
    const url = `${apiUrl}/contents/demos.config.json?ref=${encodeURIComponent(options.branch)}`;

    const response = await fetch(url, {
        headers: {
            ...buildHeaders(),
            'Accept': 'application/vnd.github.v3.raw+json',
        },
    });

    if (!response.ok) {
        if (response.status === 404) {
            return { demos: {}};
        }
        throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json() as DemosConfig;
}

export async function getUnlistedDemos(options: RepoOptions): Promise<Set<string>> {
    const config = await fetchDemosConfig(options);
    const unlisted = new Set<string>();
    for (const [name, entry] of Object.entries(config.demos)) {
        if (entry.unlisted === true) {
            unlisted.add(name);
        }
    }
    return unlisted;
}

export async function listDemoFolders(options: RepoOptions): Promise<string[]> {
    const apiUrl = getGitHubApiUrl(options);
    const url = `${apiUrl}/git/trees/${encodeURIComponent(options.branch)}?recursive=1`;

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

    const unlisted = await getUnlistedDemos(options);

    // Return only 2-level deep directories (e.g. "scada/js", "kitchen-sink/ts")
    return data.tree
        // Only include items that are directories (type 'tree'),
        // are exactly 2 levels deep, and don't start with a dot (to exclude hidden folders)
        .filter((item) => item.type === 'tree' && item.path.split('/').length === 2 && !item.path.startsWith('.'))
        .map((item) => item.path)
        .filter((path) => !unlisted.has(path.split('/')[0]))
        .sort();
}
