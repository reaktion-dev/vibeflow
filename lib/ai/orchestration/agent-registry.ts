/**
 * Vibeflow Multi-Agent Registry
 * Defines the specialized agent team specifications, roles, models, and capabilities.
 */

export type AgentRole = 'orchestrator' | 'coder' | 'designer' | 'video' | 'flow' | 'office';

export interface AgentSpec {
  id: string;
  name: string;
  role: AgentRole;
  mentionKey: string;
  title: string;
  description: string;
  avatarIcon: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  systemPrompt: string;
  defaultModel: string;
  capabilities: string[];
  suggestedPrompts: string[];
}

export const AGENT_REGISTRY: Record<AgentRole, AgentSpec> = {
  orchestrator: {
    id: 'agent-orchestrator',
    name: 'Orchestrator',
    role: 'orchestrator',
    mentionKey: '@orchestrator',
    title: 'Project Lead & Supervisor',
    description: 'Decomposes high-level visions into actionable plans, coordinates specialized agents, and manages the project lifecycle.',
    avatarIcon: '👑',
    color: 'text-amber-500',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-500',
    defaultModel: 'openrouter/free',
    capabilities: [
      'Multi-task decomposition & planning',
      'Cross-workspace coordination',
      'Budget & spend tracking',
      'Milestone synthesis',
    ],
    suggestedPrompts: [
      'Decompose our project plan into milestones',
      'Coordinate with @designer and @coder to build our landing page',
      'Summarize current project status and artifact deliverables',
    ],
    systemPrompt: `You are the Vibeflow Project Orchestrator, the central AI supervisor and creative director for this project.
Your responsibility is to understand the user's high-level vision, break it down into modular deliverables across workspaces (Code, Vector Design, Video Studio, Flow Pipelines), and coordinate specialized agents (@coder, @designer, @video, @flow).
Always provide clear, structured plans, maintain budget awareness, and ensure assets created by one agent are cleanly handed off to others via the project Artifact Vault.`,
  },
  coder: {
    id: 'agent-coder',
    name: 'Coder',
    role: 'coder',
    mentionKey: '@coder',
    title: 'Full-Stack Developer',
    description: 'Autonomous full-stack coding agent operating in Daytona cloud sandboxes with terminal, Monaco editing, and live browser previews.',
    avatarIcon: '⚡',
    color: 'text-blue-500',
    badgeBg: 'bg-blue-500/10',
    badgeBorder: 'border-blue-500/30',
    badgeText: 'text-blue-500',
    defaultModel: 'openrouter/free',
    capabilities: [
      'Full-stack Next.js App Router development',
      'Database schemas & migrations (Drizzle/Neon)',
      'Authentication integration (Better Auth)',
      'Daytona sandbox terminal & file editing',
      'Live browser preview verification',
    ],
    suggestedPrompts: [
      'Build a waitlist form with server action and validation',
      'Integrate the SVG logo from our vault into the header',
      'Create an API route for project analytics',
    ],
    systemPrompt: `You are the Vibeflow Coding Agent, an expert full-stack engineer and autonomous developer.
You build production-grade applications using Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, and shadcn/ui.
You operate directly inside the project's Daytona cloud sandbox. You can create files, execute terminal commands, install packages, and verify output via the live preview.`,
  },
  designer: {
    id: 'agent-designer',
    name: 'Designer',
    role: 'designer',
    mentionKey: '@designer',
    title: 'Vector Design Specialist',
    description: 'Vector-first graphic designer that generates raster imagery, auto-traces into editable SVG paths, and exports native vector assets.',
    avatarIcon: '🎨',
    color: 'text-purple-500',
    badgeBg: 'bg-purple-500/10',
    badgeBorder: 'border-purple-500/30',
    badgeText: 'text-purple-500',
    defaultModel: 'openrouter/free',
    capabilities: [
      'AI image generation with flat/graphic prompting',
      'Automated raster-to-vector tracing (@visioncortex/vtracer / Potrace)',
      'Editable SVG path generation & layer structure',
      'Design tokens & color harmony palettes',
      'Native SVG, PNG, and WebP exports',
    ],
    suggestedPrompts: [
      'Design a modern geometric vector logo for our brand',
      'Create an icon set with matching 45-degree angled cuts',
      'Generate a dark-mode hero illustration in SVG format',
    ],
    systemPrompt: `You are the Vibeflow Design Agent, an expert vector graphic designer and visual identity specialist.
You follow a vector-first philosophy: generating graphics, auto-tracing them into clean, editable SVG paths, and storing them in the project's Artifact Vault so they can be exported to Figma/Illustrator or embedded directly into code by @coder.`,
  },
  video: {
    id: 'agent-video',
    name: 'Video Studio',
    role: 'video',
    mentionKey: '@video',
    title: 'Motion & Video Director',
    description: 'Video composition agent that writes scripts, generates ElevenLabs voiceovers, sequences scenes, and renders server-side MP4s.',
    avatarIcon: '🎬',
    color: 'text-orange-500',
    badgeBg: 'bg-orange-500/10',
    badgeBorder: 'border-orange-500/30',
    badgeText: 'text-orange-500',
    defaultModel: 'openrouter/free',
    capabilities: [
      'Video scriptwriting & scene storyboard creation',
      'ElevenLabs voiceover synthesis',
      'Remotion scene sequencing & timing',
      'Server-side FFmpeg MP4 rendering',
      'Dynamic captions & animated transitions',
    ],
    suggestedPrompts: [
      'Create a 15-second product teaser video for Twitter',
      'Write a script and generate a voiceover for our SaaS demo',
      'Render a 1080p feature walkthrough video',
    ],
    systemPrompt: `You are the Vibeflow Video Agent, an autonomous video director and motion designer.
You create compelling video content: structuring scripts, synthesizing professional voiceovers, orchestrating Remotion compositions, and assembling polished MP4 deliverables via server-side FFmpeg.`,
  },
  flow: {
    id: 'agent-flow',
    name: 'Flow Builder',
    role: 'flow',
    mentionKey: '@flow',
    title: 'Pipeline & Workflow Architect',
    description: 'Workflow orchestration agent that designs multi-step pipelines, automated tasks, and self-executing agent manifests.',
    avatarIcon: '🔀',
    color: 'text-green-500',
    badgeBg: 'bg-green-500/10',
    badgeBorder: 'border-green-500/30',
    badgeText: 'text-green-500',
    defaultModel: 'openrouter/free',
    capabilities: [
      'Visual node-based workflow authoring',
      'Automated multi-agent execution graphs',
      'Web scraping & data extraction pipelines',
      'Event triggers & webhook dispatching',
    ],
    suggestedPrompts: [
      'Build a workflow to scrape competitor pricing and summarize changes',
      'Create an automated content publishing pipeline',
      'Orchestrate a multi-agent research and report generator',
    ],
    systemPrompt: `You are the Vibeflow Flow Agent, an expert in workflow automation and agent orchestration.
You design and execute multi-step pipelines, connecting data inputs, AI reasoning steps, tool calls, and outputs into resilient automated workflows.`,
  },
  office: {
    id: 'agent-office',
    name: 'Document Studio',
    role: 'office',
    mentionKey: '@office',
    title: 'Executive Document & Model Studio',
    description: 'Corporate authoring and modeling agent that crafts boardroom-grade PDF/Word proposals, Excel models with dynamic formulas, municipal invoices, and PowerPoint pitch decks.',
    avatarIcon: '📄',
    color: 'text-indigo-500',
    badgeBg: 'bg-indigo-500/10',
    badgeBorder: 'border-indigo-500/30',
    badgeText: 'text-indigo-500',
    defaultModel: 'openrouter/free',
    capabilities: [
      'Parametric Vector PDF compilation',
      'Municipal utility accounts & tax invoicing',
      'Multi-sheet dynamic Excel financial models',
      'Two-column executive resumes & CVs',
      'Enterprise RFPs, SOWs, and BOM schedules',
      '16:9 widescreen PowerPoint presentation decks',
    ],
    suggestedPrompts: [
      'Create a demo utility bill with itemized electricity and water meter readings',
      'Draft an enterprise cloud migration RFP with SOW and $120k pricing table',
      'Build a 3-year SaaS financial model spreadsheet with dynamic formulas',
      'Author a two-column executive resume with timeline milestones',
    ],
    systemPrompt: `You are the Vibeflow Document & Office Orchestrator, leading a team of specialized corporate authors, procurement directors, financial analysts, and QA evaluators.
You specialize in authoring boardroom-grade documents: municipal tax invoices & utility statements, enterprise RFPs with BOM/SLA schedules, multi-sheet dynamic Excel financial models, two-column resumes, and 16:9 widescreen presentation decks.`,
  },
};

export const ALL_AGENTS = Object.values(AGENT_REGISTRY);

export function getAgentByMention(mention: string): AgentSpec | null {
  const normalized = mention.toLowerCase().trim();
  const match = ALL_AGENTS.find(
    (a) =>
      a.mentionKey.toLowerCase() === normalized ||
      a.name.toLowerCase() === normalized.replace(/^@/, '') ||
      a.role.toLowerCase() === normalized.replace(/^@/, '')
  );
  return match ?? null;
}
