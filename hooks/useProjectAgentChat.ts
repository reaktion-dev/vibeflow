'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { CODING_AGENT_MODELS } from '@/lib/ai/harness/opencode-agent';

interface UseProjectAgentChatOptions {
  projectId: string;
  currentFile?: string;
}

/**
 * Harness-aware chat hook for project coding agent.
 * 
 * Key differences from the previous ToolLoopAgent implementation:
 * - The harness owns conversation history (no message replay needed)
 * - Session state persists via detach/reattach on the server
 * - Tool parts include harness-specific types (tool-read, tool-bash, dynamic-tool)
 * - Approval flow is built into the harness permissionMode
 * 
 * The hook only needs to:
 * 1. Send new user messages
 * 2. Render incoming stream parts (text, reasoning, tools, approvals)
 * 3. Send approval responses when requested
 */
export function useProjectAgentChat({
  projectId,
  currentFile,
}: UseProjectAgentChatOptions) {
  const [selectedModel, setSelectedModel] = useState(
    CODING_AGENT_MODELS[0]?.id ?? 'anthropic/claude-sonnet-4-6'
  );

  // The harness session persists on the server, so we don't need to load history.
  // Messages appear in real-time as the stream progresses.
  const [isLoadingHistory] = useState(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/projects/${projectId}/chat`,
        prepareSendMessagesRequest: ({ body }) => ({
          body: {
            ...(body ?? {}),
            model: selectedModel,
            currentFile,
          },
        }),
      }),
    [projectId, selectedModel, currentFile]
  );

  const chat = useChat({
    id: projectId, // Stable chat ID = projectId for session correlation
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onError: (error) => {
      toast.error(error.message || 'Chat request failed');
    },
  });

  const sendTextMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    await chat.sendMessage({ text: trimmed });
  };

  const clearMessages = () => {
    chat.setMessages([]);
    chat.clearError();
    // Note: This only clears the UI. The harness session state persists on the server.
    // To fully clear the harness conversation, you'd need a separate API call.
  };

  return {
    ...chat,
    availableModels: CODING_AGENT_MODELS,
    selectedModel,
    setSelectedModel,
    sendTextMessage,
    clearMessages,
    isLoadingHistory,
  };
}
