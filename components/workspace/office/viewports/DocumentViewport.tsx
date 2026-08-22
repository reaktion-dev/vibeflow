'use client';

import React, { useState, useEffect } from 'react';
import { useOfficeStore } from '@/lib/office-tool/useOfficeStore';
import { generatePdfBuffer } from '@/lib/office-tool/pdf/service';
import { DocumentBlockCanvas } from './DocumentBlockCanvas';
import { Loader2 } from 'lucide-react';

interface DocumentViewportProps {
  isEditable?: boolean;
}

export function DocumentViewport({ isEditable = false }: DocumentViewportProps) {
  const activeDoc = useOfficeStore((s) => s.activeDoc);
  const zoom = useOfficeStore((s) => s.zoom);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (activeDoc.type !== 'document') return null;
  const doc = activeDoc.model;

  // ── Live Vector PDF Compilation for View Mode ──────────────────────────────
  useEffect(() => {
    let isCancelled = false;

    async function compilePdf() {
      if (isEditable) return;
      setIsGeneratingPdf(true);

      try {
        const buffer = await generatePdfBuffer(doc);
        if (isCancelled) return;

        const blob = new Blob([buffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        setPdfUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (err) {
        console.error('[DocumentViewport] PDF compilation failed:', err);
      } finally {
        if (!isCancelled) {
          setIsGeneratingPdf(false);
        }
      }
    }

    compilePdf();

    return () => {
      isCancelled = true;
    };
  }, [doc, isEditable]);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  return (
    <div className="relative flex size-full flex-col overflow-hidden bg-slate-950">
      {/* ── View Mode: 100% Vector PDF Stream with True Print Geometry ─────── */}
      {!isEditable && (
        <div className="flex-1 overflow-auto relative p-6 flex flex-col items-center justify-start min-h-full">
          {isGeneratingPdf && !pdfUrl && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs text-slate-300">
              <Loader2 className="size-7 animate-spin text-primary mb-2.5" />
              <span className="text-xs font-semibold tracking-wide">Compiling Vector PDF Layout…</span>
            </div>
          )}

          {pdfUrl && (
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                width: doc.pageSize === 'a4' ? '794px' : '816px',
                height: '920px',
              }}
              className="relative shadow-2xl rounded-xs border border-slate-700/60 overflow-hidden bg-slate-900 transition-transform duration-150"
            >
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                className="size-full border-0 bg-white"
                title={doc.title}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Edit Mode: Interactive Component Block Canvas ──────────────────── */}
      {isEditable && <DocumentBlockCanvas />}
    </div>
  );
}

export default DocumentViewport;
