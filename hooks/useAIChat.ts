'use client';

import { useCallback, useRef, useState } from 'react';
import { ChatMessage } from '@/lib/types';

interface UseChatOptions {
  projectId: string;
  onNewMessage?: (message: ChatMessage) => void;
}

export function useAIChat({ projectId, onNewMessage }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);

  // Keep ref in sync with state
  messagesRef.current = messages;

  /**
   * Send a chat message and stream response
   */
  const sendMessage = useCallback(
    async (userMessage: string, model?: string) => {
      try {
        setError(null);
        setIsLoading(true);

        // Add user message
        const userMsg: ChatMessage = {
          id: `msg_${Date.now()}_user`,
          role: 'user',
          content: userMessage,
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);

        // Prepare messages for API
        const apiMessages = messagesRef.current.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        apiMessages.push({ role: 'user', content: userMessage });

        // Stream response
        const response = await fetch(`/api/projects/${projectId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            model,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get AI response');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response stream');
        }

        // Collect the full response
        let fullResponse = '';
        const assistantMsg: ChatMessage = {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content: '',
          createdAt: new Date(),
          metadata: {
            agentOperation: {
              type: 'chat',
              status: 'running',
            },
          },
        };

        setMessages((prev) => [...prev, assistantMsg]);

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            const lines = text.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === 'text') {
                    fullResponse += data.data;

                    // Update the assistant message
                    setMessages((prev) => {
                      const updated = [...prev];
                      const lastMsg = updated[updated.length - 1];
                      if (lastMsg.role === 'assistant') {
                        lastMsg.content = fullResponse;
                      }
                      return updated;
                    });
                  } else if (data.type === 'tool-call') {
                    console.log(
                      '[v0] Tool call:',
                      data.tool,
                      'Args:',
                      data.args
                    );
                  } else if (data.type === 'complete') {
                    // Mark as complete
                    setMessages((prev) => {
                      const updated = [...prev];
                      const lastMsg = updated[updated.length - 1];
                      if (
                        lastMsg.role === 'assistant' &&
                        lastMsg.metadata?.agentOperation
                      ) {
                        lastMsg.metadata.agentOperation.status = 'completed';
                      }
                      return updated;
                    });
                  } else if (data.type === 'error') {
                    console.error('[v0] Chat error:', data.data);
                    setError(data.data);
                  }
                } catch (e) {
                  console.error('[v0] Failed to parse SSE data:', e);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        setIsLoading(false);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Chat error occurred';
        setError(message);
        setIsLoading(false);
        console.error('[v0] Chat error:', err);
      }
    },
    [projectId]
  );

  /**
   * Clear chat history
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
