/**
 * Vibeflow AI Model Configuration
 *
 * Free models available through:
 * - OpenRouter (16 free models with tool support)
 * - Vercel AI Gateway (built into AI SDK)
 * - OpenCode SDK (community provider)
 */

// ─── Provider Types ───────────────────────────────────────────────────────────

export type AIProvider = 'openrouter' | 'gateway' | 'opencode';

export interface AIModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  contextLength: number;
  supportsTools: boolean;
  supportsImages: boolean;
  category: 'coding' | 'general' | 'multimodal' | 'image-gen';
  description: string;
}

// ─── OpenRouter Free Models (with tool support) ────────────────────────────────

export const OPENROUTER_FREE_MODELS: AIModelConfig[] = [
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'Nemotron 3 Ultra (550B)',
    provider: 'openrouter',
    contextLength: 1_000_000,
    supportsTools: true,
    supportsImages: false,
    category: 'coding',
    description: 'NVIDIA largest free model, excellent for coding tasks',
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'Nemotron 3.5 Lightning',
    provider: 'openrouter',
    contextLength: 1_000_000,
    supportsTools: true,
    supportsImages: false,
    category: 'coding',
    description: 'Fast and capable, great for rapid coding',
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b:free',
    name: 'Nemotron 3 Super (120B)',
    provider: 'openrouter',
    contextLength: 262_144,
    supportsTools: true,
    supportsImages: false,
    category: 'coding',
    description: 'Balanced performance for coding and reasoning',
  },
  {
    id: 'poolside/laguna-s-2.1:free',
    name: 'Poolside Laguna S',
    provider: 'openrouter',
    contextLength: 262_144,
    supportsTools: true,
    supportsImages: false,
    category: 'coding',
    description: 'Specialized coding model from Poolside',
  },
  {
    id: 'poolside/laguna-xs-2.1:free',
    name: 'Poolside Laguna XS',
    provider: 'openrouter',
    contextLength: 262_144,
    supportsTools: true,
    supportsImages: false,
    category: 'coding',
    description: 'Lightweight coding model, fast responses',
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'Cohere North Mini Code',
    provider: 'openrouter',
    contextLength: 256_000,
    supportsTools: true,
    supportsImages: false,
    category: 'coding',
    description: 'Cohere coding model, good for code generation',
  },
  {
    id: 'google/gemma-4-31b-it:free',
    name: 'Google Gemma 4 31B',
    provider: 'openrouter',
    contextLength: 262_144,
    supportsTools: true,
    supportsImages: true,
    category: 'multimodal',
    description: 'Google multimodal model with vision support',
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Google Gemma 4 26B',
    provider: 'openrouter',
    contextLength: 262_144,
    supportsTools: true,
    supportsImages: true,
    category: 'multimodal',
    description: 'Google multimodal model, smaller and faster',
  },
  {
    id: 'dots-studio/dots-3-note-preview:free',
    name: 'Dots3 Note Preview',
    provider: 'openrouter',
    contextLength: 512_000,
    supportsTools: true,
    supportsImages: true,
    category: 'general',
    description: 'High context window, multimodal support',
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    name: 'Nemotron 3 Nano Omni',
    provider: 'openrouter',
    contextLength: 256_000,
    supportsTools: true,
    supportsImages: true,
    category: 'multimodal',
    description: 'Omnimodal: text, audio, image, video input',
  },
  {
    id: 'z-ai/glm-5.2:free',
    name: 'Z.ai GLM 5.2',
    provider: 'openrouter',
    contextLength: 256_000,
    supportsTools: true,
    supportsImages: false,
    category: 'general',
    description: 'General purpose model with large context',
  },
  {
    id: 'openai/gpt-oss-20b:free',
    name: 'OpenAI GPT-OSS 20B',
    provider: 'openrouter',
    contextLength: 131_072,
    supportsTools: true,
    supportsImages: false,
    category: 'general',
    description: 'OpenAI open-source model',
  },
  {
    id: 'openrouter/free',
    name: 'Free Models Router',
    provider: 'openrouter',
    contextLength: 200_000,
    supportsTools: true,
    supportsImages: true,
    category: 'general',
    description: 'Auto-routes to best available free model',
  },
];

// ─── OpenRouter Image Generation Models ────────────────────────────────────────

export const OPENROUTER_IMAGE_MODELS: AIModelConfig[] = [
  {
    id: 'bytedance-seed/seedream-5-0-lite',
    name: 'Seedream 5.0 Lite',
    provider: 'openrouter',
    contextLength: 0,
    supportsTools: false,
    supportsImages: false,
    category: 'image-gen',
    description: 'ByteDance image generation, free prompt cost',
  },
  {
    id: 'bytedance-seed/seedream-5-0-pro',
    name: 'Seedream 5.0 Pro',
    provider: 'openrouter',
    contextLength: 0,
    supportsTools: false,
    supportsImages: false,
    category: 'image-gen',
    description: 'High quality image generation',
  },
  {
    id: 'qwen/qwen-image-3',
    name: 'Qwen Image 3',
    provider: 'openrouter',
    contextLength: 0,
    supportsTools: false,
    supportsImages: false,
    category: 'image-gen',
    description: 'Qwen image generation model',
  },
  {
    id: 'krea/krea-2-large',
    name: 'Krea 2 Large',
    provider: 'openrouter',
    contextLength: 0,
    supportsTools: false,
    supportsImages: false,
    category: 'image-gen',
    description: 'Krea AI image generation',
  },
];

// ─── Vercel AI Gateway Models (built-in) ──────────────────────────────────────

export const GATEWAY_MODELS: AIModelConfig[] = [
  {
    id: 'openai/gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    provider: 'gateway',
    contextLength: 1_048_576,
    supportsTools: true,
    supportsImages: true,
    category: 'coding',
    description: 'OpenAI fastest model, great for quick tasks',
  },
  {
    id: 'openai/gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    provider: 'gateway',
    contextLength: 1_048_576,
    supportsTools: true,
    supportsImages: true,
    category: 'coding',
    description: 'OpenAI balanced model',
  },
  {
    id: 'anthropic/claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'gateway',
    contextLength: 200_000,
    supportsTools: true,
    supportsImages: true,
    category: 'coding',
    description: 'Anthropic best coding model',
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gateway',
    contextLength: 1_048_576,
    supportsTools: true,
    supportsImages: true,
    category: 'coding',
    description: 'Google fast model with large context',
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'gateway',
    contextLength: 1_048_576,
    supportsTools: true,
    supportsImages: true,
    category: 'coding',
    description: 'Google most capable model',
  },
];

// ─── Default Models ────────────────────────────────────────────────────────────

/** Default coding agent model (free) */
export const DEFAULT_CODING_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';

/** Default multimodal model (free) */
export const DEFAULT_MULTIMODAL_MODEL = 'google/gemma-4-31b-it:free';

/** Default image generation model (free) */
export const DEFAULT_IMAGE_MODEL = 'bytedance-seed/seedream-5-0-lite';

/** Default general purpose model (free) */
export const DEFAULT_GENERAL_MODEL = 'openrouter/free';

// ─── Helper Functions ──────────────────────────────────────────────────────────

/** Get all available models */
export function getAllModels(): AIModelConfig[] {
  return [
    ...OPENROUTER_FREE_MODELS,
    ...OPENROUTER_IMAGE_MODELS,
    ...GATEWAY_MODELS,
  ];
}

/** Get models by category */
export function getModelsByCategory(
  category: AIModelConfig['category']
): AIModelConfig[] {
  return getAllModels().filter((m) => m.category === category);
}

/** Get models by provider */
export function getModelsByProvider(provider: AIProvider): AIModelConfig[] {
  return getAllModels().filter((m) => m.provider === provider);
}

/** Get free models only */
export function getFreeModels(): AIModelConfig[] {
  return getAllModels().filter(
    (m) => m.provider === 'openrouter' || m.id.includes(':free')
  );
}

/** Get coding-optimized models */
export function getCodingModels(): AIModelConfig[] {
  return getAllModels().filter(
    (m) => m.category === 'coding' && m.supportsTools
  );
}

/** Get a model config by ID */
export function getModelById(id: string): AIModelConfig | undefined {
  return getAllModels().find((m) => m.id === id);
}
