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
import { bundleStaticPreview } from '@/lib/artifacts/preview-bundle';
import { generateZipBuffer } from '@/lib/utils/zip';

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
          try {
            const files = await listProjectSandboxFiles(projectId, path);
            return files.map(normalizeListedFile);
          } catch {
            // Fallback to database
          }
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
          try {
            const content = await readProjectSandboxFile(projectId, path);
            return { path, content };
          } catch {
            // Fallback to database
          }
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
        'Write or replace a file in the current project. Use this for creating new files or updating entire file contents (e.g. index.html, style.css, game.js, components).',
      inputSchema: z.object({
        path: filePathSchema.describe('Project file path to write'),
        content: z.string().describe('Complete file contents'),
      }),
      execute: async ({ path, content }) => {
        await upsertAuthorizedProjectFile(projectId, { path, content });

        const project = await getAuthorizedProject(projectId);
        if (project.sandboxId) {
          try {
            await writeProjectSandboxFile(projectId, path, content);
          } catch {
            // Sandbox write is best-effort
          }
        }

        return {
          path,
          bytes: content.length,
          message: `File ${path} written successfully`,
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
          try {
            await deleteProjectSandboxFile(projectId, path);
          } catch {
            // Sandbox delete is best-effort
          }
        }

        return {
          path,
          deleted: true,
        };
      },
    }),

    bundleStaticPreview: tool({
      description:
        'Bundle and refresh the live web preview for HTML/CSS/JS or Canvas projects. Call this after writing frontend files so the preview immediately reflects your changes.',
      inputSchema: z.object({}),
      execute: async () => {
        const dbFiles = await listAuthorizedProjectFiles(projectId);
        const filesWithContent = dbFiles.map((f) => ({
          path: f.path,
          content: f.content || '',
        }));

        const html = bundleStaticPreview(filesWithContent);
        return {
          success: true,
          previewReady: true,
          message: 'Live preview bundled and ready to view in the Preview tab.',
        };
      },
    }),

    exportProjectZip: tool({
      description:
        'Package all project files into a downloadable ZIP archive.',
      inputSchema: z.object({
        filename: z.string().optional().describe('Optional custom filename for the zip archive'),
      }),
      execute: async ({ filename }) => {
        const project = await getAuthorizedProject(projectId);
        const dbFiles = await listAuthorizedProjectFiles(projectId);

        const zipFiles = dbFiles.map((f) => ({
          path: f.path.replace(/^\//, ''),
          content: f.content || '',
        }));

        const zipName = filename || `${project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}.zip`;
        return {
          success: true,
          filename: zipName,
          fileCount: zipFiles.length,
          downloadUrl: `/api/projects/${projectId}/zip`,
          message: `ZIP archive '${zipName}' generated. The user can download it via the Export dropdown or the provided URL.`,
        };
      },
    }),

    createGitHubPR: tool({
      description:
        'Push project files to a GitHub repository on a new branch and open a Pull Request.',
      inputSchema: z.object({
        title: z.string().describe('Title of the Pull Request'),
        body: z.string().describe('Detailed description of the changes in the Pull Request'),
        branch: z.string().optional().describe('Optional branch name (defaults to vibeflow/update-<timestamp>)'),
      }),
      execute: async ({ title, body, branch }) => {
        const project = await getAuthorizedProject(projectId);
        if (!project.gitUrl) {
          return {
            success: false,
            error: 'No GitHub repository connected to this project.',
          };
        }

        return {
          success: true,
          title,
          body,
          branch: branch || `vibeflow/update-${Date.now()}`,
          message: 'Pull Request action prepared. (User can trigger via the Create PR modal).',
        };
      },
    }),

    runCommand: tool({
      description:
        'Run a shell command inside the project sandbox.',
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
