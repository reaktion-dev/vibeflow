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
}

const DEFAULT_SUGGESTIONS = [
  'Summarize the project architecture.',
  'List the most important files for this feature.',
  'Inspect the current file and explain what it does.',
  'Propose a safe implementation plan before editing.',
];

export function ChatPanelComposer({
  availableModels,
  onStop,
  onSubmit,
  selectedModel,
  setSelectedModel,
  status = 'ready',
}: ChatPanelComposerProps) {
  const [input, setInput] = useState('');
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);

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

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-sm">
      <Suggestions className="px-3 pt-3">
        {DEFAULT_SUGGESTIONS.map((suggestion) => (
          <Suggestion
            key={suggestion}
            onClick={(value) => void onSubmit(value)}
            suggestion={suggestion}
            variant="outline"
          />
        ))}
      </Suggestions>

      <div className="p-3 pt-2">
        <PromptInput
          onSubmit={async ({ text }) => {
            const trimmed = text.trim();
            if (!trimmed) return;
            await onSubmit(trimmed);
            setInput('');
          }}
        >
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask the project agent to inspect, explain, or change something…"
              rows={3}
              value={input}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <ModelSelector
                onOpenChange={setModelSelectorOpen}
                open={modelSelectorOpen}
              >
                <ModelSelectorTrigger className="inline-flex h-8 max-w-48 items-center rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground">
                  <span className="truncate">
                    {selectedModelData?.name ?? 'Choose model'}
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
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
