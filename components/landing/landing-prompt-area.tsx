"use client";

import { Paperclip, CornerDownLeft } from "lucide-react";
import { InputGroupAddon } from "@/components/ui/input-group";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";

interface LandingPromptAreaProps {
  placeholder?: string;
  onSubmit?: (message: { text: string; files: any[] }) => void | Promise<void>;
  isCreating?: boolean;
}

function LandingPromptToolbar({ isCreating }: { isCreating: boolean }) {
  const attachments = usePromptInputAttachments();

  return (
    <InputGroupAddon
      align="block-end"
      className="border-t border-border/30 px-3 py-2"
    >
      <PromptInputFooter className="justify-between">
        {/* Left tools */}
        <PromptInputTools>
          <PromptInputButton
            tooltip="Attach files"
            onClick={attachments.openFileDialog}
          >
            <Paperclip className="w-4 h-4" />
          </PromptInputButton>
        </PromptInputTools>

        {/* Right tools */}
        <PromptInputTools>
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
  );
}

export function LandingPromptArea({
  placeholder = "Build a shop app UI",
  onSubmit,
  isCreating = false,
}: LandingPromptAreaProps) {
  const handleSubmit = async (message: { text: string; files: any[] }) => {
    if (!message.text.trim()) return;
    onSubmit?.(message);
  };

  return (
    <div
      id="dashboard-prompt-area"
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
          id="dashboard-prompt-textarea"
          placeholder={placeholder}
          disabled={isCreating}
          className="min-h-[120px] resize-none text-sm leading-relaxed placeholder:text-muted-foreground/50"
        />

        {/* Toolbar */}
        <LandingPromptToolbar isCreating={isCreating} />
      </PromptInput>
    </div>
  );
}