'use client';

import { useMemo, useState } from 'react';

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
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

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
  projectType?: 'code' | 'design' | 'video' | 'flow';
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

  const suggestions = projectType === 'design'
    ? DESIGN_SUGGESTIONS
    : projectType === 'video'
    ? VIDEO_SUGGESTIONS
    : projectType === 'flow'
    ? FLOW_SUGGESTIONS
    : CODE_SUGGESTIONS;

  const placeholder = projectType === 'design'
    ? 'Ask the design agent to generate or trace vector SVGs…'
    : projectType !== 'code'
    ? `Ask the ${projectType} agent…`
    : 'Ask the coding agent to inspect, build, or debug…';

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

  const handleSubmit = async ({ text }: { text: string }) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setHasSentMessage(true);
    await onSubmit(trimmed);
    setInput('');
  };

  return (
    <div className="border-t border-border/40 bg-card/95 backdrop-blur-sm shrink-0">
      {/* Onboarding suggestions — compact and hidden once user interacts */}
      {!hasSentMessage && (
        <div className="px-2.5 pt-2 pb-1 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <Sparkles className="size-2.5 text-primary" />
              Ideas:
            </span>
            {suggestions.slice(0, 2).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setHasSentMessage(true);
                  void onSubmit(suggestion);
                }}
                className="text-[11px] px-2 py-0.5 rounded-md border border-border/50 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors truncate max-w-56"
                title={suggestion}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Composer Box */}
      <div className="p-2.5">
        <PromptInput onSubmit={handleSubmit} className="rounded-xl border border-border/60 bg-background/80 shadow-xs">
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(event) => setInput(event.target.value)}
              placeholder={placeholder}
              rows={2}
              value={input}
              className="min-h-12 text-xs leading-relaxed resize-none"
            />
          </PromptInputBody>

          <PromptInputFooter className="px-2 py-1.5 justify-between">
            <PromptInputTools>
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
