'use client';

import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { ChatPanel } from '@/components/ai/chat-panel/ChatPanel';
import { ArtifactGallery } from '@/components/workspace/ArtifactGallery';
import { ArtifactPreview } from '@/components/workspace/ArtifactPreview';
import { BudgetBar } from '@/components/workspace/BudgetBar';
import { VectorMiniEditor } from '@/components/workspace/editor/VectorMiniEditor';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/stores/workspace-store';

type ProjectType = 'design' | 'video' | 'flow';

interface ContentWorkspaceProps {
  projectId: string;
  projectName: string;
  projectType: ProjectType;
}

const workspaceConfig: Record<
  ProjectType,
  { label: string; accent: string }
> = {
  design: {
    label: 'Design',
    accent: 'from-purple-500 to-pink-500',
  },
  video: {
    label: 'Video',
    accent: 'from-orange-500 to-red-500',
  },
  flow: {
    label: 'Flow',
    accent: 'from-green-500 to-emerald-500',
  },
};

export function ContentWorkspace({
  projectId,
  projectName,
  projectType,
}: ContentWorkspaceProps) {
  const showChat = useWorkspaceStore((s) => s.showChat);
  const setShowChat = useWorkspaceStore((s) => s.setShowChat);
  const showGallery = useWorkspaceStore((s) => s.showGallery);
  const setShowGallery = useWorkspaceStore((s) => s.setShowGallery);
  const toggleGallery = useWorkspaceStore((s) => s.toggleGallery);
  const selectedAsset = useWorkspaceStore((s) => s.selectedAsset);
  const setSelectedAsset = useWorkspaceStore((s) => s.setSelectedAsset);
  const config = workspaceConfig[projectType];

  // On small screens, collapse the side panels by default so the canvas keeps
  // usable width (desktop keeps the full three-pane layout).
  useEffect(() => {
    if (window.matchMedia('(max-width: 1023.98px)').matches) {
      setShowChat(false);
      setShowGallery(false);
    }
  }, [setShowChat, setShowGallery]);

  const handleSelectAsset = (
    assetId: string,
    asset: { name: string; type: string; mimeType?: string | null; sizeBytes?: number | null }
  ) => {
    setSelectedAsset({
      id: assetId,
      name: asset.name,
      type: asset.type,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes ?? null,
    });
  };

  // Determine if the selected asset should open in the mini-editor (SVG only)
  const isSvgAsset =
    selectedAsset?.type === 'svg' ||
    selectedAsset?.mimeType === 'image/svg+xml';

  const assetUrl = selectedAsset
    ? `/api/projects/${projectId}/assets/${selectedAsset.id}`
    : null;

  return (
    <div className="relative flex h-screen w-full bg-background">
      {/* Main content area — artifact gallery + preview/editor */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex h-12 items-center justify-between border-b border-border/40 bg-background/80 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br text-xs font-bold text-white',
                config.accent
              )}
            >
              V
            </div>
            <h1 className="text-sm font-semibold text-foreground">{projectName}</h1>
            <span className="text-xs text-muted-foreground">/ {config.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <BudgetBar projectId={projectId} />
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={toggleGallery}
            >
              {showGallery ? (
                <ChevronLeft className="mr-1 h-4 w-4" />
              ) : (
                <ChevronRight className="mr-1 h-4 w-4" />
              )}
              Artifacts
            </Button>
          </div>
        </div>

        {/* Gallery + Preview/Editor */}
        <div className="relative flex flex-1 overflow-hidden">
          {showGallery && (
            <div
              className={cn(
                'flex flex-col border-r border-border bg-card',
                // Desktop: static panel. Mobile: overlay drawer so the canvas
                // keeps usable width on small screens.
                'absolute inset-y-0 left-0 z-30 w-64 shadow-xl lg:static lg:z-auto lg:w-72 lg:shadow-none'
              )}
            >
              <div className="flex items-center gap-2 border-b border-border p-3">
                <Images className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-foreground">Artifacts</h3>
              </div>
              <ArtifactGallery
                projectId={projectId}
                projectType={projectType}
                selectedAssetId={selectedAsset?.id}
                onSelect={handleSelectAsset}
              />
            </div>
          )}

          {/* Preview panel — mini-editor for SVG assets, preview for others */}
          {selectedAsset && assetUrl ? (
            isSvgAsset ? (
              <VectorMiniEditor
                svgUrl={assetUrl}
                assetId={selectedAsset.id}
                projectId={projectId}
              />
            ) : (
              <ArtifactPreview
                projectId={projectId}
                assetId={selectedAsset.id}
                assetName={selectedAsset.name}
                assetType={selectedAsset.type}
                assetMimeType={selectedAsset.mimeType}
                assetSizeBytes={selectedAsset.sizeBytes}
              />
            )
          ) : (
            <div className="flex flex-1 items-center justify-center bg-muted/30">
              <div className="text-center text-muted-foreground">
                <p className="text-sm">
                  {config.label} workspace preview
                </p>
                <p className="mt-1 text-xs">
                  Generated artifacts will appear here. Ask the agent to create
                  something to get started.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat sidebar */}
      {showChat && (
        <div
          className={cn(
            'flex flex-col border-l border-border bg-card',
            // Desktop: static panel. Mobile: overlay drawer.
            'absolute inset-y-0 right-0 z-30 w-80 shadow-xl lg:static lg:z-auto lg:w-96 lg:shadow-none'
          )}
        >
          <ChatPanel projectId={projectId} projectType={projectType} />
        </div>
      )}

      {/* Chat toggle */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="absolute right-0 top-12 flex h-10 items-center gap-1 rounded-l-md border border-r-0 border-border bg-card px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Chat
        </button>
      )}

    </div>
  );
}
