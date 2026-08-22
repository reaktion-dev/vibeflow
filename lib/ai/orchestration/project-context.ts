/**
 * Vibeflow Shared Project Context Provider
 * Synthesizes cross-workspace project state, spend ledger, active deliverables,
 * and vault assets so all specialized agents operate with synchronized context.
 */

export interface VaultAssetSummary {
  id: string;
  name: string;
  type: 'image' | 'svg' | 'video' | 'audio' | 'document' | 'export' | 'pipeline';
  url: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  createdAt: string;
}

export interface ProjectDeliverableStatus {
  codeStatus: 'uninitialized' | 'scaffolding' | 'active' | 'ready';
  designStatus: 'uninitialized' | 'generating' | 'vectorized' | 'ready';
  videoStatus: 'uninitialized' | 'scripting' | 'rendering' | 'ready';
  flowStatus: 'uninitialized' | 'authoring' | 'running' | 'ready';
}

export interface SharedProjectContext {
  projectId: string;
  projectName: string;
  description?: string | null;
  budgetCents: number;
  spentCents: number;
  overBudget: boolean;
  deliverables: ProjectDeliverableStatus;
  recentVaultAssets: VaultAssetSummary[];
  designTokens?: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    style: string;
  };
}

/**
 * Formats the shared project context into a compact markdown block for agent system prompts.
 */
export function buildAgentContextPrompt(context: SharedProjectContext): string {
  const {
    projectName,
    description,
    budgetCents,
    spentCents,
    deliverables,
    recentVaultAssets,
    designTokens,
  } = context;

  const budgetFormatted = `$${(budgetCents / 100).toFixed(2)}`;
  const spentFormatted = `$${(spentCents / 100).toFixed(2)}`;

  let prompt = `## Active Project Context: ${projectName}\n`;
  if (description) prompt += `**Description**: ${description}\n`;
  prompt += `**Budget**: Spent ${spentFormatted} of ${budgetFormatted} limit.\n\n`;

  prompt += `### Workspace Status Matrix:\n`;
  prompt += `- **⚡ Code Workspace**: ${deliverables.codeStatus}\n`;
  prompt += `- **🎨 Vector Design**: ${deliverables.designStatus}\n`;
  prompt += `- **🎬 Video Studio**: ${deliverables.videoStatus}\n`;
  prompt += `- **🔀 Flow Pipelines**: ${deliverables.flowStatus}\n\n`;

  if (designTokens) {
    prompt += `### Brand Design Tokens:\n`;
    prompt += `- Primary Accent: ${designTokens.primaryColor}\n`;
    prompt += `- Secondary Glyph: ${designTokens.secondaryColor}\n`;
    prompt += `- Typography: ${designTokens.fontFamily}\n`;
    prompt += `- Style Aesthetic: ${designTokens.style}\n\n`;
  }

  if (recentVaultAssets && recentVaultAssets.length > 0) {
    prompt += `### Shared Artifact Vault (Available to all agents):\n`;
    for (const asset of recentVaultAssets.slice(0, 8)) {
      prompt += `- [${asset.type.toUpperCase()}] **${asset.name}** (Ref: \`asset://${asset.name}\`)\n`;
    }
    prompt += `\n*Note: You can reference any asset from the vault by name to embed in code, video, or pipelines.*\n`;
  }

  return prompt;
}
