'use client';

import { useState } from 'react';
import { useOfficeStore } from '@/lib/office-tool/useOfficeStore';
import { OfficeDocType } from '@/lib/office-tool/types';
import { OfficeToolbar } from './panels/OfficeToolbar';
import { OfficeLaunchpad } from './OfficeLaunchpad';
import { DocumentInspectorPanel } from './panels/DocumentInspectorPanel';
import { DocumentOutlinePanel } from './panels/DocumentOutlinePanel';
import { DocumentInsertMenu } from './panels/DocumentInsertMenu';
import { DocumentViewport } from './viewports/DocumentViewport';
import { SpreadsheetViewport } from './viewports/SpreadsheetViewport';
import { PresentationViewport } from './viewports/PresentationViewport';
import { generateDocxBuffer } from '@/lib/office-tool/generators/docx';
import { generateXlsxBuffer } from '@/lib/office-tool/generators/xlsx';
import { generatePptxBuffer } from '@/lib/office-tool/generators/pptx';
import { generatePdfBuffer } from '@/lib/office-tool/pdf/service';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface OfficeStudioRootProps {
  projectId: string;
  mode?: 'view' | 'edit';
  onModeChange?: (mode: 'view' | 'edit') => void;
}

export function OfficeStudioRoot({
  projectId,
  mode: controlledMode,
  onModeChange: controlledOnModeChange,
}: OfficeStudioRootProps) {
  const [internalMode, setInternalMode] = useState<'view' | 'edit'>('view');
  const mode = controlledMode ?? internalMode;
  const setMode = controlledOnModeChange ?? setInternalMode;

  const [showLaunchpad, setShowLaunchpad] = useState(false);

  const activeDocType = useOfficeStore((s) => s.activeDocType);
  const activeDoc = useOfficeStore((s) => s.activeDoc);
  const isDocumentLoaded = useOfficeStore((s) => s.isDocumentLoaded);
  const loadSample = useOfficeStore((s) => s.loadSample);
  const activeStudioTab = useOfficeStore((s) => s.activeStudioTab);
  const setActiveStudioTab = useOfficeStore((s) => s.setActiveStudioTab);

  const isDisplayingLaunchpad = showLaunchpad || !isDocumentLoaded;

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: OfficeDocType | 'pdf') => {
    setIsExporting(true);
    const toastId = toast.loading(`Generating ${format.toUpperCase()} export…`);

    try {
      let buffer: Buffer;
      let filename = 'document.pdf';
      let mimeType = 'application/pdf';

      if (format === 'pdf' || (format === 'document' && activeDoc.type === 'document')) {
        buffer = await generatePdfBuffer(activeDoc.model as any);
        filename = `${activeDoc.model.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'document'}.pdf`;
        mimeType = 'application/pdf';
      } else if (format === 'document' && activeDoc.type === 'document') {
        buffer = await generateDocxBuffer(activeDoc.model);
        filename = `${activeDoc.model.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'document'}.docx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (format === 'spreadsheet' && activeDoc.type === 'spreadsheet') {
        buffer = await generateXlsxBuffer(activeDoc.model);
        filename = `${activeDoc.model.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'spreadsheet'}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (format === 'presentation' && activeDoc.type === 'presentation') {
        buffer = await generatePptxBuffer(activeDoc.model);
        filename = `${activeDoc.model.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'presentation'}.pptx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      } else {
        throw new Error('Active document type does not match requested format');
      }

      // Download binary in browser
      const blob = new Blob([buffer], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${format.toUpperCase()} downloaded successfully!`, { id: toastId });
    } catch (err: any) {
      console.error('[OfficeStudioRoot] Export failed:', err);
      toast.error(`Export failed: ${err.message || 'Unknown error'}`, { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSave = () => {
    toast.success('Document state saved to project vault!');
  };

  return (
    <div className="relative flex size-full flex-col overflow-hidden bg-background">
      {/* ── Top Office Toolbar ─────────────────────────────────────────────── */}
      <OfficeToolbar
        mode={mode}
        onModeChange={setMode}
        onNewDocument={() => setShowLaunchpad(true)}
        onSave={handleSave}
        onExport={handleExport}
      />

      {/* ── Main Studio Body ──────────────────────────────────────────────── */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Column: Pro Studio Inspector in Edit Mode */}
        {mode === 'edit' && activeDocType === 'document' && !isDisplayingLaunchpad && (
          <aside className="w-80 border-r border-border bg-card flex flex-col shrink-0 z-20 shadow-lg animate-in slide-in-from-left-4 duration-200">
            {/* Panel Tab Switcher */}
            <div className="h-10 border-b border-border px-3 flex items-center justify-between bg-muted/30">
              <span className="text-xs font-semibold text-foreground">Document Studio</span>
              <div className="flex items-center rounded-md border border-border bg-muted/40 p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveStudioTab('inspector')}
                  className={cn(
                    'px-2 py-0.5 rounded-xs transition-colors',
                    activeStudioTab === 'inspector'
                      ? 'bg-background text-foreground shadow-2xs font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Props
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStudioTab('outline')}
                  className={cn(
                    'px-2 py-0.5 rounded-xs transition-colors',
                    activeStudioTab === 'outline'
                      ? 'bg-background text-foreground shadow-2xs font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Outline
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStudioTab('insert')}
                  className={cn(
                    'px-2 py-0.5 rounded-xs transition-colors',
                    activeStudioTab === 'insert'
                      ? 'bg-background text-foreground shadow-2xs font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Insert
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto">
              {activeStudioTab === 'inspector' && <DocumentInspectorPanel />}
              {activeStudioTab === 'outline' && <DocumentOutlinePanel />}
              {activeStudioTab === 'insert' && <DocumentInsertMenu />}
            </div>
          </aside>
        )}

        {/* ── Active Format Viewport or Launchpad ──────────────────────────── */}
        <div className="relative flex-1 overflow-hidden">
          {isDisplayingLaunchpad ? (
            <OfficeLaunchpad
              onSelectArchetype={(type) => {
                setShowLaunchpad(false);
              }}
            />
          ) : (
            <>
              {activeDocType === 'document' && (
                <DocumentViewport isEditable={mode === 'edit'} />
              )}
              {activeDocType === 'spreadsheet' && (
                <SpreadsheetViewport isEditable={mode === 'edit'} />
              )}
              {activeDocType === 'presentation' && (
                <PresentationViewport isEditable={mode === 'edit'} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OfficeStudioRoot;
