'use client';

import { useState } from 'react';
import {
  Eye,
  Code,
  RefreshCw,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { ChatPanel } from '@/components/ai/chat-panel/ChatPanel';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useProjectPreview } from '@/hooks/useProjectPreview';
import { ProjectExportDropdown } from '@/components/workspace/ProjectExportDropdown';
import { PreviewStage } from './PreviewStage';
import { CodeStage } from './CodeStage';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ResizableIDEProps {
  projectId: string;
  projectName: string;
}

export type ViewMode = 'preview' | 'code';
export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export function ResizableIDE({ projectId, projectName }: ResizableIDEProps) {
  const selectedFile = useWorkspaceStore((s) => s.selectedFile);
  const setSelectedFile = useWorkspaceStore((s) => s.setSelectedFile);

  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');

  const {
    previewHtml,
    isLoading: previewLoading,
    logs,
    refresh: refreshPreview,
    openInNewTab,
  } = useProjectPreview(projectId);

  return (
    <div className="h-full w-full bg-background flex flex-col overflow-hidden">
      {/* Studio Surface (2 Columns: Left AI Assistant + Right Stage) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* AI Coding Agent Panel (Left Column) */}
        <aside className="w-80 sm:w-96 lg:w-[400px] bg-card border-r border-border flex flex-col shrink-0 min-h-0">
          <ChatPanel
            projectId={projectId}
            projectType="code"
            currentFile={selectedFile ?? undefined}
          />
        </aside>

        {/* Primary Stage (Right Column with Unified Toolbar) */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-background">
          {/* Unified Stage Toolbar (Replacing multiple stacked headers & address bars) */}
          <div className="h-10 border-b border-border/60 bg-card/70 backdrop-blur-sm px-3 flex items-center justify-between gap-2 shrink-0 z-10">
            {/* Left: View Mode Switcher + Live Sandbox Indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                    viewMode === 'preview'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="Switch to Live Preview (Eye)"
                >
                  <Eye className="size-3.5 text-primary" />
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('code')}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                    viewMode === 'code'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="Switch to Code Editor"
                >
                  <Code className="size-3.5 text-blue-500" />
                  <span>Code</span>
                </button>
              </div>

              {/* Refresh & URL Chip */}
              {viewMode === 'preview' && (
                <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 border border-border/40 rounded-md px-2 py-1">
                  <button
                    type="button"
                    onClick={refreshPreview}
                    className="hover:text-foreground transition-colors"
                    title="Refresh Preview"
                  >
                    <RefreshCw className={cn('size-3', previewLoading && 'animate-spin')} />
                  </button>
                  <span className="font-mono text-[11px] text-muted-foreground/80">
                    localhost:3000
                  </span>
                </div>
              )}
            </div>

            {/* Center: Device Viewport Switcher (Preview Mode) or Active File (Code Mode) */}
            <div className="flex items-center">
              {viewMode === 'preview' ? (
                <div className="flex items-center rounded-md border border-border/60 bg-muted/40 p-0.5">
                  <button
                    type="button"
                    onClick={() => setDeviceMode('desktop')}
                    className={cn(
                      'p-1 rounded-xs transition',
                      deviceMode === 'desktop'
                        ? 'bg-background text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title="Desktop View (100%)"
                  >
                    <Monitor className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeviceMode('tablet')}
                    className={cn(
                      'p-1 rounded-xs transition',
                      deviceMode === 'tablet'
                        ? 'bg-background text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title="Tablet View (768px)"
                  >
                    <Tablet className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeviceMode('mobile')}
                    className={cn(
                      'p-1 rounded-xs transition',
                      deviceMode === 'mobile'
                        ? 'bg-background text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title="Mobile View (375px)"
                  >
                    <Smartphone className="size-3.5" />
                  </button>
                </div>
              ) : (
                selectedFile && (
                  <span className="hidden md:inline-block text-xs text-muted-foreground font-mono truncate max-w-xs">
                    {selectedFile}
                  </span>
                )
              )}
            </div>

            {/* Right: Pop out + Export Options */}
            <div className="flex items-center gap-1.5">
              {viewMode === 'preview' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openInNewTab}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                  title="Open Live Preview in New Window"
                >
                  <ExternalLink className="size-3" />
                  <span className="hidden md:inline">Pop out</span>
                </Button>
              )}

              <ProjectExportDropdown
                projectId={projectId}
                projectName={projectName}
                onOpenPreviewTab={openInNewTab}
              />
            </div>
          </div>

          {/* Stage Body */}
          <div className="flex-1 overflow-hidden min-h-0 relative">
            {viewMode === 'preview' ? (
              <PreviewStage
                previewHtml={previewHtml}
                isLoading={previewLoading}
                logs={logs}
                deviceMode={deviceMode}
                onRefresh={refreshPreview}
                onOpenInNewTab={openInNewTab}
              />
            ) : (
              <CodeStage
                projectId={projectId}
                selectedFile={selectedFile ?? undefined}
                onSelectFile={(path) => setSelectedFile(path)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ResizableIDE;
