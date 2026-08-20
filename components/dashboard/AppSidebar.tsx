'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  FolderOpen,
  LogOut,
  ChevronDown,
  Code2,
  Palette,
  Video,
  Workflow,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}

const WORKSPACE_TYPES = [
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'flow', label: 'Flows', icon: Workflow },
] as const;

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<string | null>(null);
  const { data: session, isPending } = useSession();
  const { projects } = useProjects();

  const user = session?.user;
  const displayName =
    user?.name?.trim() || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email ?? '';
  const userInitials = (displayName.trim().charAt(0) || 'U').toUpperCase();

  // Keep the search box and workspace filter in sync with the dashboard's
  // query params (initial load, cross-page navigation, and back/forward).
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

  const startNewProject = () => {
    // If the dashboard composer is already mounted, jump to it;
    // otherwise go to the dashboard, which hosts it.
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
    // Mirror the query into the dashboard URL so the project grid filters too.
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

  const mainNavItems: NavItem[] = [
    {
      icon: <Plus className="h-4 w-4" />,
      label: 'New Project',
      onClick: startNewProject,
    },
    {
      icon: <FolderOpen className="h-4 w-4" />,
      label: 'Projects',
      href: '/dashboard',
    },
  ];

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-xs font-bold text-white shadow-lg shadow-indigo-500/25">
            V
          </div>
          <h1 className="text-lg font-bold text-foreground">Vibeflow</h1>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <div className="p-3">
          <Button
            onClick={startNewProject}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 z-10 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Live search results */}
          {normalizedQuery && (
            <div className="mt-2 overflow-hidden rounded-lg border border-border/60 bg-card/60">
              {matchingProjects.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  No matching projects
                </p>
              ) : (
                matchingProjects.slice(0, 6).map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
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

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  {item.href ? (
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={pathname === item.href}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton onClick={item.onClick}>
                      {item.icon}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {WORKSPACE_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <SidebarMenuItem key={type.id}>
                    <SidebarMenuButton
                      isActive={activeType === type.id}
                      onClick={() => {
                        setActiveType(type.id);
                        router.push(`/dashboard?type=${type.id}`);
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{type.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                className="data-[active=true]:bg-transparent"
              />
            }
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={user?.image ?? '/avatar.png'} alt={displayName} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <span>{isPending ? 'User' : displayName}</span>
            <ChevronDown className="ml-auto h-4 w-4" />
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
            <DropdownMenuItem onClick={handleSignOut}>
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