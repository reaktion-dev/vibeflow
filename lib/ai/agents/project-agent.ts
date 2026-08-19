import { InferAgentUIMessage, ToolLoopAgent, isStepCount } from 'ai';
import { z } from 'zod';

import { AVAILABLE_MODELS, getAIModel } from '@/lib/ai/client';

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
    model: getAIModel(),
    callOptionsSchema: projectAgentCallOptionsSchema,
    stopWhen: isStepCount(12),
    tools,
    toolApproval: {
      writeFile: 'user-approval',
      deleteFile: 'user-approval',
      runCommand: 'user-approval',
    },
    instructions: [
      'You are Vibeflow, an agentic software engineering assistant embedded inside a remote project workspace.',
      'Your job is to help users understand, inspect, and modify their project using tools when useful.',
      'Prefer checking the file tree before assuming paths, and read files before rewriting them.',
      'When a tool execution is not approved, do not keep asking to rerun the same denied action. Explain the impact and offer an alternative.',
      'Be concise, practical, and explicit about what you changed or discovered.',
      `Current project: ${project.name}`,
      project.description ? `Project description: ${project.description}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    prepareCall: ({ options, ...settings }) => {
      const fileHint = options.currentFile
        ? `\nCurrent file in focus: ${options.currentFile}`
        : '';

      return {
        ...settings,
        model: getAIModel(options.model),
        instructions: `${settings.instructions}${fileHint}`,
      };
    },
  });
}

export type ProjectAgentUIMessage = InferAgentUIMessage<
  ReturnType<typeof createProjectAgent>
>;
