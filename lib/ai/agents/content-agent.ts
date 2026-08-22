import { InferAgentUIMessage, ToolLoopAgent, isStepCount } from 'ai';
import { z } from 'zod';

import { getAIModel } from '@/lib/ai/client';
import { createSharedContentTools, createDesignTools } from './content-tools';

/**
 * Default model for content workspace agents.
 * Uses `openrouter/free` (auto-router) for resilient free-tier routing.
 */
const DEFAULT_CONTENT_MODEL = 'openrouter/free';

const contentAgentCallOptionsSchema = z.object({
  model: z.string().optional(),
});

export { CONTENT_CHAT_MODELS } from '@/lib/ai/chat-models';

/**
 * Create a content workspace agent for a project.
 */
export function createContentAgent(project: {
  id: string;
  name: string;
  type: 'design' | 'video' | 'flow';
  description?: string | null;
}) {
  const tools = {
    ...createSharedContentTools(),
  };

  let toolApproval: Record<string, 'user-approval'> = {};
  const instructions: string[] = [
    'You are Vibeflow, an expert AI content creation agent and visual designer.',
    'You help users create, compose, trace, and export production-quality graphic and video artifacts.',
    'Be concise, decisive, and proactive. Always execute the complete multi-step tool sequence to produce deliverables.',
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
      '## Design Workspace Tool Capabilities:',
      '- `searchImages({ query, count })`: Search web for transparent PNGs, icons, illustrations, and backgrounds.',
      '- `fetchImage({ url, name })`: Download an image from search results into the project Artifact Vault and get its `assetId`. ALWAYS call this before `composeDesign` so you have an `assetId` to layer.',
      '- `composeDesign({ width, height, background, layers })`: Primary tool to composite multi-layer SVGs from images, shapes, and text.',
      '- `generateImage({ prompt, style })`: AI image generation when custom imagery is requested.',
      '- `traceImage({ assetId, mode })`: Auto-trace raster image into editable SVG vector paths (@visioncortex/vtracer).',
      '- `exportDesign({ assetId, formats })`: Export composed SVG to PNG/JPEG/WebP.',
      '',
      '## Standard Image Composition Workflow (IMPORTANT):',
      'When asked to create an image, banner, or featured article graphic:',
      '1. **Search**: Call `searchImages` for transparent icons or background images.',
      '2. **Fetch**: Pick the best search result and call `fetchImage({ url, name: "icon-name" })` to download it and get `{ assetId }`.',
      '3. **Compose**: Call `composeDesign` with complete layer structures:',
      '   ```json',
      '   {',
      '     "width": 1200,',
      '     "height": 630,',
      '     "background": "#0b132b",',
      '     "layers": [',
      '       {',
      '         "name": "illustration",',
      '         "elements": [',
      '           { "type": "image", "assetId": "<FETCHED_ASSET_ID>", "x": 100, "y": 115, "width": 400, "height": 400 }',
      '         ]',
      '       },',
      '       {',
      '         "name": "typography",',
      '         "elements": [',
      '           { "type": "text", "text": "Article Headline", "x": 560, "y": 260, "fontSize": 48, "fontWeight": "bold", "fill": "#ffffff" },',
      '           { "type": "text", "text": "Subheading or tagline", "x": 560, "y": 330, "fontSize": 24, "fill": "#94a3b8" }',
      '         ]',
      '       }',
      '     ]',
      '   }',
      '   ```',
      '4. **Inform**: Let the user know the composite SVG is ready in the canvas.'
    );
  }

  if (project.type === 'video') {
    instructions.push(
      'You are in the Video workspace.',
      'Manage video scripts and assets using listAssets, getAssetUrl, and checkBudget.'
    );
  }

  if (project.type === 'flow') {
    instructions.push(
      'You are in the Flow workspace.',
      'Manage pipeline manifests and assets using listAssets, getAssetUrl, and checkBudget.'
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
