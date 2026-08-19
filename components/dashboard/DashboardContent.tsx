'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Code2,
  GitBranch,
  LayoutTemplate,
  Palette,
  Plus,
  Sparkles,
  Upload,
  Video,
  Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useSWR from 'swr';
import { cn } from '@/lib/utils';
import { focusDashboardPrompt } from './prompt-focus';
import { ProjectCreationModal } from './ProjectCreationModal';
import { DashboardHero } from './DashboardHero';
import { DashboardPromptArea } from './DashboardPromptArea';

type ProjectType = 'code' | 'design' | 'video' | 'flow';
type ProjectStatus = 'active' | 'archived' | 'deleted';

interface Project {
  id: string;
  name: string;
  description: string | null;
  type: ProjectType;
  status: ProjectStatus;
  gitUrl: string | null;
  sandboxId: string | null;
  template: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectCardProps {
  project: Project;
  onOpen: (id: string) => void;
}

const TYPE_META: Record<
  ProjectType,
  { label: string; icon: typeof Code2; color: string; bgColor: string }
> = {
  code: {
    label: 'Code',
    icon: Code2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  design: {
    label: 'Design',
    icon: Palette,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  video: {
    label: 'Video',
    icon: Video,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  flow: {
    label: 'Flow',
    icon: Workflow,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
};

const STATUS_META: Record<
  ProjectStatus,
  { label: string; tint: string; dot: string }
> = {
  active: {
    label: 'Active',
    tint: 'bg-emerald-500/10',
    dot: 'bg-emerald-500',
  },
  archived: {
    label: 'Archived',
    tint: 'bg-slate-500/10',
    dot: 'bg-slate-500',
  },
  deleted: {
    label: 'Deleted',
    tint: 'bg-rose-500/10',
    dot: 'bg-rose-500',
  },
};

const QUICK_STARTS: {
  icon: typeof Upload;
  label: string;
  description: string;
  action: 'modal' | 'prompt';
}[] = [
  {
    icon: Upload,
    label: 'Import a project',
    description: 'From a ZIP, folder, or Git repo',
    action: 'modal',
  },
  {
    icon: LayoutTemplate,
    label: 'Start from a template',
    description: 'React, Node, and other stacks',
    action: 'modal',
  },
  {
    icon: Bot,
    label: 'Ask an AI agent',
    description: 'Describe it and let an agent scaffold it',
    action: 'prompt',
  },
];

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function getRepoHost(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function ProjectCard({ project, onOpen }: ProjectCardProps) {
  const typeMeta = TYPE_META[project.type] ?? TYPE_META.code;
  const statusMeta = STATUS_META[project.status] ?? STATUS_META.active;
  const TypeIcon = typeMeta.icon;
  const repoHost = project.gitUrl ? getRepoHost(project.gitUrl) : null;

  const open = () => onOpen(project.id);

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`Open project ${project.name}`}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      className="group flex cursor-pointer flex-col rounded-xl border border-border/60 bg-card/60 p-4 outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {/* Header */}
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
              typeMeta.bgColor
            )}
          >
            <TypeIcon className={cn('h-4 w-4', typeMeta.color)} />
          </span>
          <h3 className="truncate font-medium text-foreground">
            {project.name}
          </h3>
        </div>
        <Badge
          variant="outline"
          className={cn('shrink-0', statusMeta.tint)}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', statusMeta.dot)} />
          {statusMeta.label}
        </Badge>
      </div>

      {/* Description */}
      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
        {project.description || 'No description yet.'}
      </p>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/30 pt-3">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          {repoHost ? (
            <>
              <GitBranch className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{repoHost}</span>
            </>
          ) : (
            <>
              <TypeIcon className="h-3.5 w-3.5 shrink-0" />
              <span>
                {typeMeta.label} · Created{' '}
                {formatShortDate(project.createdAt)}
              </span>
            </>
          )}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
        >
          Open
        </Button>
      </div>
    </article>
  );
}

export function DashboardContent() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);

  const {
    data: projects = [],
    isLoading,
    mutate,
  } = useSWR<Project[]>('/api/projects', async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    // API returns { success: true, data: [...] }
    return json.data ?? [];
  });

  const refreshProjects = () => void mutate();

  const openProject = (id: string) => router.push(`/projects/${id}`);

  const handlePromptSubmit = async (message: { text: string; files: any[] }) => {
    if (!message.text.trim()) return;
    setIsCreating(true);
    setShowCreationModal(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: message.text.slice(0, 100),
          description: message.text,
          type: 'code',
          template: 'blank',
        }),
      });

      if (!res.ok) throw new Error('Failed to create project');
      refreshProjects();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuickStart = (action: 'modal' | 'prompt') => {
    if (action === 'prompt') {
      focusDashboardPrompt();
      return;
    }
    setShowCreationModal(true);
  };

  const hasProjects = projects.length > 0;

  return (
    <div className="flex min-h-full w-full flex-col">
      {/* Command surface */}
      <section
        className={cn(
          'mx-auto flex w-full max-w-3xl flex-col items-center px-4',
          hasProjects ? 'pt-10 pb-8 sm:pt-14' : 'pt-14 pb-10 sm:pt-20'
        )}
      >
        <DashboardHero
          title={
            hasProjects
              ? 'What are you building next?'
              : 'What do you want to build?'
          }
          compact={hasProjects}
          showUpgradeBanner={false}
        />

        <div className="flex w-full justify-center pt-4 sm:pt-6">
          <DashboardPromptArea
            placeholder={
              hasProjects
                ? 'Describe the next thing you want to build'
                : 'Build a dashboard with charts and analytics'
            }
            onSubmit={handlePromptSubmit}
            isCreating={isCreating}
            compact={hasProjects}
          />
        </div>
      </section>

      {/* Projects grid */}
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-14 sm:px-6">
        {isLoading ? (
          <div
            aria-label="Loading projects"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-border/60 bg-card/40 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="h-4 w-1/2 rounded bg-muted" />
                  <div className="h-5 w-14 rounded-full bg-muted" />
                </div>
                <div className="mb-2 h-3 w-full rounded bg-muted" />
                <div className="mb-6 h-3 w-2/3 rounded bg-muted" />
                <div className="flex items-center justify-between border-t border-border/30 pt-3">
                  <div className="h-3 w-20 rounded bg-muted" />
                  <div className="h-6 w-12 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : hasProjects ? (
          <div>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <h2 className="text-base font-semibold text-foreground sm:text-lg">
                  Your projects
                </h2>
                <span className="text-xs text-muted-foreground sm:text-sm">
                  {projects.length}
                </span>
              </div>
              <Button
                onClick={() => setShowCreationModal(true)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                New project
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={openProject}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="border-t border-border/40 pt-8">
            <div className="mb-5 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-muted-foreground">
                Quick start
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {QUICK_STARTS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleQuickStart(item.action)}
                    className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Creation modal */}
      {showCreationModal && (
        <ProjectCreationModal
          isOpen={showCreationModal}
          onClose={() => setShowCreationModal(false)}
          onSuccess={() => {
            setShowCreationModal(false);
            setIsCreating(false);
            refreshProjects();
          }}
        />
      )}
    </div>
  );
}
