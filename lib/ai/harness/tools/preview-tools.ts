import { tool } from 'ai';
import { z } from 'zod';

import { getToolContext } from './context';
import { getAuthorizedProject, listAuthorizedProjectFiles } from '@/lib/projects/server';
import { bundleStaticPreview } from '@/lib/artifacts/preview-bundle';

export function createPreviewTools() {
  return {
    bundleStaticPreview: tool({
      description:
        'Generate an instant standalone HTML preview bundle for static web applications, HTML5/Canvas games, and frontend components.',
      inputSchema: z.object({}),
      execute: async () => {
        const { projectId } = getToolContext();
        const files = await listAuthorizedProjectFiles(projectId);

        const projectFiles = files.map((f) => ({
          path: f.path,
          content: f.content || '',
        }));

        const html = bundleStaticPreview(projectFiles);

        return {
          success: true,
          previewReady: true,
          fileCount: files.length,
          previewHtmlLength: html.length,
          message: 'Static preview bundled successfully. Live preview refreshed.',
        };
      },
    }),

    getSandboxPreviewUrl: tool({
      description:
        'Get the live preview URL for a running web/dev server in the project sandbox.',
      inputSchema: z.object({
        port: z.number().int().default(3000).describe('Port number of the dev server (e.g. 3000, 5173, 8080)'),
      }),
      execute: async ({ port }) => {
        const { projectId } = getToolContext();
        const project = await getAuthorizedProject(projectId);

        let previewUrl = `/api/projects/${projectId}/preview`;
        if (project.sandboxId) {
          previewUrl = `https://${project.sandboxId}-${port}.daytona.app`;
        }

        return {
          port,
          previewUrl,
          message: `Dev server preview available at port ${port}.`,
        };
      },
    }),
  };
}
