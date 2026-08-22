'use client';

import { useOfficeStore } from '@/lib/office-tool/useOfficeStore';
import {
  OFFICE_THEMES,
  OfficeThemeName,
  HeadingSection,
  ParagraphSection,
  CalloutSection,
  StatGridSection,
  TableSection,
  BulletListSection,
  NumberedListSection,
} from '@/lib/office-tool/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  FileText,
  Sliders,
  Sparkles,
  Layers,
  Heading,
  AlignLeft,
  Columns,
  Table as TableIcon,
  List,
  Trash2,
  Plus,
  Check,
  ChevronLeft,
} from 'lucide-react';

export function DocumentInspectorPanel() {
  const activeDoc = useOfficeStore((s) => s.activeDoc);
  const selectedSection = useOfficeStore((s) => s.getSelectedSection());
  const selectSection = useOfficeStore((s) => s.selectSection);
  const updateWordSection = useOfficeStore((s) => s.updateWordSection);
  const updateWordDocumentMeta = useOfficeStore((s) => s.updateWordDocumentMeta);
  const deleteWordSection = useOfficeStore((s) => s.deleteWordSection);

  if (activeDoc.type !== 'document') return null;
  const doc = activeDoc.model;

  // ── A. Selected Section Block Properties ───────────────────────────────────
  if (selectedSection) {
    return (
      <div className="p-3 space-y-4 text-xs">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={() => selectSection(null)}
              className="p-1 -ml-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Back to Document Properties"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="font-bold text-foreground capitalize truncate">
              {selectedSection.type} Block
            </span>
          </div>

          <Button
            size="xs"
            variant="destructive"
            onClick={() => deleteWordSection(selectedSection.id)}
            className="h-6 px-2 text-2xs gap-1"
          >
            <Trash2 className="size-3" />
            <span>Delete</span>
          </Button>
        </div>

        {/* 1. Heading Properties */}
        {selectedSection.type === 'heading' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Heading Level</Label>
              <div className="grid grid-cols-3 gap-1">
                {([1, 2, 3] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => updateWordSection(selectedSection.id, { level: lvl })}
                    className={cn(
                      'py-1 text-xs rounded border transition-colors font-bold',
                      (selectedSection as HeadingSection).level === lvl
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    H{lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Heading Text</Label>
              <Input
                value={(selectedSection as HeadingSection).text}
                onChange={(e) =>
                  updateWordSection(selectedSection.id, { text: e.target.value })
                }
                className="text-xs font-semibold"
              />
            </div>
          </div>
        )}

        {/* 2. Paragraph Properties */}
        {selectedSection.type === 'paragraph' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1">
              <Label className="text-[11px] text-muted-foreground">Lead Paragraph Style</Label>
              <input
                type="checkbox"
                checked={Boolean((selectedSection as ParagraphSection).lead)}
                onChange={(e) =>
                  updateWordSection(selectedSection.id, { lead: e.target.checked })
                }
                className="rounded border-border text-primary focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Paragraph Body</Label>
              <textarea
                rows={5}
                value={(selectedSection as ParagraphSection).text}
                onChange={(e) =>
                  updateWordSection(selectedSection.id, { text: e.target.value })
                }
                className="w-full text-xs border border-border rounded-md p-2 bg-background text-foreground leading-relaxed focus:outline-primary"
              />
            </div>
          </div>
        )}

        {/* 3. Callout Box Properties */}
        {selectedSection.type === 'callout' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Callout Title</Label>
              <Input
                value={(selectedSection as CalloutSection).title || ''}
                placeholder="e.g. Core Strategic Value"
                onChange={(e) =>
                  updateWordSection(selectedSection.id, { title: e.target.value })
                }
                className="text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Badge Label</Label>
              <Input
                value={(selectedSection as CalloutSection).badge || ''}
                placeholder="e.g. HIGH IMPACT"
                onChange={(e) =>
                  updateWordSection(selectedSection.id, { badge: e.target.value })
                }
                className="text-xs uppercase font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Callout Narrative</Label>
              <textarea
                rows={4}
                value={(selectedSection as CalloutSection).text}
                onChange={(e) =>
                  updateWordSection(selectedSection.id, { text: e.target.value })
                }
                className="w-full text-xs border border-border rounded-md p-2 bg-background text-foreground leading-relaxed focus:outline-primary"
              />
            </div>
          </div>
        )}

        {/* 4. Stat Grid Properties */}
        {selectedSection.type === 'stat-grid' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] text-muted-foreground">Metric Cards</Label>
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  const currentStats = (selectedSection as StatGridSection).stats || [];
                  updateWordSection(selectedSection.id, {
                    stats: [
                      ...currentStats,
                      { label: 'New Metric', value: '+50%' },
                    ],
                  });
                }}
                className="h-5 px-2 text-2xs gap-1"
              >
                <Plus className="size-3" />
                <span>Add Metric</span>
              </Button>
            </div>

            <div className="space-y-2">
              {(selectedSection as StatGridSection).stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded border border-border/70 bg-muted/20 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xs font-mono font-bold text-muted-foreground">
                      Card #{idx + 1}
                    </span>
                    <button
                      onClick={() => {
                        const updated = [...(selectedSection as StatGridSection).stats];
                        updated.splice(idx, 1);
                        updateWordSection(selectedSection.id, { stats: updated });
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      title="Remove Metric"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <Input
                      value={stat.value}
                      placeholder="Value (e.g. 380%)"
                      onChange={(e) => {
                        const updated = [...(selectedSection as StatGridSection).stats];
                        updated[idx] = { ...updated[idx], value: e.target.value };
                        updateWordSection(selectedSection.id, { stats: updated });
                      }}
                      className="h-7 text-xs font-bold font-mono"
                    />
                    <Input
                      value={stat.label}
                      placeholder="Label (e.g. ROI)"
                      onChange={(e) => {
                        const updated = [...(selectedSection as StatGridSection).stats];
                        updated[idx] = { ...updated[idx], label: e.target.value };
                        updateWordSection(selectedSection.id, { stats: updated });
                      }}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Table Properties */}
        {selectedSection.type === 'table' && (
          <div className="space-y-3">
            <Label className="text-[11px] text-muted-foreground">Table Dimensions</Label>
            <div className="p-2 rounded border border-border/70 bg-muted/20 text-xs flex justify-between font-mono">
              <span>Columns: {(selectedSection as TableSection).headers.length}</span>
              <span>Rows: {(selectedSection as TableSection).rows.length}</span>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Column Headers</Label>
              {(selectedSection as TableSection).headers.map((h, hIdx) => (
                <Input
                  key={hIdx}
                  value={h}
                  onChange={(e) => {
                    const headers = [...(selectedSection as TableSection).headers];
                    headers[hIdx] = e.target.value;
                    updateWordSection(selectedSection.id, { headers });
                  }}
                  className="h-7 text-xs mb-1 font-semibold"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── B. Global Document & Page Inspector (when no section selected) ─────────
  return (
    <div className="p-3 space-y-4 text-xs">
      {/* Header Ribbon */}
      <div className="flex items-center justify-between pb-1 border-b border-border/50">
        <span className="font-bold text-foreground flex items-center gap-1.5">
          <Sliders className="size-3.5 text-primary" />
          Document Global Props
        </span>
        <Badge variant="outline" className="text-[10px] font-mono uppercase">
          {doc.pageSize ?? 'Letter'}
        </Badge>
      </div>

      {/* Document Meta */}
      <div className="space-y-2">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Document Title</Label>
          <Input
            value={doc.title}
            onChange={(e) => updateWordDocumentMeta({ title: e.target.value })}
            className="h-8 text-xs font-bold"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Subtitle</Label>
          <Input
            value={doc.subtitle || ''}
            placeholder="Executive Framework & Proposal"
            onChange={(e) => updateWordDocumentMeta({ subtitle: e.target.value })}
            className="h-7 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Author</Label>
            <Input
              value={doc.author || ''}
              placeholder="Author Name"
              onChange={(e) => updateWordDocumentMeta({ author: e.target.value })}
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Organization</Label>
            <Input
              value={doc.organization || ''}
              placeholder="Enterprise Org"
              onChange={(e) => updateWordDocumentMeta({ organization: e.target.value })}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Page Constraints & Layout */}
      <div className="space-y-2 pt-2 border-t border-border/50">
        <Label className="text-[11px] text-muted-foreground">Physical Page Geometry</Label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => updateWordDocumentMeta({ pageSize: 'letter' })}
            className={cn(
              'py-1.5 px-2 rounded border text-xs text-left transition-colors',
              doc.pageSize === 'letter' || !doc.pageSize
                ? 'border-primary bg-primary/10 text-primary font-bold'
                : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="font-semibold">Letter</div>
            <div className="text-3xs text-muted-foreground">8.5" × 11" (US)</div>
          </button>

          <button
            type="button"
            onClick={() => updateWordDocumentMeta({ pageSize: 'a4' })}
            className={cn(
              'py-1.5 px-2 rounded border text-xs text-left transition-colors',
              doc.pageSize === 'a4'
                ? 'border-primary bg-primary/10 text-primary font-bold'
                : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="font-semibold">A4</div>
            <div className="text-3xs text-muted-foreground">210 × 297 mm (ISO)</div>
          </button>
        </div>

        {/* Page Fit & Cover Page Toggles */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between py-1">
            <Label className="text-[11px] text-muted-foreground">Include Executive Cover</Label>
            <input
              type="checkbox"
              checked={Boolean(doc.hasCoverPage)}
              onChange={(e) => updateWordDocumentMeta({ hasCoverPage: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <Label className="text-[11px] text-muted-foreground">Strict 1-Page Fit</Label>
            <input
              type="checkbox"
              checked={doc.pageFit === 'strict-1-page'}
              onChange={(e) =>
                updateWordDocumentMeta({
                  pageFit: e.target.checked ? 'strict-1-page' : 'multi-page',
                })
              }
              className="rounded border-border text-primary focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Theme Presets */}
      <div className="space-y-1.5 pt-2 border-t border-border/50">
        <Label className="text-[11px] text-muted-foreground">Corporate Theme Palette</Label>
        <div className="grid grid-cols-1 gap-1.5">
          {(Object.entries(OFFICE_THEMES) as [OfficeThemeName, typeof OFFICE_THEMES[OfficeThemeName]][]).map(
            ([tKey, t]) => (
              <button
                key={tKey}
                type="button"
                onClick={() => updateWordDocumentMeta({ theme: tKey })}
                className={cn(
                  'flex items-center justify-between p-2 rounded-md border text-xs transition-all text-left',
                  doc.theme === tKey
                    ? 'border-primary bg-primary/10 font-bold text-foreground shadow-2xs'
                    : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span
                      className="size-3 rounded-full border border-black/20"
                      style={{ backgroundColor: t.primary }}
                    />
                    <span
                      className="size-3 rounded-full border border-black/20"
                      style={{ backgroundColor: t.secondary }}
                    />
                  </div>
                  <span className="capitalize">{t.name}</span>
                </div>
                {doc.theme === tKey && <Check className="size-3 text-primary" />}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentInspectorPanel;
