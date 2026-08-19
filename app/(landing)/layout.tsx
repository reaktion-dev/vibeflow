import { SidebarProvider } from "@/components/ui/sidebar";
import { LandingSidebar } from "@/components/landing/landing-sidebar";
import { LandingTopBar } from "@/components/landing/landing-topbar";

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        {/* Left Rail */}
        <LandingSidebar />

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Bar */}
          <LandingTopBar />

          {/* Workspace */}
          <main className="flex flex-1 flex-col items-center justify-center overflow-auto px-4 pb-12">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
