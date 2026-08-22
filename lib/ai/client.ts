import { LanguageModel, gateway } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

import { getEnv } from '../env';
import {
  DEFAULT_CODING_MODEL,
  DEFAULT_MULTIMODAL_MODEL,
  GATEWAY_MODELS,
  type AIProvider,
} from './models';

// ─── Provider Instances ────────────────────────────────────────────────────────

let openrouterInstance: ReturnType<typeof createOpenRouter> | null = null;
let opencodeZenInstance: ReturnType<typeof createOpenAICompatible> | null = null;

function getOpenRouter() {
  if (!openrouterInstance) {
    const env = getEnv();
    openrouterInstance = createOpenRouter({
      apiKey: env.OPENROUTER_API_KEY || '',
    });
  }
  return openrouterInstance;
}

function getOpenCodeZen() {
  if (!opencodeZenInstance) {
    const env = getEnv();
    const apiKey = env.OPENCODE_ZEN_API_KEY || env.OPENCODE_API_KEY || '';
    opencodeZenInstance = createOpenAICompatible({
      name: 'opencode-zen',
      apiKey,
      baseURL: 'https://opencode.ai/zen/v1',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'x-api-key': apiKey,
      },
    });
  }
  return opencodeZenInstance;
}

// ─── Model Factory ─────────────────────────────────────────────────────────────

/**
 * Get an AI model by provider and model ID
 */
export function getAIModel(
  modelId?: string,
  provider?: AIProvider
): LanguageModel {
  const model = modelId || DEFAULT_CODING_MODEL;

  // 1. OpenCode Zen provider
  if (provider === 'opencode' || model.startsWith('opencode/')) {
    const modelName = model.replace(/^opencode\//, '');
    return getOpenCodeZen().chatModel(modelName);
  }

  // 2. Explicit Gateway provider or designated Gateway models ONLY
  const isGatewayModel = GATEWAY_MODELS.some((m) => m.id === model);
  if (provider === 'gateway' || isGatewayModel) {
    return gateway(model);
  }

  // 3. Default to OpenRouter for all other models (including openrouter/free, :free, etc.)
  return getOpenRouter().chat(model);
}

/**
 * Get a coding-optimized model
 */
export function getCodingModel(modelId?: string): LanguageModel {
  return getAIModel(modelId || DEFAULT_CODING_MODEL);
}

/**
 * Get a multimodal model (supports images)
 */
export function getMultimodalModel(modelId?: string): LanguageModel {
  return getAIModel(modelId || DEFAULT_MULTIMODAL_MODEL, 'openrouter');
}

/**
 * Get a general purpose model
 */
export function getGeneralModel(modelId?: string): LanguageModel {
  return getAIModel(modelId || 'openrouter/free', 'openrouter');
}

export { AVAILABLE_CHAT_MODELS as AVAILABLE_MODELS } from '@/lib/ai/chat-models';
