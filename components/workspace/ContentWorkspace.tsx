'use client';

import { useEffect } from 'react';
import { ChevronLeft, Images, MessageSquare, Palette, Video, Workflow, FileText } from 'lucide-react';
import { ChatPanel } from '@/components/ai/chat-panel/ChatPanel';
import { ArtifactGallery } from '@/components/workspace/ArtifactGallery';
import { ArtifactPreview } from '@/components/workspace/ArtifactPreview';
import { DesignStudioRoot } from '@/components/workspace/design/DesignStudioRoot';
import { OfficeStudioRoot } from '@/components/workspace/office/OfficeStudioRoot';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useOfficeStore } from '@/lib/office-tool/useOfficeStore';

type ProjectType = 'design' | 'video' | 'flow' | 'office';

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
  office: {
    label: 'Office Studio',
    icon: FileText as any,
    accent: 'from-blue-600 to-indigo-600',
  },
};

export function ContentWorkspace({
  projectId,
  projectName,
  projectType,
}: ContentWorkspaceProps) {
  const showChat = useWorkspaceStore((s) => s.showChat);
  const setShowChat = useWorkspaceStore((s) => s.setShowChat);
  const sidebarTab = useWorkspaceStore((s) => s.sidebarTab);
  const setSidebarTab = useWorkspaceStore((s) => s.setSidebarTab);
  const selectedAsset = useWorkspaceStore((s) => s.selectedAsset);
  const setSelectedAsset = useWorkspaceStore((s) => s.setSelectedAsset);
  const designMode = useWorkspaceStore((s) => s.designMode);
  const setDesignMode = useWorkspaceStore((s) => s.setDesignMode);

  const config = workspaceConfig[projectType];

  useEffect(() => {
    if (window.matchMedia('(max-width: 1023.98px)').matches) {
      setShowChat(false);
    }
  }, [setShowChat]);

  const handleSelectAsset = (
    assetId: string,
    asset: {
      name: string;
      type: string;
      mimeType?: string | null;
      sizeBytes?: number | null;
      metadata?: any;
    }
  ) => {
    setSelectedAsset({
      id: assetId,
      name: asset.name,
      type: asset.type,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes ?? null,
    });

    const isDoc =
      asset.type === 'document' ||
      asset.name.endsWith('.pdf') ||
      asset.name.endsWith('.docx') ||
      asset.name.endsWith('.xlsx') ||
      asset.name.endsWith('.pptx');

    if (isDoc && asset.metadata?.model) {
      const docType =
        asset.metadata?.docType === 'spreadsheet' || asset.name.endsWith('.xlsx')
          ? 'spreadsheet'
          : asset.metadata?.docType === 'presentation' || asset.name.endsWith('.pptx')
          ? 'presentation'
          : 'document';
      useOfficeStore.getState().loadDocument({
        type: docType,
        model: asset.metadata.model,
      });
    }
  };

  const isSvgAsset =
    selectedAsset?.type === 'svg' ||
    selectedAsset?.mimeType === 'image/svg+xml' ||
    selectedAsset?.name.endsWith('.svg');

  const isDocumentAsset =
    selectedAsset?.type === 'document' ||
    selectedAsset?.name.endsWith('.pdf') ||
    selectedAsset?.name.endsWith('.docx') ||
    selectedAsset?.name.endsWith('.xlsx') ||
    selectedAsset?.name.endsWith('.pptx');

  const assetUrl = selectedAsset
    ? `/api/projects/${projectId}/assets/${selectedAsset.id}`
    : null;

  // In edit mode in design or office workspace, the layout evolves: the left column becomes the Studio Inspector
  const isEditingStudio =
    (projectType === 'design' && designMode === 'edit' && isSvgAsset) ||
    ((projectType === 'office' || isDocumentAsset) && designMode === 'edit');

  return (
    <div className="relative flex h-full w-full bg-background overflow-hidden">
      {/* ── Unified Left Column: Agent Chat & Artifacts Tabbed Panel ── */}
      {!isEditingStudio && showChat && (
        <aside className="w-80 sm:w-96 lg:w-[380px] border-r border-border bg-card flex flex-col shrink-0 min-h-0 relative z-20">
          {/* Top Panel Tab Switcher Header */}
          <div className="flex h-11 items-center justify-between border-b border-border/80 bg-muted/20 px-3 shrink-0">
            <div className="flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setSidebarTab('chat')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  sidebarTab === 'chat'
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <MessageSquare className="size-3.5 text-primary" />
                <span>Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('artifacts')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  sidebarTab === 'artifacts'
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Images className="size-3.5 text-amber-500" />
                <span>Artifacts</span>
              </button>
            </div>

            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setShowChat(false)}
              title="Collapse Sidebar"
              className="size-7 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </Button>
          </div>

          {/* Panel Tab Body */}
          <div className="flex-1 min-h-0 overflow-hidden relative">
            {sidebarTab === 'chat' ? (
              <ChatPanel projectId={projectId} projectType={projectType} />
            ) : (
              <div className="flex flex-col h-full overflow-y-auto">
                <ArtifactGallery
                  projectId={projectId}
                  projectType={projectType}
                  selectedAssetId={selectedAsset?.id}
                  onSelect={handleSelectAsset}
                />
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Sidebar toggle button when collapsed */}
      {!isEditingStudio && !showChat && (
        <div className="absolute left-0 top-3 z-30 flex items-center rounded-r-md border border-l-0 border-border bg-card/95 shadow-md backdrop-blur-sm p-0.5">
          <button
            type="button"
            onClick={() => {
              setSidebarTab('chat');
              setShowChat(true);
            }}
            className="flex h-7 items-center gap-1.5 rounded-sm px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Open Agent Chat"
          >
            <MessageSquare className="size-3.5 text-primary" />
            <span>Chat</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSidebarTab('artifacts');
              setShowChat(true);
            }}
            className="flex h-7 items-center gap-1.5 rounded-sm px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors border-l border-border/60"
            title="Open Artifacts Vault"
          >
            <Images className="size-3.5 text-amber-500" />
            <span>Artifacts</span>
          </button>
        </div>
      )}

      {/* ── Main Canvas & Studio Area (Takes 100% of remaining width) ── */}
      <main className="flex flex-1 flex-col overflow-hidden min-w-0 bg-background relative">
        {/* Canvas Body */}
        <div className="flex-1 overflow-hidden relative">
            {projectType === 'office' || isDocumentAsset ? (
              <OfficeStudioRoot
                projectId={projectId}
                mode={designMode}
                onModeChange={setDesignMode}
              />
            ) : selectedAsset && assetUrl ? (
              isSvgAsset ? (
                <DesignStudioRoot
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
      </main>
    </div>
  );
}

export default ContentWorkspace;
