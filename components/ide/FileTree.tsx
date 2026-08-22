'use client';

import React, { useState, useCallback } from 'react';
import { FileNode } from '@/lib/types';
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  Image as ImageIcon,
  Palette,
  Gamepad2,
  File,
} from 'lucide-react';

interface FileTreeProps {
  files: FileNode[];
  onFileSelect: (path: string) => void;
  selectedPath?: string;
  isLoading?: boolean;
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'].includes(ext)) {
    if (filename.includes('game') || filename.includes('player') || filename.includes('canvas')) {
      return <Gamepad2 className="size-3.5 text-amber-500 shrink-0" />;
    }
    return <FileCode className="size-3.5 text-blue-400 shrink-0" />;
  }
  if (['html', 'htm'].includes(ext)) {
    return <FileCode className="size-3.5 text-orange-500 shrink-0" />;
  }
  if (['css', 'scss', 'sass', 'less'].includes(ext)) {
    return <Palette className="size-3.5 text-cyan-400 shrink-0" />;
  }
  if (['json', 'yaml', 'yml'].includes(ext)) {
    return <FileJson className="size-3.5 text-yellow-400 shrink-0" />;
  }
  if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif', 'ico'].includes(ext)) {
    return <ImageIcon className="size-3.5 text-emerald-400 shrink-0" />;
  }
  if (['md', 'markdown', 'txt'].includes(ext)) {
    return <FileText className="size-3.5 text-zinc-400 shrink-0" />;
  }
  return <File className="size-3.5 text-muted-foreground shrink-0" />;
}

export function FileTree({
  files,
  onFileSelect,
  selectedPath,
  isLoading,
}: FileTreeProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['/', 'src']));

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
    <div className="h-full overflow-y-auto select-none py-1">
      {isLoading ? (
        <div className="p-3 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-5 bg-muted/60 rounded animate-pulse"
            />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="p-4 text-xs text-muted-foreground text-center">
          No files yet
        </div>
      ) : (
        <div className="px-1.5 space-y-0.5">
          {files.map((file) => (
            <FileTreeNode
              key={file.path}
              node={file}
              level={0}
              expanded={expandedDirs.has(file.path)}
              expandedDirs={expandedDirs}
              onToggle={toggleDir}
              onSelect={onFileSelect}
              selected={selectedPath === file.path || selectedPath === `/${file.path.replace(/^\//, '')}`}
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
  const indent = level * 10;

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
        className={`w-full flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition duration-150 text-left ${
          selected
            ? 'bg-primary/15 text-primary font-medium border border-primary/25 shadow-2xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
        style={{ paddingLeft: `${indent + 6}px` }}
      >
        {isDirectory ? (
          <>
            <ChevronRight
              className={`size-3.5 shrink-0 text-muted-foreground/70 transition-transform duration-150 ${
                expanded ? 'rotate-90' : ''
              }`}
            />
            {expanded ? (
              <FolderOpen className="size-3.5 text-primary/80 shrink-0" />
            ) : (
              <Folder className="size-3.5 text-muted-foreground shrink-0" />
            )}
          </>
        ) : (
          <>
            <div className="size-3.5 shrink-0" />
            {getFileIcon(node.name)}
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>

      {isDirectory && expanded && node.children && (
        <div className="space-y-0.5">
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
