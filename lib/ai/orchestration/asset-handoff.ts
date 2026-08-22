/**
 * Vibeflow Cross-Agent Asset Handoff Protocol
 * Facilitates passing generated deliverables (SVGs, MP4s, OOXML, code snippets)
 * between specialized agents in the collaborative stream.
 */

import { AgentRole } from './agent-registry';

export interface AssetHandoffEvent {
  id: string;
  sourceAgentRole: AgentRole;
  targetAgentRole: AgentRole;
  assetId: string;
  assetName: string;
  assetType: 'image' | 'svg' | 'video' | 'audio' | 'document' | 'export' | 'code';
  assetUrl: string;
  instruction: string;
  timestamp: string;
}

/**
 * Creates a formatted handoff message for the collaborative chat stream.
 */
export function createHandoffMessage(event: AssetHandoffEvent): {
  role: 'system';
  content: string;
  metadata: Record<string, any>;
} {
  const {
    sourceAgentRole,
    targetAgentRole,
    assetName,
    assetType,
    instruction,
  } = event;

  const content = `🔄 **Asset Handoff**: @${sourceAgentRole} deposited **${assetName}** (${assetType.toUpperCase()}) into the Vault for @${targetAgentRole}.\n\n*Action*: ${instruction}`;

  return {
    role: 'system',
    content,
    metadata: {
      isHandoff: true,
      handoffEvent: event,
    },
  };
}
