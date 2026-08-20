'use client';

import React from 'react';
import { useProject } from '@/hooks/useProject';
import { useFileTree } from '@/hooks/useFileOperations';
import { FileTree } from './FileTree';
import { EditorPane } from './EditorPane';
import { Terminal } from './Terminal';
import { ChatSidebar } from '@/components/ai/ChatSidebar';
import { ChevronLeft, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useWorkspaceStore } from '@/stores/workspace-store';

interface IDELayoutProps {
  projectId: string;
}

export function IDELayout({ projectId }: IDELayoutProps) {
  const { project, isLoading: projectLoading } = useProject(projectId);
  const { files, isLoading: filesLoading } = useFileTree(projectId, '/');
  const selectedFile = useWorkspaceStore((s) => s.selectedFile);
  const setSelectedFile = useWorkspaceStore((s) => s.setSelectedFile);
  const showFileTree = useWorkspaceStore((s) => s.showFileTree);
  const toggleFileTree = useWorkspaceStore((s) => s.toggleFileTree);
  const showChat = useWorkspaceStore((s) => s.showChat);
  const toggleChat = useWorkspaceStore((s) => s.toggleChat);
  const layoutMode = useWorkspaceStore((s) => s.layoutMode);
  const setLayoutMode = useWorkspaceStore((s) => s.setLayoutMode);

  if (projectLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <p className="text-muted-foreground mb-4">Project not found</p>
        <Link
          href="/"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-1.5 hover:bg-secondary rounded transition"
            title="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-semibold truncate">{project.name}</h1>
            <p className="text-xs text-muted-foreground truncate">
              Sandbox: {project.sandboxId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFileTree}
            className="p-1.5 hover:bg-secondary rounded transition"
            title="Toggle sidebar"
          >
            {showFileTree ? (
              <Menu className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={toggleChat}
            className="p-1.5 hover:bg-secondary rounded transition"
            title="Toggle chat"
          >
            {showChat ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Sidebar */}
        {showFileTree && (
          <div className="w-56 border-r border-border flex flex-col bg-card">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold">Files</h2>
            </div>
            <FileTree
              files={files}
              onFileSelect={setSelectedFile}
              selectedPath={selectedFile ?? undefined}
              isLoading={filesLoading}
            />
          </div>
        )}

        {/* Editor & Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <EditorPane
              projectId={projectId}
              filePath={selectedFile ?? undefined}
              onClose={() => setSelectedFile(null)}
            />
          </div>

          {/* Terminal */}
          <div className="h-48 border-t border-border">
            <Terminal projectId={projectId} />
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-72 border-l border-border flex flex-col">
            <ChatSidebar
              projectId={projectId}
              context={selectedFile ? `Currently editing: ${selectedFile}` : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}
