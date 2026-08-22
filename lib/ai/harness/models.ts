/**
 * Client-safe model definitions and auth/sandbox helpers for the coding agent.
 *
 * This file is intentionally separate from `opencode-agent.ts` because that
 * module imports server-only SDKs (@ai-sdk/harness-opencode, @ai-sdk/sandbox-vercel)
 * that rely on Node.js builtins (fs, stream/promises, node:timers/promises) and
 * runtime `new URL(..., import.meta.url)` bridge asset resolution. Importing those
 * from a client component drags the entire server-only graph into the browser bundle,
 * breaking the production build.
 *
 * Keep this module free of any DB or server-only native imports.
 */

export interface CodingAgentModel {
  id: string;
  name: string;
  provider: string;
  free?: boolean;
}

/**
 * Available models for the coding agent.
 * These match the models configured in lib/ai/models.ts.
 */
export const CODING_AGENT_MODELS: CodingAgentModel[] = [
  // ── OpenCode Zen Models (Native OpenCode Ecosystem) ──
  { id: 'opencode/deepseek-v4-flash-free', name: 'OpenCode DeepSeek Flash (Structured Output)', provider: 'OpenCode Zen', free: true },
  { id: 'opencode/big-pickle', name: 'OpenCode Big Pickle (Fast Code)', provider: 'OpenCode Zen', free: true },
  { id: 'opencode/mimo-v2.5-free', name: 'OpenCode MiMo 2.5', provider: 'OpenCode Zen', free: true },
  { id: 'opencode/qwen3.6-plus-free', name: 'OpenCode Qwen 3.6 Plus', provider: 'OpenCode Zen', free: true },
  { id: 'opencode/minimax-m3-free', name: 'OpenCode MiniMax M3', provider: 'OpenCode Zen', free: true },
  { id: 'opencode/gpt-5.6-terra', name: 'OpenCode GPT 5.6 Terra', provider: 'OpenCode Zen', free: false },
  { id: 'opencode/gpt-5.6-luna', name: 'OpenCode GPT 5.6 Luna', provider: 'OpenCode Zen', free: false },

  // ── OpenRouter Free Models ──
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', name: 'Nemotron 3 Ultra (550B)', provider: 'OpenRouter', free: true },
  { id: 'nvidia/nemotron-3.5-lightning:free', name: 'Nemotron 3.5 Lightning', provider: 'OpenRouter', free: true },
  { id: 'poolside/laguna-s-2.1:free', name: 'Poolside Laguna S', provider: 'OpenRouter', free: true },
  { id: 'cohere/north-mini-code:free', name: 'Cohere North Mini Code', provider: 'OpenRouter', free: true },
  { id: 'openrouter/free', name: 'Free Models Router', provider: 'OpenRouter', free: true },

  // ── Anthropic Gateway ──
  { id: 'anthropic/claude-sonnet-4-6', name: 'Claude Sonnet 4', provider: 'Anthropic' },
];

/**
 * Resolves the authentication mode and model ID for OpenCode based on available environment keys.
 * Per the official AI SDK Harness docs (https://ai-sdk.dev/providers/ai-sdk-harnesses/opencode):
 * Supported environment variables are:
 * - AI_GATEWAY_API_KEY, AI_GATEWAY_BASE_URL
 * - ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL
 * - OPENAI_API_KEY, OPENAI_BASE_URL
 *
 * For OpenAI-compatible endpoints (OpenCode Zen, OpenRouter), auth mode 'openai' is used
 * with OPENAI_BASE_URL and OPENAI_API_KEY set appropriately.
 */
export function resolveOpenCodeSettings(modelId?: string) {
  const opencodeZenKey = process.env.OPENCODE_ZEN_API_KEY || process.env.OPENCODE_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;

  const defaultModel = opencodeZenKey
    ? 'opencode/deepseek-v4-flash-free'
    : openRouterKey
      ? 'openrouter/free'
      : 'anthropic/claude-sonnet-4-6';

  const model = modelId || defaultModel;
  let auth: 'auto' | 'anthropic' | 'openai' | 'ai-gateway' = 'auto';

  // 1. OpenCode Zen models (`opencode/*`)
  if (model.startsWith('opencode/')) {
    if (opencodeZenKey) {
      process.env.OPENAI_API_KEY = opencodeZenKey;
      process.env.OPENAI_BASE_URL = 'https://opencode.ai/zen/v1';
      auth = 'openai';
    } else if (openRouterKey) {
      process.env.OPENAI_API_KEY = openRouterKey;
      process.env.OPENAI_BASE_URL = 'https://openrouter.ai/api/v1';
      auth = 'openai';
    }
  } else if (
    openRouterKey &&
    (model.startsWith('openrouter/') ||
      model.includes(':free') ||
      model.startsWith('nvidia/') ||
      model.startsWith('poolside/') ||
      model.startsWith('cohere/'))
  ) {
    // 2. OpenRouter models
    process.env.OPENAI_API_KEY = openRouterKey;
    process.env.OPENAI_BASE_URL = 'https://openrouter.ai/api/v1';
    auth = 'openai';
  } else if (anthropicKey && model.startsWith('anthropic/')) {
    // 3. Anthropic
    auth = 'anthropic';
  } else if (openaiKey && model.startsWith('openai/')) {
    // 4. OpenAI
    auth = 'openai';
  } else if (gatewayKey) {
    // 5. Vercel AI Gateway
    auth = 'ai-gateway';
  } else if (opencodeZenKey) {
    process.env.OPENAI_API_KEY = opencodeZenKey;
    process.env.OPENAI_BASE_URL = 'https://opencode.ai/zen/v1';
    auth = 'openai';
  } else if (openRouterKey) {
    process.env.OPENAI_API_KEY = openRouterKey;
    process.env.OPENAI_BASE_URL = 'https://openrouter.ai/api/v1';
    auth = 'openai';
  }

  return { model, auth };
}

/**
 * Safely extracts the inner sandbox handle if session is a HarnessAgentSession,
 * or returns the raw sandbox session.
 */
export function getSandboxHandle(session: any): any {
  if (session && typeof session.getSandboxSession === 'function') {
    return session.getSandboxSession();
  }
  return session;
}
