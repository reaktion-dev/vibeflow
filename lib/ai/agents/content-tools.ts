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

    exportDesign: tool({
      description:
        'Export the current SVG design as both a native SVG file and a rasterized image (PNG, JPEG, or WebP). Produces two export assets in the gallery.',
      inputSchema: z.object({
        svgAssetId: z
          .string()
          .describe('The SVG asset ID to export'),
        name: z
          .string()
          .default('design-export')
          .describe('Base name for the exported files (without extension)'),
        format: z
          .enum(['png', 'jpeg', 'webp'])
          .default('png')
          .describe('Raster output format'),
        scale: z
          .union([z.literal(1), z.literal(2)])
          .default(1)
          .describe('Export scale (1x or 2x)'),
        quality: z
          .number()
          .min(1)
          .max(100)
          .optional()
          .describe('Quality for JPEG/WebP (1-100, ignored for PNG)'),
      }),
      execute: async ({ svgAssetId, name, format, scale, quality }) => {
        const { projectId } = getToolContext();

        const { getAssetBuffer } = await import('@/lib/artifacts/service');
        const { exportDesign: exportDesignFn } = await import(
          '@/lib/artifacts/export'
        );

        // Download the SVG from R2
        const svgBuffer = await getAssetBuffer(svgAssetId);
        const svgString = svgBuffer.toString('utf-8');

        const result = await exportDesignFn({
          projectId,
          svgString,
          name,
          options: { format, scale, quality },
        });

        return {
          svgAssetId: result.svgAssetId,
          rasterAssetId: result.rasterAssetId,
          message: `Exported "${name}" as SVG + ${format.toUpperCase()} (${scale}x). Both files are in the artifact gallery.`,
        };
      },
    }),

    searchImages: tool({
      description:
        'Search the web for images (stock photos, transparent PNGs, backgrounds, reference material). Returns URLs and metadata. Use fetchImage to download and store found images as project assets. Best for finding reusable content like backgrounds, icons, logos, and transparent cutouts.',
      inputSchema: z.object({
        query: z
          .string()
          .min(2)
          .describe(
            'Search query. Add "png transparent" for cutouts, "background" for backgrounds, "free stock" for photos.'
          ),
        count: z
          .number()
          .int()
          .min(1)
          .max(20)
          .default(10)
          .describe('Number of results to return'),
      }),
      execute: async ({ query, count }) => {
        const { searchImages } = await import('@/lib/ai/agents/web-search');

        const { results, provider } = await searchImages(query, { count });

        return {
          query,
          provider,
          results: results.map((r) => ({
            title: r.title,
            imageUrl: r.imageUrl,
            source: r.source,
            width: r.width,
            height: r.height,
          })),
          message: `Found ${results.length} images. Use fetchImage to download and store any of these as project assets.`,
        };
      },
    }),

    searchWeb: tool({
      description:
        'Search the web for general information, references, inspiration, or content to reuse in designs. Returns titles, URLs, and snippets.',
      inputSchema: z.object({
        query: z.string().min(2).describe('Search query'),
        count: z
          .number()
          .int()
          .min(1)
          .max(20)
          .default(5)
          .describe('Number of results to return'),
      }),
      execute: async ({ query, count }) => {
        const { searchWeb: searchFn } = await import(
          '@/lib/ai/agents/web-search'
        );

        const { results, provider } = await searchFn(query, { count });

        return {
          query,
          provider,
          results: results.map((r) => ({
            title: r.title,
            url: r.url,
            snippet: r.source,
          })),
        };
      },
    }),

    fetchImage: tool({
      description:
        'Download an image from a URL and store it as a project asset in R2. Use after searchImages to fetch found images. Supports PNG, JPEG, WebP, and GIF.',
      inputSchema: z.object({
        url: z.string().url().describe('Direct image URL to download'),
        name: z
          .string()
          .describe('Human-readable name for the asset (e.g., "coffee-cup-transparent")'),
        assetType: z
          .enum(['image', 'export'])
          .default('image')
          .describe('Asset type — "image" for reusable elements, "export" for final outputs'),
      }),
      execute: async ({ url, name, assetType }) => {
        const { projectId } = getToolContext();

        const { downloadImageFromUrl } = await import(
          '@/lib/ai/agents/web-search'
        );

        const { buffer, mimeType } = await downloadImageFromUrl(url);

        const result = await createAsset({
          projectId,
          name,
          type: assetType as AssetType,
          mimeType,
          body: buffer,
          metadata: {
            status: 'ready',
            source: {
              provider: 'web',
              model: 'fetch',
              prompt: url,
              params: { url },
            },
          },
        });

        return {
          assetId: result.id,
          mimeType,
          sizeBytes: result.sizeBytes,
          message: `Downloaded "${name}" (${mimeType}, ${result.sizeBytes} bytes). It is now available in the artifact gallery.`,
        };
      },
    }),

    composeDesign: tool({
      description:
        'Compose a multi-layer SVG design from elements: raster images (backgrounds, transparent PNGs), vector shapes (rects, cards), and text. This is the primary tool for creating rich, composite designs — layer images, shapes, and text to produce production-quality output. The composed SVG is stored as an asset and loaded into the mini-editor.',
      inputSchema: z.object({
        width: z
          .number()
          .int()
          .positive()
          .default(1080)
          .describe('Canvas width in pixels'),
        height: z
          .number()
          .int()
          .positive()
          .default(1080)
          .describe('Canvas height in pixels'),
        background: z
          .string()
          .default('#ffffff')
          .describe('Background color (hex or "transparent")'),
        layers: z
          .array(
            z.object({
              name: z.string().describe('Layer name (e.g., "background", "content", "overlay")'),
              elements: z
                .array(
                  z.union([
                    z.object({
                      type: z.literal('image'),
                      assetId: z.string().describe('R2 asset ID of the image to place'),
                      x: z.number().default(0),
                      y: z.number().default(0),
                      width: z.number().describe('Width in pixels'),
                      height: z.number().describe('Height in pixels'),
                      opacity: z.number().min(0).max(1).optional(),
                    }),
                    z.object({
                      type: z.literal('rect'),
                      x: z.number().default(0),
                      y: z.number().default(0),
                      width: z.number(),
                      height: z.number(),
                      fill: z.string().nullable().optional(),
                      stroke: z.string().nullable().optional(),
                      strokeWidth: z.number().optional(),
                      rx: z.number().default(0).describe('Corner radius'),
                      opacity: z.number().min(0).max(1).optional(),
                    }),
                    z.object({
                      type: z.literal('text'),
                      text: z.string(),
                      x: z.number().default(0),
                      y: z.number().default(0),
                      fontFamily: z.string().default('sans-serif'),
                      fontSize: z.number().default(16),
                      fontWeight: z
                        .union([z.literal('normal'), z.literal('bold'), z.number()])
                        .default('normal'),
                      fill: z.string().default('#000000'),
                      textAnchor: z
                        .enum(['start', 'middle', 'end'])
                        .default('start'),
                      opacity: z.number().min(0).max(1).optional(),
                    }),
                  ])
                )
                .describe('Elements in this layer'),
              visible: z.boolean().default(true),
            })
          )
          .min(1)
          .describe('Layers, bottom to top'),
      }),
      execute: async ({ width, height, background, layers }) => {
        const { projectId } = getToolContext();

        const { composeSvgDocument, svgDocumentToString } = await import(
          '@/lib/artifacts/compose'
        );
        const { resolveImageReferences } = await import(
          '@/lib/artifacts/resolve-images'
        );

        // Build the SVG document from the layer spec
        const document = composeSvgDocument({
          projectId,
          width,
          height,
          layers,
        });

        // Resolve image assetId references to base64 data URLs for rendering
        const resolvedImages = await resolveImageReferences(document);

        // Convert to SVG string (with resolved images)
        const svgString = svgDocumentToString(document, resolvedImages);

        // Store as SVG asset
        const result = await createAsset({
          projectId,
          name: 'Composed design',
          type: 'svg',
          mimeType: 'image/svg+xml',
          body: Buffer.from(svgString, 'utf-8'),
          metadata: {
            status: 'ready',
            source: {
              provider: 'vibeflow',
              model: 'compose',
              prompt: '',
              params: { width, height, layerCount: layers.length, background },
            },
          },
        });

        // Also store the canvas data for the mini-editor
        const { saveCanvasData } = await import(
          '@/lib/ai/agents/image-trace'
        );
        await saveCanvasData(projectId, document);

        return {
          svgAssetId: result.id,
          layerCount: layers.length,
          elementCount: layers.reduce(
            (sum, l) => sum + l.elements.length,
            0
          ),
          message: `Composed design with ${layers.length} layers. The SVG is ready in the artifact gallery and loaded in the mini-editor. Use exportDesign to export as PNG/JPEG/WebP.`,
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
  // searchImages, searchWeb, fetchImage, composeDesign, exportDesign are free (no approval)
};
