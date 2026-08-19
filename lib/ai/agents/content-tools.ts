import { tool } from 'ai';
import { z } from 'zod';

import { getToolContext } from '@/lib/ai/harness/tools/context';
import {
  createAsset,
  listAssets,
  getAsset,
  getAssetDownloadUrl,
} from '@/lib/artifacts/service';
import { checkBudget, recordSpend } from '@/lib/budget/service';
import type { AssetType } from '@/lib/artifacts/contracts';

/**
 * Content workspace tools for ToolLoopAgent.
 *
 * These are host-executed tools — they run on the Next.js server, not in a
 * sandbox. They share the same AsyncLocalStorage context as the harness
 * workspace tools, so projectId/userId/projectType propagate without being
 * agent parameters.
 *
 * Paid tools declare `toolApproval: 'user-approval'` on the agent (not here —
 * ToolLoopAgent's toolApproval map is set at agent creation time).
 *
 * Shared tools (listAssets, getAssetUrl, checkBudget) are always available.
 * Domain-specific tools are merged in per workspace type.
 */

/**
 * Shared tools available across all content workspaces.
 * These are the same operations as the harness workspace tools, but
 * without the `tool()` wrapper — the agent factory composes them.
 */
export function createSharedContentTools() {
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
 * Design-specific tools (Phase 2).
 *
 * The generateImage and traceImage tools are paid — they require
 * toolApproval: 'user-approval' on the agent.
 *
 * Image generation uses AI SDK generateImage() + OpenRouter imageModel().
 * Tracing uses @visioncortex/vtracer (WASM) — added in Phase 2.
 */
export function createDesignTools() {
  return {
    generateImage: tool({
      description:
        'Generate an image from a text prompt using AI image generation. The prompt should describe a flat, graphic, illustration-style image for best tracing results (avoid photorealistic). Returns asset IDs for the generated images.',
      inputSchema: z.object({
        prompt: z
          .string()
          .min(3)
          .describe(
            'Image generation prompt. Use flat/graphic/illustration style for traceability. Avoid photorealistic — photographic images trace into noisy SVG paths.'
          ),
        model: z
          .string()
          .optional()
          .describe(
            'Image model slug (e.g. "bytedance-seed/seedream-5-0-lite"). Defaults to the project\'s chosen model.'
          ),
        size: z
          .enum(['1024x1024', '1536x1024', '1024x1536', '1920x1080'])
          .default('1024x1024')
          .describe('Output image dimensions'),
        seed: z
          .number()
          .int()
          .optional()
          .describe('Random seed for reproducibility'),
      }),
      execute: async ({ prompt, model, size, seed }) => {
        const { projectId } = getToolContext();

        // Dynamic import to keep the client bundle clean
        const { generateImageForProject } = await import(
          '@/lib/ai/agents/image-gen'
        );

        const result = await generateImageForProject({
          projectId,
          prompt,
          model,
          size,
          seed,
        });

        return {
          assetIds: result.assetIds,
          message: `Generated ${result.assetIds.length} image(s). Use traceImage to convert to editable SVG paths.`,
        };
      },
    }),

    traceImage: tool({
      description:
        'Trace a raster image asset into editable SVG paths using bitmap tracing (vtracer). Produces an SVG asset with editable vector paths that can be opened in the vector mini-editor.',
      inputSchema: z.object({
        assetId: z.string().describe('The image asset ID to trace'),
        preset: z
          .enum(['photo', 'poster', 'bw'])
          .default('poster')
          .describe(
            'Tracing preset: "poster" for flat graphics (best), "photo" for detailed images, "bw" for black & white'
          ),
        simplify: z
          .number()
          .min(0)
          .max(10)
          .default(1)
          .describe('Path simplification level (higher = simpler paths)'),
      }),
      execute: async ({ assetId, preset, simplify }) => {
        const { projectId } = getToolContext();

        const { traceAssetImage } = await import(
          '@/lib/ai/agents/image-trace'
        );

        const result = await traceAssetImage({
          projectId,
          assetId,
          preset,
          simplify,
        });

        return {
          svgAssetId: result.svgAssetId,
          pathCount: result.pathCount,
          message: `Traced image to SVG with ${result.pathCount} paths. The SVG is ready in the artifact gallery.`,
        };
      },
    }),
  };
}

/**
 * The tool approval map for content agents.
 *
 * Paid tools require user approval before execution (AC-009).
 * Free tools (listAssets, getAssetUrl, checkBudget) execute without approval.
 *
 * NOTE: Subagent tools cannot use approval flows — but these tools run on the
 * main ToolLoopAgent orchestrator, which DOES support toolApproval.
 * Subagents (if added later) would only handle non-paid work.
 */
export const contentToolApproval = {
  generateImage: 'user-approval' as const,
  traceImage: 'user-approval' as const,
  uploadTextAsset: 'user-approval' as const,
  // listAssets, getAssetUrl, checkBudget are free (no approval)
};
