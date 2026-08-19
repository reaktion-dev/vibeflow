// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  gitUrl?: string;
  sandboxId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Sandbox types (from Daytona)
export interface Sandbox {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'paused' | 'error';
  createdAt: Date;
  updatedAt: Date;
  gitConfig?: {
    url: string;
    branch?: string;
    sshKey?: string;
  };
}

// File system types
export interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  children?: FileNode[];
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
}

// Terminal types
export interface TerminalCommand {
  id: string;
  command: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  output: string;
  error?: string;
  exitCode?: number;
  createdAt: Date;
  completedAt?: Date;
}

// AI Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  metadata?: {
    sandboxId?: string;
    agentOperation?: {
      type: string;
      status: 'pending' | 'running' | 'completed' | 'error';
    };
  };
}

export interface ChatSession {
  id: string;
  projectId: string;
  messages: ChatMessage[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

// Daytona API Response types
export interface DaytonaResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Git operations
export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  dirty: boolean;
  untracked: string[];
}

// Agent operations
export interface AgentOperation {
  id: string;
  type: 'code_generation' | 'bug_fix' | 'refactor' | 'test_generation' | 'custom';
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: string;
  output?: string;
  error?: string;
  sandboxId: string;
  createdAt: Date;
  completedAt?: Date;
}
