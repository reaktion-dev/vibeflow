'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  Images,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  FileCode,
  Video,
  FileText,
  Palette,
  ExternalLink,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export interface VaultAsset {
  id: string;
  projectId: string;
  name: string;
  type: 'image' | 'svg' | 'video' | 'audio' | 'document' | 'export' | 'pipeline';
  mimeType?: string | null;
  url: string;
  sizeBytes?: number | null;
  metadata?: string | null;
  createdAt: string;
}

interface ArtifactVaultProps {
  projectId: string;
  projectName: string;
  onSelectAsset?: (asset: VaultAsset) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Artifacts', icon: Images },
  { id: 'svg', label: 'Vectors & SVGs', icon: Palette },
  { id: 'video', label: 'Videos & Media', icon: Video },
  { id: 'document', label: 'Documents', icon: FileText },
  { id: 'export', label: 'Code & Bundles', icon: FileCode },
] as const;

export function ArtifactVault({
  projectId,
  projectName,
  onSelectAsset,
}: ArtifactVaultProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<VaultAsset | null>(null);

  const {
    data: assetsData,
    isLoading,
    mutate,
  } = useSWR<VaultAsset[]>(
    `/api/projects/${projectId}/assets`,
    async (url: string) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json.data) ? json.data : [];
      } catch {
        return [];
      }
    },
    { fallbackData: [] }
  );

  const assets: VaultAsset[] = Array.isArray(assetsData) ? assetsData : [];

  const handleCopyReference = (asset: VaultAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    const refText = `asset://${asset.name}`;
    navigator.clipboard.writeText(refText);
    setCopiedId(asset.id);
    toast.success(`Copied "${refText}" to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAssets = assets.filter((asset) => {
    if (!asset) return false;
    if (activeCategory !== 'all' && asset.type !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (asset.name || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* Vault Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/50 bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <Images className="h-5 w-5 text-amber-500" />
            <h1 className="text-lg font-bold text-foreground">Project Artifact Vault</h1>
            <Badge variant="secondary" className="text-xs">
              {assets.length} {assets.length === 1 ? 'Asset' : 'Assets'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Central repository of vector SVGs, MP4 videos, OOXML documents, and exports for {projectName}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void mutate()}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 bg-muted/20 px-6 py-2.5">
        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all',
                  isActive
                    ? 'bg-background text-foreground shadow-2xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2 z-10 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search vault assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Asset Grid / Gallery */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-border/60 bg-card/40 p-4 h-48"
              />
            ))}
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 text-center p-6">
            <Images className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">No Artifacts Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Ask <span className="font-semibold text-purple-500">@designer</span> to craft vector SVGs or <span className="font-semibold text-orange-500">@video</span> to compose clips. Artifacts will automatically index here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAssets.map((asset) => {
              const isSvg = asset.type === 'svg' || asset.mimeType?.includes('svg');
              const isCopied = copiedId === asset.id;

              return (
                <div
                  key={asset.id}
                  onClick={() => {
                    setPreviewAsset(asset);
                    onSelectAsset?.(asset);
                  }}
                  className="group relative flex flex-col rounded-xl border border-border/60 bg-card/60 overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-lg"
                >
                  {/* Asset Thumbnail Preview */}
                  <div className="flex h-36 w-full items-center justify-center bg-muted/30 p-4 border-b border-border/40">
                    {isSvg ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <img
                          src={`/api/projects/${projectId}/assets/${asset.id}`}
                          alt={asset.name}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : asset.type === 'video' ? (
                      <Video className="h-12 w-12 text-orange-500/70" />
                    ) : asset.type === 'document' ? (
                      <FileText className="h-12 w-12 text-blue-500/70" />
                    ) : (
                      <Images className="h-12 w-12 text-muted-foreground/60" />
                    )}
                  </div>

                  {/* Asset Info Card */}
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="truncate text-xs font-semibold text-foreground" title={asset.name}>
                        {asset.name}
                      </span>
                      <Badge variant="outline" className="text-[9px] uppercase px-1 py-0">
                        {asset.type}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2">
                      <span className="font-mono truncate">asset://{asset.name}</span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => handleCopyReference(asset, e)}
                        title="Copy asset reference for agent chat"
                        className="h-6 w-6"
                      >
                        {isCopied ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ArtifactVault;
