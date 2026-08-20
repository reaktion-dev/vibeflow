'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Application,
  Container,
  Graphics,
  Text as PixiText,
  Sprite,
  Texture,
  TextStyle,
} from 'pixi.js';
import {
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Palette,
  Download,
  Save,
  MousePointer2,
  Hand,
  Type,
  Image as ImageIcon,
  Square,
  Spline,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface VectorMiniEditorProps {
  /** URL that returns the SVG string (the asset API route) */
  svgUrl: string;
  /** Asset ID — used for export */
  assetId: string;
  /** Project ID — used for saving canvas data + export */
  projectId: string;
}

type Tool = 'select' | 'pan';
type ElementType = 'path' | 'rect' | 'image' | 'text';

interface ElementEntry {
  id: string;
  type: ElementType;
  name: string;
  visible: boolean;
  /** The SVG DOM element — edits mutate this for export */
  domElement: SVGElement;
  /** The PixiJS display object for rendering */
  displayObject: Container | Graphics | Sprite | PixiText | null;
}

interface LayerEntry {
  id: string;
  name: string;
  visible: boolean;
  container: Container;
  elements: ElementEntry[];
}

/**
 * PixiJS-rendered vector mini-editor (EXT-010).
 *
 * Handles all composed-SVG element types:
 * - <path> → Graphics (vector paths from tracing)
 * - <rect> → Graphics (shapes, cards, backgrounds)
 * - <image> → Sprite (raster backgrounds, fetched images)
 * - <text> → PixiJS Text (headlines, body text)
 *
 * The SVG is parsed with the browser's DOMParser into a retained DOM tree.
 * Edits (visibility, fill, opacity, text) mutate the DOM, so export is just
 * serialization — no lossy round-trip through graphicsContextToSvg.
 */
export function VectorMiniEditor({ svgUrl, assetId, projectId }: VectorMiniEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const rootContainerRef = useRef<Container | null>(null);
  const svgDocRef = useRef<Document | null>(null);
  const layersRef = useRef<LayerEntry[]>([]);
  const elementsMapRef = useRef<Map<string, ElementEntry>>(new Map());

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layers, setLayers] = useState<LayerEntry[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Style state (adapted to selected element type)
  const [fillColor, setFillColor] = useState('#ff0000');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [opacity, setOpacity] = useState(1);
  const [textValue, setTextValue] = useState('');
  const [fontSize, setFontSize] = useState(16);

  // ─── Initialize PixiJS Application ────────────────────────────────────────────

  useEffect(() => {
    let destroyed = false;

    async function initApp() {
      if (!canvasRef.current) return;

      const app = new Application();
      await app.init({
        canvas: canvasRef.current,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
        resizeTo: canvasRef.current.parentElement ?? undefined,
      });

      if (destroyed) {
        app.destroy(true);
        return;
      }

      appRef.current = app;

      const container = new Container();
      app.stage.addChild(container);
      rootContainerRef.current = container;
    }

    initApp().catch((err) => {
      console.error('[mini-editor] PixiJS init failed:', err);
      setError('Failed to initialize WebGL canvas');
      setIsLoading(false);
    });

    return () => {
      destroyed = true;
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
      rootContainerRef.current = null;
      layersRef.current = [];
      elementsMapRef.current.clear();
    };
  }, []);

  // ─── Load & Parse SVG ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!svgUrl || !appRef.current || !rootContainerRef.current) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch(svgUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(async (svgString) => {
        if (cancelled) return;

        const app = appRef.current!;
        const rootContainer = rootContainerRef.current!;

        // Clear previous content
        rootContainer.removeChildren();
        layersRef.current = [];
        elementsMapRef.current.clear();

        // Parse SVG with DOMParser (reliable, handles all element types)
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, 'image/svg+xml');

        const parseError = doc.querySelector('parsererror');
        if (parseError) {
          throw new Error('Invalid SVG: could not parse');
        }

        svgDocRef.current = doc;
        const svgRoot = doc.documentElement;

        // Extract viewBox for sizing
        const viewBox = svgRoot.getAttribute('viewBox') ?? '0 0 1080 1080';
        const [, , vbWidth, vbHeight] = viewBox.split(/[\s,]+/).map(Number);
        const canvasW = vbWidth || 1080;
        const canvasH = vbHeight || 1080;

        // Parse layers (<g> groups) or fall back to treating the root as one layer
        const groupElements = Array.from(svgRoot.querySelectorAll(':scope > g'));
        const layerEntries: LayerEntry[] = [];

        const groupsToProcess =
          groupElements.length > 0
            ? groupElements
            : [svgRoot as unknown as SVGElement];

        for (let i = 0; i < groupsToProcess.length; i++) {
          const groupEl = groupsToProcess[i] as SVGElement;
          const layerId =
            groupEl.getAttribute('id') ?? `layer_${i}`;
          const layerName =
            groupEl.getAttribute('data-name') ?? layerId;

          const layerContainer = new Container();
          layerContainer.label = layerId;
          rootContainer.addChild(layerContainer);

          const elementEntries: ElementEntry[] = [];

          // Process child elements of this group
          const childElements = getEditableChildren(groupEl);
          for (let j = 0; j < childElements.length; j++) {
            const childEl = childElements[j] as SVGElement;
            const tagName = childEl.tagName.toLowerCase();
            const elId = childEl.getAttribute('id') ?? `${layerId}_el_${j}`;
            childEl.setAttribute('id', elId);

            const elementType = tagName as ElementType;
            const displayObject = await createDisplayObject(
              childEl,
              elementType,
              canvasW,
              canvasH
            );

            if (displayObject) {
              layerContainer.addChild(displayObject);
            }

            const entry: ElementEntry = {
              id: elId,
              type: elementType,
              name: getChildName(childEl, elementType, j),
              visible: true,
              domElement: childEl,
              displayObject,
            };
            elementEntries.push(entry);
            elementsMapRef.current.set(elId, entry);
          }

          layerEntries.push({
            id: layerId,
            name: layerName,
            visible: true,
            container: layerContainer,
            elements: elementEntries,
          });
        }

        if (cancelled) return;

        layersRef.current = layerEntries;
        setLayers(layerEntries);
        setIsLoading(false);

        // Fit to view
        fitToView(app, rootContainer, canvasW, canvasH);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[mini-editor] SVG load failed:', err);
        setError(err.message ?? 'Failed to load SVG');
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [svgUrl]);

  // ─── Selection ────────────────────────────────────────────────────────────────

  const selectElement = useCallback((elementId: string) => {
    const entry = elementsMapRef.current.get(elementId);
    if (!entry) return;

    setSelectedElementId(elementId);

    // Sync UI state from the DOM element
    const el = entry.domElement;
    const opacityAttr = el.getAttribute('opacity');
    setOpacity(opacityAttr ? parseFloat(opacityAttr) : 1);

    const fillAttr = el.getAttribute('fill');
    setFillColor(fillAttr && fillAttr !== 'none' ? fillAttr : '#ff0000');

    const strokeAttr = el.getAttribute('stroke');
    setStrokeColor(strokeAttr && strokeAttr !== 'none' ? strokeAttr : '#000000');

    if (entry.type === 'text') {
      setTextValue(el.textContent ?? '');
      const sizeAttr = el.getAttribute('font-size');
      setFontSize(sizeAttr ? parseInt(sizeAttr, 10) : 16);
    }
  }, []);

  // ─── Element visibility toggle ────────────────────────────────────────────────

  const toggleElementVisibility = useCallback((elementId: string) => {
    const entry = elementsMapRef.current.get(elementId);
    if (entry) {
      entry.visible = !entry.visible;
      if (entry.displayObject) {
        entry.displayObject.visible = entry.visible;
      }
    }
    setLayers((prev) =>
      prev.map((l) => ({
        ...l,
        elements: l.elements.map((e) =>
          e.id === elementId ? { ...e, visible: !e.visible } : e
        ),
      }))
    );
  }, []);

  // ─── Layer visibility toggle ──────────────────────────────────────────────────

  const toggleLayerVisibility = useCallback((layerId: string) => {
    const layer = layersRef.current.find((l) => l.id === layerId);
    if (layer) {
      layer.visible = !layer.visible;
      layer.container.visible = layer.visible;
    }
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  }, []);

  // ─── Restyle: fill ────────────────────────────────────────────────────────────

  const applyFill = useCallback(
    (color: string) => {
      setFillColor(color);
      if (!selectedElementId) return;
      const entry = elementsMapRef.current.get(selectedElementId);
      if (!entry) return;

      entry.domElement.setAttribute('fill', color);

      if (entry.type === 'rect' && entry.displayObject instanceof Graphics) {
        rebuildRect(entry);
      } else if (entry.type === 'text' && entry.displayObject instanceof PixiText) {
        entry.displayObject.style.fill = color;
      } else if (entry.type === 'path' && entry.displayObject instanceof Graphics) {
        entry.displayObject.tint = hexToNumber(color);
      }
    },
    [selectedElementId]
  );

  // ─── Restyle: opacity ─────────────────────────────────────────────────────────

  const applyOpacity = useCallback(
    (value: number) => {
      setOpacity(value);
      if (!selectedElementId) return;
      const entry = elementsMapRef.current.get(selectedElementId);
      if (!entry) return;

      entry.domElement.setAttribute('opacity', String(value));
      if (entry.displayObject) {
        entry.displayObject.alpha = value;
      }
    },
    [selectedElementId]
  );

  // ─── Restyle: text content ───────────────────────────────────────────────────

  const applyText = useCallback(
    (text: string) => {
      setTextValue(text);
      if (!selectedElementId) return;
      const entry = elementsMapRef.current.get(selectedElementId);
      if (!entry || entry.type !== 'text') return;

      entry.domElement.textContent = text;
      if (entry.displayObject instanceof PixiText) {
        entry.displayObject.text = text;
      }
    },
    [selectedElementId]
  );

  // ─── Restyle: font size ──────────────────────────────────────────────────────

  const applyFontSize = useCallback(
    (size: number) => {
      setFontSize(size);
      if (!selectedElementId) return;
      const entry = elementsMapRef.current.get(selectedElementId);
      if (!entry || entry.type !== 'text') return;

      entry.domElement.setAttribute('font-size', String(size));
      if (entry.displayObject instanceof PixiText) {
        entry.displayObject.style.fontSize = size;
      }
    },
    [selectedElementId]
  );

  // ─── Zoom ─────────────────────────────────────────────────────────────────────

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!rootContainerRef.current) return;
    e.preventDefault();
    const container = rootContainerRef.current;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(10, Math.max(0.1, container.scale.x * delta));
    container.scale.set(newScale);
    setZoom(newScale);
  }, []);

  // ─── Export edited SVG ───────────────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    if (!svgDocRef.current) return;
    setIsExporting(true);
    try {
      // Serialize the (mutated) DOM back to an SVG string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgDocRef.current.documentElement);

      // Export as raster via the API route
      await fetch(`/api/projects/${projectId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          svgAssetId: assetId,
          name: 'edited-design',
          format: 'png',
          scale: 2,
        }),
      });

      // Also download the edited SVG
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edited-design.svg';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[mini-editor] Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [assetId, projectId]);

  // ─── Save canvas data ────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!svgDocRef.current) return;
    setIsSaving(true);
    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgDocRef.current.documentElement);

      await fetch(`/api/projects/${projectId}/canvas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasData: svgString }),
      });
    } catch (err) {
      console.error('[mini-editor] Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [projectId]);

  // ─── Selected element info ────────────────────────────────────────────────────

  const selectedEntry = selectedElementId
    ? elementsMapRef.current.get(selectedElementId)
    : null;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex h-10 items-center justify-between border-b border-border/40 bg-card/30 px-3">
        <div className="flex items-center gap-1">
          <Button
            variant={activeTool === 'select' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setActiveTool('select')}
            title="Select"
          >
            <MousePointer2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={activeTool === 'pan' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setActiveTool('pan')}
            title="Pan"
          >
            <Hand className="h-3.5 w-3.5" />
          </Button>
          <div className="mx-1 h-4 w-px bg-border/60" />
          <span className="text-[10px] font-mono text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-[11px]"
            disabled={isSaving}
            onClick={handleSave}
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-[11px]"
            disabled={isExporting}
            onClick={handleExport}
          >
            {isExporting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            Export
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div
          className="relative flex-1 overflow-hidden bg-muted/30"
          onWheel={handleWheel}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="text-center text-muted-foreground">
                <p className="text-sm font-medium">{error}</p>
                <p className="mt-1 text-xs">
                  The SVG may contain features unsupported by the renderer.
                </p>
              </div>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className={cn(
              'h-full w-full',
              activeTool === 'pan' ? 'cursor-grab' : 'cursor-default'
            )}
          />
        </div>

        {/* Properties panel */}
        <div className="w-60 border-l border-border/40 bg-card/50 flex flex-col overflow-y-auto">
          {/* Layers */}
          <div className="border-b border-border/40">
            <div className="flex items-center gap-2 px-3 py-2">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                Layers
              </h3>
            </div>
            <div className="max-h-56 overflow-y-auto pb-2">
              {layers.length === 0 ? (
                <p className="px-3 py-2 text-[11px] text-muted-foreground">
                  No layers detected
                </p>
              ) : (
                layers.map((layer) => (
                  <div key={layer.id}>
                    {/* Layer header */}
                    <div className="flex items-center gap-1 px-3 py-1">
                      <button
                        onClick={() => toggleLayerVisibility(layer.id)}
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        {layer.visible ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                      </button>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {layer.name}
                      </span>
                    </div>
                    {/* Elements */}
                    {layer.elements.map((el) => (
                      <div
                        key={el.id}
                        onClick={() => selectElement(el.id)}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 py-1 pl-6 pr-3 text-xs transition-colors',
                          selectedElementId === el.id
                            ? 'bg-primary/10 text-foreground'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        )}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleElementVisibility(el.id);
                          }}
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          {el.visible ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                        </button>
                        <ElementTypeIcon type={el.type} />
                        <span className="truncate">{el.name}</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Style panel — adapts to element type */}
          {selectedEntry && (
            <div className="border-b border-border/40 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                  Style
                </h3>
                <Badge variant="outline" className="ml-auto h-4 px-1 text-[9px] uppercase">
                  {selectedEntry.type}
                </Badge>
              </div>
              <div className="space-y-2.5">
                {/* Text content — text elements only */}
                {selectedEntry.type === 'text' && (
                  <div>
                    <label className="mb-1 block text-[10px] text-muted-foreground">
                      Text
                    </label>
                    <Input
                      value={textValue}
                      onChange={(e) => applyText(e.target.value)}
                      className="h-7 text-[11px]"
                    />
                  </div>
                )}

                {/* Font size — text elements only */}
                {selectedEntry.type === 'text' && (
                  <div>
                    <label className="mb-1 block text-[10px] text-muted-foreground">
                      Font size
                    </label>
                    <Input
                      type="number"
                      value={fontSize}
                      onChange={(e) => applyFontSize(parseInt(e.target.value, 10) || 16)}
                      className="h-7 text-[11px]"
                    />
                  </div>
                )}

                {/* Fill — path, rect, text (not image) */}
                {selectedEntry.type !== 'image' && (
                  <div>
                    <label className="mb-1 block text-[10px] text-muted-foreground">
                      {selectedEntry.type === 'text' ? 'Color' : 'Fill'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={fillColor}
                        onChange={(e) => applyFill(e.target.value)}
                        className="h-7 w-7 cursor-pointer rounded border border-border"
                      />
                      <Input
                        value={fillColor}
                        onChange={(e) => applyFill(e.target.value)}
                        className="h-7 flex-1 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                )}

                {/* Opacity — all types */}
                <div>
                  <label className="mb-1 block text-[10px] text-muted-foreground">
                    Opacity
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={opacity}
                    onChange={(e) => applyOpacity(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="mt-auto p-3">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="h-4 px-1 text-[9px] uppercase">
                SVG
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {layers.reduce((sum, l) => sum + l.elements.length, 0)} element(s)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Get the editable child elements of a group (skips nested <g>, text nodes, etc.)
 */
function getEditableChildren(groupEl: SVGElement): Element[] {
  return Array.from(groupEl.children).filter((child) => {
    const tag = child.tagName.toLowerCase();
    return tag === 'path' || tag === 'rect' || tag === 'image' || tag === 'text';
  });
}

/**
 * Generate a human-readable name for a child element.
 */
function getChildName(el: SVGElement, type: ElementType, index: number): string {
  const dataName = el.getAttribute('data-name');
  if (dataName) return dataName;

  const labels: Record<ElementType, string> = {
    path: `Path ${index + 1}`,
    rect: `Rect ${index + 1}`,
    image: `Image ${index + 1}`,
    text: el.textContent?.slice(0, 20) ?? `Text ${index + 1}`,
  };
  return labels[type];
}

/**
 * Create the appropriate PixiJS display object for an SVG element.
 */
async function createDisplayObject(
  el: SVGElement,
  type: ElementType,
  canvasW: number,
  canvasH: number
): Promise<Container | Graphics | Sprite | PixiText | null> {
  try {
    switch (type) {
      case 'rect':
        return createRectGraphics(el);

      case 'image':
        return await createImageSprite(el);

      case 'text':
        return createTextObject(el);

      case 'path':
        return createPathGraphics(el);

      default:
        return null;
    }
  } catch (err) {
    console.warn(`[mini-editor] Failed to create ${type} display object:`, err);
    return null;
  }
}

/**
 * Create a Graphics object from a <rect> element.
 */
function createRectGraphics(el: SVGElement): Graphics {
  const g = new Graphics();
  const x = parseFloat(el.getAttribute('x') ?? '0');
  const y = parseFloat(el.getAttribute('y') ?? '0');
  const width = parseFloat(el.getAttribute('width') ?? '100');
  const height = parseFloat(el.getAttribute('height') ?? '100');
  const rx = parseFloat(el.getAttribute('rx') ?? '0');
  const fill = el.getAttribute('fill') ?? '#cccccc';
  const opacity = parseFloat(el.getAttribute('opacity') ?? '1');

  if (rx > 0) {
    g.roundRect(x, y, width, height, rx);
  } else {
    g.rect(x, y, width, height);
  }

  if (fill && fill !== 'none') {
    g.fill(hexToNumber(fill));
  }

  const stroke = el.getAttribute('stroke');
  const strokeWidth = parseFloat(el.getAttribute('stroke-width') ?? '0');
  if (stroke && stroke !== 'none' && strokeWidth > 0) {
    g.stroke({ color: hexToNumber(stroke), width: strokeWidth });
  }

  g.alpha = opacity;
  return g;
}

/**
 * Rebuild a rect Graphics object after attribute changes.
 */
function rebuildRect(entry: ElementEntry): void {
  if (!(entry.displayObject instanceof Graphics)) return;
  const oldAlpha = entry.displayObject.alpha;
  entry.displayObject.clear();
  const el = entry.domElement;
  const x = parseFloat(el.getAttribute('x') ?? '0');
  const y = parseFloat(el.getAttribute('y') ?? '0');
  const width = parseFloat(el.getAttribute('width') ?? '100');
  const height = parseFloat(el.getAttribute('height') ?? '100');
  const rx = parseFloat(el.getAttribute('rx') ?? '0');
  const fill = el.getAttribute('fill') ?? '#cccccc';

  if (rx > 0) {
    entry.displayObject.roundRect(x, y, width, height, rx);
  } else {
    entry.displayObject.rect(x, y, width, height);
  }
  if (fill && fill !== 'none') {
    entry.displayObject.fill(hexToNumber(fill));
  }
  entry.displayObject.alpha = oldAlpha;
}

/**
 * Create a Sprite from an <image> element (supports data URLs).
 */
async function createImageSprite(el: SVGElement): Promise<Sprite | null> {
  const href =
    el.getAttribute('href') ??
    el.getAttribute('xlink:href') ??
    el.getAttributeNS('http://www.w3.org/1999/xlink', 'href');

  if (!href) return null;

  const x = parseFloat(el.getAttribute('x') ?? '0');
  const y = parseFloat(el.getAttribute('y') ?? '0');
  const width = parseFloat(el.getAttribute('width') ?? '100');
  const height = parseFloat(el.getAttribute('height') ?? '100');
  const opacity = parseFloat(el.getAttribute('opacity') ?? '1');

  const texture = await Texture.from(href);
  const sprite = new Sprite(texture);
  sprite.x = x;
  sprite.y = y;
  sprite.width = width;
  sprite.height = height;
  sprite.alpha = opacity;
  return sprite;
}

/**
 * Create a PixiJS Text object from a <text> element.
 */
function createTextObject(el: SVGElement): PixiText {
  const text = el.textContent ?? '';
  const x = parseFloat(el.getAttribute('x') ?? '0');
  const y = parseFloat(el.getAttribute('y') ?? '0');
  const fontFamily = el.getAttribute('font-family') ?? 'sans-serif';
  const fontSize = parseInt(el.getAttribute('font-size') ?? '16', 10);
  const fontWeight = el.getAttribute('font-weight') ?? 'normal';
  const fill = el.getAttribute('fill') ?? '#000000';
  const opacity = parseFloat(el.getAttribute('opacity') ?? '1');

  const style = new TextStyle({
    fontFamily,
    fontSize,
    fontWeight: fontWeight as TextStyle['fontWeight'],
    fill: fill.startsWith('#') ? hexToNumber(fill) : fill,
    align: 'left',
  });

  const textObj = new PixiText({ text, style });
  textObj.x = x;
  textObj.y = y;
  textObj.alpha = opacity;
  return textObj;
}

/**
 * Create a Graphics object from a <path> element.
 * Uses PixiJS's built-in SVG path parser via Graphics.svg().
 */
function createPathGraphics(el: SVGElement): Graphics {
  const g = new Graphics();
  const d = el.getAttribute('d') ?? '';
  const fill = el.getAttribute('fill') ?? '#000000';
  const stroke = el.getAttribute('stroke');
  const strokeWidth = parseFloat(el.getAttribute('stroke-width') ?? '0');
  const opacity = parseFloat(el.getAttribute('opacity') ?? '1');

  // Build a minimal SVG fragment and parse with Graphics.svg()
  const svgFragment = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${strokeWidth}"` : ''} /></svg>`;
  g.svg(svgFragment);
  g.alpha = opacity;
  return g;
}

/**
 * Fit the container to the viewport with padding.
 */
function fitToView(app: Application, container: Container, contentW: number, contentH: number) {
  const padding = 48;
  const rendererW = app.renderer.width / (window.devicePixelRatio || 1);
  const rendererH = app.renderer.height / (window.devicePixelRatio || 1);

  const scaleX = (rendererW - padding) / contentW;
  const scaleY = (rendererH - padding) / contentH;
  const scale = Math.min(scaleX, scaleY, 1);
  container.scale.set(scale);
  container.x = (rendererW - contentW * scale) / 2;
  container.y = (rendererH - contentH * scale) / 2;
}

/**
 * Convert a hex color string (#ff0000) to a number (0xff0000).
 */
function hexToNumber(hex: string): number {
  const cleaned = hex.replace('#', '');
  return parseInt(cleaned, 16);
}

/**
 * Icon for an element type in the layers panel.
 */
function ElementTypeIcon({ type }: { type: ElementType }) {
  const icons: Record<ElementType, typeof Spline> = {
    path: Spline,
    rect: Square,
    image: ImageIcon,
    text: Type,
  };
  const Icon = icons[type] ?? Spline;
  return <Icon className="h-3 w-3 shrink-0" />;
}
