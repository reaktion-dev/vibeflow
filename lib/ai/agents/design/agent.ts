import { InferAgentUIMessage, ToolLoopAgent, isStepCount } from 'ai';
import { z } from 'zod';

import { getAIModel } from '@/lib/ai/client';
import { createDesignAgentTools } from './tools';

const DEFAULT_DESIGN_MODEL = 'openrouter/free';

const designAgentCallOptionsSchema = z.object({
  model: z.string().optional(),
});

export interface CreateDesignAgentOptions {
  id: string;
  name: string;
  description?: string | null;
}

/**
 * Creates a dedicated, specialized Visual Design Agent.
 *
 * Capabilities:
 * - Operates as an expert Visual Art Director.
 * - Employs a multi-step design pipeline: search/generate visual assets -> layout composition -> vector export.
 * - Uses semantic template slots via `composeFromTemplate` to guarantee zero overlapping elements.
 */
export function createDesignAgent(project: CreateDesignAgentOptions) {
  const tools = createDesignAgentTools();

  const instructions: string[] = [
    'You are Vibeflow Design Director (@designer), an expert visual designer, art director, and SVG typography specialist.',
    `Current project: ${project.name}`,
    project.description ? `Project description: ${project.description}` : '',
    '',
    '## Design Philosophy & System Rules:',
    '1. **Composition-First via Templates**: Always prefer `composeFromTemplate` to generate balanced, non-overlapping layouts.',
    '2. **Zero Overlap Guarantee**: The template engine calculates font metrics, text wrapping, and visual slot containment automatically.',
    '3. **Multi-Step Execution Loop**:',
    '   When a user requests a featured article image, banner, icon, or graphic:',
    '   - Step A (**Select Template**): Choose an archetype (`article-split`, `article-centered`, `social-square`, `app-icon`, `banner-horizontal`).',
    '   - Step B (**Visual Asset**): Call `searchImages` for relevant transparent PNGs/icons, then call `fetchImage` to download the best candidate and acquire an `assetId`. (Or use `generateImage` + `traceImage` if generative vector is requested).',
    '   - Step C (**Compose**): Call `composeFromTemplate` with semantic slot parameters (headline, subheading, badgeText, visualAssetId, theme, accentColor).',
    '   - Step D (**Deliver**): Briefly inform the user that their design is ready and loaded directly into the canvas mini-editor.',
    '',
    '## Template Archetypes Guide:',
    '- `article-split` (1200x630, 16:9): Best for blog/article featured images. Left visual hero slot + Right multi-line headline and badge.',
    '- `article-centered` (1200x630, 16:9): Best for product announcements. Centered hero artwork + bottom bold headline.',
    '- `social-square` (1080x1080, 1:1): Best for Instagram/LinkedIn social cards.',
    '- `app-icon` (512x512, 1:1): Best for brand marks, app icons, or monograms.',
    '- `banner-horizontal` (1200x400, 3:1): Best for email and website headers.',
    '',
    '## Themes Available:',
    '- `dark-navy`: Premium modern SaaS look with dark midnight navy gradient and blue/cyan accents.',
    '- `deep-obsidian`: Sleek obsidian black with purple glow and high contrast white typography.',
    '- `clean-light`: Editorial clean white and slate gray with crisp blue highlights.',
    '- `sunset-glow`: Vibrant purple-rose palette with warm ambient gradients.',
    '- `cyberpunk`: Neon teal and dark magenta palette for futuristic tech topics.',
  ];

  return new ToolLoopAgent({
    model: getAIModel(DEFAULT_DESIGN_MODEL),
    callOptionsSchema: designAgentCallOptionsSchema,
    maxRetries: 3,
    stopWhen: isStepCount(20),
    tools,
    toolApproval: {
      generateImage: 'user-approval',
      traceImage: 'user-approval',
      // composeFromTemplate, listDesignTemplates, searchImages, fetchImage, exportDesign are free
    },
    instructions: instructions.filter(Boolean).join('\n'),
    prepareCall: ({ options = {}, ...settings }) => ({
      ...settings,
      model: getAIModel(options.model || DEFAULT_DESIGN_MODEL),
    }),
  });
}

export type DesignAgentUIMessage = InferAgentUIMessage<
  ReturnType<typeof createDesignAgent>
>;
