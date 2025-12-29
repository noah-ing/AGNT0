import type { ToolDefinition, ExecutionContext } from '../../runtime/types';

export const GitHubTool: ToolDefinition = {
  id: 'github',
  name: 'GitHub',
  description: 'Interact with GitHub repositories, issues, PRs, and more',
  category: 'Integration',
  icon: 'Github',
  schema: {
    input: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'getRepo',
            'listRepos',
            'getFile',
            'listFiles',
            'createIssue',
            'listIssues',
            'getIssue',
            'createPR',
            'listPRs',
            'getPR',
            'searchCode',
            'getUser',
          ],
          description: 'GitHub action to perform',
        },
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        path: { type: 'string', description: 'File path in repository' },
        branch: { type: 'string', description: 'Branch name', default: 'main' },
        title: { type: 'string', description: 'Issue/PR title' },
        body: { type: 'string', description: 'Issue/PR body' },
        labels: { type: 'array', items: { type: 'string' }, description: 'Labels for issue' },
        number: { type: 'number', description: 'Issue or PR number' },
        query: { type: 'string', description: 'Search query' },
        username: { type: 'string', description: 'GitHub username' },
      },
      required: ['action'],
    },
    output: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'any' },
        error: { type: 'string' },
      },
    },
  },
  execute: async (input: unknown, context: ExecutionContext): Promise<unknown> => {
    const {
      action,
      owner,
      repo,
      path: filePath,
      branch = 'main',
      title,
      body,
      labels,
      number,
      query,
      username,
    } = input as {
      action: string;
      owner?: string;
      repo?: string;
      path?: string;
      branch?: string;
      title?: string;
      body?: string;
      labels?: string[];
      number?: number;
      query?: string;
      username?: string;
    };

    const token = context.config.apiKeys?.github || process.env.GITHUB_TOKEN;
    if (!token && action !== 'getRepo' && action !== 'getUser') {
      return { success: false, error: 'GitHub token required. Set GITHUB_TOKEN or configure in settings.' };
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'AGNT0/1.0',
    };

    if (token) {
      headers.Authorization = `token ${token}`;
    }

    const apiUrl = 'https://api.github.com';

    try {
      let url: string;
      let method = 'GET';
      let requestBody: string | undefined;

      switch (action) {
        case 'getRepo':
          if (!owner || !repo) throw new Error('owner and repo required');
          url = `${apiUrl}/repos/${owner}/${repo}`;
          break;

        case 'listRepos':
          if (username) {
            url = `${apiUrl}/users/${username}/repos`;
          } else {
            url = `${apiUrl}/user/repos`;
          }
          break;

        case 'getFile':
          if (!owner || !repo || !filePath) throw new Error('owner, repo, and path required');
          url = `${apiUrl}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
          break;

        case 'listFiles':
          if (!owner || !repo) throw new Error('owner and repo required');
          url = `${apiUrl}/repos/${owner}/${repo}/contents/${filePath || ''}?ref=${branch}`;
          break;

        case 'createIssue':
          if (!owner || !repo || !title) throw new Error('owner, repo, and title required');
          url = `${apiUrl}/repos/${owner}/${repo}/issues`;
          method = 'POST';
          requestBody = JSON.stringify({ title, body, labels });
          break;

        case 'listIssues':
          if (!owner || !repo) throw new Error('owner and repo required');
          url = `${apiUrl}/repos/${owner}/${repo}/issues`;
          break;

        case 'getIssue':
          if (!owner || !repo || !number) throw new Error('owner, repo, and number required');
          url = `${apiUrl}/repos/${owner}/${repo}/issues/${number}`;
          break;

        case 'createPR':
          if (!owner || !repo || !title) throw new Error('owner, repo, and title required');
          url = `${apiUrl}/repos/${owner}/${repo}/pulls`;
          method = 'POST';
          requestBody = JSON.stringify({ title, body, head: branch, base: 'main' });
          break;

        case 'listPRs':
          if (!owner || !repo) throw new Error('owner and repo required');
          url = `${apiUrl}/repos/${owner}/${repo}/pulls`;
          break;

        case 'getPR':
          if (!owner || !repo || !number) throw new Error('owner, repo, and number required');
          url = `${apiUrl}/repos/${owner}/${repo}/pulls/${number}`;
          break;

        case 'searchCode':
          if (!query) throw new Error('query required');
          url = `${apiUrl}/search/code?q=${encodeURIComponent(query)}`;
          break;

        case 'getUser':
          url = username ? `${apiUrl}/users/${username}` : `${apiUrl}/user`;
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      const response = await fetch(url, {
        method,
        headers,
        body: requestBody,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `GitHub API error: ${response.status}`,
        };
      }

      // Decode file content if fetching a file
      if (action === 'getFile' && data.content) {
        data.decodedContent = Buffer.from(data.content, 'base64').toString('utf-8');
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
