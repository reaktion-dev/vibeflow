/**
 * Client-safe chat model lists.
 *
 * Keep this file free of provider factories, agents, tools, or other server-only
 * imports. Client components use it to populate model selectors without pulling
 * native/node-only dependencies into the browser bundle.
 */

export interface ChatModelOption {
  id: string;
  name: string;
  provider: string;
  free?: boolean;
}

export const AVAILABLE_CHAT_MODELS: ChatModelOption[] = [
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
  { id: 'openai/gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'Gateway', free: false },
  { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'Gateway', free: false },
  { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'Gateway', free: false },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Gateway', free: false },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Gateway', free: false },
];

export const CONTENT_CHAT_MODELS = AVAILABLE_CHAT_MODELS;
