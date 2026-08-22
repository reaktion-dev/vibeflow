'use client';

import React from 'react';
import { useOfficeStore } from '@/lib/office-tool/useOfficeStore';
import { DocSection, OFFICE_THEMES } from '@/lib/office-tool/types';
import { cn } from '@/lib/utils';
import {
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Columns,
  Table as TableIcon,
  Heading as HeadingIcon,
  AlignLeft,
  List,
  FileText,
} from 'lucide-react';

interface DocumentBlockCanvasProps {
  className?: string;
}

export function DocumentBlockCanvas({ className }: DocumentBlockCanvasProps) {
  const activeDoc = useOfficeStore((s) => s.activeDoc);
  const zoom = useOfficeStore((s) => s.zoom);
  const selectedSectionId = useOfficeStore((s) => s.selectedSectionId);
  const selectSection = useOfficeStore((s) => s.selectSection);
  const setActiveStudioTab = useOfficeStore((s) => s.setActiveStudioTab);
  const deleteWordSection = useOfficeStore((s) => s.deleteWordSection);
  const reorderWordSections = useOfficeStore((s) => s.reorderWordSections);

  if (activeDoc.type !== 'document') return null;
  const doc = activeDoc.model;
  const theme = OFFICE_THEMES[doc.theme] ?? OFFICE_THEMES['corporate-navy'];

  const isA4 = doc.pageSize === 'a4';
  const isStrict1Page = doc.pageFit === 'strict-1-page';
  const widthPx = isA4 ? '794px' : '816px';
  const pageHeightPx = isA4 ? '1123px' : '1056px';

  const hasDedicatedCover = doc.hasCoverPage && !isStrict1Page;

  const handleBlockClick = (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    selectSection(sectionId);
    setActiveStudioTab('inspector');
  };

  const handleCoverClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectSection(null);
    setActiveStudioTab('inspector');
  };

  return (
    <div
      onClick={() => selectSection(null)}
      className={cn(
        'flex-1 overflow-y-auto overflow-x-auto py-10 px-6 flex flex-col items-center select-text bg-slate-950 gap-10',
        className
      )}
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          PAGE 1: DEDICATED COVER PAGE SHEET (When hasCoverPage is active)
         ═══════════════════════════════════════════════════════════════════════ */}
      {hasDedicatedCover && (
        <div className="flex flex-col items-center gap-2">
          {/* Page Tag Indicator */}
          <div className="flex items-center gap-2 text-2xs font-mono uppercase tracking-wider text-slate-400">
            <span className="size-2 rounded-full bg-primary" />
            <span>Page 1 of 2 — Executive Cover Sheet</span>
          </div>

          <div
            onClick={handleCoverClick}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              width: widthPx,
              height: pageHeightPx,
            }}
            className={cn(
              'relative flex flex-col justify-between bg-white text-slate-900 shadow-2xl rounded-xs border p-16 transition-all cursor-pointer',
              selectedSectionId === null
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-slate-300 hover:border-slate-400'
            )}
          >
            {/* Top Badge & Date */}
            <div>
              <div className="flex items-center justify-between mb-10">
                <span
                  className="text-xs font-bold tracking-wider px-3 py-1.5 rounded-sm uppercase text-white shadow-xs"
                  style={{ backgroundColor: theme.primary }}
                >
                  Executive Document
                </span>
                <span className="text-xs font-semibold text-slate-400 font-mono">
                  {doc.date || new Date().toLocaleDateString()}
                </span>
              </div>

              {/* Title & Subtitle */}
              <h1
                className="text-4xl font-black tracking-tight mb-4 leading-tight"
                style={{ color: theme.primary }}
              >
                {doc.title}
              </h1>

              {doc.subtitle && (
                <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl">
                  {doc.subtitle}
                </p>
              )}
            </div>

            {/* Bottom Metadata Box */}
            <div>
              <div
                className="flex items-center justify-between p-6 rounded-md border-l-4 shadow-xs"
                style={{
                  backgroundColor: theme.bgLight,
                  borderColor: theme.secondary,
                  color: theme.textDark,
                }}
              >
                <div className="space-y-1">
                  <div className="text-3xs font-mono font-bold uppercase tracking-wider text-slate-400">
                    PREPARED BY
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {doc.author || 'Autonomous Agent Studio'}
                  </div>
                </div>

                {doc.organization && (
                  <div className="space-y-1">
                    <div className="text-3xs font-mono font-bold uppercase tracking-wider text-slate-400">
                      ORGANIZATION
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {doc.organization}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="text-3xs font-mono font-bold uppercase tracking-wider text-slate-400">
                    ISSUE DATE
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {doc.date || new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-8 text-3xs font-mono text-slate-400">
                <span>CONFIDENTIAL & PROPRIETARY</span>
                <span>PAGE 1 OF 2</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PAGE 2+ : CONTENT BODY PAGE SHEET
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col items-center gap-2">
        {/* Page Tag Indicator */}
        <div className="flex items-center gap-2 text-2xs font-mono uppercase tracking-wider text-slate-400">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span>
            {hasDedicatedCover ? 'Page 2 of 2 — Deliverable Scope & Terms' : 'Single Page Document'}
          </span>
        </div>

        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            width: widthPx,
            minHeight: pageHeightPx,
          }}
          className="relative flex flex-col justify-between bg-white text-slate-900 shadow-2xl rounded-xs border border-slate-300 p-12 transition-transform duration-150"
        >
          {/* Running Top Header */}
          {hasDedicatedCover && (
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6 text-3xs font-mono text-slate-400 uppercase tracking-wider">
              <span className="font-bold text-slate-600 truncate max-w-sm">
                {doc.title}
              </span>
              <span>{doc.organization || 'EXECUTIVE BRIEF'}</span>
            </div>
          )}

          {/* Top Compact Ribbon for 1-Page Documents */}
          {!hasDedicatedCover && doc.hasCoverPage && (
            <div
              onClick={handleCoverClick}
              className={cn(
                'border-b-2 pb-6 mb-6 cursor-pointer rounded-md p-3 transition-all',
                selectedSectionId === null
                  ? 'ring-2 ring-primary/40 bg-slate-50/70'
                  : 'hover:bg-slate-50/50'
              )}
              style={{ borderColor: theme.border }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-2xs font-bold tracking-wider px-2 py-0.5 rounded-xs uppercase text-white shadow-xs"
                  style={{ backgroundColor: theme.primary }}
                >
                  Executive Brief
                </span>
                <span className="text-2xs font-semibold text-slate-400 font-mono">
                  {doc.date || new Date().toLocaleDateString()}
                </span>
              </div>

              <h1
                className="text-2xl font-black tracking-tight mb-1"
                style={{ color: theme.primary }}
              >
                {doc.title}
              </h1>

              {doc.subtitle && (
                <p className="text-xs text-slate-500 font-medium mb-3">{doc.subtitle}</p>
              )}

              <div
                className="flex items-center gap-4 text-2xs font-semibold p-2.5 rounded-md border-l-4"
                style={{
                  backgroundColor: theme.bgLight,
                  borderColor: theme.secondary,
                  color: theme.textDark,
                }}
              >
                <span>AUTHOR: <strong>{doc.author || 'Autonomous Agent Studio'}</strong></span>
                {doc.organization && (
                  <span>• ORG: <strong>{doc.organization}</strong></span>
                )}
              </div>
            </div>
          )}

          {/* ── Document Body Sections (Click-to-Select & Inspect) ───────────── */}
          <div className="space-y-4 flex-1">
            {doc.sections.map((section, idx) => {
              const isSelected = section.id === selectedSectionId;

              return (
                <div
                  key={section.id}
                  onClick={(e) => handleBlockClick(section.id, e)}
                  className={cn(
                    'group relative rounded-md p-3 transition-all cursor-pointer border',
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xs'
                      : 'border-transparent hover:border-slate-300 hover:bg-slate-50/80'
                  )}
                >
                  {/* Floating Action Pill on Hover/Select */}
                  <div
                    className={cn(
                      'absolute right-2 -top-3 items-center gap-1 bg-white border border-slate-200 shadow-xs rounded px-1.5 py-0.5 z-20 transition-opacity',
                      isSelected ? 'flex' : 'hidden group-hover:flex'
                    )}
                  >
                    <span className="text-3xs font-mono font-bold uppercase text-primary px-1">
                      {section.type}
                    </span>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        reorderWordSections(idx, idx - 1);
                      }}
                      className="text-slate-500 hover:text-primary p-0.5 disabled:opacity-30"
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
                      className="text-slate-500 hover:text-primary p-0.5 disabled:opacity-30"
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
                      className="text-rose-500 hover:text-rose-700 p-0.5"
                      title="Delete Block"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>

                  {/* Section Visual Content */}
                  <BlockContentRenderer section={section} theme={theme} />
                </div>
              );
            })}
          </div>

          {/* Running Bottom Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-8 text-3xs font-mono text-slate-400">
            <span>CONFIDENTIAL & PROPRIETARY</span>
            <span>
              {hasDedicatedCover ? 'PAGE 2 OF 2' : 'PAGE 1 OF 1'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockContentRenderer({
  section,
  theme,
}: {
  section: DocSection;
  theme: typeof OFFICE_THEMES[keyof typeof OFFICE_THEMES];
}) {
  switch (section.type) {
    case 'heading':
      return (
        <div className="border-b pb-1.5" style={{ borderColor: theme.border }}>
          <h2
            className={cn(
              'font-bold tracking-tight',
              section.level === 1 && 'text-2xl mt-2 mb-1',
              section.level === 2 && 'text-xl mt-1.5 mb-1',
              section.level === 3 && 'text-lg mt-1 mb-0.5'
            )}
            style={{ color: theme.primary }}
          >
            {section.text || 'Untitled Heading'}
          </h2>
        </div>
      );

    case 'paragraph':
      return (
        <p
          className={cn(
            'text-slate-700 leading-relaxed text-sm',
            section.lead && 'text-base font-medium text-slate-900 leading-7'
          )}
        >
          {section.text || 'Empty paragraph text.'}
        </p>
      );

    case 'callout':
      return (
        <div
          className="rounded-lg border-l-4 p-4 shadow-xs"
          style={{
            backgroundColor: theme.bgLight,
            borderColor: theme.secondary,
          }}
        >
          {(section.title || section.badge) && (
            <div className="flex items-center gap-2 mb-1.5">
              {section.badge && (
                <span
                  className="text-3xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white"
                  style={{ backgroundColor: theme.secondary }}
                >
                  {section.badge}
                </span>
              )}
              {section.title && (
                <h4
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: theme.primary }}
                >
                  {section.title}
                </h4>
              )}
            </div>
          )}
          <p className="text-xs text-slate-700 leading-relaxed">{section.text}</p>
        </div>
      );

    case 'stat-grid':
      return (
        <div className="grid grid-cols-3 gap-3 my-2">
          {section.stats.map((st, i) => (
            <div
              key={i}
              className="rounded-lg border p-4 text-center shadow-xs"
              style={{
                backgroundColor: theme.bgLight,
                borderColor: theme.border,
              }}
            >
              <span
                className="text-2xl font-black block tracking-tight"
                style={{ color: theme.primary }}
              >
                {st.value}
              </span>
              <span className="text-2xs font-bold text-slate-600 uppercase tracking-wider mt-1 block">
                {st.label}
              </span>
              {st.description && (
                <span className="text-3xs text-slate-400 mt-0.5 block">{st.description}</span>
              )}
            </div>
          ))}
        </div>
      );

    case 'table':
      return (
        <div className="my-2 overflow-hidden rounded-md border border-slate-200 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead style={{ backgroundColor: theme.primary, color: '#FFFFFF' }}>
              <tr>
                {section.headers.map((h, i) => (
                  <th key={i} className="px-3 py-2.5 font-bold tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {section.rows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'bullet-list':
      return (
        <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 my-1 pl-2">
          {section.items.map((it, i) => (
            <li key={i} className="leading-relaxed">
              {it}
            </li>
          ))}
        </ul>
      );

    case 'numbered-list':
      return (
        <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 my-1 pl-2">
          {section.items.map((it, i) => (
            <li key={i} className="leading-relaxed">
              {it}
            </li>
          ))}
        </ol>
      );

    case 'divider':
      return <hr className="border-slate-200 my-3" />;

    default:
      return null;
  }
}

export default DocumentBlockCanvas;
