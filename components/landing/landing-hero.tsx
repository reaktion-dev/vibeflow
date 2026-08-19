"use client";

import { Sparkles } from "lucide-react";

interface LandingHeroProps {
  title?: string;
  showUpgradeBanner?: boolean;
}

export function LandingHero({
  title = "What do you want to build?",
  showUpgradeBanner = true,
}: LandingHeroProps) {
  return (
    <div className="flex flex-col items-center gap-6 pt-24 pb-4">
      {/* Logo / Brand Mark */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-xl font-bold text-white shadow-lg shadow-indigo-500/25">
          V
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Vibeflow
        </h1>
      </div>

      {/* Subtitle */}
      <p className="max-w-md text-center text-lg text-muted-foreground">
        {title}
      </p>

      {/* Upgrade Banner */}
      {showUpgradeBanner && (
        <div className="flex w-full max-w-xl items-center justify-between rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-accent-foreground/80">
            <Sparkles className="w-4 h-4 text-accent" />
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
