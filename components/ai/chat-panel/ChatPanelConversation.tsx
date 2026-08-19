import { MessageSquareText } from 'lucide-react';

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';

import { ChatPanelMessage } from './ChatPanelMessage';

interface ChatPanelConversationProps {
  messages: any[];
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
            description="Ask about the codebase, inspect files, or request a change. Sensitive tool calls will ask for approval."
            icon={<MessageSquareText className="size-5" />}
            title="Start a project conversation"
          />
        ) : (
          messages.map((message) => (
            <ChatPanelMessage
              key={message.id}
              message={message}
              onApprove={onApprove}
              onDeny={onDeny}
            />
          ))
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
