'use client';

import { useState, useEffect } from 'react';
import { Download, Loader2, Maximize2, ZoomIn, ZoomOut, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useOfficeStore } from '@/lib/office-tool/useOfficeStore';
import toast from 'react-hot-toast';

/**
 * Fetch an SVG asset URL and render it inline as real vector markup.
 * Inline SVG scales crisply at any zoom level (unlike <img src="*.svg">).
 */
function InlineSvg({ src, alt, zoom }: { src: string; alt: string; zoom: number }) {
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSvgMarkup(null);
    setError(false);
    fetch(src)
      .then((res) => res.text())
      .then((text) => {
        if (!cancelled) setSvgMarkup(text);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (error) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full rounded-xl shadow-lg shadow-black/10"
      />
    );
  }

  if (!svgMarkup) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }

  return (
    <div
      // Flex container fills the scrollable preview area; the SVG shrinks to
      // fit via flex constraints and the parent's overflow-auto scrolls when
      // the zoom transform grows it (no fixed height cap to clip against).
      className="flex h-full w-full items-center justify-center [&>svg]:max-h-full [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:w-auto"
      style={{
        transform: `scale(${zoom})`,
        transformOrigin: 'center',
        transition: 'transform 0.15s ease-out',
      }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}

interface ArtifactPreviewProps {
  projectId: string;
  assetId: string | null;
  assetName?: string;
  assetType?: string;
  assetMimeType?: string | null;
  assetSizeBytes?: number | null;
}

interface AssetDetail {
  id: string;
  name: string;
  type: string;
  mimeType: string | null;
  sizeBytes: number | null;
  status: string;
  url?: string;
}

export function ArtifactPreview({
  projectId,
  assetId,
  assetName,
  assetType,
  assetMimeType,
  assetSizeBytes,
}: ArtifactPreviewProps) {
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // The asset URL is the API route itself — it redirects to a signed R2 URL
  // or streams the buffer directly (dev mode). We use it as an img src.
  const assetUrl = assetId ? `/api/projects/${projectId}/assets/${assetId}` : null;

  useEffect(() => {
    if (!assetId) {
      setAsset(null);
      return;
    }

    // Build asset detail from props + URL — no need to fetch JSON
    // since the route returns a redirect/binary, not JSON.
    setAsset({
      id: assetId,
      name: assetName ?? 'Asset',
      type: assetType ?? 'unknown',
      mimeType: assetMimeType ?? null,
      sizeBytes: assetSizeBytes ?? null,
      status: 'ready',
      url: assetUrl ?? undefined,
    });
  }, [assetId, assetName, assetType, assetMimeType, assetUrl, assetSizeBytes]);

  // Use passed props as fallback
  const displayName = asset?.name ?? assetName ?? 'Asset';
  const displayType = asset?.type ?? assetType ?? 'unknown';
  const mimeType = asset?.mimeType ?? assetMimeType;
  const isImage = mimeType?.startsWith('image/') || displayType === 'image' || displayType === 'svg' || displayType === 'export';
  const isSvg = mimeType === 'image/svg+xml' || (displayType === 'svg');

  const handleExport = async (format: 'png' | 'jpeg' | 'webp') => {
    if (!assetId) return;
    setIsExporting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          svgAssetId: assetId,
          name: displayName.replace(/\.\w+$/, ''),
          format,
          scale: 2,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Export failed (HTTP ${res.status})`);
      }
      toast.success(`Exported ${format.toUpperCase()} 2x`);
    } catch (err) {
      console.error('Export failed:', err);
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  if (!assetId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background/50">
        <div className="text-center text-muted-foreground px-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30">
            <Maximize2 className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-foreground/80">Preview Panel</p>
          <p className="mt-1.5 text-xs leading-relaxed">
            Select an artifact from the gallery to preview it here.
          </p>
          <p className="mt-3 text-[11px] text-muted-foreground/50 leading-relaxed">
            Ask the agent to compose a design, search for images,<br />
            or generate something to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background/50">
      {/* Preview toolbar */}
      <div className="flex h-10 items-center justify-between border-b border-border/40 bg-card/30 px-3">
        <div className="flex items-center gap-2">
          <span className="truncate text-xs font-medium text-foreground">{displayName}</span>
          <Badge variant="secondary" className="h-4 px-1.5 text-[9px] uppercase">
            {displayType}
          </Badge>
        </div>
        <div className="flex items-center gap-0.5">
          {/* Zoom controls (image/svg only) */}
          {isImage && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                disabled={zoom <= 0.25}
                className="h-7 w-7"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="w-10 text-center text-[10px] font-mono text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
                disabled={zoom >= 4}
                className="h-7 w-7"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <div className="mx-1 h-4 w-px bg-border/60" />
            </>
          )}

          {/* Export button (SVG only) */}
          {isSvg && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-[11px]"
                disabled={isExporting}
                onClick={() => handleExport('png')}
              >
                {isExporting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Download className="h-3 w-3" />
                )}
                PNG 2x
              </Button>
            </div>
          )}

          {/* Open in new tab */}
          {asset?.url && (
            <a
              href={asset.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex size-7 items-center justify-center rounded-[min(var(--radius-md),12px)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Preview canvas */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-6 sm:p-8">
        {asset?.url && isImage ? (
          isSvg ? (
            <InlineSvg
              src={asset.url}
              alt={displayName}
              zoom={zoom}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.url}
              alt={displayName}
              className="max-w-full max-h-full rounded-xl shadow-lg shadow-black/10"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                transition: 'transform 0.15s ease-out',
              }}
            />
          )
        ) : displayType === 'document' || displayName.endsWith('.pdf') || displayName.endsWith('.docx') || displayName.endsWith('.xlsx') || displayName.endsWith('.pptx') ? (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-border/60 bg-card/70 max-w-md text-center shadow-lg backdrop-blur-xs">
            <div className="size-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
              <FileText className="size-7" />
            </div>
            <h3 className="text-base font-semibold text-foreground">{displayName}</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-5">
              Structured document asset with vector typography, live formula ledgers, and export models.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => {
                  toast.success(`Opened "${displayName}" in Document Studio Canvas`);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 text-xs h-9 px-4 shadow-sm"
              >
                <FileText className="size-4" />
                Open in Studio Canvas
              </Button>
              {asset?.url && (
                <Button variant="outline" asChild className="h-9 px-4 text-xs gap-1.5">
                  <a href={asset.url} target="_blank" rel="noreferrer">
                    <Download className="size-3.5" />
                    Download
                  </a>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Unable to preview this asset type</p>
            {asset?.url && (
              <a
                href={asset.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs text-primary underline"
              >
                Download instead
              </a>
            )}
          </div>
        )}
      </div>

      {/* Asset metadata footer */}
      {asset && (
        <div className="flex h-8 items-center gap-3 border-t border-border/40 bg-card/30 px-3 text-[10px] font-mono text-muted-foreground/70">
          {asset.sizeBytes && (
            <span>{(asset.sizeBytes / 1024).toFixed(1)} KB</span>
          )}
          {asset.mimeType && <span>{asset.mimeType}</span>}
          <span className="ml-auto capitalize">{asset.status}</span>
        </div>
      )}
    </div>
  );
}
