'use client';

import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { DashboardTopBar } from './DashboardTopBar';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  projectName?: string;
  userName?: string;
  plan?: 'free' | 'pro' | 'team';
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  projectName = 'Vibeflow',
  userName = 'User',
  plan = 'free',
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset>
          <DashboardTopBar
            projectName={projectName}
            userName={userName}
            plan={plan}
          />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
