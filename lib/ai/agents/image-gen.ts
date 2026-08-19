import { generateImage } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

import { getEnv } from '@/lib/env';
import { createAsset } from '@/lib/artifacts/service';
import { recordSpend } from '@/lib/budget/service';
import { getToolContext } from '@/lib/ai/harness/tools/context';
import { OPENROUTER_IMAGE_MODELS, DEFAULT_IMAGE_MODEL } from '@/lib/ai/models';

/**
 * Image generation service for the Design workspace.
 *
 * Uses AI SDK generateImage() + OpenRouter imageModel() per the spec (EXT-003).
 * Generated images are stored as `image`-type assets in R2.
 *
 * The model is chosen by the user at first generation per project and stored
 * in `project.config`. It can be overridden per call via the `model` parameter.
 *
 * Cost is recorded against the project budget after successful generation.
 * Prompts default to graphic/flat style for traceability (trace-first decision).
 */

// Cost estimates in cents per image (rough, varies by model)
const IMAGE_COST_CENTS: Record<string, number> = {
  'bytedance-seed/seedream-5-0-lite': 1,
  'bytedance-seed/seedream-5-0-pro': 5,
  'qwen/qwen-image-3': 3,
  'krea/krea-2-large': 4,
};

function getOpenRouterClient() {
  const env = getEnv();
  return createOpenRouter({
    apiKey: env.OPENROUTER_API_KEY || '',
  });
}

/**
 * Get the project's chosen image model from project.config, or the default.
 */
function resolveImageModel(projectConfig: string | null, override?: string): string {
  if (override) return override;

  if (projectConfig) {
    try {
      const config = JSON.parse(projectConfig);
      if (config.imageModel) return config.imageModel;
    } catch {
      // ignore parse errors
    }
  }

  return DEFAULT_IMAGE_MODEL;
}

/**
 * Get the cost in cents for an image generation.
 */
function getImageCostCents(model: string, count: number): number {
  const perImage = IMAGE_COST_CENTS[model] ?? 2; // default 2 cents
  return perImage * count;
}

/**
 * Generate one or more images from a prompt and store them as assets.
 *
 * Called by the generateImage tool on the content agent.
 */
export async function generateImageForProject(input: {
  projectId: string;
  prompt: string;
  model?: string;
  size?: string;
  seed?: number;
  count?: number;
}): Promise<{ assetIds: string[] }> {
  const { projectId, prompt } = input;
  const count = input.count ?? 1;

  // Get project to read config and validate ownership
  const { getAuthorizedProject } = await import('@/lib/projects/server');
  const project = await getAuthorizedProject(projectId);

  const model = resolveImageModel(project.config, input.model);
  const size = input.size ?? '1024x1024';

  // Check budget before generation
  const estimatedCost = getImageCostCents(model, count);
  const { checkBudget } = await import('@/lib/budget/service');
  const budgetCheck = await checkBudget(projectId, estimatedCost);

  if (!budgetCheck.allowed) {
    throw new Error(
      `Image generation would exceed project budget. ` +
        `Estimated cost: ${estimatedCost} cents, remaining: ${budgetCheck.remainingCents} cents. ` +
        `Ask the user to approve the over-budget spend or increase the project budget.`
    );
  }

  // Create a pending asset record first
  const { createPendingAsset, finalizeAsset, failAsset } = await import(
    '@/lib/artifacts/service'
  );

  const pendingAssetIds: string[] = [];
  for (let i = 0; i < count; i++) {
    const assetId = await createPendingAsset({
      projectId,
      name: `Generated image ${i + 1}`,
      type: 'image',
      mimeType: 'image/png',
      metadata: {
        status: 'running',
        source: {
          provider: 'openrouter',
          model,
          prompt,
          seed: input.seed,
          params: { size },
        },
      },
    });
    pendingAssetIds.push(assetId);
  }

  try {
    // Generate images via AI SDK
    const openrouter = getOpenRouterClient();
    const imageModel = openrouter.imageModel(model);

    const result = await generateImage({
      model: imageModel,
      prompt,
      size: size as
        | '1024x1024'
        | '1536x1024'
        | '1024x1536'
        | '1920x1080'
        | `${number}x${number}`,
      providerOptions: {
        openrouter: {
          seed: input.seed,
        },
      },
    });

    // Store each generated image as an asset
    const assetIds: string[] = [];
    const images = result.images ?? [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const assetId = pendingAssetIds[i] ?? pendingAssetIds[0];

      // Convert base64 to buffer
      const buffer = image.uint8Array
        ? Buffer.from(image.uint8Array)
        : Buffer.from(image.base64, 'base64');

      await finalizeAsset(assetId, buffer, {
        status: 'ready',
        costMicros: getImageCostCents(model, 1) * 10000, // cents → micros (1 cent = 10,000 micros)
      });

      assetIds.push(assetId);
    }

    // Record spend after successful generation
    const totalCost = getImageCostCents(model, images.length);
    await recordSpend(projectId, totalCost);

    return { assetIds };
  } catch (error) {
    // Mark all pending assets as failed
    for (const assetId of pendingAssetIds) {
      await failAsset(
        assetId,
        error instanceof Error ? error.message : 'Image generation failed'
      );
    }
    throw error;
  }
}

/**
 * Get available image models for the model picker (AC-011).
 */
export function getAvailableImageModels() {
  return OPENROUTER_IMAGE_MODELS.map((m) => ({
    id: m.id,
    name: m.name,
    provider: m.provider,
    description: m.description,
  }));
}

/**
 * Save the user's image model choice to the project config (AC-011).
 */
export async function saveImageModelChoice(
  projectId: string,
  modelId: string
): Promise<void> {
  const { getAuthorizedProject } = await import('@/lib/projects/server');
  const project = await getAuthorizedProject(projectId);

  let config: Record<string, unknown> = {};
  if (project.config) {
    try {
      config = JSON.parse(project.config);
    } catch {
      // ignore
    }
  }

  config.imageModel = modelId;

  const { db } = await import('@/lib/db');
  const { projectTable } = await import('@/lib/db/schema');
  const { eq } = await import('drizzle-orm');

  await db
    .update(projectTable)
    .set({ config: JSON.stringify(config) })
    .where(eq(projectTable.id, projectId));
}
