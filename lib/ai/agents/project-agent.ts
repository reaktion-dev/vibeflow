import { InferAgentUIMessage, ToolLoopAgent, isStepCount } from 'ai';
import { z } from 'zod';

import { AVAILABLE_MODELS, getAIModel } from '@/lib/ai/client';
import { DEFAULT_CODING_MODEL } from '@/lib/ai/models';

import { createProjectTools } from './project-tools';

const projectAgentCallOptionsSchema = z.object({
  model: z.string().optional(),
  currentFile: z.string().optional(),
});

export const PROJECT_CHAT_MODELS = AVAILABLE_MODELS;

export function createProjectAgent(project: {
  id: string;
  name: string;
  description?: string | null;
}) {
  const tools = createProjectTools(project.id);

  return new ToolLoopAgent({
    model: getAIModel(DEFAULT_CODING_MODEL),
    callOptionsSchema: projectAgentCallOptionsSchema,
    stopWhen: isStepCount(20),
    maxRetries: 3,
    tools,
    toolApproval: {
      deleteFile: 'user-approval',
      runCommand: 'user-approval',
      createGitHubPR: 'user-approval',
      // writeFile, readFile, listFiles, bundleStaticPreview, exportProjectZip are autonomous
    },
    instructions: [
      'You are Vibeflow, an autonomous expert coding agent and full-stack developer (like v0, Lovable, or Google AI Studio).',
      'Your goal is to build complete, functional, high-quality projects based on user prompts (e.g. HTML5 games, Next.js apps, interactive dashboards, full-stack tools).',
      '',
      '## Autonomous Development Workflow:',
      '1. Understand & Plan: Determine the optimal stack (HTML5/Canvas, React/Vite, Next.js) and file structure.',
      '2. Scaffold & Implement: Use `writeFile` to create complete, production-ready code with no placeholders or TODOs.',
      '   - For HTML5 games: create index.html, style.css, and game.js (with 60fps Canvas loop, physics, score tracking, and Web Audio API sounds).',
      '   - For React/Next.js: create clean components, styling with Tailwind CSS, and state management.',
      '3. Live Preview: Call `bundleStaticPreview` whenever you create or update frontend files so the user can immediately test and play their app live.',
      '4. Deliver & Export: Mention that the live preview is ready in the Preview tab, and that the user can download the full project as a ZIP archive or push to GitHub.',
      '',
      `Current project: ${project.name}`,
      project.description ? `Project description: ${project.description}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    prepareCall: ({ options = {}, ...settings }) => {
      const fileHint = options.currentFile
        ? `\nCurrent file in focus: ${options.currentFile}`
        : '';

      return {
        ...settings,
        model: getAIModel(options.model || DEFAULT_CODING_MODEL),
        instructions: `${settings.instructions}${fileHint}`,
      };
    },
  });
}

export type ProjectAgentUIMessage = InferAgentUIMessage<
  ReturnType<typeof createProjectAgent>
>;
