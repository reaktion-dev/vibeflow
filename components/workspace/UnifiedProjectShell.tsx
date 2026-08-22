'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Code2,
  Palette,
  Video,
  Workflow,
  Images,
  ArrowLeft,
} from 'lucide-react';
import { VibeflowLogo } from '@/components/ui/vibeflow-logo';
import { ResizableIDE } from '@/components/ide/ResizableIDE';
import { ContentWorkspace } from '@/components/workspace/ContentWorkspace';
import { ArtifactVault } from '@/components/workspace/vault/ArtifactVault';
import { ProjectOverviewHUD } from '@/components/workspace/ProjectOverviewHUD';
import { BudgetBar } from '@/components/workspace/BudgetBar';
import { cn } from '@/lib/utils';

export type WorkspaceTab = 'overview' | 'code' | 'design' | 'video' | 'flow' | 'artifacts';

interface UnifiedProjectShellProps {
  projectId: string;
  projectName: string;
  initialType?: string;
}

const TABS: {
  id: WorkspaceTab;
  label: string;
  icon: typeof Code2;
  color: string;
}[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    color: 'text-amber-500',
  },
  {
    id: 'code',
    label: 'Code',
    icon: Code2,
    color: 'text-blue-500',
  },
  {
    id: 'design',
    label: 'Design',
    icon: Palette,
    color: 'text-purple-500',
  },
  {
    id: 'video',
    label: 'Video',
    icon: Video,
    color: 'text-orange-500',
  },
  {
    id: 'flow',
    label: 'Flow',
    icon: Workflow,
    color: 'text-green-500',
  },
  {
    id: 'artifacts',
    label: 'Vault',
    icon: Images,
    color: 'text-amber-500',
  },
];

export function UnifiedProjectShell({
  projectId,
  projectName,
  initialType = 'overview',
}: UnifiedProjectShellProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') as WorkspaceTab | null;

  // Default to tab in URL -> initialType -> fallback to 'overview'
  const defaultTab = (
    ['overview', 'code', 'design', 'video', 'flow', 'artifacts'].includes(tabParam ?? '')
      ? tabParam
      : ['code', 'design', 'video', 'flow', 'artifacts'].includes(initialType)
      ? initialType
      : 'overview'
  ) as WorkspaceTab;

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(defaultTab);

  const handleTabChange = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/projects/${projectId}?${params.toString()}`);
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Notion-style Top Workspace Bar */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border/50 bg-background/90 px-3 backdrop-blur-md">
        {/* Left: Breadcrumbs & Project Identity */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Projects</span>
          </Link>

          <span className="text-border/60">/</span>

          <div className="flex items-center gap-2 min-w-0">
            <VibeflowLogo variant="mark" size={20} className="shrink-0" />
            <h1 className="truncate text-xs font-semibold text-foreground sm:text-sm">
              {projectName}
            </h1>
          </div>
        </div>

        {/* Center: Multi-Modal Workspace Switcher Tabs */}
        <nav
          aria-label="Workspace modes"
          className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-0.5 shadow-2xs"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                  isActive
                    ? cn('bg-background text-foreground shadow-xs', tab.color)
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
                title={`Switch to ${tab.label} workspace`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Budget & Project Actions */}
        <div className="flex items-center gap-2">
          <BudgetBar projectId={projectId} />
        </div>
      </header>

      {/* Main Multi-Modal Content Body */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'overview' && (
          <div className="h-full w-full">
            <ProjectOverviewHUD
              projectId={projectId}
              projectName={projectName}
              onNavigateToTab={(tab) => handleTabChange(tab as WorkspaceTab)}
            />
          </div>
        )}

        {activeTab === 'code' && (
          <div className="h-full w-full">
            <ResizableIDE projectId={projectId} projectName={projectName} />
          </div>
        )}

        {activeTab === 'design' && (
          <div className="h-full w-full">
            <ContentWorkspace
              projectId={projectId}
              projectName={projectName}
              projectType="design"
            />
          </div>
        )}

        {activeTab === 'video' && (
          <div className="h-full w-full">
            <ContentWorkspace
              projectId={projectId}
              projectName={projectName}
              projectType="video"
            />
          </div>
        )}

        {activeTab === 'flow' && (
          <div className="h-full w-full">
            <ContentWorkspace
              projectId={projectId}
              projectName={projectName}
              projectType="flow"
            />
          </div>
        )}

        {activeTab === 'artifacts' && (
          <div className="h-full w-full">
            <ArtifactVault
              projectId={projectId}
              projectName={projectName}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default UnifiedProjectShell;
