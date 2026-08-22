'use client';

import { useState, useEffect, useCallback } from 'react';
import { bundleStaticPreview } from '@/lib/artifacts/preview-bundle';

export interface PreviewConsoleLog {
  level: 'log' | 'warn' | 'error';
  message: string;
  timestamp: Date;
}

export function useProjectPreview(projectId: string) {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<PreviewConsoleLog[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Fetch project files and build the standalone preview HTML
  useEffect(() => {
    let isCancelled = false;

    async function loadPreview() {
      if (!projectId) return;
      try {
        setIsLoading(true);
        const res = await fetch(`/api/projects/${projectId}/files`);
        if (!res.ok) {
          if (!isCancelled) {
            setPreviewHtml(bundleStaticPreview([]));
          }
          return;
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          if (!isCancelled) {
            setPreviewHtml(bundleStaticPreview([]));
          }
          return;
        }

        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          // Fetch contents of files
          const filesWithContent = await Promise.all(
            data.data.map(async (file: { path: string; content?: string }) => {
              if (file.content !== undefined) {
                return { path: file.path, content: file.content };
              }
              try {
                const fileRes = await fetch(
                  `/api/projects/${projectId}/files?action=read&path=${encodeURIComponent(file.path)}`
                );
                if (fileRes.ok) {
                  const fileType = fileRes.headers.get('content-type') || '';
                  if (fileType.includes('application/json')) {
                    const fileJson = await fileRes.json();
                    return {
                      path: file.path,
                      content: fileJson.data?.content || '',
                    };
                  }
                }
                return { path: file.path, content: '' };
              } catch {
                return { path: file.path, content: '' };
              }
            })
          );

          if (!isCancelled) {
            const bundled = bundleStaticPreview(filesWithContent);
            setPreviewHtml(bundled);
          }
        } else if (!isCancelled) {
          setPreviewHtml(bundleStaticPreview([]));
        }
      } catch (err) {
        console.error('[vibeflow] Failed to load preview files:', err);
        if (!isCancelled) {
          setPreviewHtml(bundleStaticPreview([]));
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    void loadPreview();

    return () => {
      isCancelled = true;
    };
  }, [projectId, refreshKey]);

  // Auto-refresh when files change or agent turn completes
  useEffect(() => {
    const handleUpdate = () => {
      refresh();
    };
    window.addEventListener('vibeflow-workspace-updated', handleUpdate);
    return () => window.removeEventListener('vibeflow-workspace-updated', handleUpdate);
  }, [refresh]);

  // Listen to console logs relayed by the preview iframe harness
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data && event.data.type === 'vibeflow-preview-console') {
        const { level, message, timestamp } = event.data;
        setLogs((prev) => [
          ...prev.slice(-100), // Keep last 100 logs
          {
            level: level || 'log',
            message: String(message),
            timestamp: timestamp ? new Date(timestamp) : new Date(),
          },
        ]);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const openInNewTab = useCallback(() => {
    if (!previewHtml) return;
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [previewHtml]);

  return {
    previewHtml,
    isLoading,
    logs,
    clearLogs,
    refresh,
    openInNewTab,
  };
}
