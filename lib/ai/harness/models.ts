/**
 * Client-safe model definitions for the coding agent.
 *
 * This file is intentionally separate from `opencode-agent.ts` because that
 * module imports server-only SDKs (@ai-sdk/harness-opencode, @ai-sdk/sandbox-vercel)
 * that rely on Node.js builtins (fs, stream/promises, node:timers/promises) and
 * runtime `new URL(..., import.meta.url)` bridge asset resolution. Importing those
 * from a client component drags the entire server-only graph into the browser bundle,
 * breaking the production build.
 *
 * Keep this module free of any server-only imports.
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
  { id: 'anthropic/claude-sonnet-4-6', name: 'Claude Sonnet 4', provider: 'Anthropic' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', name: 'Nemotron 3 Ultra (550B)', provider: 'OpenRouter', free: true },
  { id: 'nvidia/nemotron-3.5-lightning:free', name: 'Nemotron 3.5 Lightning', provider: 'OpenRouter', free: true },
  { id: 'poolside/laguna-s-2.1:free', name: 'Poolside Laguna S', provider: 'OpenRouter', free: true },
  { id: 'cohere/north-mini-code:free', name: 'Cohere North Mini Code', provider: 'OpenRouter', free: true },
  { id: 'openrouter/free', name: 'Free Models Router', provider: 'OpenRouter', free: true },
];
