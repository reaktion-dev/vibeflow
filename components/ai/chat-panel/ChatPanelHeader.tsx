import { Bot, Sparkles, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ChatPanelHeaderProps {
  currentFile?: string;
  modelName: string;
  onClear: () => void;
}

export function ChatPanelHeader({
  currentFile,
  modelName,
  onClear,
}: ChatPanelHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
      <div className="min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bot className="size-4" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Project Agent</h3>
            <p className="text-muted-foreground text-xs">
              Agent-native workspace chat with tool approvals
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className="gap-1" variant="secondary">
            <Sparkles className="size-3" />
            {modelName}
          </Badge>
          {currentFile ? (
            <Badge variant="outline">Focus: {currentFile}</Badge>
          ) : null}
        </div>
      </div>

      <Button
        className="shrink-0"
        onClick={onClear}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Clear conversation</span>
      </Button>
    </div>
  );
}
