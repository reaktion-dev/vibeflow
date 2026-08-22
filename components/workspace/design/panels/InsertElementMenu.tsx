'use client';

import { useDesignStore } from '@/lib/design-tool/useDesignStore';
import { Type, Square, Circle, Image as ImageIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

export function InsertElementMenu() {
  const addNode = useDesignStore((s) => s.addNode);
  const document = useDesignStore((s) => s.document);

  const insertHeadline = () => {
    const id = `text_${nanoid(6)}`;
    addNode({
      id,
      type: 'text',
      name: 'New Headline',
      visible: true,
      locked: false,
      opacity: 1,
      x: Math.round(document.width * 0.2),
      y: Math.round(document.height * 0.3),
      text: 'New Headline',
      fontSize: 44,
      fontFamily: 'system-ui, sans-serif',
      fontWeight: 'bold',
      fill: '#FFFFFF',
      textAnchor: 'start',
    });
    toast.success('Added Headline');
  };

  const insertSubtitle = () => {
    const id = `text_${nanoid(6)}`;
    addNode({
      id,
      type: 'text',
      name: 'New Subtitle',
      visible: true,
      locked: false,
      opacity: 1,
      x: Math.round(document.width * 0.2),
      y: Math.round(document.height * 0.45),
      text: 'Add your supporting description or tagline here.',
      fontSize: 20,
      fontFamily: 'system-ui, sans-serif',
      fontWeight: 'normal',
      fill: '#94A3B8',
      textAnchor: 'start',
    });
    toast.success('Added Subtitle');
  };

  const insertCardRect = () => {
    const id = `rect_${nanoid(6)}`;
    addNode({
      id,
      type: 'rect',
      name: 'Card Container',
      visible: true,
      locked: false,
      opacity: 0.9,
      x: Math.round(document.width * 0.15),
      y: Math.round(document.height * 0.2),
      width: 400,
      height: 300,
      rx: 20,
      fill: '#1E293B',
      stroke: '#334155',
      strokeWidth: 1.5,
    });
    toast.success('Added Card');
  };

  const insertCircle = () => {
    const id = `circle_${nanoid(6)}`;
    addNode({
      id,
      type: 'circle',
      name: 'Accent Circle',
      visible: true,
      locked: false,
      opacity: 0.85,
      x: Math.round(document.width * 0.5),
      y: Math.round(document.height * 0.5),
      r: 80,
      fill: '#3B82F6',
    });
    toast.success('Added Circle');
  };

  return (
    <div className="p-3 space-y-3 text-xs">
      <div className="flex items-center justify-between pb-1 border-b border-border/40">
        <span className="font-semibold text-foreground flex items-center gap-1.5">
          <Plus className="size-3.5 text-primary" />
          Insert Elements
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={insertHeadline}
          className="h-16 flex flex-col items-center justify-center gap-1 text-xs hover:border-primary/50"
        >
          <Type className="size-4 text-primary" />
          <span>Headline</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={insertSubtitle}
          className="h-16 flex flex-col items-center justify-center gap-1 text-xs hover:border-primary/50"
        >
          <Type className="size-3.5 text-sky-400" />
          <span>Subtitle</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={insertCardRect}
          className="h-16 flex flex-col items-center justify-center gap-1 text-xs hover:border-primary/50"
        >
          <Square className="size-4 text-purple-500" />
          <span>Card / Rect</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={insertCircle}
          className="h-16 flex flex-col items-center justify-center gap-1 text-xs hover:border-primary/50"
        >
          <Circle className="size-4 text-emerald-500" />
          <span>Circle Orb</span>
        </Button>
      </div>
    </div>
  );
}

export default InsertElementMenu;
