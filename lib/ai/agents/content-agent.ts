import { InferAgentUIMessage, ToolLoopAgent, isStepCount } from 'ai';
import { z } from 'zod';

import { getAIModel } from '@/lib/ai/client';
import { createSharedContentTools, createDesignTools } from './content-tools';

/**
 * Default model for content workspace agents.
 *
 * Uses `openrouter/free` (auto-router) instead of a pinned model so that
 * when one provider is overloaded (e.g. Nvidia 502s), OpenRouter routes
 * to the next best available free model automatically.
 */
const DEFAULT_CONTENT_MODEL = 'openrouter/free';

/**
 * Content workspace agent — a ToolLoopAgent (no sandbox) for design/video/docs/flow.
 *
 * Architecture:
 * - `code` projects → HarnessAgent (OpenCode + Firecracker microVM, sandbox)
 * - `design`/`video`/`flow` projects → ToolLoopAgent (host-side, no sandbox)
 *
 * The ToolLoopAgent supports `toolApproval` (unlike subagents), so paid tools
 * like `generateImage` pause for user approval (AC-009). Non-paid complex work
 * can later delegate to subagents (which can't use approvals — only used for
 * free operations).
 *
 * The agent shares the same AsyncLocalStorage tool context as the harness
 * (projectId/userId/projectType propagate without being agent parameters).
 */

const contentAgentCallOptionsSchema = z.object({
  model: z.string().optional(),
});

export { CONTENT_CHAT_MODELS } from '@/lib/ai/chat-models';

/**
 * Create a content workspace agent for a project.
 *
 * @param project - The project (must be type design/video/flow)
 * @returns A ToolLoopAgent with domain-specific tools
 */
export function createContentAgent(project: {
  id: string;
  name: string;
  type: 'design' | 'video' | 'flow';
  description?: string | null;
}) {
  // Start with shared tools (listAssets, getAssetUrl, uploadTextAsset, checkBudget)
  const tools = {
    ...createSharedContentTools(),
  };

  let toolApproval: Record<string, 'user-approval'> = {};
  const instructions: string[] = [
    'You are Vibeflow, an AI agent for content creation workspaces.',
    'You help users generate, trace, and export creative artifacts.',
    'Be concise and practical. Always explain what you are about to do before calling paid tools.',
    'When a tool execution is not approved, explain why it was needed and offer alternatives.',
    `Current project: ${project.name}`,
  ];
  if (project.description) {
    instructions.push(`Project description: ${project.description}`);
  }

  // Add domain-specific tools per project type
  if (project.type === 'design') {
    Object.assign(tools, createDesignTools());

    toolApproval = {
      generateImage: 'user-approval',
      traceImage: 'user-approval',
      uploadTextAsset: 'user-approval',
      // searchImages, searchWeb, fetchImage, composeDesign, exportDesign are free
    };

    instructions.push(
      'You are in the Design workspace. Your capabilities:',
      '- searchImages: Search the web for reusable images — backgrounds, transparent PNGs, icons, stock photos. Always search first before generating images.',
      '- searchWeb: Search the web for general information, references, and inspiration.',
      '- fetchImage: Download an image from a URL and store it as a project asset. Use after searchImages.',
      '- composeDesign: Build a composite SVG design from layers of images, shapes, and text. This is your PRIMARY design tool — layer backgrounds, vector shapes, transparent PNGs, and text to create production-quality designs.',
      '- generateImage: Generate images from text prompts using AI. Use when you need custom imagery not available via search. Prompt for flat/graphic style.',
      '- traceImage: Convert a raster image into editable SVG vector paths.',
      '- exportDesign: Export a composed SVG design as SVG + raster (PNG/JPEG/WebP).',
      '- listAssets/getAssetUrl: View and retrieve project artifacts.',
      '- uploadTextAsset: Store SVG source, JSON, or text deliverables.',
      '- checkBudget: Check remaining generation budget before paid operations.',
      '',
      'Design workflow (composition-first):',
      '1. Search for reusable images (backgrounds, transparent PNGs, icons)',
      '2. Fetch the best images as project assets',
      '3. Compose a multi-layer design with composeDesign (background image + vector shapes + text)',
      '4. Export the composed design as PNG/JPEG/WebP',
      '',
      'Alternative workflow (vector-first):',
      '1. Generate an AI image with generateImage',
      '2. Trace it to SVG with traceImage',
      '3. Export the traced SVG',
      '',
      'Always check budget before calling generateImage. Prefer composition over generation — it produces higher quality results and costs less.',
      'After composing a design, suggest exporting it. The user can then tweak it in the mini-editor.'
    );
  }

  // video and flow tools will be added in later phases
  if (project.type === 'video') {
    instructions.push(
      'You are in the Video workspace.',
      'Video generation tools will be available in a later phase.',
      'For now, you can manage artifacts with listAssets, getAssetUrl, and checkBudget.'
    );
  }

  if (project.type === 'flow') {
    instructions.push(
      'You are in the Flow workspace.',
      'Pipeline execution tools will be available in a later phase.',
      'For now, you can manage artifacts with listAssets, getAssetUrl, and checkBudget.'
    );
  }

  return new ToolLoopAgent({
    model: getAIModel(DEFAULT_CONTENT_MODEL),
    callOptionsSchema: contentAgentCallOptionsSchema,
    maxRetries: 3,
    stopWhen: isStepCount(20),
    tools,
    toolApproval,
    instructions: instructions.filter(Boolean).join('\n'),
    prepareCall: ({ options = {}, ...settings }) => ({
      ...settings,
      model: getAIModel(options.model || DEFAULT_CONTENT_MODEL),
    }),
  });
}

export type ContentAgentUIMessage = InferAgentUIMessage<
  ReturnType<typeof createContentAgent>
>;
