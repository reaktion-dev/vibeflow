import { HarnessAgent } from '@ai-sdk/harness/agent';
import { createOpenCode } from '@ai-sdk/harness-opencode';
import { createVercelSandbox } from '@ai-sdk/sandbox-vercel';

import { getAuthorizedProjectFile, listAuthorizedProjectFiles } from '@/lib/projects/server';
import { CODING_AGENT_MODELS } from '@/lib/ai/harness/models';

/**
 * Vibeflow Coding Agent powered by HarnessAgent + OpenCode + Vercel Sandbox.
 * 
 * This agent runs OpenCode in an isolated Firecracker microVM with full workspace access.
 * Built-in tools: read, write, edit, bash, grep, glob, ls, webfetch, skill, todowrite, agent.
 * 
 * Sessions are persistent and resumable across HTTP requests via detach/reattach.
 */
export const codingAgent = new HarnessAgent({
  harness: createOpenCode({
    auth: 'auto', // Try AI Gateway first, fall back to Anthropic/OpenAI
    model: 'anthropic/claude-sonnet-4-6', // or any OpenRouter model
    reasoningVariant: 'medium',
  }),
  sandbox: createVercelSandbox({
    runtime: 'node24',
    ports: [4000], // Required for OpenCode bridge WebSocket
  }),
  instructions: [
    'You are Vibeflow, an expert coding assistant embedded in a remote project workspace.',
    'You have full access to the project through your built-in tools: read, write, edit, bash, grep, glob, ls, and webfetch.',
    'Always read files before modifying them. Prefer small, safe changes.',
    'When making destructive changes (deleting files, running shell commands), explain the impact clearly.',
    'If a tool execution is denied, explain why it was needed and offer safer alternatives.',
    'Be concise and practical. Show diffs when appropriate.',
  ].join('\n'),
  permissionMode: 'allow-reads', // Reads are free, writes/bash need approval
  skills: [
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
    workDir: 'workspace', // Stable workspace directory inside the sandbox
    bootstrapHash: 'vibeflow-opencode-v1',
    onBootstrap: async ({ session, abortSignal }) => {
      // Pre-install common tools once, snapshotted for reuse across all sessions
      const installRipgrep = await session.run({
        command: 'command -v rg >/dev/null 2>&1 || (apt-get update && apt-get install -y ripgrep)',
        abortSignal,
      });

      if (installRipgrep.exitCode !== 0) {
        console.warn('[vibeflow] Failed to install ripgrep during bootstrap:', installRipgrep.stderr);
      }
    },
    onSession: async ({ session, sessionWorkDir, abortSignal }) => {
      // Per-session setup: inject project files into the sandbox workspace
      // This runs every time a session starts (including resumed sessions)
      
      // For now, we'll seed files on-demand when the agent requests them.
      // In the future, we can sync the full project here:
      
      // Example: Create a README if project files exist in the DB
      // const projectId = session.id; // sessionId = projectId
      // try {
      //   const files = await listAuthorizedProjectFiles(projectId);
      //   for (const file of files) {
      //     if (file.content) {
      //       await session.writeTextFile({
      //         path: `${sessionWorkDir}/${file.path}`,
      //         content: file.content,
      //         abortSignal,
      //       });
      //     }
      //   }
      // } catch (error) {
      //   console.warn('[vibeflow] Could not sync project files to sandbox:', error);
      // }
      
      // Create a placeholder README so the agent knows where it is
      await session.writeTextFile({
        path: `${sessionWorkDir}/README.md`,
        content: '# Vibeflow Project\n\nThis is your project workspace. Ask the agent to inspect, modify, or create files.',
        abortSignal,
      });
    },
  },
});

/**
 * Available models for the coding agent.
 * These match the models configured in lib/ai/models.ts.
 *
 * Re-exported from the client-safe `models.ts` so server consumers that already
 * import from this module continue to work. Client components should import
 * CODING_AGENT_MODELS directly from `@/lib/ai/harness/models` to avoid pulling
 * server-only SDKs into the client bundle.
 */
export { CODING_AGENT_MODELS } from '@/lib/ai/harness/models';
