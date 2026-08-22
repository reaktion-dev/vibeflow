'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDesignStore } from '@/lib/design-tool/useDesignStore';
import { SceneNode, DesignDocument } from '@/lib/design-tool/types';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PixiCanvasViewportProps {
  className?: string;
  isEditable?: boolean;
}

export function PixiCanvasViewport({ className, isEditable = true }: PixiCanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);

  const document = useDesignStore((s) => s.document);
  const zoom = useDesignStore((s) => s.zoom);
  const panOffset = useDesignStore((s) => s.panOffset);
  const setPanOffset = useDesignStore((s) => s.setPanOffset);
  const setZoom = useDesignStore((s) => s.setZoom);
  const activeTool = useDesignStore((s) => s.activeTool);
  const selectedNodeId = useDesignStore((s) => s.selectedNodeId);
  const selectNode = useDesignStore((s) => s.selectNode);
  const setHoveredNode = useDesignStore((s) => s.setHoveredNode);
  const updateNode = useDesignStore((s) => s.updateNode);
  const commitSnapshot = useDesignStore((s) => s.commitSnapshot);
  const getSvgString = useDesignStore((s) => s.getSvgString);

  // Dragging state with debounced history commits
  const isPanningRef = useRef(false);
  const isDraggingNodeRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const nodeStartPosRef = useRef({ x: 0, y: 0 });
  const dragStartDocSnapshotRef = useRef<DesignDocument | null>(null);

  // Selected element bounding box in artboard space
  const [selectedBounds, setSelectedBounds] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // ── 1. Calculate Live Bounding Box for Selected Node ───────────────────────

  useEffect(() => {
    if (!selectedNodeId || !svgWrapperRef.current) {
      setSelectedBounds(null);
      return;
    }

    const svgEl = svgWrapperRef.current.querySelector('svg');
    if (!svgEl) {
      setSelectedBounds(null);
      return;
    }

    const targetEl = svgEl.querySelector(`#${selectedNodeId}`) as SVGGraphicsElement | null;
    if (targetEl && typeof targetEl.getBBox === 'function') {
      try {
        const bbox = targetEl.getBBox();
        setSelectedBounds({
          x: bbox.x,
          y: bbox.y,
          width: Math.max(bbox.width, 24),
          height: Math.max(bbox.height, 24),
        });
        return;
      } catch {}
    }

    // Fallback: Scene Graph node metrics
    function findNode(nodes: SceneNode[]): SceneNode | null {
      for (const node of nodes) {
        if (node.id === selectedNodeId) return node;
        if (node.type === 'group') {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    }

    const node = findNode(document.rootNodes);
    if (!node) {
      setSelectedBounds(null);
      return;
    }

    if (node.type === 'rect' || node.type === 'image') {
      setSelectedBounds({ x: node.x, y: node.y, width: node.width, height: node.height });
    } else if (node.type === 'circle') {
      setSelectedBounds({ x: node.x, y: node.y, width: node.r * 2, height: node.r * 2 });
    } else if (node.type === 'text') {
      const w = node.text.length * (node.fontSize || 20) * 0.6;
      const h = node.fontSize || 24;
      let startX = node.x;
      if (node.textAnchor === 'middle') startX = node.x - w / 2;
      else if (node.textAnchor === 'end') startX = node.x - w;
      setSelectedBounds({ x: startX, y: node.y - h * 0.8, width: w, height: h });
    } else {
      setSelectedBounds({ x: node.x, y: node.y, width: 100, height: 100 });
    }
  }, [selectedNodeId, document]);

  // ── 2. Mouse Wheel Zoom & Pan Handlers ─────────────────────────────────────

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom((prev) => Math.min(3, Math.max(0.2, Number((prev * zoomFactor).toFixed(2)))));
    } else {
      setPanOffset((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1 || activeTool === 'pan' || e.shiftKey) {
      isPanningRef.current = true;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanningRef.current) {
      const dx = e.clientX - dragStartPosRef.current.x;
      const dy = e.clientY - dragStartPosRef.current.y;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      return;
    }

    if (isDraggingNodeRef.current && selectedNodeId) {
      const dx = (e.clientX - dragStartPosRef.current.x) / zoom;
      const dy = (e.clientY - dragStartPosRef.current.y) / zoom;
      updateNode(
        selectedNodeId,
        {
          x: Math.round(nodeStartPosRef.current.x + dx),
          y: Math.round(nodeStartPosRef.current.y + dy),
        },
        { pushHistory: false }
      );
    }
  };

  const handleMouseUp = () => {
    if (isDraggingNodeRef.current && selectedNodeId && dragStartDocSnapshotRef.current) {
      const selectedNode = useDesignStore.getState().getSelectedNode();
      if (
        selectedNode &&
        (selectedNode.x !== nodeStartPosRef.current.x || selectedNode.y !== nodeStartPosRef.current.y)
      ) {
        commitSnapshot(dragStartDocSnapshotRef.current);
      }
      dragStartDocSnapshotRef.current = null;
    }

    isPanningRef.current = false;
    isDraggingNodeRef.current = false;
  };

  // ── 3. Interactive Click & Drag on SVG Nodes ───────────────────────────────

  const handleSvgPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isEditable || e.button !== 0 || activeTool === 'pan') return;

    let target = e.target as SVGElement | null;
    if (!target) return;

    // Find nearest node with an id
    let targetNodeId: string | null = null;
    while (target && target.tagName && target.tagName.toLowerCase() !== 'svg') {
      const id = target.getAttribute('id');
      if (id && !id.startsWith('bg-') && id !== 'root') {
        targetNodeId = id;
        break;
      }
      target = target.parentElement as SVGElement | null;
    }

    if (targetNodeId) {
      e.stopPropagation();
      selectNode(targetNodeId);

      const node = useDesignStore.getState().getSelectedNode();
      if (node && !node.locked) {
        isDraggingNodeRef.current = true;
        dragStartPosRef.current = { x: e.clientX, y: e.clientY };
        nodeStartPosRef.current = { x: node.x, y: node.y };
        dragStartDocSnapshotRef.current = JSON.parse(JSON.stringify(useDesignStore.getState().document));
      }
    } else {
      selectNode(null);
    }
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={cn(
        'relative size-full overflow-hidden select-none bg-radial from-slate-900/60 to-slate-950 flex items-center justify-center',
        activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        className
      )}
    >
      {/* Centered Transformable Artboard Container */}
      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          width: `${document.width}px`,
          height: `${document.height}px`,
          transition: isPanningRef.current || isDraggingNodeRef.current ? 'none' : 'transform 0.1s ease-out',
        }}
        className="relative shrink-0 rounded-xl shadow-2xl overflow-visible border border-slate-700/80 bg-slate-950"
      >
        {/* Full-Fidelity Vector Document Markup (Supports 100% of gradients, defs, filters, shadows, and paths) */}
        <div
          ref={svgWrapperRef}
          onPointerDown={handleSvgPointerDown}
          className={cn(
            'size-full overflow-hidden rounded-xl',
            isEditable && activeTool === 'select' && 'cursor-pointer'
          )}
          dangerouslySetInnerHTML={{ __html: getSvgString() }}
        />

        {/* ── Selection Gizmo Overlay with 8 Transform Handles ────────────── */}
        {selectedBounds && isEditable && (
          <div
            style={{
              left: `${selectedBounds.x - 4}px`,
              top: `${selectedBounds.y - 4}px`,
              width: `${selectedBounds.width + 8}px`,
              height: `${selectedBounds.height + 8}px`,
            }}
            className="absolute pointer-events-none border-2 border-primary rounded-xs z-30 shadow-xs"
          >
            {/* 4 Corner Handles */}
            <div className="absolute -left-1.5 -top-1.5 size-3 rounded-2xs border-2 border-primary bg-background shadow-xs pointer-events-auto cursor-nwse-resize" />
            <div className="absolute -right-1.5 -top-1.5 size-3 rounded-2xs border-2 border-primary bg-background shadow-xs pointer-events-auto cursor-nesw-resize" />
            <div className="absolute -left-1.5 -bottom-1.5 size-3 rounded-2xs border-2 border-primary bg-background shadow-xs pointer-events-auto cursor-nesw-resize" />
            <div className="absolute -right-1.5 -bottom-1.5 size-3 rounded-2xs border-2 border-primary bg-background shadow-xs pointer-events-auto cursor-nwse-resize" />

            {/* 4 Edge Midpoint Handles */}
            <div className="absolute left-1/2 -top-1 -translate-x-1/2 w-4 h-2 rounded-2xs border border-primary bg-background pointer-events-auto cursor-ns-resize" />
            <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-4 h-2 rounded-2xs border border-primary bg-background pointer-events-auto cursor-ns-resize" />
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-4 rounded-2xs border border-primary bg-background pointer-events-auto cursor-ew-resize" />
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-4 rounded-2xs border border-primary bg-background pointer-events-auto cursor-ew-resize" />
          </div>
        )}
      </div>
    </div>
  );
}

export default PixiCanvasViewport;
