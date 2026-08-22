/**
 * Vibeflow @Mention Router
 * Parses user input for @agent mentions and routes tasks to the appropriate specialized agent.
 */

import { AGENT_REGISTRY, AgentSpec, ALL_AGENTS, getAgentByMention } from './agent-registry';

export interface MentionRouteResult {
  targetAgent: AgentSpec;
  isExplicitMention: boolean;
  mentionedAgents: AgentSpec[];
  cleanedPrompt: string;
  rawPrompt: string;
}

/**
 * Regex matching `@agent` tokens (e.g. @coder, @designer, @video, @flow, @office, @orchestrator)
 */
const MENTION_REGEX = /@(orchestrator|coder|designer|video|flow|office|document)\b/gi;

/**
 * Parses user prompt text to resolve target agent and all mentioned agents.
 */
export function resolveMentionRoute(prompt: string): MentionRouteResult {
  const trimmed = prompt.trim();
  const matches = trimmed.match(MENTION_REGEX);

  if (!matches || matches.length === 0) {
    // Default to Project Orchestrator if no agent is explicitly mentioned
    return {
      targetAgent: AGENT_REGISTRY.orchestrator,
      isExplicitMention: false,
      mentionedAgents: [],
      cleanedPrompt: trimmed,
      rawPrompt: trimmed,
    };
  }

  // Collect all valid agent specs mentioned
  const mentionedAgents: AgentSpec[] = [];
  for (const match of matches) {
    const spec = getAgentByMention(match);
    if (spec && !mentionedAgents.some((a) => a.id === spec.id)) {
      mentionedAgents.push(spec);
    }
  }

  // The primary target is the first mentioned agent
  const targetAgent = mentionedAgents[0] ?? AGENT_REGISTRY.orchestrator;

  // Clean prompt by removing leading mention tag if present
  let cleaned = trimmed;
  if (trimmed.startsWith(targetAgent.mentionKey)) {
    cleaned = trimmed.slice(targetAgent.mentionKey.length).trim();
    if (cleaned.startsWith(':') || cleaned.startsWith(',')) {
      cleaned = cleaned.slice(1).trim();
    }
  }

  return {
    targetAgent,
    isExplicitMention: true,
    mentionedAgents,
    cleanedPrompt: cleaned || trimmed,
    rawPrompt: trimmed,
  };
}

/**
 * Provides autocomplete suggestions when user types `@` in the chat input.
 */
export function getMentionAutocomplete(query: string): AgentSpec[] {
  const normalized = query.toLowerCase().replace(/^@/, '').trim();
  if (!normalized) return ALL_AGENTS;

  return ALL_AGENTS.filter(
    (agent) =>
      agent.name.toLowerCase().includes(normalized) ||
      agent.role.toLowerCase().includes(normalized) ||
      agent.title.toLowerCase().includes(normalized)
  );
}
