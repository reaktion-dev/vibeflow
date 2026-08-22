'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Eye,
  Edit3,
  Layers,
  Palette,
  Download,
  Save,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Type,
  Square,
  Sparkles,
  Loader2,
  Check,
  RefreshCw,
  Sliders,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface VectorDesignStudioProps {
  svgUrl: string;
  assetId: string;
  assetName: string;
  projectId: string;
  mode: 'view' | 'edit';
  onModeChange: (mode: 'view' | 'edit') => void;
}

interface LayerItem {
  id: string;
  name: string;
  visible: boolean;
  elementCount: number;
}

interface SelectedElementState {
  id: string;
  tagName: string;
  name?: string;
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  rx?: number;
}

const THEME_PRESETS = [
  { name: 'Dark Navy', bg: '#0B132B', accent: '#3B82F6' },
  { name: 'Obsidian', bg: '#09090b', accent: '#A855F7' },
  { name: 'Cyberpunk', bg: '#0A0612', accent: '#22D3EE' },
  { name: 'Sunset', bg: '#180B26', accent: '#FB7185' },
  { name: 'Clean Light', bg: '#FFFFFF', accent: '#2563EB' },
];

export function VectorDesignStudio({
  svgUrl,
  assetId,
  assetName,
  projectId,
  mode,
  onModeChange,
}: VectorDesignStudioProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);

  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Inspector & Layer state
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedElement, setSelectedElement] = useState<SelectedElementState | null>(null);
  const [activeTab, setActiveTab] = useState<'layers' | 'inspector' | 'palette'>('inspector');

  // ── 1. Fetch SVG Markup (From Canvas Cache or Asset API) ───────────────────

  const loadSvg = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSelectedElement(null);

    try {
      // Check saved canvas data first
      let content: string | null = null;
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`);
        if (res.ok) {
          const json = await res.json();
          const canvasData = json?.data?.canvasData;
          if (typeof canvasData === 'string' && canvasData.trim().startsWith('<svg')) {
            content = canvasData;
          }
        }
      } catch {
        // Fall back to asset URL
      }

      if (!content) {
        const res = await fetch(svgUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        content = await res.text();
      }

      setSvgMarkup(content);
      setIsLoading(false);
    } catch (err: any) {
      console.error('[VectorDesignStudio] Failed to load SVG:', err);
      setError('Failed to load SVG design');
      setIsLoading(false);
    }
  }, [svgUrl, projectId]);

  useEffect(() => {
    void loadSvg();
  }, [loadSvg]);

  // ── 2. Parse Layers from SVG DOM ───────────────────────────────────────────

  useEffect(() => {
    if (!svgMarkup || !svgWrapperRef.current) return;

    const svgEl = svgWrapperRef.current.querySelector('svg');
    if (!svgEl) return;

    const groupEls = Array.from(svgEl.querySelectorAll(':scope > g'));
    if (groupEls.length > 0) {
      const parsedLayers: LayerItem[] = groupEls.map((g, idx) => {
        const id = g.getAttribute('id') || `layer-${idx}`;
        const name =
          id.replace(/^layer-/, '').replace(/-/g, ' ').toUpperCase() || `Layer ${idx + 1}`;
        const visible = g.getAttribute('display') !== 'none';
        return {
          id,
          name,
          visible,
          elementCount: g.children.length,
        };
      });
      setLayers(parsedLayers);
    } else {
      setLayers([
        {
          id: 'root-layer',
          name: 'Main Content',
          visible: true,
          elementCount: svgEl.children.length,
        },
      ]);
    }
  }, [svgMarkup]);

  // ── 3. Interactive Element Selection in Edit Mode ──────────────────────────

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'edit') return;

    const target = e.target as SVGElement;
    if (!target || target.tagName.toLowerCase() === 'svg') {
      setSelectedElement(null);
      return;
    }

    const tagName = target.tagName.toLowerCase();
    const id = target.getAttribute('id') || `${tagName}-${Date.now().toString(36)}`;
    target.setAttribute('id', id);

    let text: string | undefined;
    let fontSize: number | undefined;
    if (tagName === 'text' || tagName === 'tspan') {
      text = target.textContent || '';
      const fs = target.getAttribute('font-size') || window.getComputedStyle(target).fontSize;
      fontSize = parseFloat(fs) || 16;
    }

    const fill = target.getAttribute('fill') || '#ffffff';
    const stroke = target.getAttribute('stroke') || '';
    const strokeWidth = parseFloat(target.getAttribute('stroke-width') || '0');
    const opacity = parseFloat(target.getAttribute('opacity') || '1');
    const rx = parseFloat(target.getAttribute('rx') || '0');

    setSelectedElement({
      id,
      tagName,
      text,
      fill,
      stroke,
      strokeWidth,
      opacity,
      fontSize,
      rx,
    });
    setActiveTab('inspector');
  };

  // ── 4. Apply Element Changes to SVG DOM ─────────────────────────────────────

  const updateElementProperty = (key: keyof SelectedElementState, value: any) => {
    if (!selectedElement || !svgWrapperRef.current) return;

    const el = svgWrapperRef.current.querySelector(`#${selectedElement.id}`) as SVGElement | null;
    if (!el) return;

    if (key === 'text') {
      el.textContent = value;
    } else if (key === 'fill') {
      el.setAttribute('fill', value);
    } else if (key === 'stroke') {
      el.setAttribute('stroke', value);
    } else if (key === 'strokeWidth') {
      el.setAttribute('stroke-width', value.toString());
    } else if (key === 'opacity') {
      el.setAttribute('opacity', value.toString());
    } else if (key === 'fontSize') {
      el.setAttribute('font-size', value.toString());
    } else if (key === 'rx') {
      el.setAttribute('rx', value.toString());
    }

    setSelectedElement((prev) => (prev ? { ...prev, [key]: value } : null));

    // Update parent SVG string state
    const svgEl = svgWrapperRef.current.querySelector('svg');
    if (svgEl) {
      setSvgMarkup(svgEl.outerHTML);
    }
  };

  // ── 5. Toggle Layer Visibility ─────────────────────────────────────────────

  const toggleLayerVisibility = (layerId: string) => {
    if (!svgWrapperRef.current) return;

    const groupEl = svgWrapperRef.current.querySelector(`#${layerId}`) as SVGElement | null;
    if (!groupEl) return;

    const isCurrentlyVisible = groupEl.getAttribute('display') !== 'none';
    const nextVisibility = !isCurrentlyVisible;

    if (nextVisibility) {
      groupEl.removeAttribute('display');
    } else {
      groupEl.setAttribute('display', 'none');
    }

    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: nextVisibility } : l))
    );

    const svgEl = svgWrapperRef.current.querySelector('svg');
    if (svgEl) {
      setSvgMarkup(svgEl.outerHTML);
    }
  };

  // ── 6. Save Canvas Edits ───────────────────────────────────────────────────

  const handleSave = async () => {
    if (!svgMarkup) return;
    setIsSaving(true);

    try {
      // 1. Save to Canvas API route
      await fetch(`/api/projects/${projectId}/canvas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasData: svgMarkup }),
      });

      toast.success('Design changes saved to Artifact Vault');
    } catch (err) {
      console.error('[VectorDesignStudio] Save failed:', err);
      toast.error('Failed to save design');
    } finally {
      setIsSaving(false);
    }
  };

  // ── 7. Export SVG to PNG / SVG / JPEG ─────────────────────────────────────

  const handleExport = async (format: 'png' | 'jpeg' | 'svg') => {
    if (!svgMarkup) return;
    setIsExporting(true);

    try {
      if (format === 'svg') {
        const blob = new Blob([svgMarkup], { type: 'image/svg+xml' });
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
      console.error('[VectorDesignStudio] Export error:', err);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative flex size-full bg-background overflow-hidden">
      {/* ── Left Column: Pro Studio Tools & Inspector Panel (when in Edit mode) ── */}
      {mode === 'edit' && (
        <aside className="w-80 border-r border-border bg-card flex flex-col shrink-0 z-20 shadow-lg animate-in slide-in-from-left-4 duration-200">
          {/* Studio Panel Header */}
          <div className="h-10 border-b border-border px-3 flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-1.5">
              <Sliders className="size-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">Design Inspector</span>
            </div>
            <div className="flex items-center rounded-md border border-border bg-muted/40 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveTab('inspector')}
                className={cn(
                  'px-2 py-0.5 rounded-xs transition-colors',
                  activeTab === 'inspector' ? 'bg-background text-foreground shadow-2xs font-medium' : 'text-muted-foreground'
                )}
              >
                Props
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('layers')}
                className={cn(
                  'px-2 py-0.5 rounded-xs transition-colors',
                  activeTab === 'layers' ? 'bg-background text-foreground shadow-2xs font-medium' : 'text-muted-foreground'
                )}
              >
                Layers
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('palette')}
                className={cn(
                  'px-2 py-0.5 rounded-xs transition-colors',
                  activeTab === 'palette' ? 'bg-background text-foreground shadow-2xs font-medium' : 'text-muted-foreground'
                )}
              >
                Theme
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
            {/* 1. Element Inspector Tab */}
            {activeTab === 'inspector' && (
              <div className="space-y-4">
                {selectedElement ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground capitalize flex items-center gap-1.5">
                        {selectedElement.tagName === 'text' || selectedElement.tagName === 'tspan' ? (
                          <Type className="size-3.5 text-primary" />
                        ) : (
                          <Square className="size-3.5 text-primary" />
                        )}
                        {selectedElement.tagName} Element
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        #{selectedElement.id.slice(0, 10)}
                      </span>
                    </div>

                    {/* Text Content Editor */}
                    {(selectedElement.tagName === 'text' || selectedElement.tagName === 'tspan') && (
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-muted-foreground">Text Content</Label>
                        <Input
                          value={selectedElement.text || ''}
                          onChange={(e) => updateElementProperty('text', e.target.value)}
                          className="h-8 text-xs font-medium"
                        />
                      </div>
                    )}

                    {/* Font Size */}
                    {(selectedElement.tagName === 'text' || selectedElement.tagName === 'tspan') && (
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-muted-foreground">Font Size (px)</Label>
                        <Input
                          type="number"
                          value={selectedElement.fontSize || 16}
                          onChange={(e) => updateElementProperty('fontSize', Number(e.target.value))}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    )}

                    {/* Fill Color */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">Fill Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedElement.fill?.startsWith('#') ? selectedElement.fill : '#ffffff'}
                          onChange={(e) => updateElementProperty('fill', e.target.value)}
                          className="size-7 rounded border border-border cursor-pointer bg-transparent"
                        />
                        <Input
                          value={selectedElement.fill || ''}
                          onChange={(e) => updateElementProperty('fill', e.target.value)}
                          className="h-7 text-xs font-mono flex-1"
                        />
                      </div>
                    </div>

                    {/* Stroke Color */}
                    {selectedElement.tagName !== 'text' && (
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-muted-foreground">Stroke / Border</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedElement.stroke?.startsWith('#') ? selectedElement.stroke : '#000000'}
                            onChange={(e) => updateElementProperty('stroke', e.target.value)}
                            className="size-7 rounded border border-border cursor-pointer bg-transparent"
                          />
                          <Input
                            value={selectedElement.stroke || ''}
                            onChange={(e) => updateElementProperty('stroke', e.target.value)}
                            className="h-7 text-xs font-mono flex-1"
                          />
                        </div>
                      </div>
                    )}

                    {/* Opacity Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Opacity</span>
                        <span className="font-mono">{Math.round((selectedElement.opacity ?? 1) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={selectedElement.opacity ?? 1}
                        onChange={(e) => updateElementProperty('opacity', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground rounded-lg border border-dashed border-border/60">
                    <Square className="size-6 mx-auto mb-2 text-muted-foreground/60" />
                    <p className="font-medium text-foreground text-xs">No Element Selected</p>
                    <p className="text-[11px] mt-1 text-muted-foreground">
                      Click any element, text, or shape in the canvas to inspect and edit properties.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. Layers Tree Tab */}
            {activeTab === 'layers' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-border/40">
                  <span className="text-[11px] font-semibold text-muted-foreground">SVG Layers</span>
                  <Badge variant="outline" className="text-[10px]">{layers.length} groups</Badge>
                </div>
                <div className="space-y-1">
                  {layers.map((layer) => (
                    <div
                      key={layer.id}
                      className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Layers className="size-3.5 text-primary shrink-0" />
                        <span className="font-medium truncate text-foreground">{layer.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleLayerVisibility(layer.id)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                        title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                      >
                        {layer.visible ? <Eye className="size-3.5 text-primary" /> : <EyeOff className="size-3.5 opacity-40" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Theme Preset Tab */}
            {activeTab === 'palette' && (
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground">Theme Presets</span>
                <div className="space-y-1.5">
                  {THEME_PRESETS.map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => {
                        toast.success(`Applied ${t.name} Theme`);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg border border-border/50 bg-background hover:border-primary/40 transition-all text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="size-3 rounded-full border border-border shrink-0" style={{ backgroundColor: t.accent }} />
                        <span className="font-medium text-foreground">{t.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">{t.bg}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* ── Main Canvas Surface ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-background">
        {/* Unified Studio Stage Toolbar */}
        <div className="h-10 border-b border-border/60 bg-card/70 backdrop-blur-sm px-3 flex items-center justify-between gap-2 shrink-0 z-10">
          {/* Left: View / Edit Toggle Pill + Asset Name */}
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
                title="Pro Studio Editor Mode (Inspector on Left)"
              >
                <Edit3 className="size-3.5 text-purple-500" />
                <span>Edit</span>
              </button>
            </div>

            <span className="hidden md:inline-block text-[11px] text-muted-foreground font-mono truncate max-w-xs">
              {assetName}
            </span>
          </div>

          {/* Center: Zoom Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))))}
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
              onClick={() => setZoom(1)}
              className="p-1 rounded text-muted-foreground hover:text-foreground transition text-[10px]"
              title="Reset Zoom"
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
                onClick={handleSave}
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
              onClick={() => handleExport('png')}
              disabled={isExporting}
              className="h-7 px-2.5 text-xs gap-1"
            >
              {isExporting ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3" />}
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Live Canvas Area */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-auto flex items-center justify-center p-4 sm:p-8 bg-muted/20 select-none"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-xs">Rendering SVG Design…</span>
            </div>
          ) : error ? (
            <div className="text-center text-destructive text-xs p-4">
              <p className="font-semibold">{error}</p>
              <Button variant="outline" size="sm" onClick={loadSvg} className="mt-2 text-xs">
                Retry
              </Button>
            </div>
          ) : svgMarkup ? (
            <div
              ref={svgWrapperRef}
              onClick={handleCanvasClick}
              className={cn(
                'transition-transform duration-150 rounded-xl shadow-2xl overflow-hidden border border-border/80 bg-background relative',
                mode === 'edit' && 'cursor-crosshair'
              )}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
              }}
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default VectorDesignStudio;
