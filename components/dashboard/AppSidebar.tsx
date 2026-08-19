'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  FolderOpen,
  Settings,
  HelpCircle,
  LogOut,
  User,
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
import { focusDashboardPrompt } from './prompt-focus';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');

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

  const bottomNavItems: NavItem[] = [
    {
      icon: <Settings className="h-4 w-4" />,
      label: 'Settings',
      href: '/settings',
    },
    {
      icon: <HelpCircle className="h-4 w-4" />,
      label: 'Help',
      href: '/help',
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
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
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/code" />}>
                  <Code2 className="h-4 w-4" />
                  <span>Code</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/design" />}>
                  <Palette className="h-4 w-4" />
                  <span>Design</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/video" />}>
                  <Video className="h-4 w-4" />
                  <span>Video</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/flow" />}>
                  <Workflow className="h-4 w-4" />
                  <span>Flows</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomNavItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton render={<Link href={item.href || '#'} />}>
                    {item.icon}
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
              <AvatarImage src="/avatar.png" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <span>User</span>
            <ChevronDown className="ml-auto h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">User</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    user@example.com
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/sign-in')}>
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
