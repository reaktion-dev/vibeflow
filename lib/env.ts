import { z } from 'zod';

const envSchema = z.object({
  DAYTONA_API_KEY: z.string().min(1).optional(),
  DAYTONA_API_BASE_URL: z.string().url().optional(),
  // AI Providers
  OPENCODE_ZEN_API_KEY: z.string().optional(),
  OPENCODE_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  AI_GATEWAY_API_KEY: z.string().optional(),
  AI_GATEWAY_BASE_URL: z.string().url().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  // Vercel Sandbox (for harness)
  VERCEL_TOKEN: z.string().optional(),
  VERCEL_TEAM_ID: z.string().optional(),
  VERCEL_PROJECT_ID: z.string().optional(),
  VERCEL_OIDC_TOKEN: z.string().optional(),
  // Cloudflare R2 (artifact storage)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),
  // Budget ceiling cap (env-level, in cents)
  BUDGET_CEILING_CENTS: z.coerce.number().int().positive().default(100000), // $1000 default
  // Phase 2: MCP/ACP
  MCP_REGISTRY_URL: z.string().url().optional(),
  ACP_SECRET: z.string().optional(),
  TOOL_APPROVAL_SECRET: z.string().optional(),
  // Phase 3: Design Canvas
  STABILITY_API_KEY: z.string().optional(),
  REPLICATE_API_TOKEN: z.string().optional(),
  // Phase 4: Video Studio
  REMOTION_LICENSE_KEY: z.string().optional(),
  // Phase 2: Web search (Serper/SerpAPI) for design composition
  SERPER_API_KEY: z.string().optional(),
  SERPAPI_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const env = {
    DAYTONA_API_KEY: process.env.DAYTONA_API_KEY,
    DAYTONA_API_BASE_URL: process.env.DAYTONA_API_BASE_URL || 'https://api.daytona.io',
    // AI Providers
    OPENCODE_ZEN_API_KEY: process.env.OPENCODE_ZEN_API_KEY,
    OPENCODE_API_KEY: process.env.OPENCODE_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
    AI_GATEWAY_BASE_URL: process.env.AI_GATEWAY_BASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    // Vercel Sandbox
    VERCEL_TOKEN: process.env.VERCEL_TOKEN,
    VERCEL_TEAM_ID: process.env.VERCEL_TEAM_ID,
    VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID,
    VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN,
    // Cloudflare R2
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
    BUDGET_CEILING_CENTS: process.env.BUDGET_CEILING_CENTS
      ? Number(process.env.BUDGET_CEILING_CENTS)
      : 100000,
    MCP_REGISTRY_URL: process.env.MCP_REGISTRY_URL,
    ACP_SECRET: process.env.ACP_SECRET,
    TOOL_APPROVAL_SECRET: process.env.TOOL_APPROVAL_SECRET,
    STABILITY_API_KEY: process.env.STABILITY_API_KEY,
    REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
    REMOTION_LICENSE_KEY: process.env.REMOTION_LICENSE_KEY,
    SERPER_API_KEY: process.env.SERPER_API_KEY,
    SERPAPI_API_KEY: process.env.SERPAPI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
  };

  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    console.warn('⚠️ Environment variable validation warnings:', parsed.error.format());
    // Continue with defaults instead of throwing
  }

  cachedEnv = parsed.success ? parsed.data : (env as Env);
  return cachedEnv;
}

// Validate on module load (server-side only)
if (typeof window === 'undefined') {
  try {
    getEnv();
  } catch (error) {
    console.error('Error during environment validation:', error);
  }
}
