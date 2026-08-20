'use client';

import { useEffect } from 'react';
import { Bot, ChevronsUpDown, Plus, Sparkles, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ConversationSummary } from '@/hooks/useProjectAgentChat';
import { cn } from '@/lib/utils';

interface ChatPanelHeaderProps {
  currentFile?: string;
  modelName: string;
  onClear: () => void | Promise<void>;
  projectType?: 'code' | 'design' | 'video' | 'flow';
  conversations: ConversationSummary[];
  conversationId?: string;
  onSelectConversation: (id: string) => void | Promise<void>;
  onNewConversation: () => void | Promise<void>;
  refreshConversations: () => void | Promise<void>;
}

export function ChatPanelHeader({
  currentFile,
  modelName,
  onClear,
  projectType = 'code',
  conversations,
  conversationId,
  onSelectConversation,
  onNewConversation,
  refreshConversations,
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

  // Refresh the conversation list on mount so the switcher is up to date.
  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  const activeTitle =
    conversations.find((convo) => convo.id === conversationId)?.title ?? 'Chat';

  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 bg-background/80 backdrop-blur-sm px-4 py-3">
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

      <div className="flex shrink-0 items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground/80 hover:text-foreground"
                size="sm"
                variant="ghost"
              />
            }
          >
            <span className="max-w-36 truncate">{activeTitle}</span>
            <ChevronsUpDown className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>Conversations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {conversations.length === 0 ? (
              <div className="px-1.5 py-1 text-xs text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              conversations.map((convo) => (
                <DropdownMenuItem
                  key={convo.id}
                  onClick={() => void onSelectConversation(convo.id)}
                  className={cn(
                    'max-w-full',
                    convo.id === conversationId && 'bg-accent text-accent-foreground'
                  )}
                >
                  <span className="truncate">{convo.title || 'Untitled'}</span>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void onNewConversation()}>
              <Plus className="size-4" />
              New conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          className="shrink-0 h-7 w-7 text-muted-foreground/60 hover:text-foreground"
          onClick={() => void onClear()}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Trash2 className="size-3.5" />
          <span className="sr-only">Clear conversation</span>
        </Button>
      </div>
    </div>
  );
}