'use client';

import {
  WebPreview,
  WebPreviewBody,
  WebPreviewConsole,
} from '@/components/ai-elements/web-preview';
import { PreviewConsoleLog } from '@/hooks/useProjectPreview';

interface PreviewStageProps {
  previewHtml: string;
  isLoading: boolean;
  logs: PreviewConsoleLog[];
  deviceMode?: 'desktop' | 'tablet' | 'mobile';
  onRefresh?: () => void;
  onOpenInNewTab?: () => void;
}

export function PreviewStage({
  previewHtml,
  isLoading,
  logs,
  deviceMode = 'desktop',
}: PreviewStageProps) {
  return (
    <div className="flex size-full flex-col overflow-hidden bg-background">
      <WebPreview className="size-full rounded-none border-0" defaultUrl="http://localhost:3000">
        {/* Live Stage Body */}
        <div className="flex-1 relative flex flex-col min-h-0 bg-muted/25 overflow-hidden items-center justify-center p-0 sm:p-2">
          <div
            className={`h-full transition-all duration-200 flex flex-col ${
              deviceMode === 'mobile'
                ? 'w-[375px] max-w-full rounded-xl border border-border shadow-xl overflow-hidden bg-background'
                : deviceMode === 'tablet'
                ? 'w-[768px] max-w-full rounded-xl border border-border shadow-xl overflow-hidden bg-background'
                : 'w-full bg-background'
            }`}
          >
            <WebPreviewBody
              srcDoc={previewHtml || undefined}
              className="size-full bg-background border-none"
            />
            <WebPreviewConsole logs={logs} />
          </div>
        </div>
      </WebPreview>
    </div>
  );
}

export default PreviewStage;
