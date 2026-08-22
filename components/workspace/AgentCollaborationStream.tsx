'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  CornerDownLeft,
  Bot,
  Paperclip,
  Check,
  ExternalLink,
  ChevronRight,
  Code2,
  Palette,
  Video,
  Workflow,
  Images,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ALL_AGENTS,
  AGENT_REGISTRY,
  AgentSpec,
  getAgentByMention,
  resolveMentionRoute,
  getMentionAutocomplete,
} from '@/lib/ai/orchestration';
import toast from 'react-hot-toast';

export interface ChatStreamMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  agentRole?: 'orchestrator' | 'coder' | 'designer' | 'video' | 'flow';
  content: string;
  timestamp: string;
  actionCard?: {
    type: 'approval' | 'handoff' | 'artifact';
    title: string;
    description: string;
    actionLabel: string;
    onAction?: () => void;
    artifactUrl?: string;
  };
}

interface AgentCollaborationStreamProps {
  projectId: string;
  projectName: string;
  onNavigateToTab?: (tab: string) => void;
}

export function AgentCollaborationStream({
  projectId,
  projectName,
  onNavigateToTab,
}: AgentCollaborationStreamProps) {
  const [messages, setMessages] = useState<ChatStreamMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      agentRole: 'orchestrator',
      content: `Welcome to **${projectName}**! I'm your Project Lead (@orchestrator).

Our specialized agent team is ready:
- ⚡ **@coder**: Full-stack Next.js app development in Daytona sandboxes
- 🎨 **@designer**: Vector-first SVG design and auto-tracing
- 🎬 **@video**: Remotion video composition and ElevenLabs voiceovers
- 🔀 **@flow**: Autonomous multi-agent pipelines

How would you like to begin? Type your vision or tag an agent with **@**!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Monitor for `@` mention triggers
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputPrompt(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtMatch = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/);

    if (lastAtMatch) {
      setShowAutocomplete(true);
      setAutocompleteQuery(lastAtMatch[1] ?? '');
      setAutocompleteIndex(0);
    } else {
      setShowAutocomplete(false);
    }
  };

  const filteredAgents = getMentionAutocomplete(autocompleteQuery);

  const handleSelectAgent = (agent: AgentSpec) => {
    const cursorPos = textareaRef.current?.selectionStart ?? inputPrompt.length;
    const textBeforeCursor = inputPrompt.slice(0, cursorPos);
    const textAfterCursor = inputPrompt.slice(cursorPos);
    const newTextBefore = textBeforeCursor.replace(/@([a-zA-Z0-9_-]*)$/, `${agent.mentionKey} `);

    setInputPrompt(newTextBefore + textAfterCursor);
    setShowAutocomplete(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showAutocomplete && filteredAgents.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAutocompleteIndex((prev) => (prev + 1) % filteredAgents.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAutocompleteIndex((prev) => (prev - 1 + filteredAgents.length) % filteredAgents.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = filteredAgents[autocompleteIndex];
        if (selected) handleSelectAgent(selected);
        return;
      }
      if (e.key === 'Escape') {
        setShowAutocomplete(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const trimmed = inputPrompt.trim();
    if (!trimmed || isSending) return;

    const route = resolveMentionRoute(trimmed);
    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatStreamMessage = {
      id: userMsgId,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsSending(true);

    // Simulate specialized agent response & action card
    setTimeout(() => {
      const target = route.targetAgent;
      let replyContent = '';
      let actionCard: ChatStreamMessage['actionCard'] = undefined;

      if (target.role === 'designer') {
        replyContent = `🎨 **@designer**: I'm generating your vector asset concepts based on your prompt: *"${route.cleanedPrompt}"*.

I'll trace the result using \`@visioncortex/vtracer\` into clean SVG paths and store them in the **Artifact Vault**.`;
        actionCard = {
          type: 'artifact',
          title: 'Traced Vector SVG Ready',
          description: 'traced-vector-logo.svg generated and stored in Vault.',
          actionLabel: 'Open in Design Canvas',
          onAction: () => onNavigateToTab?.('design'),
        };
      } else if (target.role === 'coder') {
        replyContent = `⚡ **@coder**: I'm initializing the Daytona sandbox to implement: *"${route.cleanedPrompt}"*.

Scaffolding Next.js App Router components and verifying via the live browser preview.`;
        actionCard = {
          type: 'approval',
          title: 'Daytona Sandbox Initialized',
          description: 'Next.js dev server running on port 3000.',
          actionLabel: 'View in Code Workspace',
          onAction: () => onNavigateToTab?.('code'),
        };
      } else if (target.role === 'video') {
        replyContent = `🎬 **@video**: Writing the 15s script and sequencing scenes in Remotion for *"${route.cleanedPrompt}"*.`;
        actionCard = {
          type: 'approval',
          title: 'Voiceover Synthesized',
          description: 'ElevenLabs voice track rendered (14.8s). Ready to assemble MP4.',
          actionLabel: 'Open Video Studio',
          onAction: () => onNavigateToTab?.('video'),
        };
      } else {
        replyContent = `👑 **@orchestrator**: I've analyzed your request: *"${route.cleanedPrompt}"*.

**Proposed Plan**:
1. **@designer**: Generate and auto-trace the branding vector assets.
2. **@coder**: Build the frontend components and integrate the vector SVG.
3. **@video**: Sequence a product demo video for launch.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          role: 'assistant',
          agentRole: target.role,
          content: replyContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionCard,
        },
      ]);
      setIsSending(false);
    }, 900);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* Header with Active Agent Chips */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/50 bg-background/80 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Multi-Agent Collaboration Stream</span>
        </div>

        {/* Agent Avatars */}
        <div className="flex items-center gap-1">
          {ALL_AGENTS.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => {
                setInputPrompt(`${agent.mentionKey} `);
                textareaRef.current?.focus();
              }}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border transition-colors',
                agent.badgeBg,
                agent.badgeBorder,
                agent.badgeText,
                'hover:opacity-80'
              )}
              title={agent.description}
            >
              <span>{agent.avatarIcon}</span>
              <span className="hidden sm:inline">{agent.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const agentSpec = msg.agentRole ? AGENT_REGISTRY[msg.agentRole] : null;

          return (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3 max-w-3xl',
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              )}
            >
              {/* Avatar Icon */}
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs shadow-2xs',
                  isUser
                    ? 'bg-primary text-primary-foreground border-primary'
                    : agentSpec
                    ? cn(agentSpec.badgeBg, agentSpec.badgeBorder, agentSpec.badgeText)
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {isUser ? '👤' : agentSpec?.avatarIcon ?? '🤖'}
              </div>

              {/* Message Content Bubble */}
              <div className="flex flex-col min-w-0 max-w-xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-foreground">
                    {isUser ? 'You' : agentSpec ? `${agentSpec.name} (${agentSpec.title})` : 'AI'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                </div>

                <div
                  className={cn(
                    'rounded-xl px-3.5 py-2.5 text-xs leading-relaxed border',
                    isUser
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-card-foreground border-border/60 shadow-xs'
                  )}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Interactive Action Card */}
                  {msg.actionCard && (
                    <div className="mt-3 rounded-lg border border-border/70 bg-muted/40 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-semibold text-foreground">{msg.actionCard.title}</h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{msg.actionCard.description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs gap-1 shrink-0"
                          onClick={msg.actionCard.onAction}
                        >
                          <span>{msg.actionCard.actionLabel}</span>
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Autocomplete Popup */}
      {showAutocomplete && (
        <div className="mx-4 mb-1 overflow-hidden rounded-lg border border-border/70 bg-card p-1 shadow-lg backdrop-blur-md">
          <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/40">
            Mention an Agent
          </div>
          {filteredAgents.map((agent, index) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => handleSelectAgent(agent)}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors',
                index === autocompleteIndex
                  ? 'bg-primary/10 text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">{agent.avatarIcon}</span>
                <span className="font-semibold text-foreground">{agent.mentionKey}</span>
                <span className="text-[11px] text-muted-foreground truncate">{agent.title}</span>
              </div>
              <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase">
                {agent.role}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Box */}
      <div className="border-t border-border/50 bg-background/95 p-3">
        <div className="relative rounded-xl border border-border/60 bg-card/70 p-1.5 shadow-md focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/40">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputPrompt}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message or type @ to mention an agent (@coder, @designer, @video, @flow)..."
            className="w-full resize-none bg-transparent px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />

          <div className="flex items-center justify-between border-t border-border/30 pt-1.5 px-2">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-xs" title="Attach asset reference" className="h-6 w-6">
                <Paperclip className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[10px] text-muted-foreground/60">Tip: Type @ to mention agents</span>
            </div>

            <Button
              size="sm"
              onClick={handleSend}
              disabled={!inputPrompt.trim() || isSending}
              className="h-7 gap-1 px-2.5 text-xs"
            >
              <span>Send</span>
              <CornerDownLeft className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentCollaborationStream;
