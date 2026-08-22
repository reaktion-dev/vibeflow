'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  FolderOpen,
  Folder,
  LogOut,
  ChevronDown,
  ChevronRight,
  Code2,
  Palette,
  Video,
  Workflow,
  FileText,
  Images,
  LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VibeflowLogo } from '@/components/ui/vibeflow-logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { authClient, useSession } from '@/lib/auth-client';
import { useProjects } from '@/hooks/useProject';
import { focusDashboardPrompt } from './prompt-focus';
import { cn } from '@/lib/utils';

const WORKSPACE_TYPES = [
  { id: 'code', label: 'Code Workspaces', icon: Code2, color: 'text-blue-500' },
  { id: 'design', label: 'Design Canvases', icon: Palette, color: 'text-purple-500' },
  { id: 'office', label: 'Office Studios', icon: FileText, color: 'text-indigo-500' },
  { id: 'video', label: 'Video Studios', icon: Video, color: 'text-orange-500' },
  { id: 'flow', label: 'Workflow Pipelines', icon: Workflow, color: 'text-green-500' },
] as const;

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const { data: session, isPending } = useSession();
  const { projects } = useProjects();

  const user = session?.user;
  const displayName =
    user?.name?.trim() || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email ?? '';
  const userInitials = (displayName.trim().charAt(0) || 'U').toUpperCase();

  // Auto-expand the currently open project in the tree
  useEffect(() => {
    if (pathname.startsWith('/projects/')) {
      const currentProjectId = pathname.split('/')[2];
      if (currentProjectId) {
        setExpandedProjects((prev) => new Set([...prev, currentProjectId]));
      }
    }
  }, [pathname]);

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setSearchQuery(params.get('q') ?? '');
      setActiveType(params.get('type'));
    };
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [pathname]);

  const toggleProjectExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startNewProject = () => {
    if (
      typeof document !== 'undefined' &&
      document.getElementById('dashboard-prompt-textarea')
    ) {
      focusDashboardPrompt();
    } else {
      router.push('/dashboard');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (pathname === '/dashboard') {
      const params = new URLSearchParams(window.location.search);
      if (value) params.set('q', value);
      else params.delete('q');
      const qs = params.toString();
      router.replace(qs ? `/dashboard?${qs}` : '/dashboard');
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
    } finally {
      router.push('/sign-in');
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchingProjects = normalizedQuery
    ? projects.filter((project) => {
        const name = (project.name ?? '').toLowerCase();
        const description = (project.description ?? '').toLowerCase();
        return (
          name.includes(normalizedQuery) ||
          description.includes(normalizedQuery)
        );
      })
    : [];

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-border/50">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-1 py-0.5">
          <VibeflowLogo variant="mark" size={24} className="shrink-0" />
          <div className="flex flex-col min-w-0">
            <h1 className="text-sm font-bold text-foreground leading-none">Vibeflow</h1>
            <span className="text-[10px] text-muted-foreground font-mono mt-0.5">agentic platform</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* New Project CTA */}
        <div className="p-3">
          <Button
            onClick={startNewProject}
            className="w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
            size="sm"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>New Project</span>
          </Button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 z-10 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-8 w-full rounded-md border border-border/60 bg-muted/40 py-1.5 pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          {/* Live search results popover */}
          {normalizedQuery && (
            <div className="mt-1.5 max-h-48 overflow-auto rounded-md border border-border/60 bg-card/95 p-1 shadow-lg backdrop-blur-sm">
              {matchingProjects.length === 0 ? (
                <p className="px-2.5 py-1.5 text-xs text-muted-foreground">
                  No matching projects
                </p>
              ) : (
                matchingProjects.slice(0, 6).map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-muted"
                  >
                    <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{project.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <SidebarSeparator />

        {/* Global Hub Navigation */}
        <SidebarGroup className="py-1">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/dashboard" />}
                  isActive={pathname === '/dashboard' && !activeType}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span>All Projects</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Notion-Style Multi-Modal Projects Tree */}
        <SidebarGroup className="py-1">
          <div className="flex items-center justify-between px-2 py-1">
            <SidebarGroupLabel className="p-0 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Projects
            </SidebarGroupLabel>
            <button
              type="button"
              onClick={startNewProject}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
              title="New project"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <SidebarGroupContent>
            <div className="space-y-0.5 px-1">
              {projects.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-muted-foreground/60 italic">
                  No projects yet
                </p>
              ) : (
                projects.slice(0, 15).map((project) => {
                  const isCurrent = pathname === `/projects/${project.id}`;
                  const isExpanded = expandedProjects.has(project.id);

                  return (
                    <div key={project.id} className="group/tree flex flex-col">
                      {/* Project Root Folder */}
                      <div
                        className={cn(
                          'flex items-center gap-1 rounded-md px-1.5 py-1 text-xs transition-colors',
                          isCurrent
                            ? 'bg-accent/60 font-medium text-accent-foreground'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        )}
                      >
                        <button
                          type="button"
                          onClick={(e) => toggleProjectExpand(project.id, e)}
                          className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-muted-foreground/60 hover:text-foreground"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => router.push(`/projects/${project.id}`)}
                          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                        >
                          {isExpanded ? (
                            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          ) : (
                            <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          )}
                          <span className="truncate">{project.name}</span>
                        </button>
                      </div>

                      {/* Sub-Workspaces Tree Nodes */}
                      {isExpanded && (
                        <div className="ml-4 flex flex-col border-l border-border/40 pl-2 pt-0.5 space-y-0.5">
                          <Link
                            href={`/projects/${project.id}?tab=overview`}
                            className={cn(
                              'flex items-center gap-1.5 rounded px-2 py-1 text-[11px] transition-colors',
                              isCurrent && (!currentTab || currentTab === 'overview')
                                ? 'bg-amber-500/15 text-amber-500 font-medium'
                                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                            )}
                          >
                            <LayoutGrid className="h-3 w-3 text-amber-500 shrink-0" />
                            <span>Overview (HUD)</span>
                          </Link>

                          <Link
                            href={`/projects/${project.id}?tab=code`}
                            className={cn(
                              'flex items-center gap-1.5 rounded px-2 py-1 text-[11px] transition-colors',
                              isCurrent && currentTab === 'code'
                                ? 'bg-blue-500/15 text-blue-500 font-medium'
                                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                            )}
                          >
                            <Code2 className="h-3 w-3 text-blue-500 shrink-0" />
                            <span>Code Workspace</span>
                          </Link>

                          <Link
                            href={`/projects/${project.id}?tab=design`}
                            className={cn(
                              'flex items-center gap-1.5 rounded px-2 py-1 text-[11px] transition-colors',
                              isCurrent && currentTab === 'design'
                                ? 'bg-purple-500/15 text-purple-500 font-medium'
                                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                            )}
                          >
                            <Palette className="h-3 w-3 text-purple-500 shrink-0" />
                            <span>Vector Design</span>
                          </Link>

                          <Link
                            href={`/projects/${project.id}?tab=office`}
                            className={cn(
                              'flex items-center gap-1.5 rounded px-2 py-1 text-[11px] transition-colors',
                              isCurrent && currentTab === 'office'
                                ? 'bg-indigo-500/15 text-indigo-500 font-medium'
                                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                            )}
                          >
                            <FileText className="h-3 w-3 text-indigo-500 shrink-0" />
                            <span>Office Studio</span>
                          </Link>

                          <Link
                            href={`/projects/${project.id}?tab=video`}
                            className={cn(
                              'flex items-center gap-1.5 rounded px-2 py-1 text-[11px] transition-colors',
                              isCurrent && currentTab === 'video'
                                ? 'bg-orange-500/15 text-orange-500 font-medium'
                                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                            )}
                          >
                            <Video className="h-3 w-3 text-orange-500 shrink-0" />
                            <span>Video Studio</span>
                          </Link>

                          <Link
                            href={`/projects/${project.id}?tab=flow`}
                            className={cn(
                              'flex items-center gap-1.5 rounded px-2 py-1 text-[11px] transition-colors',
                              isCurrent && currentTab === 'flow'
                                ? 'bg-green-500/15 text-green-500 font-medium'
                                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                            )}
                          >
                            <Workflow className="h-3 w-3 text-green-500 shrink-0" />
                            <span>Flow Pipelines</span>
                          </Link>

                          <Link
                            href={`/projects/${project.id}?tab=artifacts`}
                            className={cn(
                              'flex items-center gap-1.5 rounded px-2 py-1 text-[11px] transition-colors',
                              isCurrent && currentTab === 'artifacts'
                                ? 'bg-amber-500/15 text-amber-500 font-medium'
                                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                            )}
                          >
                            <Images className="h-3 w-3 text-amber-500 shrink-0" />
                            <span>Artifact Vault</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Global Workspaces Filter */}
        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Filter By Modality
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {WORKSPACE_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = activeType === type.id;
                return (
                  <SidebarMenuItem key={type.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => {
                        setActiveType(isActive ? null : type.id);
                        if (isActive) router.push('/dashboard');
                        else router.push(`/dashboard?type=${type.id}`);
                      }}
                      className="text-xs"
                    >
                      <Icon className={cn('h-3.5 w-3.5', type.color)} />
                      <span>{type.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="sm"
                className="w-full justify-between data-[active=true]:bg-transparent"
              />
            }
          >
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarImage src={user?.image ?? '/avatar.png'} alt={displayName} />
                <AvatarFallback className="text-[10px]">{userInitials}</AvatarFallback>
              </Avatar>
              <span className="truncate text-xs font-medium">{isPending ? 'User' : displayName}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {isPending ? 'User' : displayName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail || 'Signed in'}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} variant="destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SidebarTrigger />
    </Sidebar>
  );
}

export { useSidebar };