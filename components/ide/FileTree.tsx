'use client';

import React, { useState, useCallback } from 'react';
import { FileNode } from '@/lib/types';
import { ChevronRight, File, Folder } from 'lucide-react';

interface FileTreeProps {
  files: FileNode[];
  onFileSelect: (path: string) => void;
  selectedPath?: string;
  isLoading?: boolean;
}

export function FileTree({
  files,
  onFileSelect,
  selectedPath,
  isLoading,
}: FileTreeProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const toggleDir = useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      {isLoading ? (
        <div className="p-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-6 bg-muted rounded animate-pulse"
            />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="p-4 text-xs text-muted-foreground text-center">
          No files
        </div>
      ) : (
        <div className="p-2">
          {files.map((file) => (
            <FileTreeNode
              key={file.path}
              node={file}
              level={0}
              expanded={expandedDirs.has(file.path)}
              expandedDirs={expandedDirs}
              onToggle={toggleDir}
              onSelect={onFileSelect}
              selected={selectedPath === file.path}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FileTreeNodeProps {
  node: FileNode;
  level: number;
  expanded: boolean;
  expandedDirs?: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  selected: boolean;
}

export function FileTreeNode({
  node,
  level,
  expanded,
  expandedDirs = new Set(),
  onToggle,
  onSelect,
  selected,
}: FileTreeNodeProps) {
  const isDirectory = node.type === 'directory';
  const indent = level * 12;

  return (
    <div>
      <button
        onClick={() => {
          if (isDirectory) {
            onToggle(node.path);
          } else {
            onSelect(node.path);
          }
        }}
        className={`w-full flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded transition ${
          selected
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-muted text-foreground'
        }`}
        style={{ paddingLeft: `${indent + 8}px` }}
      >
        {isDirectory ? (
          <>
            <ChevronRight
              className={`w-4 h-4 flex-shrink-0 transition ${
                expanded ? 'rotate-90' : ''
              }`}
            />
            <Folder className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
          </>
        ) : (
          <>
            <div className="w-4 h-4 flex-shrink-0" />
            <File className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>

      {isDirectory && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              expanded={expandedDirs.has(child.path)}
              expandedDirs={expandedDirs}
              onToggle={onToggle}
              onSelect={onSelect}
              selected={selected}
            />
          ))}
        </div>
      )}
    </div>
  );
}
