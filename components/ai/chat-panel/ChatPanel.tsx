'use client';

import { useMemo } from 'react';

import { useProjectAgentChat } from '@/hooks/useProjectAgentChat';

import { ChatPanelComposer } from './ChatPanelComposer';
import { ChatPanelConversation } from './ChatPanelConversation';
import { ChatPanelHeader } from './ChatPanelHeader';

interface ChatPanelProps {
  projectId: string;
  currentFile?: string;
}

export function ChatPanel({ projectId, currentFile }: ChatPanelProps) {
  const {
    addToolApprovalResponse,
    availableModels,
    clearMessages,
    messages,
    selectedModel,
    sendTextMessage,
    setSelectedModel,
    status,
    stop,
    isLoadingHistory,
  } = useProjectAgentChat({
    projectId,
    currentFile,
  });

  const selectedModelName = useMemo(() => {
    return (
      availableModels.find((model) => model.id === selectedModel)?.name ??
      'Unknown model'
    );
  }, [availableModels, selectedModel]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <ChatPanelHeader
        currentFile={currentFile}
        modelName={selectedModelName}
        onClear={clearMessages}
      />

      <div className="min-h-0 flex-1">
        {isLoadingHistory ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading conversation...
            </div>
          </div>
        ) : (
          <ChatPanelConversation
            messages={messages}
            onApprove={(approvalId) => {
              void addToolApprovalResponse({
                id: approvalId,
                approved: true,
              });
            }}
            onDeny={(approvalId) => {
              void addToolApprovalResponse({
                id: approvalId,
                approved: false,
              });
            }}
          />
        )}
      </div>

      <ChatPanelComposer
        availableModels={availableModels}
        onStop={stop}
        onSubmit={sendTextMessage}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        status={status}
      />
    </div>
  );
}
