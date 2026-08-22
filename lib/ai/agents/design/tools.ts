import { tool } from 'ai';
import { z } from 'zod';

import { getToolContext } from '@/lib/ai/harness/tools/context';
import type { AssetType } from '@/lib/artifacts/contracts';
import {
  ALL_TEMPLATES,
  designSlotDataSchema,
  solveTemplateLayout,
} from '@/lib/artifacts/templates';

/**
 * Dedicated toolset for the Visual Design Agent.
 */
export function createDesignAgentTools() {
  return {
    // ── Template & Composition Tools ──────────────────────────────────────────

    listDesignTemplates: tool({
      description:
        'List all available semantic design templates and layout archetypes (e.g. article-split, article-centered, social-square, app-icon, banner-horizontal) with dimensions and slot specifications.',
      inputSchema: z.object({}),
      execute: async () => {
        return {
          templates: ALL_TEMPLATES.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            dimensions: `${t.width}x${t.height}`,
            aspectRatio: t.aspectRatio,
            slots: t.slots,
          })),
          message:
            'Use composeFromTemplate to generate balanced, non-overlapping designs using any of these templates.',
        };
      },
    }),

    composeFromTemplate: tool({
      description:
        'PRIMARY DESIGN TOOL: Generate a production-ready, perfectly-aligned SVG design using semantic slots (headline, subheading, badgeText, visualAssetId, theme, accentColor). The Layout Solver guarantees zero overlapping elements, auto-wraps text, and formats margins.',
      inputSchema: designSlotDataSchema,
      execute: async (slotData) => {
        const { projectId } = getToolContext();

        // 1. Solve layout deterministically
        const svgString = solveTemplateLayout(slotData);

        // 2. Persist to project Asset Vault
        const { createAsset } = await import('@/lib/artifacts/service');
        const assetName = `${slotData.templateId}-${Date.now().toString(36)}.svg`;

        const asset = await createAsset({
          projectId,
          name: assetName,
          type: 'svg',
          mimeType: 'image/svg+xml',
          data: Buffer.from(svgString, 'utf-8'),
          metadata: {
            templateId: slotData.templateId,
            theme: slotData.theme,
            headline: slotData.headline,
            badge: slotData.badgeText,
            source: 'template-solver',
          },
        });

        return {
          assetId: asset.id,
          name: asset.name,
          templateId: slotData.templateId,
          svgUrl: `/api/projects/${projectId}/assets/${asset.id}`,
          message: `Successfully composed "${assetName}" using template "${slotData.templateId}". It is now saved in the Artifact Vault and rendered in the canvas editor.`,
        };
      },
    }),

    // ── Asset Acquisition & Search Tools ─────────────────────────────────────

    searchImages: tool({
      description:
        'Search the web for reusable images — transparent PNGs, icons, illustrations, textures, or stock photos. Always search before generating images to find authentic visual assets.',
      inputSchema: z.object({
        query: z.string().describe('Search query (e.g. "AI agent transparent png", "circuit board texture")'),
        count: z.number().int().min(1).max(10).default(8).describe('Number of results (1-10)'),
      }),
      execute: async ({ query, count }) => {
        const { searchImages: performSearch } = await import('@/lib/artifacts/image-search');
        const results = await performSearch(query, count);
        return {
          query,
          provider: results.provider,
          results: results.images.map((img) => ({
            title: img.title,
            imageUrl: img.imageUrl,
            source: img.source,
          })),
          message: `Found ${results.images.length} images. Call fetchImage({ url, name }) to download any of these into the project vault.`,
        };
      },
    }),

    fetchImage: tool({
      description:
        'Download an image from a URL and store it as a permanent project asset in R2. Call this after searchImages to acquire an assetId for composition.',
      inputSchema: z.object({
        url: z.string().url().describe('Direct HTTP/HTTPS URL of the image'),
        name: z.string().describe('Name for the stored asset (e.g. "ai-agent-icon.png")'),
      }),
      execute: async ({ url, name }) => {
        const { projectId } = getToolContext();
        const { fetchAndStoreImage } = await import('@/lib/artifacts/image-fetch');
        const result = await fetchAndStoreImage(projectId, url, name);

        return {
          assetId: result.id,
          name: result.name,
          mimeType: result.mimeType,
          sizeBytes: result.sizeBytes,
          message: `Downloaded "${result.name}" (${result.sizeBytes} bytes). Asset ID: ${result.id}. You can now pass this assetId to composeFromTemplate.`,
        };
      },
    }),

    // ── Vectorization & Generation ───────────────────────────────────────────

    generateImage: tool({
      description:
        'Generate an image from a text prompt using AI. Use when custom generative visuals are requested. Requires budget approval.',
      inputSchema: z.object({
        prompt: z.string().describe('Detailed visual description. Suggest flat vector / graphic style.'),
        style: z.enum(['flat', 'vector', 'isometric', 'realistic', 'minimalist']).default('vector'),
      }),
      execute: async ({ prompt, style }) => {
        const { projectId, userId } = getToolContext();
        const { getEnv } = await import('@/lib/env');
        const env = getEnv();

        if (!env.OPENROUTER_API_KEY) {
          throw new Error('Image generation requires an OPENROUTER_API_KEY.');
        }

        const { generateImageWithBudget } = await import('@/lib/artifacts/generate');
        const styledPrompt = `${prompt}, ${style} style, clean background, high resolution, digital art`;
        const result = await generateImageWithBudget(projectId, userId, styledPrompt);

        return {
          assetId: result.assetId,
          imageUrl: result.imageUrl,
          costCents: result.costCents,
          message: `Image generated and saved as asset "${result.assetId}". You can trace it to SVG vector paths using traceImage.`,
        };
      },
    }),

    traceImage: tool({
      description:
        'Auto-vectorize a raster image (PNG/JPEG) into clean SVG vector paths using @visioncortex/vtracer / Potrace. Produces infinitely scalable vector artwork.',
      inputSchema: z.object({
        assetId: z.string().describe('R2 asset ID of the raster image to trace'),
        mode: z.enum(['color', 'bw', 'posterized']).default('color').describe('Vectorization mode'),
      }),
      execute: async ({ assetId, mode }) => {
        const { projectId } = getToolContext();
        const { traceAssetToSvg } = await import('@/lib/artifacts/trace');
        const result = await traceAssetToSvg(projectId, assetId, { mode });

        return {
          assetId: result.svgAssetId,
          pathCount: result.pathCount,
          message: `Vectorized into SVG with ${result.pathCount} paths. Asset ID: ${result.svgAssetId}.`,
        };
      },
    }),

    exportDesign: tool({
      description:
        'Export an SVG design asset to raster formats (PNG, JPEG, WebP) with optional high-DPI scaling (1x, 2x, 3x).',
      inputSchema: z.object({
        assetId: z.string().describe('The SVG asset ID to export'),
        format: z.enum(['png', 'jpeg', 'webp']).default('png'),
        scale: z.number().min(1).max(4).default(2).describe('Export scale (1=standard, 2=Retina @2x)'),
      }),
      execute: async ({ assetId, format, scale }) => {
        const { projectId } = getToolContext();
        const { exportSvgAsset } = await import('@/lib/artifacts/export');
        const result = await exportSvgAsset(projectId, assetId, { format, scale });

        return {
          exportAssetId: result.assetId,
          format: result.format,
          dimensions: `${result.width}x${result.height}`,
          downloadUrl: `/api/projects/${projectId}/assets/${result.assetId}`,
          message: `Exported design as ${format.toUpperCase()} (${result.width}x${result.height}). Download ready.`,
        };
      },
    }),

    // ── Asset Management & Budget ────────────────────────────────────────────

    listAssets: tool({
      description: 'List existing project assets in the vault.',
      inputSchema: z.object({
        type: z.enum(['image', 'svg', 'video', 'audio', 'document', 'export']).optional(),
      }),
      execute: async ({ type }) => {
        const { projectId } = getToolContext();
        const { listAssets } = await import('@/lib/artifacts/service');
        const assets = await listAssets(projectId, type as AssetType | undefined);
        return {
          assets: assets.map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            createdAt: a.createdAt,
          })),
        };
      },
    }),

    getAssetUrl: tool({
      description: 'Get download URL for an asset.',
      inputSchema: z.object({ assetId: z.string() }),
      execute: async ({ assetId }) => {
        const { projectId } = getToolContext();
        const { getAssetDownloadUrl } = await import('@/lib/artifacts/service');
        const url = await getAssetDownloadUrl(projectId, assetId);
        return { url };
      },
    }),

    checkBudget: tool({
      description: 'Check remaining AI generation budget.',
      inputSchema: z.object({}),
      execute: async () => {
        const { projectId } = getToolContext();
        const { getProjectBudget } = await import('@/lib/budget/service');
        const budget = await getProjectBudget(projectId);
        return {
          remainingCents: budget.remainingCents,
          spendCents: budget.spendCents,
        };
      },
    }),
  };
}
