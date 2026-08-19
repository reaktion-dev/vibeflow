"use client";

import { useState } from "react";
import {
  Smile,
  Paperclip,
  Globe,
  Sparkles,
  CornerDownLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroupAddon } from "@/components/ui/input-group";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
} from "@/components/ai-elements/prompt-input";
import { cn } from "@/lib/utils";

interface LandingPromptAreaProps {
  placeholder?: string;
  onSubmit?: (message: { text: string; files: any[] }) => void | Promise<void>;
  isCreating?: boolean;
}

interface IntegrationIcon {
  name: string;
  icon: string;
}

const integrations: IntegrationIcon[] = [
  { name: "React", icon: "⚛️" },
  { name: "Supabase", icon: "⚡" },
  { name: "Vercel", icon: "▲" },
  { name: "Stripe", icon: "S" },
  { name: "GitHub", icon: "🐙" },
  { name: "Tailwind", icon: "🌊" },
  { name: "Firebase", icon: "🔥" },
  { name: "MongoDB", icon: "🍃" },
  { name: "Neon", icon: "🔮" },
  { name: "Auth0", icon: "A" },
];

function IntegrationChip({ integration }: { integration: IntegrationIcon }) {
  return (
    <button
      className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:bg-muted/60 hover:text-foreground"
      title={integration.name}
    >
      <span className="text-sm">{integration.icon}</span>
      <span>{integration.name}</span>
    </button>
  );
}

export function LandingPromptArea({
  placeholder = "Build a shop app UI",
  onSubmit,
  isCreating = false,
}: LandingPromptAreaProps) {
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  const handleSubmit = async (message: { text: string; files: any[] }) => {
    if (!message.text.trim()) return;
    onSubmit?.(message);
  };

  return (
    <div
      id="landing-prompt-area"
      className="flex w-full max-w-2xl flex-col items-center gap-4"
    >
      {/* Prompt Input — PromptInput wraps children in its own InputGroup */}
      <PromptInput
        onSubmit={handleSubmit}
        multiple
        accept="image/*"
        className="rounded-xl border border-border/60 bg-card/60 shadow-lg backdrop-blur-sm"
      >
        {/* Textarea */}
        <PromptInputTextarea
          id="landing-prompt-textarea"
          placeholder={placeholder}
          disabled={isCreating}
          className="min-h-[120px] resize-none text-sm leading-relaxed placeholder:text-muted-foreground/50"
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
                <Smile className="w-4 h-4" />
              </PromptInputButton>
              <PromptInputButton tooltip="Attach files">
                <Paperclip className="w-4 h-4" />
              </PromptInputButton>
              <button
                onClick={() =>
                  setVisibility((v) =>
                    v === "public" ? "private" : "public"
                  )
                }
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{visibility === "public" ? "Public" : "Private"}</span>
              </button>
              <PromptInputButton tooltip="AI Features">
                <Sparkles className="w-4 h-4" />
              </PromptInputButton>
            </PromptInputTools>

            {/* Right tools */}
            <PromptInputTools>
              <PromptInputButton tooltip="Generate">
                <Sparkles className="w-4 h-4" />
              </PromptInputButton>
              <PromptInputButton
                type="submit"
                variant="default"
                disabled={isCreating}
                className="rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40"
              >
                {isCreating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                ) : (
                  <CornerDownLeft className="w-4 h-4" />
                )}
              </PromptInputButton>
            </PromptInputTools>
          </PromptInputFooter>
        </InputGroupAddon>
      </PromptInput>

      {/* Integration icons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-full border-border/60 text-xs text-muted-foreground hover:text-foreground"
        >
          <span>Add Integration</span>
        </Button>
        <div className="h-4 w-px bg-border/40" />
        <div className="flex items-center gap-1">
          {integrations.map((integration) => (
            <IntegrationChip key={integration.name} integration={integration} />
          ))}
        </div>
      </div>
    </div>
  );
}
