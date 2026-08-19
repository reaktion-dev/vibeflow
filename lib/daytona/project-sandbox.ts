import { getDaytonaClient } from '@/lib/daytona/client';
import { getAuthorizedProject } from '@/lib/projects/server';

const daytona = getDaytonaClient();

async function getSandboxId(projectId: string) {
  const project = await getAuthorizedProject(projectId);

  if (!project.sandboxId) {
    throw new Error('Sandbox not provisioned for this project');
  }

  return project.sandboxId;
}

export async function listProjectSandboxFiles(projectId: string, path = '/') {
  const sandboxId = await getSandboxId(projectId);
  return daytona.listFiles(sandboxId, path);
}

export async function readProjectSandboxFile(projectId: string, path: string) {
  const sandboxId = await getSandboxId(projectId);
  return daytona.readFile(sandboxId, path);
}

export async function writeProjectSandboxFile(
  projectId: string,
  path: string,
  content: string
) {
  const sandboxId = await getSandboxId(projectId);
  return daytona.writeFile(sandboxId, path, content);
}

export async function deleteProjectSandboxFile(projectId: string, path: string) {
  const sandboxId = await getSandboxId(projectId);
  return daytona.deleteFile(sandboxId, path);
}

export async function runProjectSandboxCommand(
  projectId: string,
  command: string,
  options?: {
    workingDirectory?: string;
    environment?: Record<string, string>;
  }
) {
  const sandboxId = await getSandboxId(projectId);
  return daytona.executeCommand(sandboxId, command, options);
}
