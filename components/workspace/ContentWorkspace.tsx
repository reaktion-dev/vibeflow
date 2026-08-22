'use client';

import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Images, MessageSquare, Palette, Video, Workflow } from 'lucide-react';
import { ChatPanel } from '@/components/ai/chat-panel/ChatPanel';
import { ArtifactGallery } from '@/components/workspace/ArtifactGallery';
import { ArtifactPreview } from '@/components/workspace/ArtifactPreview';
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
  { label: string; icon: typeof Palette; accent: string }
> = {
  design: {
    label: 'Vector Design',
    icon: Palette,
    accent: 'from-purple-500 to-pink-500',
  },
  video: {
    label: 'Video Studio',
    icon: Video,
    accent: 'from-orange-500 to-red-500',
  },
  flow: {
    label: 'Flow Pipelines',
    icon: Workflow,
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

  const isSvgAsset =
    selectedAsset?.type === 'svg' ||
    selectedAsset?.mimeType === 'image/svg+xml';

  const assetUrl = selectedAsset
    ? `/api/projects/${projectId}/assets/${selectedAsset.id}`
    : null;

  return (
    <div className="relative flex h-full w-full bg-background overflow-hidden">
      {/* Left Column: Chat Sidebar (No duplicate headers!) */}
      {showChat && (
        <aside className="w-80 sm:w-96 lg:w-[400px] border-r border-border bg-card flex flex-col shrink-0 min-h-0 relative z-20">
          <ChatPanel projectId={projectId} projectType={projectType} />
        </aside>
      )}

      {/* Chat toggle button when collapsed */}
      {!showChat && (
        <button
          type="button"
          onClick={() => setShowChat(true)}
          className="absolute left-0 top-3 z-30 flex h-8 items-center gap-1.5 rounded-r-md border border-l-0 border-border bg-card/90 px-2.5 text-xs text-muted-foreground hover:text-foreground shadow-md backdrop-blur-sm transition-colors"
          title="Open Agent Chat"
        >
          <MessageSquare className="size-3.5 text-primary" />
          <span>Chat</span>
          <ChevronRight className="size-3.5" />
        </button>
      )}

      {/* Main Right Area — Clean Canvas Surface */}
      <main className="flex flex-1 flex-col overflow-hidden min-w-0 bg-background">
        {/* Compact Canvas Toolbar */}
        <div className="h-10 border-b border-border/60 bg-card/70 backdrop-blur-sm px-3 flex items-center justify-between gap-2 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              {config.label} Canvas
            </span>
            {selectedAsset && (
              <span className="text-[11px] text-muted-foreground font-mono truncate max-w-xs">
                / {selectedAsset.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 px-2.5 text-xs gap-1.5 transition-colors',
                showGallery ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={toggleGallery}
              title="Toggle Project Artifacts Drawer"
            >
              <Images className="size-3.5" />
              <span>Artifacts</span>
            </Button>
          </div>
        </div>

        {/* Gallery + Preview/Editor */}
        <div className="relative flex flex-1 overflow-hidden">
          {/* Artifact Gallery Panel */}
          {showGallery && (
            <div
              className={cn(
                'flex flex-col border-r border-border bg-card shrink-0 z-20',
                'absolute inset-y-0 left-0 w-64 shadow-xl lg:static lg:w-72 lg:shadow-none'
              )}
            >
              <div className="flex items-center justify-between border-b border-border p-2.5">
                <div className="flex items-center gap-1.5">
                  <Images className="size-3.5 text-muted-foreground" />
                  <h3 className="text-xs font-semibold text-foreground">Artifacts</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={toggleGallery}
                  className="size-6"
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ArtifactGallery
                  projectId={projectId}
                  projectType={projectType}
                  selectedAssetId={selectedAsset?.id}
                  onSelect={handleSelectAsset}
                />
              </div>
            </div>
          )}

          {/* Preview / Mini-Editor Surface */}
          <div className="flex-1 overflow-hidden bg-muted/10 relative">
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
              <div className="flex h-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/40 mb-3">
                  <Images className="size-6 text-muted-foreground/60" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{config.label} Workspace Canvas</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                  Generated artifacts and editable vectors will render here. Instruct the agent on the left to start creating.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ContentWorkspace;
