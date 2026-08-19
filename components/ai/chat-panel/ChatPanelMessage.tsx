import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';

import { HarnessToolParts } from '@/components/ai-elements/harness-tool-parts';

interface ChatPanelMessageProps {
  message: any;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
}

export function ChatPanelMessage({
  message,
  onApprove,
  onDeny,
}: ChatPanelMessageProps) {
  const from = message.role === 'user' ? 'user' : 'assistant';

  return (
    <Message from={from}>
      {message.parts.map((part: any, index: number) => {
        if (part.type === 'step-start') {
          return index > 0 ? (
            <div className="my-2 border-t border-dashed border-border" key={`${message.id}-step-${index}`} />
          ) : null;
        }

        if (part.type === 'text') {
          return (
            <MessageContent key={`${message.id}-text-${index}`}>
              <MessageResponse>{part.text}</MessageResponse>
            </MessageContent>
          );
        }

        if (part.type === 'reasoning' && typeof part.text === 'string') {
          return (
            <MessageContent key={`${message.id}-reasoning-${index}`}>
              <div className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-muted-foreground text-xs">
                <p className="mb-1 font-medium">Reasoning</p>
                <MessageResponse>{part.text}</MessageResponse>
              </div>
            </MessageContent>
          );
        }

        if (part.type === 'source-url') {
          return (
            <MessageContent key={`${message.id}-source-${index}`}>
              <a
                className="text-primary text-xs underline underline-offset-4"
                href={part.url}
                rel="noreferrer"
                target="_blank"
              >
                {part.url}
              </a>
            </MessageContent>
          );
        }

        if (part.type === 'source-document') {
          return (
            <MessageContent key={`${message.id}-document-${index}`}>
              <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs">
                {part.title ?? part.filename ?? 'Referenced document'}
              </div>
            </MessageContent>
          );
        }

        if (part.type === 'dynamic-tool' || part.type.startsWith('tool-')) {
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
    </Message>
  );
}
