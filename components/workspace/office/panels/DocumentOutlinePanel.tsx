'use client';

import { useOfficeStore } from '@/lib/office-tool/useOfficeStore';
import { DocSection } from '@/lib/office-tool/types';
import {
  Heading,
  AlignLeft,
  Columns,
  Table as TableIcon,
  List,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Trash2,
  Bookmark,
  Layers,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function DocumentOutlinePanel() {
  const activeDoc = useOfficeStore((s) => s.activeDoc);
  const selectedSectionId = useOfficeStore((s) => s.selectedSectionId);
  const selectSection = useOfficeStore((s) => s.selectSection);
  const setActiveStudioTab = useOfficeStore((s) => s.setActiveStudioTab);
  const reorderWordSections = useOfficeStore((s) => s.reorderWordSections);
  const deleteWordSection = useOfficeStore((s) => s.deleteWordSection);

  if (activeDoc.type !== 'document') return null;
  const doc = activeDoc.model;

  const isStrict1Page = doc.pageFit === 'strict-1-page';
  const hasDedicatedCover = doc.hasCoverPage && !isStrict1Page;

  const getSectionIcon = (section: DocSection) => {
    switch (section.type) {
      case 'heading':
        return <Heading className="size-3.5 text-primary shrink-0" />;
      case 'paragraph':
        return <AlignLeft className="size-3.5 text-blue-500 shrink-0" />;
      case 'callout':
        return <Sparkles className="size-3.5 text-amber-500 shrink-0" />;
      case 'stat-grid':
        return <Columns className="size-3.5 text-purple-500 shrink-0" />;
      case 'table':
        return <TableIcon className="size-3.5 text-emerald-500 shrink-0" />;
      case 'bullet-list':
      case 'numbered-list':
        return <List className="size-3.5 text-pink-500 shrink-0" />;
      default:
        return <Layers className="size-3.5 text-slate-400 shrink-0" />;
    }
  };

  const getSectionLabel = (section: DocSection) => {
    switch (section.type) {
      case 'heading':
        return section.text || `Heading (H${section.level})`;
      case 'paragraph':
        return section.text ? section.text.slice(0, 32) + '…' : 'Paragraph';
      case 'callout':
        return section.title || section.badge || 'Callout Box';
      case 'stat-grid':
        return `KPI Stat Grid (${section.stats?.length || 0} metrics)`;
      case 'table':
        return `Table (${section.headers?.length || 0} cols × ${section.rows?.length || 0} rows)`;
      case 'bullet-list':
      case 'numbered-list':
        return `List (${section.items?.length || 0} items)`;
      default:
        return 'Section Block';
    }
  };

  return (
    <div className="p-3 space-y-3 text-xs">
      <div className="flex items-center justify-between pb-1 border-b border-border/50">
        <span className="font-bold text-foreground flex items-center gap-1.5">
          <Layers className="size-3.5 text-primary" />
          Document Outline
        </span>
        <span className="text-3xs font-mono text-muted-foreground">
          {doc.sections.length} blocks
        </span>
      </div>

      {/* ── Page 1: Dedicated Cover Page ────────────────────────────────────── */}
      {hasDedicatedCover && (
        <div className="space-y-1">
          <div className="text-3xs font-mono font-bold uppercase tracking-wider text-muted-foreground px-1 mb-1">
            Page 1 of 2
          </div>
          <div
            onClick={() => {
              selectSection(null);
              setActiveStudioTab('inspector');
            }}
            className={cn(
              'flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all',
              selectedSectionId === null
                ? 'bg-primary/10 border-primary text-foreground font-semibold shadow-2xs'
                : 'border-border/70 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            <Bookmark className="size-3.5 text-primary" />
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-foreground truncate block">
                {doc.title || 'Executive Cover'}
              </span>
              <span className="text-3xs text-muted-foreground">Cover Page Sheet</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Page 2+: Content Sections ───────────────────────────────────────── */}
      <div className="space-y-1">
        <div className="text-3xs font-mono font-bold uppercase tracking-wider text-muted-foreground px-1 mb-1 pt-2">
          {hasDedicatedCover ? 'Page 2 of 2 — Content Blocks' : 'Document Content Blocks'}
        </div>

        {doc.sections.map((section, idx) => {
          const isSelected = section.id === selectedSectionId;

          return (
            <div
              key={section.id}
              onClick={() => {
                selectSection(section.id);
                setActiveStudioTab('inspector');
              }}
              className={cn(
                'group flex items-center justify-between p-2 rounded-md cursor-pointer transition-all border',
                isSelected
                  ? 'bg-primary/10 border-primary text-foreground font-semibold shadow-2xs'
                  : 'border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              )}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getSectionIcon(section)}
                <span className="truncate text-xs">{getSectionLabel(section)}</span>
              </div>

              {/* Quick Actions (Reorder & Delete) */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    reorderWordSections(idx, idx - 1);
                  }}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="Move Up"
                >
                  <ChevronUp className="size-3" />
                </button>
                <button
                  type="button"
                  disabled={idx === doc.sections.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    reorderWordSections(idx, idx + 1);
                  }}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="Move Down"
                >
                  <ChevronDown className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteWordSection(section.id);
                  }}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DocumentOutlinePanel;
