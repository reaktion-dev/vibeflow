import type { UIMessage } from 'ai';
import { Bot } from 'lucide-react';

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';

import { ChatPanelMessage } from './ChatPanelMessage';

interface ChatPanelConversationProps {
  messages: UIMessage[];
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
}

export function ChatPanelConversation({
  messages,
  onApprove,
  onDeny,
}: ChatPanelConversationProps) {
  return (
    <Conversation>
      <ConversationContent>
        {messages.length === 0 ? (
          <ConversationEmptyState
            icon={
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                <Bot className="size-6 text-primary" />
              </div>
            }
          >
            <h3 className="font-semibold text-foreground text-sm">
              Start a conversation
            </h3>
            <p className="max-w-[280px] text-balance text-muted-foreground text-xs leading-relaxed">
              Ask the agent to search, compose, or generate content. Sensitive
              tool calls will ask for your approval.
            </p>
          </ConversationEmptyState>
        ) : (
          messages.map((message, index) => {
            const prevRole = index > 0 ? messages[index - 1].role : null;
            const showSeparator = prevRole != null && prevRole !== message.role;

            return (
              <div key={message.id}>
                {showSeparator && (
                  <div className="my-4 flex items-center gap-3" aria-hidden>
                    <div className="h-px flex-1 bg-border/60" />
                    <div className="size-1 rounded-full bg-border" />
                    <div className="h-px flex-1 bg-border/60" />
                  </div>
                )}
                <ChatPanelMessage
                  message={message}
                  onApprove={onApprove}
                  onDeny={onDeny}
                />
              </div>
            );
          })
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
