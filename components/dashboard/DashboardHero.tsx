'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VibeflowLogo } from '@/components/ui/vibeflow-logo';

interface DashboardHeroProps {
  title?: string;
  compact?: boolean;
  showUpgradeBanner?: boolean;
}

/**
 * Authenticated counterpart to the landing hero: same brand mark + wordmark
 * and centered rhythm, but with a "compact" variant so it stays present but
 * lighter once projects exist below.
 */
export function DashboardHero({
  title = 'What do you want to build?',
  compact = false,
  showUpgradeBanner = false,
}: DashboardHeroProps) {
  return (
    <div className="flex flex-col items-center gap-4 sm:gap-5">
      {/* Brand mark + wordmark */}
      <div className="flex items-center gap-3">
        <VibeflowLogo
          variant="mark"
          size={compact ? 36 : 48}
          className="shrink-0"
        />
        <h1
          className={cn(
            'font-bold tracking-tight text-foreground',
            compact ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl'
          )}
        >
          Vibeflow
        </h1>
      </div>

      {/* Subtitle */}
      <p
        className={cn(
          'max-w-md text-center text-muted-foreground',
          compact ? 'text-base' : 'text-lg'
        )}
      >
        {title}
      </p>

      {/* Upgrade banner — off by default in the authenticated surface */}
      {showUpgradeBanner && (
        <div className="flex w-full max-w-xl items-center justify-between rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-accent-foreground/80">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>Upgrade to unlock all features.</span>
          </div>
          <a
            href="#"
            className="text-sm font-medium text-accent-foreground transition-colors hover:underline"
          >
            Learn more →
          </a>
        </div>
      )}
    </div>
  );
}
