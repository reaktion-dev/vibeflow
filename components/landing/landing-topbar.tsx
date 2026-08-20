"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  User,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Loader2,
} from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { focusDashboardPrompt } from "@/components/dashboard/prompt-focus";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LandingTopBarProps {
  userName?: string;
  projectName?: string;
  plan?: "free" | "pro" | "team";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U";
}

export function LandingTopBar({
  userName = "User",
  projectName = "Vibeflow",
  plan = "free",
}: LandingTopBarProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const user = session?.user;
  const isAuthenticated = Boolean(user);

  const displayName = useMemo(() => {
    if (user?.name?.trim()) {
      return user.name.trim();
    }

    if (user?.email) {
      return user.email.split("@")[0] || userName;
    }

    return userName;
  }, [user?.email, user?.name, userName]);

  const userEmail = user?.email ?? null;
  const userInitials = useMemo(() => getInitials(displayName), [displayName]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        focusDashboardPrompt();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleOpenApp = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const handleSignIn = useCallback(() => {
    router.push("/sign-in?callbackUrl=%2Fdashboard");
  }, [router]);

  const handleSignUp = useCallback(() => {
    router.push("/sign-up?callbackUrl=%2Fdashboard");
  }, [router]);

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);

    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.refresh();
          },
        },
      });
    } finally {
      setIsSigningOut(false);
    }
  }, [router]);

  return (
    <header className="flex h-12 items-center justify-between border-b border-border/40 bg-background/80 px-4 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted">
          {isAuthenticated ? (
            <Avatar size="sm" className="h-5 w-5">
              <AvatarImage src={user?.image ?? undefined} alt={displayName} />
              <AvatarFallback className="text-[10px]">{userInitials}</AvatarFallback>
            </Avatar>
          ) : (
            <User className="h-3 w-3" />
          )}
        </div>

        {isPending ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-10 animate-pulse rounded bg-muted" />
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <span className="truncate font-medium text-foreground">{isAuthenticated ? displayName : "Guest"}</span>

            <Badge
              variant="secondary"
              className="h-4 shrink-0 px-1.5 text-[10px] font-medium uppercase"
            >
              {plan}
            </Badge>

            <span className="text-border">/</span>

            <button
              type="button"
              onClick={isAuthenticated ? handleOpenApp : focusDashboardPrompt}
              className="flex min-w-0 items-center gap-1 transition-colors hover:text-foreground"
            >
              <span className="truncate">{projectName}</span>
              <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={focusDashboardPrompt}
          className="hidden items-center gap-2 rounded-lg border border-border/40 bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-muted/50 hover:text-foreground sm:flex"
          title="Focus prompt composer"
        >
          <Search className="h-3 w-3" />
          <span>Describe your project...</span>
          <kbd className="rounded border border-border/60 bg-muted px-1 py-0.5 text-[10px] font-mono text-muted-foreground">
            CtrlK
          </kbd>
        </button>

        {isPending ? (
          <div className="flex items-center gap-2">
            <div className="h-7 w-16 animate-pulse rounded-lg bg-muted" />
            <div className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
          </div>
        ) : isAuthenticated ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleOpenApp}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Open app
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-border/50 bg-background/60"
                    aria-label="Open account menu"
                  />
                }
              >
                <Avatar size="sm">
                  <AvatarImage src={user?.image ?? undefined} alt={displayName} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-24 truncate sm:inline">{displayName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>

              <DropdownMenuContent side="bottom" align="end" className="w-64">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{displayName}</span>
                      {userEmail ? (
                        <span className="text-xs text-muted-foreground">{userEmail}</span>
                      ) : null}
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={focusDashboardPrompt}>
                  <Sparkles className="h-4 w-4" />
                  <span>Start a new project idea</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleOpenApp}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Open app</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  variant="destructive"
                >
                  {isSigningOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleSignIn}
            >
              Sign in
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleSignUp}>
              <Sparkles className="h-3.5 w-3.5" />
              Get started
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
