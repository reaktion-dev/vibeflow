import { HarnessAgent } from '@ai-sdk/harness/agent';
import { createOpenCode } from '@ai-sdk/harness-opencode';
import { createVercelSandbox } from '@ai-sdk/sandbox-vercel';

import { CODING_AGENT_MODELS } from '@/lib/ai/harness/models';
import { createWorkspaceTools, workspaceToolApproval } from '@/lib/ai/harness/tools/workspace-tools';
import { seedSandboxFromDb } from '@/lib/ai/harness/sandbox-sync';

/**
 * Resolves the authentication mode and model ID for OpenCode based on available environment keys.
 */
export function resolveOpenCodeSettings(modelId?: string) {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;

  const model = modelId || (openRouterKey ? 'openrouter/free' : 'anthropic/claude-sonnet-4-6');
  let auth: any = 'auto';

  if (openRouterKey && (model.startsWith('openrouter/') || model.includes(':free') || model.startsWith('nvidia/') || model.startsWith('poolside/') || model.startsWith('cohere/'))) {
    auth = {
      openaiCompatible: {
        apiKey: openRouterKey,
        baseUrl: 'https://openrouter.ai/api/v1',
        name: 'openrouter',
      },
    };
  } else if (anthropicKey && model.startsWith('anthropic/')) {
    auth = 'anthropic';
  } else if (openaiKey && model.startsWith('openai/')) {
    auth = 'openai';
  } else if (gatewayKey) {
    auth = 'ai-gateway';
  } else if (openRouterKey) {
    auth = {
      openaiCompatible: {
        apiKey: openRouterKey,
        baseUrl: 'https://openrouter.ai/api/v1',
        name: 'openrouter',
      },
    };
  }

  return { model, auth };
}

const agentCache = new Map<string, HarnessAgent<any, any>>();

function buildSandboxProvider() {
  const sandboxConfig: any = {
    runtime: 'node24',
    ports: [4000], // Required for OpenCode bridge WebSocket
  };

  if (process.env.VERCEL_TOKEN && process.env.VERCEL_TEAM_ID && process.env.VERCEL_PROJECT_ID) {
    sandboxConfig.token = process.env.VERCEL_TOKEN;
    sandboxConfig.teamId = process.env.VERCEL_TEAM_ID;
    sandboxConfig.projectId = process.env.VERCEL_PROJECT_ID;
  }

  return createVercelSandbox(sandboxConfig);
}

/**
 * Returns a HarnessAgent configured for the requested model and available credentials.
 */
export function getCodingAgent(modelId?: string): HarnessAgent<any, any> {
  const { model, auth } = resolveOpenCodeSettings(modelId);
  const cacheKey = `${model}:${typeof auth === 'string' ? auth : 'openaiCompatible'}`;

  let agent = agentCache.get(cacheKey);
  if (agent) return agent;

  agent = new HarnessAgent({
    harness: createOpenCode({
      auth,
      model,
      reasoningVariant: 'medium',
    }),
    sandbox: buildSandboxProvider(),
    instructions: [
      'You are Vibeflow, an autonomous expert coding agent and full-stack developer (like v0, Lovable, or Google AI Studio).',
      'Your goal is to build complete, functional, high-quality projects based on user prompts (e.g. HTML5 games, Next.js apps, interactive dashboards, full-stack tools).',
      '',
      '## Autonomous Development Workflow:',
      '1. Understand & Plan: Determine the optimal stack (HTML5/Canvas, React/Vite, Next.js) and file structure.',
      '2. Scaffold & Implement: Create complete, production-ready code with no placeholders or TODOs.',
      '3. Live Preview: When creating or modifying frontend projects, invoke `bundleStaticPreview` so the user can immediately test and interact with the live preview.',
      '4. Verify & Test: Ensure code is free of syntax errors, broken imports, and runtime bugs.',
      '5. Deliver & Export: Proactively offer deliverables — mention the user can play/interact in Live Preview, download as a ZIP archive via `exportProjectZip`, or open a GitHub PR via `createGitHubPR`.',
      '',
      '## Available Tools:',
      '- Sandbox Tools: read, write, edit, bash, grep, glob, ls, webfetch.',
      '- Preview Tools: bundleStaticPreview (bundle static apps for zero-latency live preview), getSandboxPreviewUrl.',
      '- Export & Git Tools: exportProjectZip (generate downloadable .zip), createGitHubPR (open PR on GitHub).',
      '- Workspace Tools: listAssets, getAssetUrl, uploadTextAsset, checkBudget.',
      '',
      'Be proactive, creative, and deliver polished, delightful user experiences.',
    ].join('\n'),
    permissionMode: 'allow-reads', // Reads are free, writes/bash need approval
    tools: createWorkspaceTools(),
    toolApproval: workspaceToolApproval,
    skills: [
      {
        name: 'vibeflow-scaffolding',
        description: 'Project scaffolding and architecture patterns for games, dashboards, and full-stack apps',
        content: [
          'When building HTML5 games (e.g. infinite runner, platformer, arcade):',
          '- Create a clean index.html, style.css, and game.js.',
          '- Use HTML5 Canvas with smooth 60fps requestAnimationFrame, responsive resizing, keyboard/touch controls, particle effects, and sound synth (Web Audio API).',
          '- Ensure visual appeal with clean Tailwind/modern CSS, score overlays, restart buttons, and difficulty progression.',
          '',
          'When building React / SPA applications:',
          '- Use modern React 19 / TypeScript patterns with Tailwind CSS styling.',
          '- Implement proper state management, responsive viewports, and clean modular component design.',
        ].join('\n'),
      },
      {
        name: 'vibeflow-developer-workflow',
        description: 'Autonomous development, preview, and delivery guidelines',
        content: [
          'Always write complete, working code without leaving TODO comments.',
          'Call `bundleStaticPreview` whenever you update frontend files so the live preview immediately refreshes.',
          'When the user asks to save, download, or export, use `exportProjectZip` to generate a downloadable package.',
          'When the user requests a GitHub PR or repository sync, use `createGitHubPR`.',
        ].join('\n'),
      },
      {
        name: 'vibeflow-nextjs',
        description: 'Next.js App Router conventions and best practices for Vibeflow',
        content: [
          'This is a Next.js 16 App Router project with React 19.',
          'Use Server Components by default. Only use "use client" for interactivity.',
          'API routes go in app/api/. Server Actions in app/actions/.',
          'Prefer server actions for mutations over API routes when possible.',
          'Use Tailwind CSS for styling. Follow the existing design system in components/ui/.',
          'Database queries use Drizzle ORM. Schema is in lib/db/schema.ts.',
        ].join('\n'),
      },
      {
        name: 'vibeflow-safety',
        description: 'Safety rules for destructive operations',
        content: [
          'Never delete files without explicit user confirmation.',
          'Always read before writing to understand what you\'re changing.',
          'When running shell commands, explain what they do first.',
          'Prefer TypeScript over JavaScript. Maintain type safety.',
          'Test changes mentally before applying them.',
        ].join('\n'),
      },
    ],
    sandboxConfig: {
      workDir: 'workspace',
      bootstrapHash: 'vibeflow-opencode-v1',
      onBootstrap: async ({ session, abortSignal }) => {
        const sandbox = typeof (session as any).getSandboxSession === 'function' ? (session as any).getSandboxSession() : session;
        if (sandbox && typeof sandbox.run === 'function') {
          const installRipgrep = await sandbox.run({
            command: 'command -v rg >/dev/null 2>&1 || (apt-get update && apt-get install -y ripgrep)',
            abortSignal,
          });

          if (installRipgrep.exitCode !== 0) {
            console.warn('[vibeflow] Failed to install ripgrep during bootstrap:', installRipgrep.stderr);
          }
        }
      },
      onSession: async ({ session, sessionWorkDir, abortSignal }) => {
        await seedSandboxFromDb({
          session,
          projectId: session.sessionId || session.id,
          sessionWorkDir,
          abortSignal,
        });
      },
    },
  });

  agentCache.set(cacheKey, agent);
  return agent;
}

export const codingAgent = getCodingAgent();

export { CODING_AGENT_MODELS } from '@/lib/ai/harness/models';
