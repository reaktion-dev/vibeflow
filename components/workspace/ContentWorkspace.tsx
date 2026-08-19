'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { ChatPanel } from '@/components/ai/chat-panel/ChatPanel';
import { ArtifactGallery } from '@/components/workspace/ArtifactGallery';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const [showChat, setShowChat] = useState(true);
  const [showGallery, setShowGallery] = useState(true);
  const config = workspaceConfig[projectType];

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Main content area — artifact gallery + preview (the workspace focus) */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex h-12 items-center justify-between border-b border-border bg-card/50 px-4 backdrop-blur-sm">
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
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setShowGallery(!showGallery)}
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

        {/* Gallery + Preview */}
        <div className="flex flex-1 overflow-hidden">
          {showGallery && (
            <div className="w-72 border-r border-border bg-card flex flex-col">
              <div className="flex items-center gap-2 border-b border-border p-3">
                <Images className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-foreground">Artifacts</h3>
              </div>
              <ArtifactGallery projectId={projectId} projectType={projectType} />
            </div>
          )}

          {/* Preview panel — will host the mini-editor per type in later phases */}
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
        </div>
      </div>

      {/* Chat sidebar */}
      {showChat && (
        <div className="w-96 border-l border-border bg-card flex flex-col">
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
