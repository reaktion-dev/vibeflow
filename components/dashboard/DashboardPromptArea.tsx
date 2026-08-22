'use client';

import { useState } from 'react';
import {
  Smile,
  Paperclip,
  Globe,
  Sparkles,
  CornerDownLeft,
  Check,
  Code2,
  Palette,
  Video,
  Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputGroupAddon } from '@/components/ui/input-group';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
} from '@/components/ai-elements/prompt-input';
import { cn } from '@/lib/utils';

export type WorkspaceType = 'code' | 'design' | 'video' | 'flow';

const MODALITY_CONFIG: Record<
  WorkspaceType,
  {
    label: string;
    icon: typeof Code2;
    color: string;
    placeholder: string;
    chips: { name: string; icon: string }[];
  }
> = {
  code: {
    label: 'Code',
    icon: Code2,
    color: 'text-blue-500',
    placeholder: 'Build an interactive dashboard, SaaS web app, or API backend with Next.js...',
    chips: [
      { name: 'Next.js', icon: '▲' },
      { name: 'Supabase', icon: '⚡' },
      { name: 'Tailwind', icon: '🌊' },
      { name: 'Stripe', icon: '💳' },
      { name: 'Neon DB', icon: '🔮' },
      { name: 'Auth', icon: '🔐' },
    ],
  },
  design: {
    label: 'Vector Design',
    icon: Palette,
    color: 'text-purple-500',
    placeholder: 'Craft a minimalist vector logo, app icon set, or stylized marketing illustration...',
    chips: [
      { name: 'SVG Logo', icon: '✨' },
      { name: 'Icon Pack', icon: '📦' },
      { name: 'Flat Vector', icon: '🎨' },
      { name: 'Brand Identity', icon: '🏷️' },
      { name: 'Dark Mode UI', icon: '🌙' },
    ],
  },
  video: {
    label: 'Video Studio',
    icon: Video,
    color: 'text-orange-500',
    placeholder: 'Compose a 30s product demo video with ElevenLabs voiceover and dynamic scenes...',
    chips: [
      { name: '16:9 Landscape', icon: '🖥️' },
      { name: '9:16 Reel/TikTok', icon: '📱' },
      { name: 'AI Voiceover', icon: '🎙️' },
      { name: 'Product Teaser', icon: '🎬' },
      { name: 'Captions', icon: '💬' },
    ],
  },
  flow: {
    label: 'Flow Pipeline',
    icon: Workflow,
    color: 'text-green-500',
    placeholder: 'Orchestrate a multi-agent research, scraping, and automated publishing workflow...',
    chips: [
      { name: 'Multi-Agent', icon: '🤖' },
      { name: 'Web Scraper', icon: '🌐' },
      { name: 'Data Pipeline', icon: '🔀' },
      { name: 'Auto Summarizer', icon: '📄' },
    ],
  },
};

interface DashboardPromptAreaProps {
  placeholder?: string;
  onSubmit?: (message: { text: string; files: any[]; type: WorkspaceType }) => void | Promise<void>;
  isCreating?: boolean;
  compact?: boolean;
}

export function DashboardPromptArea({
  placeholder,
  onSubmit,
  isCreating = false,
  compact = false,
}: DashboardPromptAreaProps) {
  const [activeType, setActiveType] = useState<WorkspaceType>('code');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [promptText, setPromptText] = useState('');

  const currentModality = MODALITY_CONFIG[activeType];
  const activePlaceholder = placeholder || currentModality.placeholder;

  const toggleChip = (name: string) => {
    setSelectedChips((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  const handleSubmit = async (message: { text: string; files: any[] }) => {
    let finalPrompt = message.text.trim();
    if (!finalPrompt) return;

    if (selectedChips.length > 0) {
      finalPrompt += ` (Focus: ${selectedChips.join(', ')})`;
    }

    onSubmit?.({ ...message, text: finalPrompt, type: activeType });
  };

  return (
    <div
      id="dashboard-prompt-area"
      className="flex w-full max-w-2xl flex-col items-center gap-3.5"
    >
      {/* Workspace Modality Selector Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/40 p-1 shadow-2xs">
        {(Object.keys(MODALITY_CONFIG) as WorkspaceType[]).map((typeKey) => {
          const mode = MODALITY_CONFIG[typeKey];
          const Icon = mode.icon;
          const isSelected = activeType === typeKey;

          return (
            <button
              key={typeKey}
              type="button"
              onClick={() => {
                setActiveType(typeKey);
                setSelectedChips([]);
              }}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                isSelected
                  ? cn('bg-background text-foreground shadow-xs', mode.color)
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Prompt input container */}
      <PromptInput
        onSubmit={handleSubmit}
        multiple
        accept="image/*"
        className="w-full rounded-xl border border-border/60 bg-card/70 shadow-lg backdrop-blur-sm"
      >
        <PromptInputTextarea
          id="dashboard-prompt-textarea"
          placeholder={activePlaceholder}
          disabled={isCreating}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          className={cn(
            'resize-none text-sm leading-relaxed placeholder:text-muted-foreground/50',
            compact ? 'min-h-16' : 'min-h-[110px]'
          )}
        />

        {/* Toolbar */}
        <InputGroupAddon
          align="block-end"
          className="border-t border-border/30 px-3 py-2"
        >
          <PromptInputFooter className="justify-between">
            {/* Left tools */}
            <PromptInputTools>
              <PromptInputButton tooltip="Emoji">
                <Smile className="h-4 w-4" />
              </PromptInputButton>
              <PromptInputButton tooltip="Attach reference assets">
                <Paperclip className="h-4 w-4" />
              </PromptInputButton>
              <button
                type="button"
                onClick={() =>
                  setVisibility((v) =>
                    v === 'public' ? 'private' : 'public'
                  )
                }
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{visibility === 'public' ? 'Public' : 'Private'}</span>
              </button>
              <PromptInputButton tooltip="Agent settings">
                <Sparkles className="h-4 w-4" />
              </PromptInputButton>
            </PromptInputTools>

            {/* Right tools */}
            <PromptInputTools>
              <PromptInputButton
                type="submit"
                variant="default"
                disabled={isCreating || !promptText.trim()}
                className="rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40"
              >
                {isCreating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                ) : (
                  <CornerDownLeft className="h-4 w-4" />
                )}
              </PromptInputButton>
            </PromptInputTools>
          </PromptInputFooter>
        </InputGroupAddon>
      </PromptInput>

      {/* Dynamic Contextual Chips */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {currentModality.chips.map((chip) => {
          const isSelected = selectedChips.includes(chip.name);
          return (
            <button
              key={chip.name}
              type="button"
              onClick={() => toggleChip(chip.name)}
              className={cn(
                'flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs transition-all',
                isSelected
                  ? 'border-primary bg-primary/15 text-primary font-medium shadow-2xs'
                  : 'border-border/40 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-muted/60 hover:text-foreground'
              )}
            >
              <span className="text-xs leading-none">{chip.icon}</span>
              <span>{chip.name}</span>
              {isSelected && <Check className="size-3 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default DashboardPromptArea;
