import { describe, expect, it } from 'vitest';

import { createProjectChatTransport } from '@/lib/ai/chat-transport';
import type { UIMessage } from 'ai';

const MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';

function mockFetch(capture: (body: Record<string, unknown>) => void) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_input, init) => {
    capture(JSON.parse(String(init?.body)));
    return new Response('data: [DONE]\n\n', {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }) as typeof fetch;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

async function drain(stream: ReadableStream<UIMessage>) {
  for await (const _chunk of stream) {
    // no-op: just consume the mocked SSE stream
  }
}

describe('createProjectChatTransport', () => {
  it('includes messages, model, and currentFile in the request body', async () => {
    const transport = createProjectChatTransport({
      projectId: 'p_test',
      model: MODEL,
      currentFile: 'src/app.ts',
    });

    const messages: UIMessage[] = [
      { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
    ];

    let capturedBody: Record<string, unknown> | undefined;
    const restore = mockFetch((body) => {
      capturedBody = body;
    });

    try {
      const stream = await transport.sendMessages({
        chatId: 'c1',
        messages,
        trigger: 'submit-message',
        messageId: undefined,
        abortSignal: undefined,
      });
      await drain(stream);
    } finally {
      restore();
    }

    expect(capturedBody).toBeDefined();
    expect(capturedBody!.messages).toEqual(messages);
    expect(capturedBody!.model).toBe(MODEL);
    expect(capturedBody!.currentFile).toBe('src/app.ts');
  });

  it('preserves additional body fields passed by the caller', async () => {
    const transport = createProjectChatTransport({ projectId: 'p_test', model: MODEL });

    let capturedBody: Record<string, unknown> | undefined;
    const restore = mockFetch((body) => {
      capturedBody = body;
    });

    try {
      const stream = await transport.sendMessages({
        chatId: 'c1',
        messages: [{ id: 'm1', role: 'user', parts: [{ type: 'text', text: 'hi' }] }],
        trigger: 'submit-message',
        messageId: undefined,
        abortSignal: undefined,
        body: { conversationId: 'conv_123' },
      });
      await drain(stream);
    } finally {
      restore();
    }

    expect(capturedBody!.conversationId).toBe('conv_123');
    expect(capturedBody!.messages).toHaveLength(1);
  });
});