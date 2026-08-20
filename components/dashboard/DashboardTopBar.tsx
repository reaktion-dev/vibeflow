'use client';

import { useEffect } from 'react';
import { Search, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { focusDashboardPrompt } from './prompt-focus';

interface DashboardTopBarProps {
  userName?: string;
  projectName?: string;
  plan?: 'free' | 'pro' | 'team';
}

export function DashboardTopBar({
  userName = 'User',
  projectName = 'Vibeflow',
  plan = 'free',
}: DashboardTopBarProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        focusDashboardPrompt();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/40 bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      {/* Left — who and where */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted">
          <User className="h-3 w-3" />
        </div>

        <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate font-medium text-foreground">
            {userName}
          </span>
          {plan && (
            <Badge
              variant="secondary"
              className="h-4 shrink-0 px-1.5 text-[10px] font-medium uppercase"
            >
              {plan}
            </Badge>
          )}
          <span className="hidden text-border sm:inline">/</span>
          <span className="hidden truncate font-medium text-foreground sm:inline">
            {projectName}
          </span>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={focusDashboardPrompt}
          className="hidden items-center gap-2 rounded-lg border border-border/40 bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-muted/50 hover:text-foreground md:flex"
          title="Focus the prompt composer"
        >
          <Search className="h-3 w-3" />
          <span>Describe a project...</span>
          <kbd className="rounded border border-border/60 bg-muted px-1 py-0.5 text-[10px] font-mono text-muted-foreground">
            CtrlK
          </kbd>
        </button>

        <Button
          variant="ghost"
          size="sm"
          className="hidden gap-1.5 text-muted-foreground hover:text-foreground sm:flex"
          onClick={focusDashboardPrompt}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI Assist
        </Button>
      </div>
    </header>
  );
}
