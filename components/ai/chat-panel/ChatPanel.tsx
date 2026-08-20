'use client';

import { useMemo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useProjectAgentChat } from '@/hooks/useProjectAgentChat';

import { ChatPanelComposer } from './ChatPanelComposer';
import { ChatPanelConversation } from './ChatPanelConversation';
import { ChatPanelHeader } from './ChatPanelHeader';

interface ChatPanelProps {
  projectId: string;
  projectType?: 'code' | 'design' | 'video' | 'flow';
  currentFile?: string;
}

export function ChatPanel({ projectId, projectType, currentFile }: ChatPanelProps) {
  const {
    addToolApprovalResponse,
    availableModels,
    clearMessages,
    error,
    messages,
    regenerate,
    selectedModel,
    sendTextMessage,
    setSelectedModel,
    status,
    stop,
    isLoadingHistory,
  } = useProjectAgentChat({
    projectId,
    projectType,
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
        projectType={projectType}
      />

      <div className="flex min-h-0 min-w-0 flex-1">
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

      {status === 'error' && error && (
        <Alert variant="destructive" className="mx-3 mb-3 rounded-lg border-destructive/20 bg-destructive/5">
          <AlertCircle className="size-4" />
          <AlertDescription className="flex items-center justify-between gap-3">
            <span className="min-w-0 flex-1">
              {error.message || 'Something went wrong. Please try again.'}
            </span>
            <Button
              className="shrink-0 gap-1.5"
              onClick={() => void regenerate()}
              size="sm"
              type="button"
              variant="outline"
            >
              <RefreshCw className="size-3" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <ChatPanelComposer
        availableModels={availableModels}
        onStop={stop}
        onSubmit={sendTextMessage}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        status={status}
        projectType={projectType}
      />
    </div>
  );
}
