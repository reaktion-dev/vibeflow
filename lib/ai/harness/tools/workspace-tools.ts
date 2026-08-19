import { tool } from 'ai';
import { z } from 'zod';

import { getToolContext } from './context';
import {
  createAsset,
  listAssets,
  getAsset,
  getAssetDownloadUrl,
} from '@/lib/artifacts/service';
import {
  uploadToR2,
  buildObjectKey,
  isR2Configured,
} from '@/lib/storage/r2';
import {
  checkBudget,
  recordSpend,
} from '@/lib/budget/service';
import { BudgetExceededError } from '@/lib/budget/service';
import type { AssetType } from '@/lib/artifacts/contracts';

/**
 * Workspace tools for the HarnessAgent.
 *
 * These tools run on the Next.js host (not in the sandbox). They have access
 * to R2 storage, the database, and provider SDKs. Each paid tool declares
 * `toolApproval: 'user-approval'` so the turn pauses until the user
 * approves/denies.
 *
 * Phase 1 ships the foundational tools:
 * - listAssets: list artifacts for the current project
 * - getAssetUrl: get a signed download URL for an asset
 * - uploadTextAsset: store a text/JSON/markdown artifact to R2 + DB
 *
 * Future phases add:
 * - generateImage (Design)
 * - traceImage (Design)
 * - exportDesign (Design)
 * - generateVideo (Video)
 * - generateDocument (Docs)
 */

export function createWorkspaceTools() {
  return {
    listAssets: tool({
      description:
        'List all artifacts/assets in the current project. Returns id, name, type, status, and creation date.',
      inputSchema: z.object({
        type: z
          .enum(['image', 'svg', 'video', 'audio', 'document', 'export', 'pipeline'])
          .optional()
          .describe('Filter by asset type'),
      }),
      execute: async ({ type }) => {
        const { projectId } = getToolContext();
        const assets = await listAssets(projectId, type as AssetType | undefined);

        return {
          assets: assets.map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            status: (() => {
              try {
                return JSON.parse(a.metadata || '{}').status ?? 'ready';
              } catch {
                return 'ready';
              }
            })(),
            createdAt: a.createdAt,
          })),
        };
      },
    }),

    getAssetUrl: tool({
      description:
        'Get a short-lived download URL for a project asset (image, SVG, video, document). Use this when the user wants to view or download an artifact.',
      inputSchema: z.object({
        assetId: z.string().describe('The asset ID to get a URL for'),
      }),
      execute: async ({ assetId }) => {
        const { projectId } = getToolContext();
        const url = await getAssetDownloadUrl(projectId, assetId);
        return { url };
      },
    }),

    uploadTextAsset: tool({
      description:
        'Upload a text-based artifact (Markdown, JSON, SVG source, code) to the project artifact store. Creates an asset record in the database.',
      inputSchema: z.object({
        name: z.string().describe('Human-readable name for the asset'),
        content: z.string().describe('The text content to store'),
        mimeType: z
          .string()
          .default('text/plain')
          .describe('MIME type (e.g., "text/markdown", "image/svg+xml", "application/json")'),
        assetType: z
          .enum(['svg', 'document', 'pipeline'])
          .default('document')
          .describe('Asset type category'),
      }),
      execute: async ({ name, content, mimeType, assetType }) => {
        const { projectId } = getToolContext();
        const buffer = Buffer.from(content, 'utf-8');

        const result = await createAsset({
          projectId,
          name,
          type: assetType as AssetType,
          mimeType,
          body: buffer,
        });

        return {
          assetId: result.id,
          sizeBytes: result.sizeBytes,
          message: `Asset "${name}" created successfully.`,
        };
      },
    }),

    checkBudget: tool({
      description:
        'Check the remaining generation budget for the current project. Returns budget, spent, and remaining amounts in cents.',
      inputSchema: z.object({
        estimatedCostCents: z
          .number()
          .int()
          .nonnegative()
          .default(0)
          .describe('Estimated cost of the next operation in cents'),
      }),
      execute: async ({ estimatedCostCents }) => {
        const { projectId } = getToolContext();
        const result = await checkBudget(projectId, estimatedCostCents);
        return result;
      },
    }),
  };
}

/**
 * Tool approval map for the workspace tools.
 *
 * Paid tools require user approval before execution. Free tools (listAssets,
 * getAssetUrl, checkBudget) execute without approval.
 */
export const workspaceToolApproval = {
  uploadTextAsset: 'user-approval' as const,
  // listAssets, getAssetUrl, checkBudget are free (no approval)
};
