'use client';

import useSWR from 'swr';
import { Image as ImageIcon, FileText, Film, Workflow, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArtifactGalleryProps {
  projectId: string;
  projectType: string;
}

interface Asset {
  id: string;
  name: string;
  type: string;
  status: string;
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

export function ArtifactGallery({ projectId, projectType }: ArtifactGalleryProps) {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: Asset[] }>(
    `/api/projects/${projectId}/assets`,
    fetcher
  );

  const assets = data?.data ?? [];

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
        <div className="space-y-2">
          {assets.map((asset) => {
            const Icon = typeIcons[asset.type] ?? ImageIcon;
            const isPending = asset.status === 'pending' || asset.status === 'running';
            return (
              <div
                key={asset.id}
                className={cn(
                  'flex items-center gap-2 rounded-md border border-border p-2 transition hover:bg-muted/50',
                  isPending && 'border-yellow-500/30 bg-yellow-500/5'
                )}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {asset.name}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {asset.type}
                    {isPending && ` · ${asset.status}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
