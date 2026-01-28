
export enum AgentStep {
  IDLE = 'IDLE',
  PLAN = 'PLAN',
  EXECUTE = 'EXECUTE',
  VERIFY = 'VERIFY',
  ITERATE = 'ITERATE',
  DEPLOY = 'DEPLOY'
}

export interface FileNode {
  name: string;
  content: string;
  language: string;
  path: string;
  diff?: DiffPart[];
}

export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
  origin?: 'cloud' | 'local' | 'merged';
}

export interface GitHubState {
  repoName: string;
  owner: string;
  url: string;
  lastCommitSha?: string;
  workflowActive: boolean;
}

export interface ProjectState {
  name: string;
  files: FileNode[];
  plan: string[];
  github?: GitHubState;
}

export interface ProviderSettings {
  ollamaUrl: string;
  ollamaModel: string;
  hfUrl: string; // Local bridge URL
  hfToken?: string; // Hugging Face Hub Token
  hfModel: string; // Model ID for HF
  useCloud: boolean;
  cloudModel: string;
  githubToken?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'chat' | 'log' | 'error' | 'diff' | 'github';
  metadata?: any;
}
