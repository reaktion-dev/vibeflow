'use client';

import React, { useState, useEffect } from 'react';
import { useFileContent, useWriteFile } from '@/hooks/useFileOperations';
import { X, Save, ChevronDown } from 'lucide-react';
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

  useEffect(() => {
    setValue(content);
    setHasChanges(false);
  }, [content, filePath]);

  const handleSave = async () => {
    if (!filePath) return;

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

  const getFileLanguage = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      js: 'javascript',
      jsx: 'jsx',
      ts: 'typescript',
      tsx: 'tsx',
      py: 'python',
      json: 'json',
      html: 'html',
      css: 'css',
      md: 'markdown',
      yml: 'yaml',
      yaml: 'yaml',
    };
    return map[ext] || 'text';
  };

  if (!filePath) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <ChevronDown className="w-12 h-12 opacity-50 mb-2" />
        <p>Select a file to edit</p>
      </div>
    );
  }

  const fileName = filePath.split('/').pop() || filePath;

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-medium truncate">{fileName}</span>
          {hasChanges && (
            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-1.5 hover:bg-secondary rounded transition disabled:opacity-50"
              title="Save"
            >
              <Save className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-secondary rounded transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : (
          <textarea
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setHasChanges(e.target.value !== content);
            }}
            className="w-full h-full px-4 py-2 bg-background text-foreground text-sm font-mono border-none outline-none resize-none"
            spellCheck="false"
            wrap="off"
          />
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
        <span>
          {getFileLanguage(filePath)} • {value.split('\n').length} lines
        </span>
        <span>{value.length} characters</span>
      </div>
    </div>
  );
}
