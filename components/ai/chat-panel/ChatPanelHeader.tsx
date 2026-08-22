'use client';

import { useEffect } from 'react';
import { Bot, ChevronsUpDown, Plus, Sparkles, Trash2, Code2, Palette, Video, Workflow } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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

const AGENT_CONFIG = {
  code: { label: '@coder', name: 'Coding Agent', icon: Code2, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  design: { label: '@designer', name: 'Design Agent', icon: Palette, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  video: { label: '@video', name: 'Video Agent', icon: Video, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  flow: { label: '@flow', name: 'Flow Agent', icon: Workflow, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
};

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
  const config = AGENT_CONFIG[projectType] ?? AGENT_CONFIG.code;
  const AgentIcon = config.icon;

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  const activeTitle =
    conversations.find((convo) => convo.id === conversationId)?.title ?? 'New Chat';

  return (
    <div className="flex h-10 items-center justify-between gap-2 border-b border-border/40 bg-card/90 px-3 backdrop-blur-sm shrink-0">
      {/* Left: Compact Agent Identity & Model Pill */}
      <div className="flex items-center gap-2 min-w-0">
        <div className={cn('flex size-6 items-center justify-center rounded-md border text-xs shrink-0', config.bg, config.border, config.color)}>
          <AgentIcon className="size-3.5" />
        </div>

        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-xs text-foreground shrink-0">{config.label}</span>
          <span className="text-border/60 text-[10px]">·</span>
          <span
            className="truncate text-[10px] text-muted-foreground/80 hover:text-foreground transition-colors cursor-default max-w-28 sm:max-w-36"
            title={`Model: ${modelName}`}
          >
            {modelName.split(' ')[0]}
          </span>
          {currentFile && (
            <span
              className="hidden xl:inline-block truncate text-[10px] text-muted-foreground/60 max-w-20 font-mono"
              title={`Active file: ${currentFile}`}
            >
              ({currentFile.split('/').pop()})
            </span>
          )}
        </div>
      </div>

      {/* Right: Compact Conversation Switcher & Action Icons */}
      <div className="flex items-center gap-1 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                className="h-6 gap-1 px-2 text-[11px] font-normal text-muted-foreground hover:text-foreground"
                size="sm"
                variant="ghost"
              />
            }
          >
            <span className="max-w-24 truncate">{activeTitle}</span>
            <ChevronsUpDown className="size-3 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs">Thread History</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {conversations.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
                  No previous conversations
                </div>
              ) : (
                conversations.map((convo) => (
                  <DropdownMenuItem
                    key={convo.id}
                    onClick={() => void onSelectConversation(convo.id)}
                    className={cn(
                      'text-xs cursor-pointer',
                      convo.id === conversationId && 'bg-accent font-medium text-accent-foreground'
                    )}
                  >
                    <span className="truncate">{convo.title || 'Untitled Chat'}</span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void onNewConversation()} className="text-xs cursor-pointer gap-1.5">
              <Plus className="size-3.5" />
              <span>New Conversation</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Thread Icon */}
        <Button
          className="size-6 text-muted-foreground/60 hover:text-destructive transition-colors"
          onClick={() => void onClear()}
          size="icon-xs"
          type="button"
          variant="ghost"
          title="Clear messages"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default ChatPanelHeader;