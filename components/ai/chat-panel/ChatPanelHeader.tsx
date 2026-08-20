import { Bot, Sparkles, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ChatPanelHeaderProps {
  currentFile?: string;
  modelName: string;
  onClear: () => void;
  projectType?: 'code' | 'design' | 'video' | 'flow';
}

export function ChatPanelHeader({
  currentFile,
  modelName,
  onClear,
  projectType = 'code',
}: ChatPanelHeaderProps) {
  const agentLabel = projectType === 'design'
    ? 'Design Agent'
    : projectType === 'video'
    ? 'Video Agent'
    : projectType === 'flow'
    ? 'Flow Agent'
    : 'Project Agent';

  const agentDesc = projectType !== 'code'
    ? 'Agent-driven workspace with tool approvals'
    : 'Agent-native workspace chat with tool approvals';

  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 px-4 py-3">
      <div className="min-w-0 space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bot className="size-4" />
          </div>
          <div>
            <h3 className="font-medium text-sm text-foreground">{agentLabel}</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {agentDesc}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className="gap-1 text-[10px]" variant="secondary">
            <Sparkles className="size-2.5" />
            {modelName}
          </Badge>
          {currentFile ? (
            <Badge variant="outline" className="text-[10px]">Focus: {currentFile}</Badge>
          ) : null}
        </div>
      </div>

      <Button
        className="shrink-0 h-7 w-7 text-muted-foreground/60 hover:text-foreground"
        onClick={onClear}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <Trash2 className="size-3.5" />
        <span className="sr-only">Clear conversation</span>
      </Button>
    </div>
  );
}
