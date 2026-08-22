'use client';

import { useOfficeStore } from '@/lib/office-tool/useOfficeStore';
import { PresentationModel, SlideModel, OFFICE_THEMES } from '@/lib/office-tool/types';
import { cn } from '@/lib/utils';
import { Plus, Edit3 } from 'lucide-react';
import { useState } from 'react';

interface PresentationViewportProps {
  isEditable?: boolean;
}

export function PresentationViewport({ isEditable = false }: PresentationViewportProps) {
  const activeDoc = useOfficeStore((s) => s.activeDoc);
  const activeSlideIndex = useOfficeStore((s) => s.activeSlideIndex);
  const setActiveSlideIndex = useOfficeStore((s) => s.setActiveSlideIndex);
  const updateSlide = useOfficeStore((s) => s.updateSlide);
  const zoom = useOfficeStore((s) => s.zoom);

  const [isEditingTitle, setIsEditingTitle] = useState(false);

  if (activeDoc.type !== 'presentation') return null;
  const presentation = activeDoc.model;
  const slide = presentation.slides[activeSlideIndex] || presentation.slides[0];
  const theme = OFFICE_THEMES[presentation.theme] ?? OFFICE_THEMES['corporate-navy'];

  if (!slide) return null;

  return (
    <div className="flex size-full overflow-hidden bg-slate-950">
      {/* ── 1. Left Slide Filmstrip Thumbnails ──────────────────────────────── */}
      <div className="w-56 shrink-0 border-r border-slate-800 bg-slate-900/60 p-3 overflow-y-auto space-y-3">
        <div className="text-3xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
          Slide Deck ({presentation.slides.length})
        </div>

        {presentation.slides.map((s, idx) => (
          <div
            key={s.id}
            onClick={() => setActiveSlideIndex(idx)}
            className={cn(
              'group relative rounded-lg border p-2 cursor-pointer transition-all overflow-hidden',
              activeSlideIndex === idx
                ? 'border-primary ring-2 ring-primary/40 bg-slate-800 shadow-md'
                : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
            )}
          >
            {/* Slide Index Badge */}
            <div className="absolute left-2 top-2 z-10 size-4 rounded-full bg-slate-900/90 text-2xs font-bold font-mono text-slate-300 flex items-center justify-center border border-slate-700">
              {idx + 1}
            </div>

            {/* Thumbnail Canvas Mock */}
            <div className="aspect-video w-full rounded bg-slate-900 flex flex-col justify-center p-2 text-center overflow-hidden">
              <div className="text-3xs font-bold text-white truncate px-1">
                {s.title || `Slide ${idx + 1}`}
              </div>
              {s.badge && (
                <div className="text-4xs text-emerald-400 font-mono mt-0.5 truncate">
                  {s.badge}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── 2. Central 16:9 Widescreen Slide Presentation Stage ────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            width: '960px',
            height: '540px', // 16:9 Aspect Ratio
          }}
          className={cn(
            'relative shrink-0 rounded-xl shadow-2xl overflow-hidden border border-slate-800 transition-transform p-10 flex flex-col justify-between select-text',
            slide.layout === 'title' ? 'text-white' : 'text-slate-900 bg-white'
          )}
          style={{
            backgroundColor: slide.layout === 'title' ? theme.primary : '#FFFFFF',
          }}
        >
          {/* Top Accent Line (Title Slide) */}
          {slide.layout === 'title' && (
            <div
              className="w-20 h-1.5 rounded-full mb-4"
              style={{ backgroundColor: theme.accent }}
            />
          )}

          {/* ── Slide Header & Badge ───────────────────────────────────────── */}
          <div>
            {slide.badge && (
              <span
                className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm inline-block mb-3"
                style={{
                  backgroundColor: slide.layout === 'title' ? 'rgba(255,255,255,0.1)' : theme.bgLight,
                  color: slide.layout === 'title' ? theme.accent : theme.secondary,
                }}
              >
                {slide.badge}
              </span>
            )}

            {isEditingTitle && isEditable ? (
              <input
                autoFocus
                type="text"
                value={slide.title}
                onBlur={() => setIsEditingTitle(false)}
                onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                className="w-full text-2xl font-black tracking-tight border-b border-primary bg-transparent outline-none"
                style={{ color: slide.layout === 'title' ? '#FFFFFF' : theme.primary }}
              />
            ) : (
              <h2
                onDoubleClick={() => isEditable && setIsEditingTitle(true)}
                className={cn(
                  'text-2xl font-black tracking-tight',
                  slide.layout === 'title' ? 'text-3xl' : 'text-xl'
                )}
                style={{ color: slide.layout === 'title' ? '#FFFFFF' : theme.primary }}
              >
                {slide.title}
              </h2>
            )}

            {slide.subtitle && (
              <p
                className={cn(
                  'mt-2 font-medium',
                  slide.layout === 'title' ? 'text-slate-300 text-sm' : 'text-slate-500 text-xs'
                )}
              >
                {slide.subtitle}
              </p>
            )}
          </div>

          {/* ── Slide Layout Content ───────────────────────────────────────── */}
          <div className="my-auto py-2">
            {slide.layout === 'stats' && slide.stats && (
              <div className="grid grid-cols-4 gap-4">
                {slide.stats.map((st, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border text-center shadow-xs"
                    style={{
                      backgroundColor: theme.bgLight,
                      borderColor: theme.border,
                    }}
                  >
                    <div
                      className="text-2xl font-black tracking-tight"
                      style={{ color: theme.primary }}
                    >
                      {st.value}
                    </div>
                    <div
                      className="text-2xs font-bold uppercase tracking-wider mt-1"
                      style={{ color: theme.secondary }}
                    >
                      {st.label}
                    </div>
                    {st.note && (
                      <div className="text-3xs text-slate-400 mt-1">{st.note}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {slide.layout === 'two-column' && (
              <div className="grid grid-cols-2 gap-6">
                {slide.leftColumn && (
                  <div
                    className="p-5 rounded-xl border shadow-xs"
                    style={{ backgroundColor: theme.bgLight, borderColor: theme.border }}
                  >
                    <h3 className="text-sm font-bold mb-3" style={{ color: theme.primary }}>
                      {slide.leftColumn.title}
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-700 list-disc pl-4">
                      {slide.leftColumn.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {slide.rightColumn && (
                  <div
                    className="p-5 rounded-xl border shadow-xs"
                    style={{ backgroundColor: theme.bgLight, borderColor: theme.border }}
                  >
                    <h3 className="text-sm font-bold mb-3" style={{ color: theme.secondary }}>
                      {slide.rightColumn.title}
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-700 list-disc pl-4">
                      {slide.rightColumn.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Slide Footer Branding ──────────────────────────────────────── */}
          <div className="flex items-center justify-between text-3xs font-mono opacity-60">
            <span>{presentation.title} — {presentation.author || 'Vibeflow'}</span>
            <span>SLIDE {activeSlideIndex + 1} OF {presentation.slides.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PresentationViewport;
