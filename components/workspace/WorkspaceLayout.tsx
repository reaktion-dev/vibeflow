'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Code2,
  Palette,
  Video,
  Workflow,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';

export type WorkspaceType = 'code' | 'design' | 'video' | 'flow';

interface WorkspaceLayoutProps {
  workspaceId: string;
  workspaceName: string;
  workspaceType: WorkspaceType;
  children: React.ReactNode;
}

const workspaceIcons: Record<WorkspaceType, React.ReactNode> = {
  code: <Code2 className="w-4 h-4" />,
  design: <Palette className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  flow: <Workflow className="w-4 h-4" />,
};

const workspaceColors: Record<WorkspaceType, string> = {
  code: 'from-blue-500 to-cyan-500',
  design: 'from-purple-500 to-pink-500',
  video: 'from-orange-500 to-red-500',
  flow: 'from-green-500 to-emerald-500',
};

export function WorkspaceLayout({
  workspaceId,
  workspaceName,
  workspaceType,
  children,
}: WorkspaceLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  return (
    <div className="h-screen w-full flex bg-background">
      {/* Left Sidebar — Workspace Navigation */}
      <aside
        className={cn(
          'flex flex-col border-r border-border/40 bg-background/80 backdrop-blur-sm transition-all duration-300',
          sidebarCollapsed ? 'w-14' : 'w-56'
        )}
      >
        {/* Header */}
        <div className="flex h-12 items-center justify-between border-b border-border/40 px-3">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br text-white text-xs font-bold',
                  workspaceColors[workspaceType]
                )}
              >
                V
              </div>
              <span className="text-sm font-semibold truncate">{workspaceName}</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded hover:bg-muted transition"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Workspace Type Indicator */}
        <div className="px-3 py-2 border-b border-border/40">
          <div
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium',
              'bg-gradient-to-r text-white',
              workspaceColors[workspaceType]
            )}
          >
            {workspaceIcons[workspaceType]}
            {!sidebarCollapsed && <span className="capitalize">{workspaceType} Workspace</span>}
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-2 space-y-1">
          {[
            { icon: <Layers className="w-4 h-4" />, label: 'Overview' },
            { icon: <MessageSquare className="w-4 h-4" />, label: 'AI Chat' },
            { icon: <Sparkles className="w-4 h-4" />, label: 'Agents' },
          ].map((item) => (
            <button
              key={item.label}
              className={cn(
                'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition',
                'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {item.icon}
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-border/40">
          <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition">
            <Settings className="w-4 h-4" />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-12 items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-sm px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              {workspaceIcons[workspaceType]}
              <span className="font-medium">{workspaceName}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground capitalize">{workspaceType}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPanelOpen(!panelOpen)}
              className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition"
            >
              {panelOpen ? 'Hide Panel' : 'Show Panel'}
            </button>
          </div>
        </header>

        {/* Workspace Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>

      {/* Right Panel (optional) */}
      {panelOpen && (
        <aside className="w-72 border-l border-border/40 bg-background/80 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <h3 className="text-sm font-medium">Properties</h3>
          </div>
          <div className="flex-1 p-4 text-sm text-muted-foreground">
            <p>Workspace panel content goes here.</p>
          </div>
        </aside>
      )}
    </div>
  );
}
