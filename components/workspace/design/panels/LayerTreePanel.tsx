'use client';

import { useDesignStore } from '@/lib/design-tool/useDesignStore';
import { SceneNode } from '@/lib/design-tool/types';
import {
  Layers,
  Type,
  Square,
  Circle,
  Image as ImageIcon,
  Spline,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function LayerTreePanel() {
  const document = useDesignStore((s) => s.document);
  const selectedNodeId = useDesignStore((s) => s.selectedNodeId);
  const selectNode = useDesignStore((s) => s.selectNode);
  const toggleNodeVisibility = useDesignStore((s) => s.toggleNodeVisibility);
  const toggleNodeLock = useDesignStore((s) => s.toggleNodeLock);
  const deleteNode = useDesignStore((s) => s.deleteNode);

  const renderTreeItem = (node: SceneNode, depth = 0) => {
    const isSelected = node.id === selectedNodeId;

    return (
      <div key={node.id} className="space-y-0.5">
        <div
          onClick={() => selectNode(node.id)}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className={cn(
            'group flex items-center justify-between py-1.5 pr-2 rounded-md text-xs cursor-pointer transition-colors select-none',
            isSelected
              ? 'bg-primary/15 text-foreground font-semibold border border-primary/30'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          )}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {node.type === 'group' && <Layers className="size-3.5 text-cyan-500 shrink-0" />}
            {node.type === 'text' && <Type className="size-3.5 text-primary shrink-0" />}
            {node.type === 'rect' && <Square className="size-3.5 text-purple-500 shrink-0" />}
            {node.type === 'circle' && <Circle className="size-3.5 text-emerald-500 shrink-0" />}
            {node.type === 'image' && <ImageIcon className="size-3.5 text-amber-500 shrink-0" />}
            {node.type === 'path' && <Spline className="size-3.5 text-pink-500 shrink-0" />}

            <span className="truncate">{node.name}</span>
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeVisibility(node.id);
              }}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              title={node.visible ? 'Hide' : 'Show'}
            >
              {node.visible ? <Eye className="size-3" /> : <EyeOff className="size-3 opacity-40" />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeLock(node.id);
              }}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              title={node.locked ? 'Unlock' : 'Lock'}
            >
              {node.locked ? <Lock className="size-3 text-amber-500" /> : <Unlock className="size-3 opacity-40" />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteNode(node.id);
              }}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-rose-500"
              title="Delete"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        </div>

        {/* Render children for groups */}
        {node.type === 'group' && node.children.length > 0 && (
          <div className="space-y-0.5">
            {node.children.map((child) => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-3 space-y-3 text-xs">
      <div className="flex items-center justify-between pb-1 border-b border-border/40">
        <span className="font-semibold text-foreground flex items-center gap-1.5">
          <Layers className="size-3.5 text-primary" />
          Layer Hierarchy
        </span>
        <Badge variant="outline" className="text-[10px]">
          {document.rootNodes.length} roots
        </Badge>
      </div>

      <div className="space-y-0.5 overflow-y-auto max-h-[calc(100vh-220px)]">
        {document.rootNodes.map((rootNode) => renderTreeItem(rootNode))}
      </div>
    </div>
  );
}

export default LayerTreePanel;
