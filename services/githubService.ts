
import { FileNode } from '../types';

export class GitHubService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, method: string = 'GET', body?: any) {
    const res = await fetch(`https://api.github.com${endpoint}`, {
      method,
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'GitHub API Error');
    }
    return res.json();
  }

  async createRepo(name: string) {
    return this.request('/user/repos', 'POST', {
      name,
      auto_init: true,
      description: 'Built with Private Agent Architect',
    });
  }

  async commitFiles(owner: string, repo: string, files: FileNode[], message: string = 'Agentic Architecture Sync') {
    // 1. Get current ref
    const ref = await this.request(`/repos/${owner}/${repo}/git/refs/heads/main`);
    const latestCommitSha = ref.object.sha;

    // 2. Create blobs for each file
    const treeItems = await Promise.all(files.map(async (file) => {
      const blob = await this.request(`/repos/${owner}/${repo}/git/blobs`, 'POST', {
        content: file.content,
        encoding: 'utf-16', // Handle larger files or specialized chars if needed
      });
      // GitHub API actually prefers utf-8 or base64
      // Simplified version:
      const blobV2 = await this.request(`/repos/${owner}/${repo}/git/blobs`, 'POST', {
        content: btoa(unescape(encodeURIComponent(file.content))),
        encoding: 'base64',
      });
      return {
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blobV2.sha,
      };
    }));

    // 3. Create tree
    const tree = await this.request(`/repos/${owner}/${repo}/git/trees`, 'POST', {
      base_tree: latestCommitSha,
      tree: treeItems,
    });

    // 4. Create commit
    const commit = await this.request(`/repos/${owner}/${repo}/git/commits`, 'POST', {
      message,
      tree: tree.sha,
      parents: [latestCommitSha],
    });

    // 5. Update ref
    return this.request(`/repos/${owner}/${repo}/git/refs/heads/main`, 'PATCH', {
      sha: commit.sha,
    });
  }

  async setupCICD(owner: string, repo: string) {
    const workflow = `name: Agent Architect CI/CD
on:
  push:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Run build
        run: npm run build`;

    return this.commitFiles(owner, repo, [{
      name: 'main.yml',
      path: '.github/workflows/main.yml',
      content: workflow,
      language: 'yaml'
    }], 'Setup CI/CD Pipeline');
  }
}
