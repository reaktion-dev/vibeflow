'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ChatSidebar } from '@/components/ai/ChatSidebar';
import { Button } from '@/components/ui/button';
import { useFileTree } from '@/hooks/useFileOperations';

import { EditorPane } from './EditorPane';
import { FileTree } from './FileTree';
import { Terminal } from './Terminal';

interface ResizableIDEProps {
  projectId: string;
  projectName: string;
}

export function ResizableIDE({ projectId, projectName }: ResizableIDEProps) {
  const [selectedFile, setSelectedFile] = useState<string | undefined>(undefined);
  const [showFileTree, setShowFileTree] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const { files, isLoading: filesLoading } = useFileTree(projectId, '/');

  return (
    <div className="h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-foreground text-sm">{projectName}</h1>
          <span className="text-xs text-muted-foreground">/ Daytona Sandbox</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs">
            Run
          </Button>
          <Button variant="ghost" size="sm" className="text-xs">
            Deploy
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* File Tree */}
        {showFileTree && (
          <div className="w-64 border-r border-border bg-card flex flex-col">
            <div className="p-3 border-b border-border">
              <h3 className="text-xs font-semibold text-foreground">Files</h3>
            </div>
            <div className="flex-1 overflow-auto">
              <FileTree
                files={files || []}
                isLoading={filesLoading}
                onFileSelect={(path) => {
                  setSelectedFile(path);
                }}
                selectedPath={selectedFile}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor */}
          <div className="flex-1 overflow-auto border-b border-border">
            <EditorPane projectId={projectId} filePath={selectedFile} />
          </div>

          {/* Terminal */}
          <div className="h-48 border-t border-border overflow-auto bg-card">
            <Terminal projectId={projectId} />
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 border-l border-border bg-card flex flex-col">
            <ChatSidebar
              context={selectedFile ? `Currently editing: ${selectedFile}` : undefined}
              projectId={projectId}
            />
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="h-10 border-t border-border bg-card/50 flex items-center justify-between px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFileTree(!showFileTree)}
            className="flex items-center gap-1 hover:text-foreground transition"
          >
            {showFileTree ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            Files
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className="flex items-center gap-1 hover:text-foreground transition"
          >
            {showChat ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            AI Assistant
          </button>
        </div>
        <div className="text-xs">Ready</div>
      </div>
    </div>
  );
}
