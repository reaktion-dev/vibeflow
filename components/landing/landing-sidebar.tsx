"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import {
  Home,
  Code2,
  Palette,
  Video,
  Workflow,
  FolderOpen,
  ChevronUp,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface SidebarItem {
  icon: ReactNode;
  label: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
}

interface LandingSidebarProps {
  activeItem?: string;
}

const navItems: SidebarItem[] = [
  { icon: <Home className="h-4 w-4" />, label: "Home", href: "/", active: true },
  { icon: <Code2 className="h-4 w-4" />, label: "Code", href: "/dashboard?type=code" },
  { icon: <Palette className="h-4 w-4" />, label: "Design", href: "/dashboard?type=design" },
  { icon: <Video className="h-4 w-4" />, label: "Video", href: "/dashboard?type=video" },
  { icon: <Workflow className="h-4 w-4" />, label: "Flows", href: "/dashboard?type=flow" },
  { icon: <FolderOpen className="h-4 w-4" />, label: "Projects", href: "/dashboard" },
];

function LandingSidebarIconButton({
  item,
  isActive = false,
}: {
  item: SidebarItem;
  isActive?: boolean;
}) {
  const buttonClassName =
    "h-9 w-9 justify-center rounded-lg p-0 text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground data-active:bg-primary/15 data-active:text-primary [&>span]:sr-only";

  return (
    <SidebarMenuItem className="relative">
      {isActive ? (
        <div className="pointer-events-none absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-primary" />
      ) : null}

      {item.href ? (
        <SidebarMenuButton
          render={<Link href={item.href} />}
          tooltip={item.label}
          isActive={isActive}
          className={buttonClassName}
        >
          {item.icon}
          <span>{item.label}</span>
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton
          type="button"
          tooltip={item.label}
          isActive={isActive}
          onClick={item.onClick}
          aria-label={item.label}
          className={buttonClassName}
        >
          {item.icon}
          <span>{item.label}</span>
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );
}

export function LandingSidebar({ activeItem = "Home" }: LandingSidebarProps) {
  return (
    <Sidebar
      collapsible="none"
      style={{ "--sidebar-width": "3rem" } as CSSProperties}
      className="h-screen border-r border-border/40 bg-background text-foreground"
    >
      <SidebarHeader className="items-center gap-0 px-2 pt-3 pb-0">
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-xs font-bold text-white shadow-lg shadow-indigo-500/25">
          V
        </div>
      </SidebarHeader>

      <SidebarContent className="items-center overflow-hidden px-1.5 pb-3">
        <SidebarMenu className="items-center gap-0.5">
          {navItems.map((item) => (
            <LandingSidebarIconButton
              key={item.label}
              item={item}
              isActive={activeItem === item.label}
            />
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="items-center gap-0 px-1.5 pt-0 pb-3">
        <div className="mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary text-primary-foreground">
          <ChevronUp className="h-3 w-3" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
