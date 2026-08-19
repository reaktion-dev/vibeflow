import { LanguageModel, gateway } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

import { getEnv } from '../env';
import {
  DEFAULT_CODING_MODEL,
  DEFAULT_MULTIMODAL_MODEL,
  type AIProvider,
} from './models';

// ─── Provider Instances ────────────────────────────────────────────────────────

let openrouterInstance: ReturnType<typeof createOpenRouter> | null = null;

function getOpenRouter() {
  if (!openrouterInstance) {
    const env = getEnv();
    openrouterInstance = createOpenRouter({
      apiKey: env.OPENROUTER_API_KEY || '',
    });
  }
  return openrouterInstance;
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

  // Explicit provider selection
  if (
    provider === 'openrouter' ||
    model.includes(':free') ||
    model.startsWith('nvidia/') ||
    model.startsWith('poolside/') ||
    model.startsWith('cohere/') ||
    model.startsWith('google/gemma') ||
    model.startsWith('dots-studio/') ||
    model.startsWith('z-ai/') ||
    model.startsWith('openai/gpt-oss')
  ) {
    return getOpenRouter().chat(model);
  }

  if (provider === 'gateway') {
    return gateway(model);
  }

  // Auto-detect provider from model ID format
  if (model.includes('/')) {
    // Format: "provider/model" — use Vercel AI Gateway
    return gateway(model);
  }

  // Fallback: try OpenRouter
  return getOpenRouter().chat(model);
}

/**
 * Get a coding-optimized model
 */
export function getCodingModel(modelId?: string): LanguageModel {
  return getAIModel(modelId || DEFAULT_CODING_MODEL, 'openrouter');
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

// ─── Available Models ──────────────────────────────────────────────────────────

export const AVAILABLE_MODELS = [
  // OpenRouter Free Models
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', name: 'Nemotron 3 Ultra (550B)', provider: 'OpenRouter', free: true },
  { id: 'nvidia/nemotron-3.5-lightning:free', name: 'Nemotron 3.5 Lightning', provider: 'OpenRouter', free: true },
  { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'Nemotron 3 Super (120B)', provider: 'OpenRouter', free: true },
  { id: 'poolside/laguna-s-2.1:free', name: 'Poolside Laguna S', provider: 'OpenRouter', free: true },
  { id: 'poolside/laguna-xs-2.1:free', name: 'Poolside Laguna XS', provider: 'OpenRouter', free: true },
  { id: 'cohere/north-mini-code:free', name: 'Cohere North Mini Code', provider: 'OpenRouter', free: true },
  { id: 'google/gemma-4-31b-it:free', name: 'Google Gemma 4 31B', provider: 'OpenRouter', free: true },
  { id: 'google/gemma-4-26b-a4b-it:free', name: 'Google Gemma 4 26B', provider: 'OpenRouter', free: true },
  { id: 'dots-studio/dots-3-note-preview:free', name: 'Dots3 Note Preview', provider: 'OpenRouter', free: true },
  { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', name: 'Nemotron 3 Nano Omni', provider: 'OpenRouter', free: true },
  { id: 'z-ai/glm-5.2:free', name: 'Z.ai GLM 5.2', provider: 'OpenRouter', free: true },
  { id: 'openai/gpt-oss-20b:free', name: 'OpenAI GPT-OSS 20B', provider: 'OpenRouter', free: true },
  { id: 'openrouter/free', name: 'Free Models Router', provider: 'OpenRouter', free: true },
  // Vercel AI Gateway Models
  { id: 'openai/gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'Gateway', free: false },
  { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'Gateway', free: false },
  { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'Gateway', free: false },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Gateway', free: false },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Gateway', free: false },
];


