'use client';

import { useDesignStore } from '@/lib/design-tool/useDesignStore';
import {
  Eye,
  Edit3,
  MousePointer2,
  Hand,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Save,
  Download,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DesignToolbarProps {
  mode: 'view' | 'edit';
  onModeChange: (mode: 'view' | 'edit') => void;
  assetName: string;
  onSave: () => void;
  onExport: (format: 'png' | 'jpeg' | 'svg') => void;
  isSaving: boolean;
  isExporting: boolean;
}

export function DesignToolbar({
  mode,
  onModeChange,
  assetName,
  onSave,
  onExport,
  isSaving,
  isExporting,
}: DesignToolbarProps) {
  const activeTool = useDesignStore((s) => s.activeTool);
  const setActiveTool = useDesignStore((s) => s.setActiveTool);
  const zoom = useDesignStore((s) => s.zoom);
  const setZoom = useDesignStore((s) => s.setZoom);
  const resetViewport = useDesignStore((s) => s.resetViewport);
  const undo = useDesignStore((s) => s.undo);
  const redo = useDesignStore((s) => s.redo);
  const canUndo = useDesignStore((s) => s.canUndo);
  const canRedo = useDesignStore((s) => s.canRedo);
  const isDirty = useDesignStore((s) => s.isDirty);

  return (
    <div className="h-10 border-b border-border/60 bg-card/70 backdrop-blur-sm px-3 flex items-center justify-between gap-2 shrink-0 z-10 select-none">
      {/* Left: View / Edit Mode Switcher + Document Name */}
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => onModeChange('view')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
              mode === 'view'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Preview Stage Mode (Chat on Left)"
          >
            <Eye className="size-3.5 text-primary" />
            <span>View</span>
          </button>

          <button
            type="button"
            onClick={() => onModeChange('edit')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
              mode === 'edit'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Pro Studio Editor Mode (PixiJS & Inspector on Left)"
          >
            <Edit3 className="size-3.5 text-purple-500" />
            <span>Edit</span>
          </button>
        </div>

        {/* Tool Selectors (when in Edit mode) */}
        {mode === 'edit' && (
          <div className="flex items-center rounded-md border border-border/60 bg-muted/40 p-0.5 ml-1">
            <button
              type="button"
              onClick={() => setActiveTool('select')}
              className={cn(
                'p-1 rounded-xs transition',
                activeTool === 'select' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
              )}
              title="Select / Move Tool (V)"
            >
              <MousePointer2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('pan')}
              className={cn(
                'p-1 rounded-xs transition',
                activeTool === 'pan' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
              )}
              title="Pan Tool (H or Spacebar)"
            >
              <Hand className="size-3.5" />
            </button>
          </div>
        )}

        <span className="hidden md:inline-block text-[11px] text-muted-foreground font-mono truncate max-w-xs ml-1">
          {assetName} {isDirty && '•'}
        </span>
      </div>

      {/* Center: Zoom Controls & Undo/Redo */}
      <div className="flex items-center gap-1">
        {mode === 'edit' && (
          <div className="flex items-center gap-0.5 mr-2">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="size-3.5" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.2, Number((z - 0.15).toFixed(2))))}
          className="p-1 rounded text-muted-foreground hover:text-foreground transition"
          title="Zoom Out"
        >
          <ZoomOut className="size-3.5" />
        </button>
        <span className="text-[11px] font-mono text-muted-foreground w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(3, Number((z + 0.15).toFixed(2))))}
          className="p-1 rounded text-muted-foreground hover:text-foreground transition"
          title="Zoom In"
        >
          <ZoomIn className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={resetViewport}
          className="p-1 rounded text-muted-foreground hover:text-foreground transition text-[10px]"
          title="Reset View (100%)"
        >
          Reset
        </button>
      </div>

      {/* Right: Save & Export Actions */}
      <div className="flex items-center gap-1.5">
        {mode === 'edit' && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="h-7 px-2.5 text-xs gap-1 shadow-xs"
          >
            {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3 text-emerald-500" />}
            <span>Save</span>
          </Button>
        )}

        <Button
          variant="default"
          size="sm"
          onClick={() => onExport('png')}
          disabled={isExporting}
          className="h-7 px-2.5 text-xs gap-1"
        >
          {isExporting ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3" />}
          <span>Export</span>
        </Button>
      </div>
    </div>
  );
}

export default DesignToolbar;
