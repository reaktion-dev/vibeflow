'use client';

import useSWR from 'swr';
import { FileNode, FileContent } from '@/lib/types';
import axios from 'axios';

const fetcher = (url: string) => axios.get(url).then((res) => res.data.data);

/**
 * Hook to fetch file tree
 */
export function useFileTree(projectId?: string, dirPath?: string) {
  const queryParams = new URLSearchParams({
    path: dirPath || '/',
    action: 'list',
  }).toString();

  const { data, error, isLoading, mutate } = useSWR<FileNode[]>(
    projectId
      ? `/api/projects/${projectId}/files?${queryParams}`
      : null,
    fetcher
  );

  return {
    files: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to read file content
 */
export function useFileContent(projectId?: string, filePath?: string) {
  const queryParams = new URLSearchParams({
    path: filePath || '',
    action: 'read',
  }).toString();

  const { data, error, isLoading, mutate } = useSWR<FileContent>(
    projectId && filePath
      ? `/api/projects/${projectId}/files?${queryParams}`
      : null,
    fetcher
  );

  return {
    content: data?.content || '',
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to write file
 */
export function useWriteFile() {
  return async (
    projectId: string,
    filePath: string,
    content: string
  ): Promise<void> => {
    await axios.post(`/api/projects/${projectId}/files`, {
      path: filePath,
      content,
    });
  };
}

/**
 * Hook to delete file
 */
export function useDeleteFile() {
  return async (projectId: string, filePath: string): Promise<void> => {
    await axios.delete(`/api/projects/${projectId}/files`, {
      data: { path: filePath },
    });
  };
}

/**
 * Hook to execute terminal command with streaming
 */
export function useTerminalCommand() {
  return async (
    projectId: string,
    command: string,
    workingDirectory?: string,
    onData?: (data: any) => void
  ): Promise<void> => {
    const response = await fetch(
      `/api/projects/${projectId}/terminal`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, workingDirectory }),
      }
    );

    if (!response.ok) {
      throw new Error('Command execution failed');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (onData) onData(data);
            } catch (e) {
              console.error('[v0] Failed to parse SSE data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  };
}
