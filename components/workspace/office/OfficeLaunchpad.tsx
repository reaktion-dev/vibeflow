'use client';

import { useOfficeStore } from '@/lib/office-tool/useOfficeStore';
import { OfficeDocType, DocumentArchetype } from '@/lib/office-tool/types';
import {
  FileText,
  Table,
  Presentation,
  UserCheck,
  Sparkles,
  Receipt,
  Building2,
  Cpu,
  Scale,
  Award,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfficeLaunchpadProps {
  onSelectPrompt?: (prompt: string) => void;
  onSelectArchetype?: (type: OfficeDocType) => void;
}

interface ArchetypeCardItem {
  id: string;
  type: OfficeDocType;
  docArchetype?: DocumentArchetype;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  color: string;
  borderColor: string;
  bgColor: string;
  samplePrompt: string;
}

const ARCHETYPES: ArchetypeCardItem[] = [
  {
    id: 'rfp-proposal',
    type: 'document',
    docArchetype: 'executive-proposal',
    title: 'Enterprise RFP & Proposal',
    description: 'Statement of Work, itemized BOM, SLA metrics, and pricing schedule.',
    icon: FileText,
    badge: 'Vector PDF / Word',
    color: 'text-blue-500',
    borderColor: 'hover:border-blue-500/50',
    bgColor: 'bg-blue-500/10',
    samplePrompt: 'Draft an enterprise proposal for AI Cloud Migration with Scope of Work, SLA metrics, and a $120k pricing table.',
  },
  {
    id: 'executive-resume',
    type: 'document',
    docArchetype: 'two-column-resume',
    title: 'Two-Column Executive CV',
    description: 'Charcoal sidebar, headshot container, timeline node connectors, and skill progress gauges.',
    icon: UserCheck,
    badge: 'Vector PDF (Print Fit)',
    color: 'text-purple-500',
    borderColor: 'hover:border-purple-500/50',
    bgColor: 'bg-purple-500/10',
    samplePrompt: 'Author a high-impact two-column resume for a Senior Wildlife Conservationist with career milestones and skill bars.',
  },
  {
    id: 'tax-invoice',
    type: 'document',
    docArchetype: 'invoice-statement',
    title: 'Tax Invoice & Statement',
    description: 'Structured 2-column billing grid, 6-column aging matrix, and perforated remittance slip.',
    icon: Receipt,
    badge: 'Accounting PDF',
    color: 'text-emerald-500',
    borderColor: 'hover:border-emerald-500/50',
    bgColor: 'bg-emerald-500/10',
    samplePrompt: 'Generate a professional municipal tax invoice and account statement with itemized services and payment remittance advice.',
  },
  {
    id: 'executive-memo',
    type: 'document',
    docArchetype: 'executive-memo',
    title: 'Amazon-Style Strategy Memo',
    description: 'Strict 1-page executive brief with top 3-column KPI ribbon and structured strategic narrative.',
    icon: FileText,
    badge: '1-Page Brief',
    color: 'text-sky-500',
    borderColor: 'hover:border-sky-500/50',
    bgColor: 'bg-sky-500/10',
    samplePrompt: 'Write an executive briefing memo on autonomous multi-agent systems with KPI metrics and risk mitigations.',
  },
  {
    id: 'company-profile',
    type: 'document',
    docArchetype: 'company-profile',
    title: 'Company Profile & Credentials',
    description: 'Vector arch & curved layer cover, geometric hero statement, 4-quadrant capabilities grid.',
    icon: Building2,
    badge: 'Corporate Deck Cover',
    color: 'text-indigo-500',
    borderColor: 'hover:border-indigo-500/50',
    bgColor: 'bg-indigo-500/10',
    samplePrompt: 'Create a company capabilities profile for an enterprise innovation practice with service offerings and scale metrics.',
  },
  {
    id: 'technical-whitepaper',
    type: 'document',
    docArchetype: 'technical-whitepaper',
    title: 'Engineering RFC & Whitepaper',
    description: '2-column academic layout with abstract, monospaced code blocks, and system specifications.',
    icon: Cpu,
    badge: 'Technical Spec',
    color: 'text-teal-500',
    borderColor: 'hover:border-teal-500/50',
    bgColor: 'bg-teal-500/10',
    samplePrompt: 'Draft an engineering RFC specification for hermetic microVM sandbox isolation protocols.',
  },
  {
    id: 'legal-contract',
    type: 'document',
    docArchetype: 'legal-contract',
    title: 'Master Services Agreement (MSA)',
    description: 'Numbered legal clause hierarchy, indemnity callouts, and dual-column signature execution block.',
    icon: Scale,
    badge: 'Legal Contract',
    color: 'text-rose-500',
    borderColor: 'hover:border-rose-500/50',
    bgColor: 'bg-rose-500/10',
    samplePrompt: 'Draft a Master Services Agreement with scope, IP ownership, confidentiality, and signature lines.',
  },
  {
    id: 'case-study',
    type: 'document',
    docArchetype: 'case-study',
    title: 'Customer Success Case Study',
    description: 'Hero quote banner, 3-stage Challenge/Solution/Results progression, and quantified ROI cards.',
    icon: Award,
    badge: 'Sales Enablement',
    color: 'text-emerald-400',
    borderColor: 'hover:border-emerald-400/50',
    bgColor: 'bg-emerald-400/10',
    samplePrompt: 'Produce an enterprise customer success case study showing 74% time reduction with client quote.',
  },
  {
    id: 'product-datasheet',
    type: 'document',
    docArchetype: 'product-datasheet',
    title: 'Product Datasheet & Specs',
    description: 'Technical parameter spec table, feature tier matrix, and compliance certification badges (SOC2, ISO).',
    icon: Radio,
    badge: 'Product Specs',
    color: 'text-cyan-400',
    borderColor: 'hover:border-cyan-400/50',
    bgColor: 'bg-cyan-400/10',
    samplePrompt: 'Build a product specification datasheet with technical parameters and security compliance badges.',
  },
  {
    id: 'financial-model',
    type: 'spreadsheet',
    title: 'SaaS Financial Model',
    description: 'Multi-sheet workbook with dynamic formulas (SUM, AVERAGE), accounting ribbons, and forecasts.',
    icon: Table,
    badge: 'Excel (.xlsx)',
    color: 'text-emerald-500',
    borderColor: 'hover:border-emerald-500/50',
    bgColor: 'bg-emerald-500/10',
    samplePrompt: 'Build a 3-year SaaS financial model spreadsheet with quarterly revenue, COGS, and customer growth.',
  },
  {
    id: 'pitch-deck',
    type: 'presentation',
    title: 'Investor Pitch Deck',
    description: 'Widescreen 16:9 presentation deck with problem/solution arcs, stat cards, and traction metrics.',
    icon: Presentation,
    badge: 'PowerPoint (.pptx)',
    color: 'text-amber-500',
    borderColor: 'hover:border-amber-500/50',
    bgColor: 'bg-amber-500/10',
    samplePrompt: 'Create a 5-slide Series A pitch deck for an autonomous multi-agent platform with traction metrics.',
  },
];

export function OfficeLaunchpad({
  onSelectPrompt,
  onSelectArchetype,
}: OfficeLaunchpadProps) {
  const loadSample = useOfficeStore((s) => s.loadSample);
  const loadArchetype = useOfficeStore((s) => s.loadArchetype);

  const handleCardClick = (archetype: ArchetypeCardItem) => {
    if (archetype.docArchetype) {
      loadArchetype(archetype.docArchetype);
    } else {
      loadSample(archetype.type);
    }

    if (onSelectArchetype) {
      onSelectArchetype(archetype.type);
    }

    if (onSelectPrompt) {
      onSelectPrompt(archetype.samplePrompt);
    }
  };

  return (
    <div className="flex size-full flex-col items-center justify-start p-8 overflow-y-auto bg-slate-950 text-slate-100 min-h-full">
      <div className="max-w-4xl w-full text-center space-y-3 mb-8 pt-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-semibold shadow-xs">
          <Sparkles className="size-3.5" />
          <span>Parametric Document Archetype Catalog</span>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          What would you like to author today?
        </h2>

        <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
          Select a boardroom-grade layout archetype below. Each archetype compiles to an immutable vector PDF with true print geometry.
        </p>
      </div>

      {/* ── Archetype Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-w-5xl w-full pb-12">
        {ARCHETYPES.map((arch) => {
          const Icon = arch.icon;

          return (
            <button
              key={arch.id}
              type="button"
              onClick={() => handleCardClick(arch)}
              className={cn(
                'group relative flex flex-col justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition-all text-left shadow-lg',
                arch.borderColor
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('p-2 rounded-lg', arch.bgColor, arch.color)}>
                    <Icon className="size-4" />
                  </div>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/80 text-slate-300">
                    {arch.badge}
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-slate-100 group-hover:text-white transition-colors">
                  {arch.title}
                </h3>
                <p className="text-2xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {arch.description}
                </p>
              </div>

              <div className="flex items-center gap-1 text-2xs font-semibold text-primary mt-4 pt-3 border-t border-slate-800/80 group-hover:translate-x-0.5 transition-transform">
                <span>Instantiate Archetype</span>
                <ArrowRight className="size-3" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default OfficeLaunchpad;
