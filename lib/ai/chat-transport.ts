import { DefaultChatTransport } from 'ai';

/**
 * Creates the chat transport used by the project chat hook.
 *
 * Kept as a pure, framework-free factory so the request-body contract can be
 * unit-tested without mounting React.
 *
 * NOTE: `DefaultChatTransport` only attaches `messages` to the request body in
 * its default body fallback. A custom `prepareSendMessagesRequest` that returns
 * a body must re-include `messages`, or the server receives an empty message
 * list (AI_InvalidPromptError: messages must not be empty).
 */
export function createProjectChatTransport({
  projectId,
  model,
  currentFile,
}: {
  projectId: string;
  model: string;
  currentFile?: string;
}) {
  return new DefaultChatTransport({
    api: `/api/projects/${projectId}/chat`,
    prepareSendMessagesRequest: ({ body, messages }) => ({
      body: {
        ...(body ?? {}),
        messages,
        model,
        currentFile,
      },
    }),
  });
}