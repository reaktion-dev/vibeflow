'use client';

import { useDesignStore } from '@/lib/design-tool/useDesignStore';
import {
  Type,
  Square,
  Circle,
  Image as ImageIcon,
  Layers,
  Palette,
  Sliders,
  Sparkles,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const CANVAS_THEMES = [
  { name: 'Dark Navy', bg: '#0B132B', accent: '#3B82F6' },
  { name: 'Obsidian', bg: '#09090B', accent: '#A855F7' },
  { name: 'Cyberpunk', bg: '#0A0612', accent: '#22D3EE' },
  { name: 'Sunset', bg: '#180B26', accent: '#FB7185' },
  { name: 'Clean Light', bg: '#F8FAFC', accent: '#2563EB' },
];

export function ElementInspector() {
  const document = useDesignStore((s) => s.document);
  const selectedNode = useDesignStore((s) => s.getSelectedNode());
  const updateNode = useDesignStore((s) => s.updateNode);
  const deleteNode = useDesignStore((s) => s.deleteNode);
  const toggleNodeVisibility = useDesignStore((s) => s.toggleNodeVisibility);
  const toggleNodeLock = useDesignStore((s) => s.toggleNodeLock);

  if (!selectedNode) {
    // Canvas & Artboard Global Properties
    return (
      <div className="p-3 space-y-4 text-xs">
        <div className="flex items-center justify-between pb-1 border-b border-border/40">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Sliders className="size-3.5 text-primary" />
            Canvas Artboard
          </span>
          <Badge variant="outline" className="text-[10px] font-mono">
            {document.width} × {document.height}
          </Badge>
        </div>

        {/* Canvas Dimensions */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Width (px)</Label>
            <Input value={document.width} readOnly className="h-7 text-xs font-mono bg-muted/40" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Height (px)</Label>
            <Input value={document.height} readOnly className="h-7 text-xs font-mono bg-muted/40" />
          </div>
        </div>

        {/* Background Color */}
        <div className="space-y-1.5">
          <Label className="text-[11px] text-muted-foreground">Canvas Background</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={document.background.color || '#0B132B'}
              onChange={(e) => {
                useDesignStore.setState((state) => ({
                  document: {
                    ...state.document,
                    background: { ...state.document.background, color: e.target.value },
                  },
                  isDirty: true,
                }));
              }}
              className="size-7 rounded border border-border cursor-pointer bg-transparent"
            />
            <Input
              value={document.background.color || '#0B132B'}
              onChange={(e) => {
                useDesignStore.setState((state) => ({
                  document: {
                    ...state.document,
                    background: { ...state.document.background, color: e.target.value },
                  },
                  isDirty: true,
                }));
              }}
              className="h-7 text-xs font-mono flex-1"
            />
          </div>
        </div>

        {/* Theme Presets */}
        <div className="space-y-1.5 pt-2 border-t border-border/40">
          <Label className="text-[11px] text-muted-foreground">Theme Presets</Label>
          <div className="grid grid-cols-1 gap-1">
            {CANVAS_THEMES.map((theme) => (
              <button
                key={theme.name}
                type="button"
                onClick={() => {
                  useDesignStore.setState((state) => ({
                    document: {
                      ...state.document,
                      background: { ...state.document.background, color: theme.bg },
                    },
                    isDirty: true,
                  }));
                  toast.success(`Applied ${theme.name} Theme`);
                }}
                className="flex items-center justify-between p-1.5 rounded-md border border-border/50 bg-background/50 hover:bg-muted/40 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full border border-border shrink-0" style={{ backgroundColor: theme.accent }} />
                  <span className="font-medium text-foreground text-[11px]">{theme.name}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{theme.bg}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selection Hint */}
        <div className="p-3 text-center text-muted-foreground rounded-lg border border-dashed border-border/60 bg-muted/20">
          <p className="text-[11px]">
            Click any element on the canvas to inspect and edit its typography, geometry, and styles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4 text-xs">
      {/* Node Header */}
      <div className="flex items-center justify-between pb-1 border-b border-border/40">
        <div className="flex items-center gap-1.5 truncate">
          {selectedNode.type === 'text' && <Type className="size-3.5 text-primary shrink-0" />}
          {selectedNode.type === 'rect' && <Square className="size-3.5 text-purple-500 shrink-0" />}
          {selectedNode.type === 'circle' && <Circle className="size-3.5 text-emerald-500 shrink-0" />}
          {selectedNode.type === 'image' && <ImageIcon className="size-3.5 text-amber-500 shrink-0" />}
          {selectedNode.type === 'group' && <Layers className="size-3.5 text-cyan-500 shrink-0" />}
          <span className="font-semibold text-foreground truncate">{selectedNode.name}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => toggleNodeVisibility(selectedNode.id)}
            className="p-1 text-muted-foreground hover:text-foreground rounded"
            title={selectedNode.visible ? 'Hide Element' : 'Show Element'}
          >
            {selectedNode.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5 opacity-40" />}
          </button>
          <button
            type="button"
            onClick={() => toggleNodeLock(selectedNode.id)}
            className="p-1 text-muted-foreground hover:text-foreground rounded"
            title={selectedNode.locked ? 'Unlock' : 'Lock'}
          >
            {selectedNode.locked ? <Lock className="size-3.5 text-amber-500" /> : <Unlock className="size-3.5 opacity-60" />}
          </button>
          <button
            type="button"
            onClick={() => deleteNode(selectedNode.id)}
            className="p-1 text-muted-foreground hover:text-rose-500 rounded"
            title="Delete Element"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Position & Transform */}
      <div className="space-y-1.5">
        <Label className="text-[11px] text-muted-foreground font-semibold">Transform</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">X (px)</span>
            <Input
              type="number"
              value={selectedNode.x}
              onChange={(e) => updateNode(selectedNode.id, { x: Number(e.target.value) })}
              className="h-7 text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">Y (px)</span>
            <Input
              type="number"
              value={selectedNode.y}
              onChange={(e) => updateNode(selectedNode.id, { y: Number(e.target.value) })}
              className="h-7 text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* ── Type-Specific Properties ────────────────────────────────────────── */}

      {/* 1. Text Properties */}
      {selectedNode.type === 'text' && (
        <div className="space-y-3 pt-2 border-t border-border/40">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Text Content</Label>
            <textarea
              value={selectedNode.text}
              onChange={(e) => updateNode(selectedNode.id, { text: e.target.value, name: e.target.value.slice(0, 20) })}
              rows={2}
              className="w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-xs font-medium shadow-2xs resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Font Size (px)</Label>
              <Input
                type="number"
                value={selectedNode.fontSize}
                onChange={(e) => updateNode(selectedNode.id, { fontSize: Number(e.target.value) })}
                className="h-7 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Weight</Label>
              <select
                value={selectedNode.fontWeight || 'bold'}
                onChange={(e) => updateNode(selectedNode.id, { fontWeight: e.target.value as any })}
                className="w-full h-7 rounded-md border border-input bg-card px-2 text-xs"
              >
                <option value="normal">Normal</option>
                <option value="500">Medium</option>
                <option value="600">SemiBold</option>
                <option value="bold">Bold</option>
                <option value="800">Extra Bold</option>
              </select>
            </div>
          </div>

          {/* Alignment */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Alignment</Label>
            <div className="flex items-center rounded-md border border-border bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => updateNode(selectedNode.id, { textAnchor: 'start' })}
                className={cn(
                  'flex-1 py-1 rounded-xs flex items-center justify-center transition',
                  selectedNode.textAnchor === 'start' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground'
                )}
                title="Align Left"
              >
                <AlignLeft className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => updateNode(selectedNode.id, { textAnchor: 'middle' })}
                className={cn(
                  'flex-1 py-1 rounded-xs flex items-center justify-center transition',
                  selectedNode.textAnchor === 'middle' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground'
                )}
                title="Align Center"
              >
                <AlignCenter className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => updateNode(selectedNode.id, { textAnchor: 'end' })}
                className={cn(
                  'flex-1 py-1 rounded-xs flex items-center justify-center transition',
                  selectedNode.textAnchor === 'end' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground'
                )}
                title="Align Right"
              >
                <AlignRight className="size-3" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Text Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedNode.fill?.startsWith('#') ? selectedNode.fill : '#ffffff'}
                onChange={(e) => updateNode(selectedNode.id, { fill: e.target.value })}
                className="size-7 rounded border border-border cursor-pointer bg-transparent"
              />
              <Input
                value={selectedNode.fill}
                onChange={(e) => updateNode(selectedNode.id, { fill: e.target.value })}
                className="h-7 text-xs font-mono flex-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Rectangle Properties */}
      {selectedNode.type === 'rect' && (
        <div className="space-y-3 pt-2 border-t border-border/40">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Width</Label>
              <Input
                type="number"
                value={selectedNode.width}
                onChange={(e) => updateNode(selectedNode.id, { width: Number(e.target.value) })}
                className="h-7 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Height</Label>
              <Input
                type="number"
                value={selectedNode.height}
                onChange={(e) => updateNode(selectedNode.id, { height: Number(e.target.value) })}
                className="h-7 text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <Label className="text-muted-foreground">Corner Radius (rx)</Label>
              <span className="font-mono">{selectedNode.rx || 0}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={selectedNode.rx || 0}
              onChange={(e) => updateNode(selectedNode.id, { rx: Number(e.target.value) })}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Fill Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedNode.fill?.startsWith('#') ? selectedNode.fill : '#ffffff'}
                onChange={(e) => updateNode(selectedNode.id, { fill: e.target.value })}
                className="size-7 rounded border border-border cursor-pointer bg-transparent"
              />
              <Input
                value={selectedNode.fill}
                onChange={(e) => updateNode(selectedNode.id, { fill: e.target.value })}
                className="h-7 text-xs font-mono flex-1"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Border Stroke</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedNode.stroke?.startsWith('#') ? selectedNode.stroke : '#000000'}
                onChange={(e) => updateNode(selectedNode.id, { stroke: e.target.value })}
                className="size-7 rounded border border-border cursor-pointer bg-transparent"
              />
              <Input
                value={selectedNode.stroke || ''}
                placeholder="None"
                onChange={(e) => updateNode(selectedNode.id, { stroke: e.target.value })}
                className="h-7 text-xs font-mono flex-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Image Properties */}
      {selectedNode.type === 'image' && (
        <div className="space-y-3 pt-2 border-t border-border/40">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Width</Label>
              <Input
                type="number"
                value={selectedNode.width}
                onChange={(e) => updateNode(selectedNode.id, { width: Number(e.target.value) })}
                className="h-7 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Height</Label>
              <Input
                type="number"
                value={selectedNode.height}
                onChange={(e) => updateNode(selectedNode.id, { height: Number(e.target.value) })}
                className="h-7 text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <Label className="text-muted-foreground">Corner Radius</Label>
              <span className="font-mono">{selectedNode.rx || 0}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={selectedNode.rx || 0}
              onChange={(e) => updateNode(selectedNode.id, { rx: Number(e.target.value) })}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Image Source URL</Label>
            <Input
              value={selectedNode.href}
              onChange={(e) => updateNode(selectedNode.id, { href: e.target.value })}
              className="h-7 text-xs font-mono"
            />
          </div>
        </div>
      )}

      {/* Opacity Slider (All Nodes) */}
      <div className="space-y-1.5 pt-2 border-t border-border/40">
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">Opacity</span>
          <span className="font-mono">{Math.round((selectedNode.opacity ?? 1) * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={selectedNode.opacity ?? 1}
          onChange={(e) => updateNode(selectedNode.id, { opacity: parseFloat(e.target.value) })}
          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>
    </div>
  );
}

export default ElementInspector;
