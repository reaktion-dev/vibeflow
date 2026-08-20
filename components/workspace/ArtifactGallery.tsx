'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Image as ImageIcon, FileText, Film, Workflow, Loader2, Trash2, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ArtifactGalleryProps {
  projectId: string;
  projectType: string;
  selectedAssetId?: string;
  onSelect?: (assetId: string, asset: GalleryAsset) => void;
}

interface GalleryAsset {
  id: string;
  name: string;
  type: string;
  status: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  createdAt: string;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => res.json());

const typeIcons: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  svg: ImageIcon,
  video: Film,
  audio: ImageIcon,
  document: FileText,
  export: ImageIcon,
  pipeline: Workflow,
};

export function ArtifactGallery({ projectId, selectedAssetId, onSelect }: ArtifactGalleryProps) {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: GalleryAsset[] }>(
    `/api/projects/${projectId}/assets`,
    fetcher,
    { refreshInterval: 5000 }
  );

  const assets = data?.data ?? [];

  const handleDelete = async (assetId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/assets?assetId=${assetId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Failed to delete asset (HTTP ${res.status})`);
      }
      toast.success('Asset deleted');
      mutate();
    } catch (err) {
      console.error('Failed to delete asset:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete asset');
    }
  };

  return (
    <div className="flex-1 overflow-auto p-2">
      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : error ? (
        <div className="py-4 text-center text-xs text-muted-foreground">
          Failed to load artifacts
        </div>
      ) : assets.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          No artifacts yet.
          <br />
          Ask the agent to generate something.
        </div>
      ) : (
        <div className="space-y-1.5">
          {assets.map((asset) => {
            const Icon = typeIcons[asset.type] ?? ImageIcon;
            const isPending = asset.status === 'pending' || asset.status === 'running';
            const isSelected = selectedAssetId === asset.id;
            const isVisual = asset.type === 'image' || asset.type === 'svg' || asset.type === 'export';

            return (
              <div
                key={asset.id}
                onClick={() => !isPending && onSelect?.(asset.id, asset)}
                className={cn(
                  'group relative flex cursor-pointer items-center gap-2.5 rounded-lg border p-2 transition-all duration-200',
                  isSelected
                    ? 'border-primary/50 bg-primary/5 shadow-sm'
                    : 'border-border/60 hover:bg-muted/50 hover:border-border',
                  isPending && 'cursor-wait border-yellow-500/30 bg-yellow-500/5'
                )}
              >
                {/* Thumbnail */}
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted/50">
                  {isVisual && !isPending ? (
                    <Thumbnail
                      src={`/api/projects/${projectId}/assets/${asset.id}`}
                      alt={asset.name}
                    />
                  ) : isPending ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {asset.name}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {asset.type}
                    {isPending && ` · ${asset.status}`}
                  </p>
                </div>

                {/* Delete button (always visible — confirmation dialog guards it) */}
                {!isPending && (
                  <AlertDialog>
                    <AlertDialogTrigger
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-1.5 top-1.5 rounded-md p-1 text-muted-foreground/60 transition-all duration-150 hover:bg-destructive/10 hover:text-destructive focus-visible:bg-destructive/10 focus-visible:text-destructive focus-visible:outline-none"
                      title="Delete asset"
                    >
                      <Trash2 className="h-3 w-3" />
                    </AlertDialogTrigger>
                    <AlertDialogContent size="sm">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete artifact?</AlertDialogTitle>
                        <AlertDialogDescription>
                          &ldquo;{asset.name}&rdquo; will be permanently removed
                          from this project. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => handleDelete(asset.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Gallery thumbnail with a loading spinner and a broken-image fallback.
 */
function Thumbnail({ src, alt }: { src: string; alt: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  return (
    <>
      {status === 'error' ? (
        <div className="flex h-full w-full items-center justify-center">
          <ImageOff className="h-4 w-4 text-muted-foreground" />
        </div>
      ) : (
        <>
          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onLoad={() => setStatus('loaded')}
            onError={() => setStatus('error')}
            className="h-full w-full object-cover"
          />
        </>
      )}
    </>
  );
}
