'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorName,
  ModelSelectorTrigger,
} from '@/components/ai-elements/model-selector';
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, AtSign, X, Check, CornerDownLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ALL_AGENTS,
  AgentSpec,
  getMentionAutocomplete,
  resolveMentionRoute,
} from '@/lib/ai/orchestration';

interface ChatModelOption {
  id: string;
  name: string;
  provider: string;
  free?: boolean;
}

interface ChatPanelComposerProps {
  availableModels: ChatModelOption[];
  onStop: () => void;
  onSubmit: (text: string) => Promise<void>;
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
  status?: 'submitted' | 'streaming' | 'ready' | 'error';
  projectType?: 'code' | 'design' | 'video' | 'flow' | 'office';
}

const CODE_SUGGESTIONS = [
  'Build a responsive dashboard with dark mode',
  'Create an HTML5 runner game with audio',
  'Add user profile settings with avatar upload',
];

const DESIGN_SUGGESTIONS = [
  'Design a modern geometric vector monogram',
  'Create an icon set with 45-degree chamfer cuts',
  'Generate a dark-mode hero illustration',
];

const OFFICE_SUGGESTIONS = [
  'Create a demo utility bill for Thando Zondo (Soweto, 1804)',
  'Draft an enterprise cloud migration RFP with SOW & BOM',
  'Build a 3-year SaaS financial model workbook with formulas',
];

const VIDEO_SUGGESTIONS = [
  'Write a 15-second product demo video script',
  'Generate audio voiceover and preview scene timing',
];

const FLOW_SUGGESTIONS = [
  'Build an automated data extraction pipeline',
  'Orchestrate a multi-agent research workflow',
];

export function ChatPanelComposer({
  availableModels,
  onStop,
  onSubmit,
  selectedModel,
  setSelectedModel,
  status = 'ready',
  projectType = 'code',
}: ChatPanelComposerProps) {
  const [input, setInput] = useState('');
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [hasSentMessage, setHasSentMessage] = useState(false);

  // Mention Autocomplete States
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const mentionMenuRef = useRef<HTMLDivElement>(null);

  // Filter available agents for autocomplete
  const filteredAgents = useMemo(() => {
    return getMentionAutocomplete(mentionQuery);
  }, [mentionQuery]);

  // Determine active agent currently mentioned in the prompt
  const activeMention = useMemo(() => {
    const route = resolveMentionRoute(input);
    return route.isExplicitMention ? route.targetAgent : null;
  }, [input]);

  const suggestions =
    projectType === 'office'
      ? OFFICE_SUGGESTIONS
      : projectType === 'design'
      ? DESIGN_SUGGESTIONS
      : projectType === 'video'
      ? VIDEO_SUGGESTIONS
      : projectType === 'flow'
      ? FLOW_SUGGESTIONS
      : CODE_SUGGESTIONS;

  const placeholder =
    projectType === 'office'
      ? 'Ask @office to author utility bills, RFPs, resumes, or Excel models…'
      : projectType === 'design'
      ? 'Ask @designer to generate or trace vector SVGs…'
      : projectType !== 'code'
      ? `Ask the ${projectType} agent…`
      : 'Ask @coder to inspect, build, or debug…';

  const groupedModels = useMemo(() => {
    return availableModels.reduce<Record<string, ChatModelOption[]>>((acc, model) => {
      acc[model.provider] ??= [];
      acc[model.provider].push(model);
      return acc;
    }, {});
  }, [availableModels]);

  const selectedModelData = useMemo(
    () => availableModels.find((model) => model.id === selectedModel),
    [availableModels, selectedModel]
  );

  const isSubmitting = status === 'submitted' || status === 'streaming';

  // Handle typing & inspect for `@` trigger
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    const cursorPos = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtMatch = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/);

    if (lastAtMatch) {
      setShowMentionMenu(true);
      setMentionQuery(lastAtMatch[1] ?? '');
      setMentionIndex(0);
    } else {
      setShowMentionMenu(false);
    }
  };

  // Insert mention into input text
  const handleSelectAgent = (agent: AgentSpec) => {
    const textarea = containerRef.current?.querySelector('textarea');
    const cursorPos = textarea?.selectionStart ?? input.length;
    const textBeforeCursor = input.slice(0, cursorPos);
    const textAfterCursor = input.slice(cursorPos);

    let newTextBefore: string;
    if (textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/)) {
      newTextBefore = textBeforeCursor.replace(/@([a-zA-Z0-9_-]*)$/, `${agent.mentionKey} `);
    } else if (textBeforeCursor.trim() === '') {
      newTextBefore = `${agent.mentionKey} `;
    } else {
      newTextBefore = `${textBeforeCursor.trimEnd()} ${agent.mentionKey} `;
    }

    const nextValue = newTextBefore + textAfterCursor;
    setInput(nextValue);
    setShowMentionMenu(false);

    // Re-focus and update cursor position
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newCursor = newTextBefore.length;
        textarea.setSelectionRange(newCursor, newCursor);
      }
    }, 10);
  };

  // Strip active mention from prompt
  const handleRemoveActiveMention = () => {
    if (!activeMention) return;
    const cleaned = input.replace(new RegExp(`^${activeMention.mentionKey}\\s*`, 'i'), '').trimStart();
    setInput(cleaned);
    containerRef.current?.querySelector('textarea')?.focus();
  };

  // Keyboard navigation inside prompt input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionMenu && filteredAgents.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredAgents.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredAgents.length) % filteredAgents.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = filteredAgents[mentionIndex];
        if (selected) {
          handleSelectAgent(selected);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionMenu(false);
        return;
      }
    }
  };

  const handleSubmit = async ({ text }: { text: string }) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setHasSentMessage(true);
    setShowMentionMenu(false);
    await onSubmit(trimmed);
    setInput('');
  };

  // Close mention menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mentionMenuRef.current &&
        !mentionMenuRef.current.contains(event.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowMentionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative border-t border-border/40 bg-card/95 backdrop-blur-sm shrink-0">
      {/* ── 1. Floating Mention Autocomplete Popover ── */}
      {showMentionMenu && (
        <div
          ref={mentionMenuRef}
          className="absolute bottom-[calc(100%+8px)] left-2.5 right-2.5 z-50 rounded-xl border border-border/80 bg-popover/95 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between px-2 py-1 text-[10px] text-muted-foreground font-medium border-b border-border/40 pb-1 mb-1">
            <span className="flex items-center gap-1 font-semibold text-foreground/90">
              <AtSign className="size-3 text-primary" />
              Tag an Autonomous Agent
            </span>
            <span className="text-[9px] font-mono text-muted-foreground/80">
              ↑↓ navigate • ↵ select • esc dismiss
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-0.5 overscroll-contain">
            {filteredAgents.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                No matching agent found for &quot;{mentionQuery}&quot;
              </div>
            ) : (
              filteredAgents.map((agent, idx) => {
                const isSelected = idx === mentionIndex;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => handleSelectAgent(agent)}
                    onMouseEnter={() => setMentionIndex(idx)}
                    className={cn(
                      'w-full flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors',
                      isSelected
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0 leading-none">{agent.avatarIcon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground font-mono">{agent.mentionKey}</span>
                          <span className="text-[11px] font-medium text-foreground/80 truncate">
                            {agent.title}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate max-w-sm">
                          {agent.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[9px] px-1.5 py-0 rounded border font-mono',
                          agent.badgeBg,
                          agent.badgeBorder,
                          agent.badgeText
                        )}
                      >
                        {agent.role}
                      </Badge>
                      {isSelected && <ChevronRight className="size-3 text-primary animate-pulse" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── 2. Onboarding Suggestions & Quick Ideas ── */}
      {!hasSentMessage && (
        <div className="px-2.5 pt-2 pb-1 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <Sparkles className="size-2.5 text-primary" />
              Ideas:
            </span>
            {suggestions.slice(0, 3).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setHasSentMessage(true);
                  void onSubmit(suggestion);
                }}
                className="text-[11px] px-2 py-0.5 rounded-md border border-border/50 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors truncate max-w-64"
                title={suggestion}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. Main Composer Box ── */}
      <div className="p-2.5">
        <PromptInput onSubmit={handleSubmit} className="rounded-xl border border-border/60 bg-background/80 shadow-xs">
          <PromptInputBody>
            <PromptInputTextarea
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={2}
              value={input}
              className="min-h-12 text-xs leading-relaxed resize-none"
            />
          </PromptInputBody>

          <PromptInputFooter className="px-2 py-1.5 justify-between">
            <PromptInputTools>
              {/* @ Mention Quick Trigger Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowMentionMenu((prev) => !prev);
                  setMentionQuery('');
                  setMentionIndex(0);
                  containerRef.current?.querySelector('textarea')?.focus();
                }}
                className={cn(
                  'h-6.5 px-2 text-[11px] rounded-md gap-1 font-mono transition-colors',
                  showMentionMenu || activeMention
                    ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
                    : 'border-input/60 bg-muted/40 text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
                title="Tag an autonomous specialist agent (@office, @designer, @coder, @video, @flow)"
              >
                <AtSign className="size-3" />
                <span>Agent</span>
              </Button>

              {/* Active Mention Pill (if prompt begins with @agent) */}
              {activeMention && (
                <div className="flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-md border border-primary/30 bg-primary/10 text-[10px] font-mono text-primary animate-in fade-in duration-150">
                  <span className="text-xs">{activeMention.avatarIcon}</span>
                  <span className="font-semibold">{activeMention.mentionKey}</span>
                  <button
                    type="button"
                    onClick={handleRemoveActiveMention}
                    className="p-0.5 rounded hover:bg-primary/20 text-primary/70 hover:text-primary transition-colors"
                    title="Remove agent tag"
                  >
                    <X className="size-2.5" />
                  </button>
                </div>
              )}

              {/* Model Selector */}
              <ModelSelector
                onOpenChange={setModelSelectorOpen}
                open={modelSelectorOpen}
              >
                <ModelSelectorTrigger className="inline-flex h-6.5 max-w-40 items-center gap-1 rounded-md border border-input/60 bg-muted/40 px-2 text-[11px] text-muted-foreground shadow-2xs transition-colors hover:bg-accent hover:text-accent-foreground">
                  <span className="truncate">
                    {selectedModelData?.name.split(' ')[0] ?? 'Model'}
                  </span>
                </ModelSelectorTrigger>
                <ModelSelectorContent>
                  <ModelSelectorInput placeholder="Search models…" />
                  <ModelSelectorList>
                    <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                    {Object.entries(groupedModels).map(([provider, models]) => (
                      <ModelSelectorGroup heading={provider} key={provider}>
                        {models.map((model) => (
                          <ModelSelectorItem
                            key={model.id}
                            onSelect={() => {
                              setSelectedModel(model.id);
                              setModelSelectorOpen(false);
                            }}
                            value={model.id}
                          >
                            <ModelSelectorName>{model.name}</ModelSelectorName>
                            {model.free ? <Badge variant="secondary">Free</Badge> : null}
                          </ModelSelectorItem>
                        ))}
                      </ModelSelectorGroup>
                    ))}
                  </ModelSelectorList>
                </ModelSelectorContent>
              </ModelSelector>
            </PromptInputTools>

            <PromptInputSubmit
              disabled={!input.trim() && !isSubmitting}
              onStop={onStop}
              status={status}
              className="h-6.5 px-2.5 text-xs rounded-lg"
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

export default ChatPanelComposer;

