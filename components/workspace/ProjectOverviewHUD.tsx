'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  Code2,
  Palette,
  Video,
  Workflow,
  Images,
  ExternalLink,
  Sparkles,
  Layers,
  Zap,
  TrendingUp,
  FolderOpen,
  ArrowRight,
  Bot,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  ShieldCheck,
  Check,
  X,
  FileCode,
  Bell,
  Activity,
  Send,
  CornerDownLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ALL_AGENTS } from '@/lib/ai/orchestration';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ProjectOverviewHUDProps {
  projectId: string;
  projectName: string;
  onNavigateToTab: (tab: string) => void;
}

interface PendingApproval {
  id: string;
  agentRole: 'orchestrator' | 'coder' | 'designer' | 'video' | 'flow';
  title: string;
  description: string;
  type: 'budget' | 'design' | 'code' | 'pipeline';
  costCents?: number;
  createdAt: string;
}

interface ActivityEvent {
  id: string;
  agentRole: 'orchestrator' | 'coder' | 'designer' | 'video' | 'flow';
  title: string;
  detail: string;
  timestamp: string;
  targetTab?: string;
  targetAsset?: string;
}

export function ProjectOverviewHUD({
  projectId,
  projectName,
  onNavigateToTab,
}: ProjectOverviewHUDProps) {
  const [quickPrompt, setQuickPrompt] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  // Pending Human-in-the-Loop approvals queue
  const [approvals, setApprovals] = useState<PendingApproval[]>([
    {
      id: 'appr-1',
      agentRole: 'video',
      title: 'Render 1080p Teaser MP4 with Voiceover',
      description: 'ElevenLabs voiceover synthesis (14.8s) + Remotion scene sequencing and server-side FFmpeg MP4 assembly.',
      type: 'budget',
      costCents: 45,
      createdAt: '2m ago',
    },
    {
      id: 'appr-2',
      agentRole: 'designer',
      title: 'Promote Primary Vector Monogram to Vault',
      description: 'Traced SVG monogram variant with 45-degree sliced crown selected for global brand lockup.',
      type: 'design',
      createdAt: '12m ago',
    },
  ]);

  // Activity stream notifications
  const [activities, setActivities] = useState<ActivityEvent[]>([
    {
      id: 'act-1',
      agentRole: 'coder',
      title: 'Scaffolded waitlist form component',
      detail: 'Created app/components/WaitlistForm.tsx with server action validation.',
      timestamp: '5m ago',
      targetTab: 'code',
    },
    {
      id: 'act-2',
      agentRole: 'designer',
      title: 'Auto-traced vector logo into SVG',
      detail: 'Generated 3 SVG paths via @visioncortex/vtracer and saved to Vault.',
      timestamp: '14m ago',
      targetTab: 'artifacts',
    },
    {
      id: 'act-3',
      agentRole: 'orchestrator',
      title: 'Structured project milestones',
      detail: 'Assigned initial tasks across @coder, @designer, and @video.',
      timestamp: '25m ago',
      targetTab: 'overview',
    },
  ]);

  // Fetch project stats (budget & assets)
  const { data: budgetData } = useSWR(
    `/api/projects/${projectId}/budget`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) return { spentCents: 38, budgetCents: 1000 };
      const json = await res.json();
      return json.data ?? { spentCents: 38, budgetCents: 1000 };
    },
    { fallbackData: { spentCents: 38, budgetCents: 1000 } }
  );

  const { data: assetsData } = useSWR(
    `/api/projects/${projectId}/assets`,
    async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json.data) ? json.data : [];
      } catch {
        return [];
      }
    },
    { fallbackData: [] }
  );

  const assetsList = Array.isArray(assetsData) ? assetsData : [];
  const spentCents = budgetData?.spentCents ?? 38;
  const budgetCents = budgetData?.budgetCents ?? 1000;
  const budgetPercentage = Math.min(Math.round((spentCents / budgetCents) * 100), 100);

  const handleApprove = (id: string, title: string) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
    toast.success(`Approved: ${title}`);
  };

  const handleReject = (id: string, title: string) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
    toast.error(`Dismissed: ${title}`);
  };

  const handleQuickDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;

    setIsDispatching(true);
    const prompt = quickPrompt.trim();
    setQuickPrompt('');

    setTimeout(() => {
      toast.success('Task dispatched to @orchestrator');
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          agentRole: 'orchestrator',
          title: `Dispatched task: "${prompt.slice(0, 40)}..."`,
          detail: 'Orchestrator is delegating sub-tasks to specialized agents.',
          timestamp: 'Just now',
          targetTab: 'overview',
        },
        ...prev,
      ]);
      setIsDispatching(false);
    }, 600);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-background p-6 space-y-6">
      {/* Top Banner / Project Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/60 bg-gradient-to-br from-card/90 via-card/50 to-muted/20 p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="outline" className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              <span className="mr-1.5 size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Project Hub
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {projectName}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Autonomous multi-agent mission control. Review pending approvals, monitor live compute spend, and track real-time agent activity.
          </p>
        </div>

        {/* Quick Orchestrator Dispatch Box */}
        <form onSubmit={handleQuickDispatch} className="flex items-center gap-2 max-w-md w-full sm:w-80">
          <div className="relative flex-1">
            <input
              type="text"
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
              placeholder="Dispatch task to @orchestrator..."
              className="h-9 w-full rounded-xl border border-border/60 bg-background/80 px-3 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <button
              type="submit"
              disabled={!quickPrompt.trim() || isDispatching}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      {/* 4 KPI Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Compute Spend Ledger */}
        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Compute & Token Spend</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">
              ${(spentCents / 100).toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">
              of ${(budgetCents / 100).toFixed(2)} budget
            </span>
          </div>
          {/* Progress Bar */}
          <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${budgetPercentage}%` }}
            />
          </div>
        </div>

        {/* 2. Artifact Vault Count */}
        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Vault Artifacts</span>
            <Images className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">
              {assetsList.length || 3}
            </span>
            <span className="text-xs text-muted-foreground">SVGs, MP4s, Exports</span>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Shared across all specialized agents.
          </p>
        </div>

        {/* 3. Pending Approvals Meter */}
        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Pending Approvals</span>
            <ShieldCheck className="h-4 w-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">
              {approvals.length}
            </span>
            <span className="text-xs text-muted-foreground">HITL gates waiting</span>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            {approvals.length > 0 ? 'Requires human confirmation' : 'All gates clear'}
          </p>
        </div>

        {/* 4. Active Agents Online */}
        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Agent Squad</span>
            <Bot className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">5 / 5</span>
            <span className="text-xs text-emerald-500 font-medium">Online & Ready</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1">
            {ALL_AGENTS.map((a) => (
              <span
                key={a.id}
                className={cn('inline-flex size-5 items-center justify-center rounded-md border text-[10px]', a.badgeBg, a.badgeBorder, a.badgeText)}
                title={`${a.name}: ${a.title}`}
              >
                {a.avatarIcon}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Approvals & Activity vs Workspace Engines */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 cols): Pending Approvals + Workspace Engine Cards */}
        <div className="space-y-6 lg:col-span-2">
          {/* Pending Approvals Section */}
          <div className="rounded-xl border border-border/60 bg-card/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-purple-500" />
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                  Pending Approvals & HITL Gates
                </h2>
              </div>
              <Badge variant="outline" className="text-xs">
                {approvals.length} Action{approvals.length === 1 ? '' : 's'} Required
              </Badge>
            </div>

            {approvals.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-emerald-500/70 mx-auto mb-2" />
                <p className="text-xs font-medium text-foreground">No Pending Approvals</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Agents are operating smoothly within allocated parameters.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {approvals.map((appr) => (
                  <div
                    key={appr.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/80 p-3.5 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5">
                          @{appr.agentRole}
                        </Badge>
                        <h4 className="text-xs font-semibold text-foreground">{appr.title}</h4>
                        {appr.costCents && (
                          <Badge variant="secondary" className="text-[10px] text-emerald-500 font-mono">
                            +${(appr.costCents / 100).toFixed(2)} compute
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground max-w-xl leading-relaxed">
                        {appr.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(appr.id, appr.title)}
                        className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(appr.id, appr.title)}
                        className="h-7 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1 shadow-2xs"
                      >
                        <Check className="h-3 w-3" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Connected Creative Engines Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Multi-Modal Workspace Engines
              </h2>
              <span className="text-[11px] text-muted-foreground">Select workspace to enter</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* 1. Code Workspace */}
              <div
                onClick={() => onNavigateToTab('code')}
                className="group flex flex-col justify-between rounded-xl border border-border/60 bg-card/60 p-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-blue-500/40 hover:bg-card hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                        <Code2 className="h-4 w-4" />
                      </span>
                      <h3 className="font-semibold text-xs text-foreground">Code Workspace</h3>
                    </div>
                    <Badge variant="outline" className="text-[9px] bg-blue-500/10 text-blue-500 border-blue-500/30">
                      Daytona IDE
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    Next.js full-stack app, Daytona sandbox terminal, Monaco editor, and live preview.
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-border/30 text-[11px]">
                  <span className="text-muted-foreground font-mono">@coder agent</span>
                  <span className="flex items-center gap-1 text-blue-500 font-medium group-hover:underline">
                    <span>Enter IDE</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>

              {/* 2. Vector Design Canvas */}
              <div
                onClick={() => onNavigateToTab('design')}
                className="group flex flex-col justify-between rounded-xl border border-border/60 bg-card/60 p-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-purple-500/40 hover:bg-card hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                        <Palette className="h-4 w-4" />
                      </span>
                      <h3 className="font-semibold text-xs text-foreground">Vector Design</h3>
                    </div>
                    <Badge variant="outline" className="text-[9px] bg-purple-500/10 text-purple-500 border-purple-500/30">
                      SVG Engine
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    AI raster generation → auto-vectorization (vtracer) → PixiJS editable SVG paths.
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-border/30 text-[11px]">
                  <span className="text-muted-foreground font-mono">@designer agent</span>
                  <span className="flex items-center gap-1 text-purple-500 font-medium group-hover:underline">
                    <span>Enter Canvas</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>

              {/* 3. Video Studio */}
              <div
                onClick={() => onNavigateToTab('video')}
                className="group flex flex-col justify-between rounded-xl border border-border/60 bg-card/60 p-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-orange-500/40 hover:bg-card hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                        <Video className="h-4 w-4" />
                      </span>
                      <h3 className="font-semibold text-xs text-foreground">Video Studio</h3>
                    </div>
                    <Badge variant="outline" className="text-[9px] bg-orange-500/10 text-orange-500 border-orange-500/30">
                      Remotion
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    Script synthesis, ElevenLabs voiceover, Remotion scene sequencing, and FFmpeg MP4 render.
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-border/30 text-[11px]">
                  <span className="text-muted-foreground font-mono">@video agent</span>
                  <span className="flex items-center gap-1 text-orange-500 font-medium group-hover:underline">
                    <span>Enter Studio</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>

              {/* 4. Flow Pipelines */}
              <div
                onClick={() => onNavigateToTab('flow')}
                className="group flex flex-col justify-between rounded-xl border border-border/60 bg-card/60 p-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-green-500/40 hover:bg-card hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                        <Workflow className="h-4 w-4" />
                      </span>
                      <h3 className="font-semibold text-xs text-foreground">Flow Pipelines</h3>
                    </div>
                    <Badge variant="outline" className="text-[9px] bg-green-500/10 text-green-500 border-green-500/30">
                      Agent Graph
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    Visual multi-agent orchestration, automated task triggers, and streaming pipeline execution.
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-border/30 text-[11px]">
                  <span className="text-muted-foreground font-mono">@flow agent</span>
                  <span className="flex items-center gap-1 text-green-500 font-medium group-hover:underline">
                    <span>Enter Pipelines</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Live Activity Timeline & Notifications */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card/50 p-4">
            <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2.5">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Live Activity Stream
                </h3>
              </div>
              <span className="text-[10px] text-muted-foreground">Real-time</span>
            </div>

            <div className="space-y-3">
              {activities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => act.targetTab && onNavigateToTab(act.targetTab)}
                  className="group flex gap-2.5 rounded-lg p-2 transition-colors hover:bg-muted/40 cursor-pointer"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[10px]">
                    {act.agentRole === 'coder'
                      ? '⚡'
                      : act.agentRole === 'designer'
                      ? '🎨'
                      : act.agentRole === 'video'
                      ? '🎬'
                      : act.agentRole === 'flow'
                      ? '🔀'
                      : '👑'}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {act.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{act.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {act.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shared Vault Jump Card */}
          <div
            onClick={() => onNavigateToTab('artifacts')}
            className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 cursor-pointer transition-all hover:bg-amber-500/10"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                <Images className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-xs font-semibold text-foreground">Project Artifact Vault</h4>
                <p className="text-[10px] text-muted-foreground">
                  Browse {assetsList.length || 3} assets in R2 storage
                </p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-amber-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectOverviewHUD;
