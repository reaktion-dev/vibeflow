'use client';

import { Plus, Search, FolderOpen, Clock, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  currentPath?: string;
}

export function Sidebar({ currentPath }: SidebarProps) {
  const router = useRouter();

  const navItems = [
    { icon: Plus, label: 'New Project', href: '/', action: true },
    { icon: FolderOpen, label: 'Projects', href: '/#projects' },
    { icon: Clock, label: 'Recent', href: '/#recent' },
    { icon: Zap, label: 'Templates', href: '/#templates' },
  ];

  return (
    <aside className="w-60 bg-card border-r border-border h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold text-foreground">DevBox</h1>
        </div>

        {/* New Project Button */}
        <Button
          onClick={() => router.push('/')}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary/50"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-muted border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navItems.slice(1).map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href}>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm text-muted-foreground hover:text-foreground transition">
                <Icon className="w-4 h-4" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Daytona AI Dev</p>
          <p>Powered by AI SDK v7</p>
        </div>
      </div>
    </aside>
  );
}
