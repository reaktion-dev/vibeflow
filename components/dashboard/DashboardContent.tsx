'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bot,
  Code2,
  GitBranch,
  LayoutTemplate,
  MoreHorizontal,
  Palette,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Video,
  Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import useSWR from 'swr';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeleteProject } from '@/hooks/useProject';
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
  onRename: (project: Project) => void;
  onDelete: (project: Project) => void;
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

const PROJECT_TYPES: ProjectType[] = ['code', 'design', 'video', 'flow'];

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

function ProjectCard({ project, onOpen, onRename, onDelete }: ProjectCardProps) {
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
      className="group flex cursor-pointer flex-col rounded-xl border border-border/60 bg-card/60 p-4 outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary/40"
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
        <div className="flex shrink-0 items-center gap-1">
          <Badge
            variant="outline"
            className={cn('shrink-0', statusMeta.tint)}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', statusMeta.dot)} />
            {statusMeta.label}
          </Badge>
          {/* Card actions — stop propagation so the menu doesn't open the project */}
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Actions for ${project.name}`}
                  />
                }
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onRename(project)}>
                  <Pencil />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(project)}
                >
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
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
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteProject = useDeleteProject();

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

  // Client-side filtering driven by the sidebar (type + search query params).
  const typeParam = searchParams.get('type');
  const searchQuery = searchParams.get('q') ?? '';
  const activeType =
    typeParam && (PROJECT_TYPES as string[]).includes(typeParam)
      ? (typeParam as ProjectType)
      : null;

  const filteredProjects = projects.filter((project) => {
    if (activeType && project.type !== activeType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (project.name ?? '').toLowerCase();
      const description = (project.description ?? '').toLowerCase();
      if (!name.includes(q) && !description.includes(q)) return false;
    }
    return true;
  });

  const handlePromptSubmit = async (message: { text: string; files: any[] }) => {
    if (!message.text.trim()) return;
    setIsCreating(true);

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
      const json = await res.json();
      const projectId = json?.data?.id;
      if (!projectId) throw new Error('Failed to create project');

      toast.success('Project created');
      router.push(`/projects/${projectId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create project'
      );
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

  const openRename = (project: Project) => {
    setRenameValue(project.name);
    setRenameTarget(project);
  };

  const handleRename = async () => {
    if (!renameTarget) return;
    const name = renameValue.trim();
    if (!name) {
      toast.error('Project name cannot be empty');
      return;
    }
    setIsRenaming(true);
    try {
      const res = await fetch(`/api/projects/${renameTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to rename project');
      }
      toast.success('Project renamed');
      setRenameTarget(null);
      void mutate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to rename project'
      );
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      toast.success('Project deleted');
      setDeleteTarget(null);
      void mutate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete project'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const hasProjects = projects.length > 0;
  const hasFilteredProjects = filteredProjects.length > 0;

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
                  {filteredProjects.length}
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

            {hasFilteredProjects ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onOpen={openProject}
                    onRename={openRename}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/60 p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No projects match your current filters.
                </p>
              </div>
            )}
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
                    className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-lg"
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

      {/* Rename dialog */}
      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
            <DialogDescription>
              Give this project a new name.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Project name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!renameValue.trim() || isRenaming}
            >
              {isRenaming ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.name}" along with
              its files and conversations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}