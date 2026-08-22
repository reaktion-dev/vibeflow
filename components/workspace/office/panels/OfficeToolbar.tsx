'use client';

import { useOfficeStore } from '@/lib/office-tool/useOfficeStore';
import { OfficeDocType, OfficeThemeName, OFFICE_THEMES } from '@/lib/office-tool/types';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Table as TableIcon,
  Presentation,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Save,
  Palette,
  Eye,
  Edit3,
  Plus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface OfficeToolbarProps {
  mode: 'view' | 'edit';
  onModeChange: (mode: 'view' | 'edit') => void;
  onNewDocument?: () => void;
  onSave?: () => void;
  onExport?: (format: OfficeDocType) => void;
  isSaving?: boolean;
}

export function OfficeToolbar({
  mode,
  onModeChange,
  onNewDocument,
  onSave,
  onExport,
  isSaving = false,
}: OfficeToolbarProps) {
  const activeDocType = useOfficeStore((s) => s.activeDocType);
  const activeDoc = useOfficeStore((s) => s.activeDoc);
  const loadSample = useOfficeStore((s) => s.loadSample);
  const zoom = useOfficeStore((s) => s.zoom);
  const setZoom = useOfficeStore((s) => s.setZoom);
  const isDirty = useOfficeStore((s) => s.isDirty);
  const canUndo = useOfficeStore((s) => s.canUndo);
  const canRedo = useOfficeStore((s) => s.canRedo);
  const undo = useOfficeStore((s) => s.undo);
  const redo = useOfficeStore((s) => s.redo);
  const updateWordSection = useOfficeStore((s) => s.updateWordSection);

  const docTitle = activeDoc?.model?.title || 'Untitled Document';
  const currentTheme = (activeDoc?.model as any)?.theme || 'corporate-navy';

  const handleThemeChange = (themeName: OfficeThemeName) => {
    const store = useOfficeStore.getState();
    const doc = store.activeDoc;
    if (doc) {
      store.loadDocument({
        ...doc,
        model: {
          ...doc.model,
          theme: themeName,
        } as any,
      });
    }
  };

  const Icon =
    activeDocType === 'document'
      ? FileText
      : activeDocType === 'spreadsheet'
      ? TableIcon
      : Presentation;

  const formatColor =
    activeDocType === 'document'
      ? 'text-blue-500'
      : activeDocType === 'spreadsheet'
      ? 'text-emerald-500'
      : 'text-amber-500';

  return (
    <div className="flex h-12 w-full items-center justify-between border-b border-border/80 bg-background/95 px-4 backdrop-blur-md z-30">
      {/* ── Left: New Document CTA + Active Document Title ─────────────────── */}
      <div className="flex items-center gap-3">
        {onNewDocument && (
          <Button
            variant="outline"
            size="xs"
            onClick={onNewDocument}
            className="gap-1.5 text-xs font-semibold shadow-2xs border-dashed"
            title="Create or choose a new document archetype"
          >
            <Plus className="size-3.5 text-primary" />
            <span>New</span>
          </Button>
        )}

        <div className="flex items-center gap-2 max-w-[320px] truncate">
          <Icon className={cn('size-4 shrink-0', formatColor)} />
          <span className="text-xs font-semibold text-foreground truncate" title={docTitle}>
            {docTitle}
          </span>
          {isDirty && (
            <span className="size-1.5 rounded-full bg-amber-500 shrink-0" title="Unsaved changes" />
          )}
        </div>
      </div>

      {/* ── Center: View / Edit Mode Switcher ──────────────────────────────── */}
      <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5 shadow-2xs">
        <button
          onClick={() => onModeChange('view')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all',
            mode === 'view'
              ? 'bg-background text-primary shadow-2xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Eye className="size-3.5" />
          <span>View</span>
        </button>

        <button
          onClick={() => onModeChange('edit')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all',
            mode === 'edit'
              ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Edit3 className="size-3.5" />
          <span>Edit</span>
        </button>
      </div>

      {/* ── Right: Theme, Undo/Redo, Zoom, Save & Export ──────────────────── */}
      <div className="flex items-center gap-2">
        {/* Theme Picker Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="xs"
              className="gap-1 text-xs text-muted-foreground hover:text-foreground"
              title="Change Corporate Theme"
            >
              <Palette className="size-3.5" />
              <span className="hidden sm:inline capitalize">
                {currentTheme.replace('-', ' ')}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">
              Color & Style Theme
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.values(OFFICE_THEMES).map((th) => (
              <DropdownMenuItem
                key={th.name}
                onClick={() => handleThemeChange(th.name)}
                className="flex items-center justify-between text-xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-full border border-black/20"
                    style={{ backgroundColor: th.primary }}
                  />
                  <span>{th.label}</span>
                </div>
                {currentTheme === th.name && (
                  <span className="text-2xs text-primary font-bold">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Undo / Redo (Shown in Edit mode) */}
        {mode === 'edit' && (
          <div className="flex items-center gap-0.5 border-r border-border/60 pr-2">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="size-3.5" />
            </Button>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 border-r border-border/60 pr-2">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
            title="Zoom Out"
          >
            <ZoomOut className="size-3.5" />
          </Button>

          <span className="text-2xs font-mono font-medium text-muted-foreground w-9 text-center">
            {Math.round(zoom * 100)}%
          </span>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setZoom((z) => Math.min(2.0, Number((z + 0.1).toFixed(1))))}
            title="Zoom In"
          >
            <ZoomIn className="size-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setZoom(1)}
            title="Reset Zoom"
          >
            <RotateCcw className="size-3" />
          </Button>
        </div>

        {/* Save */}
        {onSave && (
          <Button
            variant="outline"
            size="xs"
            onClick={onSave}
            disabled={isSaving}
            className="gap-1.5 text-xs font-medium"
          >
            <Save className="size-3.5 text-muted-foreground" />
            <span>Save</span>
          </Button>
        )}

        {/* Export / Download */}
        <Button
          variant="default"
          size="xs"
          onClick={() => onExport?.(activeDocType)}
          className="gap-1.5 text-xs font-semibold shadow-xs"
        >
          <Download className="size-3.5" />
          <span>
            Export {activeDocType === 'document' ? 'PDF' : activeDocType === 'spreadsheet' ? 'XLSX' : 'PPTX'}
          </span>
        </Button>
      </div>
    </div>
  );
}

export default OfficeToolbar;
