'use client';

import { useChat } from '@ai-sdk/react';
import { lastAssistantMessageIsCompleteWithApprovalResponses, type UIMessage } from 'ai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { createProjectChatTransport } from '@/lib/ai/chat-transport';
import { CODING_AGENT_MODELS } from '@/lib/ai/harness/models';
import { AVAILABLE_CHAT_MODELS } from '@/lib/ai/chat-models';

interface UseProjectAgentChatOptions {
  projectId: string;
  projectType?: 'code' | 'design' | 'video' | 'flow';
  currentFile?: string;
}

/** Minimal shape of a persisted chat message row returned by GET /chat. */
interface ChatHistoryRow {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
}

/** Minimal shape of a conversation row returned by GET /conversations. */
export interface ConversationSummary {
  id: string;
  title: string | null;
  updatedAt?: string | null;
}

/**
 * Persisted chat rows are plain text blobs. Map them to the UIMessage shape
 * the chat hook + renderer expect (a single text part per message).
 */
function mapHistoryToUIMessages(rows: ChatHistoryRow[]): UIMessage[] {
  return rows
    .filter((row) => row.role === 'user' || row.role === 'assistant')
    .map((row) => ({
      id: row.id,
      role: row.role === 'user' ? 'user' : 'assistant',
      parts: [{ type: 'text' as const, text: row.content }],
    }));
}

/**
 * Workspace-aware chat hook.
 *
 * Routes to /api/projects/[id]/chat which selects the agent by project type:
 * - code → HarnessAgent (OpenCode + sandbox), falls back to ToolLoopAgent
 * - design/video/flow → ToolLoopAgent (host-side, no sandbox)
 *
 * Model lists differ: code projects use CODING_AGENT_MODELS (models compatible
 * with the OpenCode harness), content projects use AVAILABLE_CHAT_MODELS.
 */
export function useProjectAgentChat({
  projectId,
  projectType = 'code',
  currentFile,
}: UseProjectAgentChatOptions) {
  const isCodeProject = projectType === 'code';
  const modelList = isCodeProject ? CODING_AGENT_MODELS : AVAILABLE_CHAT_MODELS;

  const [selectedModel, setSelectedModel] = useState(
    modelList[0]?.id ?? 'opencode/deepseek-v4-flash-free'
  );

  // Active server conversation. `undefined` until the server confirms one
  // (from history load or the first POST).
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

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

  // Broadcast workspace updates when the agent finishes streaming
  const prevStatusRef = useRef(chat.status);
  useEffect(() => {
    if (prevStatusRef.current === 'streaming' && chat.status === 'ready') {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vibeflow-workspace-updated'));
      }
    }
    prevStatusRef.current = chat.status;
  }, [chat.status]);

  // Guards against out-of-order history responses when switching quickly.
  const historyRequestRef = useRef(0);

  const loadHistory = useCallback(
    async (targetConversationId?: string) => {
      const requestId = ++historyRequestRef.current;
      setIsLoadingHistory(true);
      try {
        const query = targetConversationId
          ? `?conversationId=${encodeURIComponent(targetConversationId)}`
          : '';
        const res = await fetch(`/api/projects/${projectId}/chat${query}`);
        const json = (await res.json()) as {
          success?: boolean;
          data?: ChatHistoryRow[];
          conversationId?: string;
        };
        if (requestId !== historyRequestRef.current) return; // stale response
        if (json.success && Array.isArray(json.data)) {
          chat.setMessages(mapHistoryToUIMessages(json.data));
          if (json.conversationId) setConversationId(json.conversationId);

          // If no previous history and initialPrompt was passed on URL, auto-trigger the agent turn
          if (json.data.length === 0 && typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const initialPrompt = urlParams.get('initialPrompt');
            if (initialPrompt && initialPrompt.trim()) {
              // Clean up URL without reloading
              const cleanUrl = window.location.pathname;
              window.history.replaceState({}, '', cleanUrl);
              void chat.sendMessage(
                { text: initialPrompt.trim() },
                { body: { conversationId: json.conversationId } }
              );
            }
          }
        }
      } catch {
        // Best-effort: keep whatever is on screen.
      } finally {
        if (requestId === historyRequestRef.current) setIsLoadingHistory(false);
      }
    },
    [projectId, chat.setMessages]
  );

  // Load the latest active conversation's history on mount.
  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/conversations`);
      const json = (await res.json()) as {
        success?: boolean;
        data?: ConversationSummary[];
      };
      if (json.success && Array.isArray(json.data)) {
        setConversations(json.data);
      }
    } catch {
      // Best-effort.
    }
  }, [projectId]);

  const sendTextMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // conversationId flows into the POST body via the transport's
    // prepareSendMessagesRequest (it spreads the request body).
    await chat.sendMessage({ text: trimmed }, { body: { conversationId } });
    // The server may have created the conversation on first send.
    void refreshConversations();
  };

  const switchConversation = useCallback(
    async (id: string) => {
      void chat.stop(); // Don't let an in-flight stream append to the wrong thread.
      setConversationId(id);
      chat.clearError();
      await loadHistory(id);
    },
    [chat.clearError, chat.stop, loadHistory]
  );

  const createConversation = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as { success?: boolean; data?: { id?: string } };
      if (json.success && json.data?.id) {
        setConversationId(json.data.id);
        chat.setMessages([]);
        chat.clearError();
        void refreshConversations();
      } else {
        toast.error('Failed to create a new conversation');
      }
    } catch {
      toast.error('Failed to create a new conversation');
    }
  }, [projectId, chat.setMessages, chat.clearError, refreshConversations]);

  const clearMessages = useCallback(async () => {
    // Start a fresh server conversation so the harness session context resets.
    await createConversation();
    // Ensure the UI clears even if the server call failed.
    chat.setMessages([]);
    chat.clearError();
  }, [createConversation, chat.setMessages, chat.clearError]);

  return {
    ...chat,
    availableModels: modelList,
    selectedModel,
    setSelectedModel,
    sendTextMessage,
    clearMessages,
    switchConversation,
    createConversation,
    refreshConversations,
    conversationId,
    conversations,
    isLoadingHistory,
  };
}