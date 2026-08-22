'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Terminal as TerminalIcon, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFileTree } from '@/hooks/useFileOperations';
import { FileTree } from './FileTree';
import { EditorPane } from './EditorPane';
import { Terminal } from './Terminal';

interface CodeStageProps {
  projectId: string;
  selectedFile?: string;
  onSelectFile: (path: string) => void;
}

export function CodeStage({
  projectId,
  selectedFile,
  onSelectFile,
}: CodeStageProps) {
  const [showExplorer, setShowExplorer] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const { files, isLoading: filesLoading } = useFileTree(projectId, '/');

  return (
    <div className="flex size-full flex-col overflow-hidden bg-background">
      {/* Code Stage Body */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Compact Integrated File Explorer */}
        {showExplorer && (
          <div className="w-52 border-r border-border bg-card/60 flex flex-col shrink-0">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FolderTree className="size-3.5 text-muted-foreground" />
                Files
              </span>
              <button
                type="button"
                onClick={() => setShowExplorer(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-xs"
                title="Collapse file tree"
              >
                <ChevronLeft className="size-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <FileTree
                files={files || []}
                isLoading={filesLoading}
                onFileSelect={onSelectFile}
                selectedPath={selectedFile}
              />
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-background">
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <EditorPane
              projectId={projectId}
              filePath={selectedFile}
              onClose={selectedFile ? () => onSelectFile('') : undefined}
            />
          </div>

          {/* Collapsible Terminal Drawer */}
          {showTerminal && (
            <div className="h-44 border-t border-border overflow-auto bg-card">
              <Terminal projectId={projectId} />
            </div>
          )}
        </div>
      </div>

      {/* Code Stage Bottom Toolbar */}
      <div className="h-8 border-t border-border bg-card/40 px-3 flex items-center justify-between text-xs text-muted-foreground select-none">
        <div className="flex items-center gap-3">
          {!showExplorer && (
            <button
              type="button"
              onClick={() => setShowExplorer(true)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
            >
              <FolderTree className="size-3.5" />
              <span>Show Files</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowTerminal(!showTerminal)}
            className={`flex items-center gap-1 transition ${
              showTerminal ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TerminalIcon className="size-3.5" />
            <span>Terminal</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span>{files.length} project files</span>
        </div>
      </div>
    </div>
  );
}
