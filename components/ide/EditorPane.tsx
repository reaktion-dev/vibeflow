'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFileContent, useWriteFile } from '@/hooks/useFileOperations';
import { X, Save, FileCode, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

interface EditorPaneProps {
  projectId: string;
  filePath?: string;
  onClose?: () => void;
}

export function EditorPane({
  projectId,
  filePath,
  onClose,
}: EditorPaneProps) {
  const { content, isLoading, mutate } = useFileContent(projectId, filePath);
  const writeFile = useWriteFile();
  const [value, setValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setValue(content);
    setHasChanges(false);
  }, [content, filePath]);

  const handleSave = async () => {
    if (!filePath || isSaving) return;

    try {
      setIsSaving(true);
      await writeFile(projectId, filePath, value);
      toast.success('File saved');
      setHasChanges(false);
      mutate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save file'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut: Cmd+S / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filePath, value, isSaving]);

  const lines = useMemo(() => {
    return value.split('\n');
  }, [value]);

  const getFileLanguage = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      js: 'JavaScript',
      jsx: 'React JSX',
      ts: 'TypeScript',
      tsx: 'React TSX',
      py: 'Python',
      json: 'JSON',
      html: 'HTML5',
      css: 'CSS3',
      md: 'Markdown',
      yml: 'YAML',
      yaml: 'YAML',
    };
    return map[ext] || 'Plain Text';
  };

  if (!filePath) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center select-none">
        <div className="size-12 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-3">
          <FileCode className="size-6 text-muted-foreground/60" />
        </div>
        <p className="text-sm font-medium text-foreground">No file selected</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Select a file from the explorer on the left or prompt the agent to generate new code.
        </p>
      </div>
    );
  }

  const fileName = filePath.split('/').pop() || filePath;

  return (
    <div className="h-full flex flex-col bg-background select-none">
      {/* Tab Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card/60">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background border border-border text-xs font-medium text-foreground shadow-2xs">
            <span className="truncate max-w-48">{fileName}</span>
            {hasChanges && (
              <span className="size-1.5 rounded-full bg-amber-500 shrink-0" title="Unsaved changes" />
            )}
          </div>
          <Badge variant="secondary" className="text-[10px] h-5 font-normal">
            {getFileLanguage(filePath)}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          {hasChanges && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs gap-1"
            >
              <Save className="size-3" />
              <span>Save</span>
            </Button>
          )}
          {onClose && (
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="flex-1 flex overflow-hidden relative">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
            Loading file contents...
          </div>
        ) : (
          <div className="flex size-full overflow-hidden font-mono text-xs">
            {/* Line Numbers Gutter */}
            <div
              ref={lineNumbersRef}
              className="w-12 shrink-0 py-3 pr-3 text-right text-muted-foreground/40 bg-card/20 select-none border-r border-border/50 overflow-hidden"
            >
              {lines.map((_, i) => (
                <div key={i} className="leading-5 text-[11px]">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setHasChanges(e.target.value !== content);
              }}
              onScroll={(e) => {
                if (lineNumbersRef.current) {
                  lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
                }
              }}
              className="flex-1 p-3 bg-transparent text-foreground leading-5 outline-none resize-none border-none overflow-auto whitespace-pre font-mono text-[13px] tab-size-2"
              spellCheck="false"
              wrap="off"
            />
          </div>
        )}
      </div>

      {/* Status Footer */}
      <div className="px-3 py-1.5 border-t border-border bg-card/40 text-[11px] text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span>{lines.length} lines</span>
          <span>{value.length} chars</span>
        </div>
        <div className="flex items-center gap-2">
          <span>UTF-8</span>
          <span>{hasChanges ? 'Unsaved' : 'Saved'}</span>
        </div>
      </div>
    </div>
  );
}
