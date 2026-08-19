import { tool } from 'ai';
import { z } from 'zod';

import {
  deleteProjectSandboxFile,
  listProjectSandboxFiles,
  readProjectSandboxFile,
  runProjectSandboxCommand,
  writeProjectSandboxFile,
} from '@/lib/daytona/project-sandbox';
import {
  deleteAuthorizedProjectFile,
  getAuthorizedProject,
  getAuthorizedProjectFile,
  listAuthorizedProjectFiles,
  upsertAuthorizedProjectFile,
} from '@/lib/projects/server';

const filePathSchema = z.string().min(1, 'File path is required');

function normalizeListedFile(file: any) {
  return {
    path: file.path,
    name: file.name ?? file.path?.split('/').pop() ?? file.path,
    type: file.type ?? (file.isDirectory ? 'directory' : 'file'),
    size: file.size ?? null,
    modified: file.modified ?? file.updatedAt ?? null,
  };
}

export function createProjectTools(projectId: string) {
  return {
    getProjectOverview: tool({
      description:
        'Get high-level information about the current Vibeflow project and sandbox status.',
      inputSchema: z.object({}),
      execute: async () => {
        const project = await getAuthorizedProject(projectId);

        return {
          id: project.id,
          name: project.name,
          description: project.description ?? null,
          gitUrl: project.gitUrl ?? null,
          sandboxId: project.sandboxId ?? null,
        };
      },
    }),

    listFiles: tool({
      description:
        'List files in the project. Use this before reading or editing when you are unsure about paths.',
      inputSchema: z.object({
        path: z.string().default('/').describe('Directory path to inspect'),
      }),
      execute: async ({ path }) => {
        const project = await getAuthorizedProject(projectId);

        if (project.sandboxId) {
          const files = await listProjectSandboxFiles(projectId, path);
          return files.map(normalizeListedFile);
        }

        const files = await listAuthorizedProjectFiles(projectId);
        const normalizedPath = path === '/' ? '' : path.replace(/\/$/, '');

        return files
          .filter((file) => {
            if (!normalizedPath) return true;
            return file.path === normalizedPath || file.path.startsWith(`${normalizedPath}/`);
          })
          .map(normalizeListedFile);
      },
    }),

    readFile: tool({
      description:
        'Read the full contents of a file from the current project workspace.',
      inputSchema: z.object({
        path: filePathSchema.describe('Project file path to read'),
      }),
      execute: async ({ path }) => {
        const project = await getAuthorizedProject(projectId);

        if (project.sandboxId) {
          const content = await readProjectSandboxFile(projectId, path);
          return { path, content };
        }

        const file = await getAuthorizedProjectFile(projectId, path);
        return {
          path,
          content: file.content ?? '',
        };
      },
    }),

    writeFile: tool({
      description:
        'Write or replace a file in the current project. Use this for creating new files or updating entire file contents.',
      inputSchema: z.object({
        path: filePathSchema.describe('Project file path to write'),
        content: z.string().describe('Complete file contents'),
      }),
      execute: async ({ path, content }) => {
        await upsertAuthorizedProjectFile(projectId, { path, content });

        const project = await getAuthorizedProject(projectId);
        if (project.sandboxId) {
          await writeProjectSandboxFile(projectId, path, content);
        }

        return {
          path,
          bytes: content.length,
          message: 'File written successfully',
        };
      },
    }),

    deleteFile: tool({
      description: 'Delete a file from the current project workspace.',
      inputSchema: z.object({
        path: filePathSchema.describe('Project file path to delete'),
      }),
      execute: async ({ path }) => {
        await deleteAuthorizedProjectFile(projectId, path);

        const project = await getAuthorizedProject(projectId);
        if (project.sandboxId) {
          await deleteProjectSandboxFile(projectId, path);
        }

        return {
          path,
          deleted: true,
        };
      },
    }),

    runCommand: tool({
      description:
        'Run a shell command inside the project sandbox. Prefer read-only inspection commands unless the user explicitly asks for changes.',
      inputSchema: z.object({
        command: z.string().min(1, 'Command is required'),
        workingDirectory: z.string().optional(),
      }),
      execute: async ({ command, workingDirectory }) => {
        const result = await runProjectSandboxCommand(projectId, command, {
          workingDirectory,
        });

        return {
          command,
          workingDirectory: workingDirectory ?? '/',
          output: result.output ?? '',
          error: result.error ?? null,
          exitCode: result.exitCode ?? 0,
        };
      },
    }),
  };
}
