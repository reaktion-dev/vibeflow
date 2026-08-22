'use client';

import { ReactNode, Suspense } from 'react';
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
        <Suspense fallback={<div className="w-64 shrink-0 bg-sidebar" />}>
          <AppSidebar />
        </Suspense>
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
