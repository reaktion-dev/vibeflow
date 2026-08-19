import { getDaytonaClient } from './client';
import { FileNode, Sandbox } from '../types';

const daytona = getDaytonaClient();

/**
 * Create a new sandbox for a project
 */
export async function createSandbox(projectName: string): Promise<Sandbox> {
  try {
    const result = await daytona.createSandbox({
      name: `${projectName}-${Date.now()}`,
      project: projectName,
    });

    return {
      id: result.id,
      name: result.name,
      status: 'running',
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),
    };
  } catch (error) {
    console.error('Failed to create sandbox:', error);
    throw error;
  }
}

/**
 * Get sandbox details
 */
export async function getSandbox(sandboxId: string): Promise<Sandbox> {
  try {
    const result = await daytona.getSandbox(sandboxId);

    return {
      id: result.id,
      name: result.name,
      status: result.status,
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),
    };
  } catch (error) {
    console.error(`Failed to get sandbox ${sandboxId}:`, error);
    throw error;
  }
}

/**
 * List all user's sandboxes
 */
export async function listSandboxes(): Promise<Sandbox[]> {
  try {
    const results = await daytona.listSandboxes();

    return results.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
    }));
  } catch (error) {
    console.error('Failed to list sandboxes:', error);
    return [];
  }
}

/**
 * Delete a sandbox
 */
export async function deleteSandbox(sandboxId: string): Promise<void> {
  try {
    await daytona.deleteSandbox(sandboxId);
  } catch (error) {
    console.error(`Failed to delete sandbox ${sandboxId}:`, error);
    throw error;
  }
}

/**
 * Execute a command in sandbox and return output
 */
export async function executeCommand(
  sandboxId: string,
  command: string,
  workingDirectory?: string
): Promise<{ output: string; error?: string; exitCode: number }> {
  try {
    const result = await daytona.executeCommand(sandboxId, command, {
      workingDirectory,
    });

    return {
      output: result.output || '',
      error: result.error,
      exitCode: result.exitCode || 0,
    };
  } catch (error) {
    console.error(`Failed to execute command: ${command}`, error);
    throw error;
  }
}

/**
 * Get the file tree of a directory
 */
export async function getFileTree(
  sandboxId: string,
  dirPath: string = '/'
): Promise<FileNode[]> {
  try {
    const files = await daytona.listFiles(sandboxId, dirPath);

    return files.map((f) => ({
      path: f.path,
      name: f.name,
      type: f.type || (f.isDirectory ? 'directory' : 'file'),
      size: f.size,
      modified: f.modified ? new Date(f.modified) : undefined,
    }));
  } catch (error) {
    console.error(`Failed to get file tree for ${dirPath}:`, error);
    return [];
  }
}

/**
 * Read file content
 */
export async function readFile(
  sandboxId: string,
  filePath: string
): Promise<string> {
  try {
    return await daytona.readFile(sandboxId, filePath);
  } catch (error) {
    console.error(`Failed to read file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Write file content
 */
export async function writeFile(
  sandboxId: string,
  filePath: string,
  content: string
): Promise<void> {
  try {
    await daytona.writeFile(sandboxId, filePath, content);
  } catch (error) {
    console.error(`Failed to write file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Delete a file
 */
export async function deleteFile(
  sandboxId: string,
  filePath: string
): Promise<void> {
  try {
    await daytona.deleteFile(sandboxId, filePath);
  } catch (error) {
    console.error(`Failed to delete file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Initialize git repository in sandbox
 */
export async function initializeGit(
  sandboxId: string,
  repoUrl: string,
  branch?: string
): Promise<void> {
  try {
    await daytona.initGit(sandboxId, repoUrl, { branch });
  } catch (error) {
    console.error(`Failed to initialize git for ${repoUrl}:`, error);
    throw error;
  }
}

/**
 * Get git status in sandbox
 */
export async function getGitStatus(
  sandboxId: string
): Promise<{ branch: string; dirty: boolean }> {
  try {
    const result = await daytona.getGitStatus(sandboxId);

    return {
      branch: result.branch || 'main',
      dirty: result.dirty || false,
    };
  } catch (error) {
    console.error(`Failed to get git status:`, error);
    return { branch: 'main', dirty: false };
  }
}

/**
 * Clone a git repository into sandbox
 */
export async function cloneRepository(
  sandboxId: string,
  repoUrl: string,
  branch?: string
): Promise<void> {
  try {
    const command = `git clone ${
      branch ? `-b ${branch}` : ''
    } ${repoUrl} .`;
    await executeCommand(sandboxId, command, '/');
  } catch (error) {
    console.error(`Failed to clone repository ${repoUrl}:`, error);
    throw error;
  }
}
