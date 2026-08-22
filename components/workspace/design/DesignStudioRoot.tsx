'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDesignStore } from '@/lib/design-tool/useDesignStore';
import { DesignToolbar } from './panels/DesignToolbar';
import { PixiCanvasViewport } from './canvas/PixiCanvasViewport';
import { ElementInspector } from './panels/ElementInspector';
import { LayerTreePanel } from './panels/LayerTreePanel';
import { InsertElementMenu } from './panels/InsertElementMenu';
import { Sliders, Layers, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface DesignStudioRootProps {
  svgUrl: string;
  assetId: string;
  assetName: string;
  projectId: string;
  mode: 'view' | 'edit';
  onModeChange: (mode: 'view' | 'edit') => void;
}

export function DesignStudioRoot({
  svgUrl,
  assetId,
  assetName,
  projectId,
  mode,
  onModeChange,
}: DesignStudioRootProps) {
  const loadFromSvg = useDesignStore((s) => s.loadFromSvg);
  const getSvgString = useDesignStore((s) => s.getSvgString);
  const isDirty = useDesignStore((s) => s.isDirty);
  const zoom = useDesignStore((s) => s.zoom);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState<'inspector' | 'layers' | 'insert'>('inspector');
  const [viewSvgMarkup, setViewSvgMarkup] = useState<string | null>(null);

  // ── Load SVG Into Living Scene Graph Store ────────────────────────────────

  const loadDocument = useCallback(async () => {
    setIsLoading(true);
    try {
      let content: string | null = null;

      // Check canvas cache first
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`);
        if (res.ok) {
          const json = await res.json();
          const canvasData = json?.data?.canvasData;
          if (typeof canvasData === 'string' && canvasData.trim().startsWith('<svg')) {
            content = canvasData;
          }
        }
      } catch {}

      if (!content) {
        const res = await fetch(svgUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        content = await res.text();
      }

      loadFromSvg(content, assetId, assetName);
      setViewSvgMarkup(content);
      setIsLoading(false);
    } catch (err) {
      console.error('[DesignStudioRoot] Failed to load SVG:', err);
      setIsLoading(false);
      toast.error('Failed to load SVG into Design Tool');
    }
  }, [svgUrl, assetId, assetName, projectId, loadFromSvg]);

  useEffect(() => {
    void loadDocument();
  }, [loadDocument]);

  // ── Save Scene Graph to Canvas Cache and DB ────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const svgString = getSvgString();

      await fetch(`/api/projects/${projectId}/canvas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasData: svgString }),
      });

      setViewSvgMarkup(svgString);
      toast.success('Design changes saved');
    } catch (err) {
      console.error('[DesignStudioRoot] Save failed:', err);
      toast.error('Failed to save design');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Export Output ─────────────────────────────────────────────────────────

  const handleExport = async (format: 'png' | 'jpeg' | 'svg') => {
    setIsExporting(true);
    try {
      const svgString = getSvgString();

      if (format === 'svg') {
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = assetName.endsWith('.svg') ? assetName : `${assetName}.svg`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Exported SVG file');
      } else {
        const res = await fetch(`/api/projects/${projectId}/export`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assetId,
            format,
            scale: 2,
          }),
        });

        if (!res.ok) throw new Error('Export failed');
        const json = await res.json();
        if (json.data?.url) {
          window.open(json.data.url, '_blank');
        }
        toast.success(`Exported as ${format.toUpperCase()} @2x`);
      }
    } catch (err) {
      console.error('[DesignStudioRoot] Export failed:', err);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative flex size-full bg-background overflow-hidden">
      {/* ── Left Column: Pro Studio Inspector (evolved workspace in Edit mode) ── */}
      {mode === 'edit' && (
        <aside className="w-80 border-r border-border bg-card flex flex-col shrink-0 z-20 shadow-lg animate-in slide-in-from-left-4 duration-200">
          {/* Panel Tab Switcher */}
          <div className="h-10 border-b border-border px-3 flex items-center justify-between bg-muted/30">
            <span className="text-xs font-semibold text-foreground">Design Studio</span>
            <div className="flex items-center rounded-md border border-border bg-muted/40 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveSideTab('inspector')}
                className={cn(
                  'px-2 py-0.5 rounded-xs transition-colors',
                  activeSideTab === 'inspector' ? 'bg-background text-foreground shadow-2xs font-medium' : 'text-muted-foreground'
                )}
              >
                Props
              </button>
              <button
                type="button"
                onClick={() => setActiveSideTab('layers')}
                className={cn(
                  'px-2 py-0.5 rounded-xs transition-colors',
                  activeSideTab === 'layers' ? 'bg-background text-foreground shadow-2xs font-medium' : 'text-muted-foreground'
                )}
              >
                Layers
              </button>
              <button
                type="button"
                onClick={() => setActiveSideTab('insert')}
                className={cn(
                  'px-2 py-0.5 rounded-xs transition-colors',
                  activeSideTab === 'insert' ? 'bg-background text-foreground shadow-2xs font-medium' : 'text-muted-foreground'
                )}
              >
                Insert
              </button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {activeSideTab === 'inspector' && <ElementInspector />}
            {activeSideTab === 'layers' && <LayerTreePanel />}
            {activeSideTab === 'insert' && <InsertElementMenu />}
          </div>
        </aside>
      )}

      {/* ── Main Canvas Surface ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-background relative">
        <DesignToolbar
          mode={mode}
          onModeChange={onModeChange}
          assetName={assetName}
          onSave={handleSave}
          onExport={handleExport}
          isSaving={isSaving}
          isExporting={isExporting}
        />

        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-muted/10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-xs">Loading Vector Scene Graph…</span>
            </div>
          ) : mode === 'edit' ? (
            <PixiCanvasViewport isEditable={true} />
          ) : (
            <div
              className="flex size-full items-center justify-center p-8 overflow-auto select-none"
            >
              {viewSvgMarkup ? (
                <div
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                  className="rounded-xl shadow-2xl overflow-hidden border border-border/80 bg-background transition-transform duration-150"
                  dangerouslySetInnerHTML={{ __html: viewSvgMarkup }}
                />
              ) : null}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default DesignStudioRoot;
