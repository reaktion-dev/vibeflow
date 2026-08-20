'use client';

import { useChat } from '@ai-sdk/react';
import { lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { createProjectChatTransport } from '@/lib/ai/chat-transport';
import { CODING_AGENT_MODELS } from '@/lib/ai/harness/models';
import { CONTENT_CHAT_MODELS } from '@/lib/ai/chat-models';

interface UseProjectAgentChatOptions {
  projectId: string;
  projectType?: 'code' | 'design' | 'video' | 'flow';
  currentFile?: string;
}

/**
 * Workspace-aware chat hook.
 *
 * Routes to /api/projects/[id]/chat which selects the agent by project type:
 * - code → HarnessAgent (OpenCode + sandbox)
 * - design/video/flow → ToolLoopAgent (host-side, no sandbox)
 *
 * Model lists differ: code projects use CODING_AGENT_MODELS,
 * content projects use CONTENT_CHAT_MODELS.
 */
export function useProjectAgentChat({
  projectId,
  projectType = 'code',
  currentFile,
}: UseProjectAgentChatOptions) {
  const isCodeProject = projectType === 'code';
  const modelList = isCodeProject ? CODING_AGENT_MODELS : CONTENT_CHAT_MODELS;

  const [selectedModel, setSelectedModel] = useState(
    modelList[0]?.id ?? 'anthropic/claude-sonnet-4-6'
  );

  // The harness session persists on the server, so we don't need to load history.
  // Messages appear in real-time as the stream progresses.
  const [isLoadingHistory] = useState(false);

  const transport = useMemo(
    () => createProjectChatTransport({ projectId, model: selectedModel, currentFile }),
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
    availableModels: modelList,
    selectedModel,
    setSelectedModel,
    sendTextMessage,
    clearMessages,
    isLoadingHistory,
  };
}
