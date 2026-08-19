'use client';

import { ChatPanel } from '@/components/ai/chat-panel/ChatPanel';

interface ChatSidebarProps {
  projectId: string;
  context?: string;
}

export function ChatSidebar({ projectId, context }: ChatSidebarProps) {
  return <ChatPanel currentFile={context} projectId={projectId} />;
}
