'use client';

import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Images, MessageSquare, Palette, Video, Workflow } from 'lucide-react';
import { ChatPanel } from '@/components/ai/chat-panel/ChatPanel';
import { ArtifactGallery } from '@/components/workspace/ArtifactGallery';
import { ArtifactPreview } from '@/components/workspace/ArtifactPreview';
import { VectorDesignStudio } from '@/components/workspace/design/VectorDesignStudio';
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
  const designMode = useWorkspaceStore((s) => s.designMode);
  const setDesignMode = useWorkspaceStore((s) => s.setDesignMode);

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
    selectedAsset?.mimeType === 'image/svg+xml' ||
    selectedAsset?.name.endsWith('.svg');

  const assetUrl = selectedAsset
    ? `/api/projects/${projectId}/assets/${selectedAsset.id}`
    : null;

  // In edit mode in design workspace, the layout evolves: the left column becomes the Studio Inspector
  const isEditingStudio = projectType === 'design' && designMode === 'edit' && isSvgAsset;

  return (
    <div className="relative flex h-full w-full bg-background overflow-hidden">
      {/* ── Left Column: Chat Sidebar (shown in View mode when showChat is true) ── */}
      {!isEditingStudio && showChat && (
        <aside className="w-80 sm:w-96 lg:w-[400px] border-r border-border bg-card flex flex-col shrink-0 min-h-0 relative z-20">
          <ChatPanel projectId={projectId} projectType={projectType} />
        </aside>
      )}

      {/* Chat toggle button when collapsed */}
      {!isEditingStudio && !showChat && (
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

      {/* ── Main Canvas & Studio Area ── */}
      <main className="flex flex-1 flex-col overflow-hidden min-w-0 bg-background relative">
        {/* Floating Artifacts Toggle (Always available in top right) */}
        {!isEditingStudio && (
          <div className="absolute top-2 right-3 z-20">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 px-2.5 text-xs gap-1.5 transition-colors border border-border/60 backdrop-blur-sm',
                showGallery ? 'bg-card text-foreground shadow-2xs' : 'bg-card/70 text-muted-foreground hover:text-foreground'
              )}
              onClick={toggleGallery}
              title="Toggle Project Artifacts Drawer"
            >
              <Images className="size-3.5" />
              <span>Artifacts</span>
            </Button>
          </div>
        )}

        {/* Gallery Drawer + Main Canvas Surface */}
        <div className="relative flex flex-1 overflow-hidden">
          {/* Artifact Gallery Panel */}
          {showGallery && !isEditingStudio && (
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

          {/* Canvas Body */}
          <div className="flex-1 overflow-hidden relative">
            {selectedAsset && assetUrl ? (
              isSvgAsset ? (
                <VectorDesignStudio
                  svgUrl={assetUrl}
                  assetId={selectedAsset.id}
                  assetName={selectedAsset.name}
                  projectId={projectId}
                  mode={designMode}
                  onModeChange={setDesignMode}
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
