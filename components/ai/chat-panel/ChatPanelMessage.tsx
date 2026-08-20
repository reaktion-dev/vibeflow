import type {
  SourceDocumentUIPart,
  SourceUrlUIPart,
  UIMessage,
} from 'ai';
import { isToolUIPart } from 'ai';
import { Bot, User } from 'lucide-react';

import { HarnessToolParts } from '@/components/ai-elements/harness-tool-parts';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';
import { cn } from '@/lib/utils';

type SourcePart = SourceUrlUIPart | SourceDocumentUIPart;

interface ChatPanelMessageProps {
  message: UIMessage;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
}

export function ChatPanelMessage({
  message,
  onApprove,
  onDeny,
}: ChatPanelMessageProps) {
  const from = message.role === 'user' ? 'user' : 'assistant';
  const isAssistant = from === 'assistant';

  const sourceParts = message.parts.filter(
    (part): part is SourcePart =>
      part.type === 'source-url' || part.type === 'source-document'
  );

  return (
    <Message from={from}>
      {/* Role label */}
      <div
        className={cn(
          'flex items-center gap-2 text-[11px] font-medium text-muted-foreground',
          isAssistant ? 'mb-1' : 'mb-1 justify-end'
        )}
      >
        {isAssistant ? (
          <>
            <span className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Bot className="size-3" />
            </span>
            Agent
          </>
        ) : (
          <>
            You
            <span className="flex size-5 items-center justify-center rounded-md bg-secondary text-muted-foreground">
              <User className="size-3" />
            </span>
          </>
        )}
      </div>

      {message.parts.map((part, index) => {
        if (part.type === 'step-start') {
          return index > 0 ? (
            <div
              className="my-2 border-t border-dashed border-border"
              key={`${message.id}-step-${index}`}
            />
          ) : null;
        }

        if (part.type === 'text') {
          return (
            <MessageContent key={`${message.id}-text-${index}`}>
              <MessageResponse>{part.text}</MessageResponse>
            </MessageContent>
          );
        }

        if (part.type === 'reasoning') {
          return (
            <MessageContent key={`${message.id}-reasoning-${index}`}>
              <Reasoning isStreaming={part.state === 'streaming'}>
                <ReasoningTrigger />
                <ReasoningContent>{part.text}</ReasoningContent>
              </Reasoning>
            </MessageContent>
          );
        }

        if (isToolUIPart(part)) {
          return (
            <HarnessToolParts
              key={`${message.id}-tool-${index}`}
              onApprove={onApprove}
              onDeny={onDeny}
              part={part}
            />
          );
        }

        return null;
      })}

      {sourceParts.length > 0 ? (
        <MessageContent>
          <Sources>
            <SourcesTrigger count={sourceParts.length} />
            <SourcesContent>
              {sourceParts.map((part, index) => (
                <Source
                  href={part.type === 'source-url' ? part.url : undefined}
                  key={`${message.id}-source-${index}`}
                  title={
                    part.type === 'source-url'
                      ? part.title ?? part.url
                      : part.title ?? part.filename ?? 'Referenced document'
                  }
                />
              ))}
            </SourcesContent>
          </Sources>
        </MessageContent>
      ) : null}
    </Message>
  );
}
