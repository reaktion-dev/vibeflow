'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Palette,
  Sparkles,
  FileCode,
  Terminal,
  FileText,
  Eye,
  GitPullRequest,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Layers,
  Wrench,
  ExternalLink,
  Copy,
  CheckCheck,
  Calculator,
  Table,
  Receipt,
  Presentation,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useOfficeStore } from '@/lib/office-tool/useOfficeStore';
import toast from 'react-hot-toast';

export interface VisualToolPartProps {
  part: any;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
}

interface SearchImageItem {
  title: string;
  imageUrl: string;
  source?: string;
}

/**
 * Returns iconic identity, color theme, and friendly label for a tool name.
 */
function getToolMeta(toolName: string) {
  switch (toolName) {
    case 'searchImages':
      return { icon: Search, label: 'Search Images', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' };
    case 'fetchImage':
      return { icon: Download, label: 'Download Asset', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    case 'composeFromTemplate':
    case 'composeDesign':
    case 'composeRawSvg':
      return { icon: Layers, label: 'Compose Design', color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' };
    case 'generateImage':
      return { icon: Sparkles, label: 'AI Image Generation', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' };
    case 'traceImage':
      return { icon: Palette, label: 'Vectorize (SVG)', color: 'text-pink-500', bg: 'bg-pink-500/10 border-pink-500/20' };
    case 'buildProcurementPackage':
      return { icon: FileText, label: 'Procurement SOW & BOM', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' };
    case 'buildFinancialWorkbook':
      return { icon: Table, label: 'Financial Model & Formulas', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    case 'authorExecutiveProposal':
      return { icon: Sparkles, label: 'Executive Document Author', color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' };
    case 'authorInvoiceStatement':
      return { icon: Receipt, label: 'Invoice & Statement Engine', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    case 'buildSlideDeck':
      return { icon: Presentation, label: '16:9 Presentation Deck', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' };
    case 'evaluateAndAuditDocument':
      return { icon: ShieldCheck, label: 'Mathematical QA Audit', color: 'text-teal-500', bg: 'bg-teal-500/10 border-teal-500/20' };
    case 'exportDesign':
    case 'exportProjectZip':
      return { icon: Download, label: 'Export Artifact', color: 'text-cyan-500', bg: 'bg-cyan-500/10 border-cyan-500/20' };
    case 'writeFile':
    case 'editFile':
    case 'write':
    case 'edit':
      return { icon: FileCode, label: 'Edit File', color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/20' };
    case 'readFile':
    case 'read':
    case 'listFiles':
    case 'ls':
    case 'glob':
    case 'grep':
      return { icon: FileText, label: 'Inspect Files', color: 'text-sky-500', bg: 'bg-sky-500/10 border-sky-500/20' };
    case 'bash':
    case 'runCommand':
      return { icon: Terminal, label: 'Run Command', color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' };
    case 'bundleStaticPreview':
      return { icon: Eye, label: 'Live Preview', color: 'text-teal-500', bg: 'bg-teal-500/10 border-teal-500/20' };
    case 'createGitHubPR':
      return { icon: GitPullRequest, label: 'GitHub PR', color: 'text-violet-500', bg: 'bg-violet-500/10 border-violet-500/20' };
    default:
      return { icon: Wrench, label: toolName || 'Tool', color: 'text-muted-foreground', bg: 'bg-muted/40 border-border/60' };
  }
}

/**
 * Derives a human-readable title summarizing what the tool is doing.
 */
function getActionSummary(toolName: string, input: any, output: any): string {
  if (!input && !output) return toolName;

  switch (toolName) {
    case 'searchImages':
      return input?.query ? `Searched for "${input.query}"` : 'Searching for images…';
    case 'fetchImage':
      return input?.name ? `Downloaded ${input.name}` : 'Downloading asset…';
    case 'composeFromTemplate':
      return input?.headline
        ? `Composed "${input.headline}" (${input.templateId || 'template'})`
        : `Composed template ${input?.templateId || 'layout'}`;
    case 'composeDesign':
      return 'Composed multi-layer SVG design';
    case 'generateImage':
      return input?.prompt ? `Generated image for "${input.prompt.slice(0, 32)}…"` : 'Generating AI image…';
    case 'traceImage':
      return output?.pathCount ? `Vectorized to SVG (${output.pathCount} paths)` : 'Vectorizing raster image to SVG…';
    case 'buildProcurementPackage':
      return input?.title ? `Authored SOW package: "${input.title}"` : 'Authoring procurement package…';
    case 'buildFinancialWorkbook':
      return input?.title ? `Engineered financial model: "${input.title}"` : 'Building financial model…';
    case 'authorExecutiveProposal':
      return input?.title ? `Synthesized executive document: "${input.title}"` : 'Authoring executive proposal…';
    case 'authorInvoiceStatement':
      return input?.title ? `Generated statement: "${input.title}"` : 'Authoring invoice & statement…';
    case 'buildSlideDeck':
      return input?.title ? `Compiled 16:9 presentation: "${input.title}"` : 'Compiling slide deck…';
    case 'evaluateAndAuditDocument':
      return output?.score ? `QA Audit Score: ${output.score}/100 (${output.passed ? 'PASSED' : 'FLAGGED'})` : 'Auditing mathematical consistency…';
    case 'exportDesign':
      return output?.format ? `Exported ${output.format.toUpperCase()} (${output.dimensions || ''})` : 'Exporting design…';
    case 'writeFile':
    case 'editFile':
    case 'write':
    case 'edit':
      return input?.path ? `Saved ${input.path}` : 'Modifying file…';
    case 'readFile':
    case 'read':
      return input?.path ? `Read ${input.path}` : 'Reading file…';
    case 'bash':
    case 'runCommand':
      return input?.command ? `Ran \`${input.command}\`` : 'Running shell command…';
    case 'bundleStaticPreview':
      return 'Updated live preview bundle';
    default:
      if (output?.message && typeof output.message === 'string') {
        return output.message;
      }
      return toolName;
  }
}

export function VisualToolPart({ part, onApprove, onDeny }: VisualToolPartProps) {
  const [showRaw, setShowRaw] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const toolName =
    part.toolName ||
    part.name ||
    part.toolInvocation?.toolName ||
    (typeof part.type === 'string' && part.type.startsWith('tool-') ? part.type.replace(/^tool-/, '') : '') ||
    'tool';

  const state = part.state || 'output-available';
  const isRunning = state === 'input-available' || state === 'input-streaming';
  const isError = state === 'output-error';
  const isDenied = state === 'output-denied';
  const isApproval = state === 'approval-requested';
  const isSuccess = state === 'output-available';

  const meta = getToolMeta(toolName);
  const Icon = meta.icon;
  const summary = getActionSummary(toolName, part.input, part.output);
  const approval = part.approval;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Automatically load the document model into the Office Store upon tool completion
  useEffect(() => {
    if (isSuccess && part.output?.model) {
      const docType =
        toolName === 'buildFinancialWorkbook'
          ? 'spreadsheet'
          : toolName === 'buildSlideDeck'
          ? 'presentation'
          : 'document';
      useOfficeStore.getState().loadDocument({
        type: docType,
        model: part.output.model,
      });
    }
  }, [isSuccess, part.output?.model, toolName]);

  return (
    <div className="my-2 rounded-xl border border-border/60 bg-card/60 shadow-2xs overflow-hidden backdrop-blur-xs text-xs">
      {/* Visual Header Item */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/20">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Icon Badge with Dynamic State */}
          <div
            className={cn(
              'size-6 rounded-lg flex items-center justify-center shrink-0 border transition-all',
              meta.bg
            )}
          >
            {isRunning ? (
              <Loader2 className="size-3.5 animate-spin text-primary" />
            ) : isError ? (
              <X className="size-3.5 text-rose-500" />
            ) : isDenied ? (
              <X className="size-3.5 text-orange-500" />
            ) : isApproval ? (
              <ShieldAlert className="size-3.5 text-amber-500" />
            ) : (
              <Icon className={cn('size-3.5', meta.color)} />
            )}
          </div>

          {/* Title & Summary */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground truncate">{meta.label}</span>
              {isRunning && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-primary/30 text-primary animate-pulse">
                  Running
                </Badge>
              )}
              {isSuccess && (
                <Check className="size-3 text-emerald-500 stroke-[3]" />
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">{summary}</p>
          </div>
        </div>

        {/* Raw JSON inspection toggle (only shown when output/input exists) */}
        {(part.input || part.output || part.errorText) && !isApproval && (
          <button
            type="button"
            onClick={() => setShowRaw(!showRaw)}
            className="text-[10px] text-muted-foreground/80 hover:text-foreground flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-muted/50 transition-colors shrink-0"
            title="Toggle raw execution details"
          >
            <span>{showRaw ? 'Less' : 'Details'}</span>
            {showRaw ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        )}
      </div>

      {/* ── Specialized Visual Content Bodies (NO raw JSON!) ──────────────── */}

      {/* 1. Specialized Search Images Results Carousel */}
      {toolName === 'searchImages' && isSuccess && part.output?.results && (
        <div className="p-2.5 border-t border-border/40 bg-background/50">
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Candidate Images ({part.output.results.length})
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            {part.output.results.map((img: SearchImageItem, idx: number) => (
              <div
                key={idx}
                className="group relative flex-none w-28 rounded-lg border border-border/60 bg-card overflow-hidden shadow-2xs hover:border-primary/50 transition-all"
              >
                {/* Image Thumbnail */}
                <div className="h-20 w-full bg-muted/30 flex items-center justify-center overflow-hidden relative">
                  <img
                    src={img.imageUrl}
                    alt={img.title}
                    className="size-full object-contain p-1 transition-transform group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  {/* Floating Action Button */}
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(img.imageUrl)}
                      className="p-1 rounded bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                      title="Copy Image URL"
                    >
                      {copiedUrl === img.imageUrl ? (
                        <CheckCheck className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                    <a
                      href={img.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                      title="Open image in new tab"
                    >
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>

                {/* Info Footer */}
                <div className="p-1.5">
                  <p className="text-[10px] font-medium text-foreground truncate" title={img.title}>
                    {img.title}
                  </p>
                  {img.source && (
                    <span className="text-[9px] text-muted-foreground truncate block">
                      {img.source}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Specialized Template Composer Result */}
      {toolName === 'composeFromTemplate' && isSuccess && part.output && (
        <div className="p-2.5 border-t border-border/40 bg-background/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Layers className="size-4 text-purple-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                {part.output.name || 'Composed SVG Design'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Loaded into Canvas • Template: <span className="font-mono text-purple-400">{part.output.templateId}</span>
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30">
            Rendered Live
          </Badge>
        </div>
      )}

      {/* 3. Specialized Download/Fetch Image Result */}
      {toolName === 'fetchImage' && isSuccess && part.output && (
        <div className="p-2.5 border-t border-border/40 bg-background/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Download className="size-3.5 text-emerald-500" />
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-foreground truncate">{part.output.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono">
                Asset ID: {part.output.assetId?.slice(0, 12)}…
              </p>
            </div>
          </div>
          {part.output.sizeBytes && (
            <span className="text-[10px] text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded">
              {(part.output.sizeBytes / 1024).toFixed(1)} KB
            </span>
          )}
        </div>
      )}

      {/* 4. Specialized Trace Vector Result */}
      {toolName === 'traceImage' && isSuccess && part.output && (
        <div className="p-2.5 border-t border-border/40 bg-background/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
              <Palette className="size-3.5 text-pink-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">Vector Paths Generated</p>
              <p className="text-[10px] text-muted-foreground">
                {part.output.pathCount} editable vector curves in SVG
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] text-pink-400 border-pink-500/30">
            Vector SVG
          </Badge>
        </div>
      )}

      {/* 5. Specialized Office / Document Architecture, Ledger Math & QA Audit Card */}
      {isSuccess &&
        (part.output?.auditScore !== undefined ||
          part.output?.score !== undefined ||
          part.output?.ledgerVerification ||
          [
            'buildProcurementPackage',
            'buildFinancialWorkbook',
            'authorExecutiveProposal',
            'authorInvoiceStatement',
            'buildSlideDeck',
            'evaluateAndAuditDocument',
          ].includes(toolName)) && (
          <div className="p-3 border-t border-border/40 bg-background/60 space-y-2.5">
            {/* Archetype & Artifact Summary */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <FileText className="size-3.5 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-foreground truncate">
                      {part.output?.model?.title || part.input?.title || 'Document Artifact'}
                    </span>
                    {(part.output?.model?.archetype || part.input?.pageFit) && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                        {part.output?.model?.archetype || part.input?.pageFit}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground block truncate">
                    {part.output?.assetName || 'Loaded in Studio Canvas'} • Theme:{' '}
                    <span className="font-mono text-foreground/80">
                      {part.output?.model?.theme || part.input?.theme || 'corporate-navy'}
                    </span>
                  </span>
                </div>
              </div>

              {/* QA Audit Score Pill */}
              {(part.output?.auditScore !== undefined || part.output?.score !== undefined) && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shrink-0">
                  <ShieldCheck className="size-3.5" />
                  <div className="text-right">
                    <div className="text-[11px] font-bold leading-none">
                      {part.output?.auditScore ?? part.output?.score}/100
                    </div>
                    <div className="text-[8px] font-medium uppercase tracking-wider text-emerald-500/80">
                      {part.output?.auditPassed ?? part.output?.passed ? 'QA PASSED' : 'QA AUDIT'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ledger Math & Formula Verification Breakdown (For Invoices & Statements) */}
            {part.output?.ledgerVerification && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-2 text-[11px] space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground font-medium text-[10px] border-b border-border/40 pb-1">
                  <span className="flex items-center gap-1">
                    <Calculator className="size-3 text-emerald-400" />
                    Mathematical Ledger Verification
                  </span>
                  <span className="text-emerald-400 font-mono flex items-center gap-0.5 text-[10px]">
                    <Check className="size-2.5 stroke-[3]" /> Math Balanced
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono pt-0.5 text-center">
                  <div className="rounded bg-background/50 p-1 border border-border/40">
                    <span className="text-[9px] text-muted-foreground block font-sans">Subtotal</span>
                    <span className="font-semibold text-foreground">
                      {part.output.ledgerVerification.subtotal}
                    </span>
                  </div>
                  <div className="rounded bg-background/50 p-1 border border-border/40">
                    <span className="text-[9px] text-muted-foreground block font-sans">Tax (VAT)</span>
                    <span className="font-semibold text-foreground">
                      {part.output.ledgerVerification.taxAmount}
                    </span>
                  </div>
                  <div className="rounded bg-primary/10 p-1 border border-primary/30">
                    <span className="text-[9px] text-primary block font-sans font-medium">Total Due</span>
                    <span className="font-bold text-primary">
                      {part.output.ledgerVerification.totalDue}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Spreadsheet Formula Audit Breakdown */}
            {toolName === 'buildFinancialWorkbook' && (
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-[10px]">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Table className="size-3 text-emerald-400" />
                  Dynamic Formula Integrity
                </span>
                <span className="font-mono text-emerald-400 font-medium">
                  ✓{' '}
                  {part.output?.formulaErrorsFound?.length === 0
                    ? 'All Excel formulas verified'
                    : `${part.output?.formulaErrorsFound?.length} formula issues`}
                </span>
              </div>
            )}

            {/* Actionable Refinements / QA Checkpoints */}
            {part.output?.refinements && part.output.refinements.length > 0 && (
              <div className="space-y-1 text-[10px] text-muted-foreground bg-muted/20 rounded p-2 border border-border/40">
                <span className="font-semibold text-foreground text-[10px] block">QA Editorial Notes:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  {part.output.refinements.map((ref: string, rIdx: number) => (
                    <li key={rIdx}>{ref}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 1-Click Interactive Open in Studio Action */}
            {part.output?.model && (
              <div className="flex items-center justify-between pt-1.5 border-t border-border/40">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                  <Check className="size-3 text-emerald-400" />
                  Synced to Canvas
                </span>
                <Button
                  size="sm"
                  type="button"
                  onClick={() => {
                    const docType =
                      toolName === 'buildFinancialWorkbook'
                        ? 'spreadsheet'
                        : toolName === 'buildSlideDeck'
                        ? 'presentation'
                        : 'document';
                    useOfficeStore.getState().loadDocument({
                      type: docType,
                      model: part.output.model,
                    });
                    toast.success(`Opened "${part.output.model.title || 'Document'}" in Studio`);
                  }}
                  className="h-7 px-3 text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 shadow-sm font-medium transition-all"
                >
                  <ExternalLink className="size-3" />
                  Open in Document Studio
                </Button>
              </div>
            )}
          </div>
        )}

      {/* 6. Human-readable Message Banner (if not showing raw and no specialized widget above) */}
      {!showRaw &&
        ![
          'searchImages',
          'composeFromTemplate',
          'fetchImage',
          'traceImage',
          'buildProcurementPackage',
          'buildFinancialWorkbook',
          'authorExecutiveProposal',
          'authorInvoiceStatement',
          'buildSlideDeck',
          'evaluateAndAuditDocument',
        ].includes(toolName) &&
        part.output?.message && (
          <div className="px-3 py-2 border-t border-border/30 bg-muted/10 text-[11px] text-muted-foreground">
            {part.output.message}
          </div>
        )}

      {/* 6. Approval Required Card */}
      {isApproval && (
        <div className="p-3 border-t border-amber-500/20 bg-amber-500/5 space-y-2">
          <div className="flex items-start gap-2">
            <ShieldAlert className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">Permission Requested</p>
              <p className="text-[11px] text-muted-foreground">
                {approval?.reason || `The agent wants to run ${toolName}.`}
              </p>
            </div>
          </div>
          {!approval?.isAutomatic && approval?.id && (
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => onApprove(approval.id)}
                className="h-7 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1"
              >
                <Check className="size-3" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDeny(approval.id)}
                className="h-7 px-3 text-xs gap-1"
              >
                <X className="size-3" />
                Deny
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 7. Error Message */}
      {isError && (
        <div className="p-2.5 border-t border-rose-500/20 bg-rose-500/5 text-rose-500 text-[11px] flex items-start gap-2">
          <X className="size-3.5 shrink-0 mt-0.5" />
          <span className="font-mono">{part.errorText || 'Tool execution encountered an error.'}</span>
        </div>
      )}

      {/* 8. Collapsible Raw JSON Details (Only shown when user clicks 'Details') */}
      {showRaw && (
        <div className="p-2.5 border-t border-border/40 bg-muted/30 space-y-2 font-mono text-[10px]">
          {part.input && (
            <div>
              <span className="text-muted-foreground uppercase text-[9px] font-sans font-bold">Input</span>
              <pre className="mt-1 p-2 rounded bg-background border border-border/40 overflow-x-auto">
                {JSON.stringify(part.input, null, 2)}
              </pre>
            </div>
          )}
          {part.output && (
            <div>
              <span className="text-muted-foreground uppercase text-[9px] font-sans font-bold">Output</span>
              <pre className="mt-1 p-2 rounded bg-background border border-border/40 overflow-x-auto">
                {JSON.stringify(part.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VisualToolPart;
