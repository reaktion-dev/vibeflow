'use client';

import { useOfficeStore } from '@/lib/office-tool/useOfficeStore';
import { DocSection } from '@/lib/office-tool/types';
import {
  Heading,
  AlignLeft,
  Columns,
  Table as TableIcon,
  Sparkles,
  List,
  Plus,
  FileCheck,
  Milestone,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BlockTemplate {
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  createSection: () => DocSection;
}

const EXECUTIVE_BLOCKS: BlockTemplate[] = [
  {
    name: 'Executive Title (H1)',
    category: 'Headings',
    description: 'Major chapter division with bottom border',
    icon: Heading,
    createSection: () => ({
      id: `h1_${Date.now().toString(36)}`,
      type: 'heading',
      level: 1,
      text: 'Executive Summary & Statement of Work',
    }),
  },
  {
    name: 'Section Header (H2)',
    category: 'Headings',
    description: 'Medium header for tactical deliverables',
    icon: Heading,
    createSection: () => ({
      id: `h2_${Date.now().toString(36)}`,
      type: 'heading',
      level: 2,
      text: 'Deliverable Scope & Architecture',
    }),
  },
  {
    name: 'Strategic Lead Paragraph',
    category: 'Text & Narrative',
    description: 'High-emphasis introductory paragraph',
    icon: AlignLeft,
    createSection: () => ({
      id: `lead_${Date.now().toString(36)}`,
      type: 'paragraph',
      lead: true,
      text: 'This strategic framework establishes the technical foundation, governance models, and milestones required for enterprise transformation.',
    }),
  },
  {
    name: 'Standard Body Paragraph',
    category: 'Text & Narrative',
    description: 'Clean, readable narrative paragraph',
    icon: AlignLeft,
    createSection: () => ({
      id: `p_${Date.now().toString(36)}`,
      type: 'paragraph',
      lead: false,
      text: 'The autonomous engineering pipeline continuously evaluates deliverables against strict compliance rules and operational budgets.',
    }),
  },
  {
    name: '3-Column KPI Stat Grid',
    category: 'Data & Metrics',
    description: 'Highlighted metrics cards with bold targets',
    icon: Columns,
    createSection: () => ({
      id: `stat_${Date.now().toString(36)}`,
      type: 'stat-grid',
      stats: [
        { label: 'Time Saved', value: '74%' },
        { label: 'Projected ROI', value: '380%' },
        { label: 'SLA Uptime', value: '99.9%' },
      ],
    }),
  },
  {
    name: 'Value Proposition Callout',
    category: 'Cards & Callouts',
    description: 'Shaded container with left accent border',
    icon: Sparkles,
    createSection: () => ({
      id: `callout_${Date.now().toString(36)}`,
      type: 'callout',
      title: 'Core Value Proposition',
      badge: 'HIGH IMPACT',
      text: 'By unifying autonomous AI pipelines in sandbox environments, development velocity increases 4x while eliminating multi-tool friction.',
    }),
  },
  {
    name: 'Commercial Pricing Table',
    category: 'Tables & Pricing',
    description: 'Structured 4-column investment schedule',
    icon: TableIcon,
    createSection: () => ({
      id: `price_${Date.now().toString(36)}`,
      type: 'table',
      headers: ['Phase', 'Deliverable Item', 'Timeline', 'Cost (USD)'],
      rows: [
        ['Phase 1', 'Blueprint & Security Review', 'Weeks 1-2', '$15,000'],
        ['Phase 2', 'Core Multi-Agent Sandbox', 'Weeks 3-6', '$45,000'],
        ['Phase 3', 'Production Deployment & SLA', 'Weeks 7-8', '$25,000'],
      ],
    }),
  },
  {
    name: 'Milestone Roadmap Table',
    category: 'Tables & Pricing',
    description: 'Deliverables with status badges & owners',
    icon: Milestone,
    createSection: () => ({
      id: `milestone_${Date.now().toString(36)}`,
      type: 'table',
      headers: ['Milestone', 'Target Date', 'Owner', 'Status'],
      rows: [
        ['Architecture Sign-off', 'Month 1', 'Lead Architect', 'Completed'],
        ['Security & Auth Audit', 'Month 2', 'SecOps Lead', 'In Progress'],
        ['Global Go-Live', 'Month 3', 'VP Engineering', 'Pending'],
      ],
    }),
  },
  {
    name: 'Executive Deliverables List',
    category: 'Lists',
    description: 'Bullet list of tactical outcomes',
    icon: List,
    createSection: () => ({
      id: `list_${Date.now().toString(36)}`,
      type: 'bullet-list',
      items: [
        'Complete end-to-end vector design and PDF generation pipeline',
        'Multi-tenant cloud sandbox orchestration with budget enforcement',
        'Comprehensive documentation and post-deployment support',
      ],
    }),
  },
];

export function DocumentInsertMenu() {
  const addWordSection = useOfficeStore((s) => s.addWordSection);
  const selectSection = useOfficeStore((s) => s.selectSection);
  const setActiveStudioTab = useOfficeStore((s) => s.setActiveStudioTab);

  const handleInsert = (template: BlockTemplate) => {
    const newSection = template.createSection();
    addWordSection(newSection);
    selectSection(newSection.id);
    setActiveStudioTab('inspector');
    toast.success(`Inserted ${template.name}`);
  };

  return (
    <div className="p-3 space-y-3 text-xs">
      <div className="flex items-center justify-between pb-1 border-b border-border/50">
        <span className="font-bold text-foreground flex items-center gap-1.5">
          <Plus className="size-3.5 text-primary" />
          Insert Executive Block
        </span>
        <span className="text-3xs font-mono text-muted-foreground">Catalog</span>
      </div>

      <div className="space-y-2">
        {EXECUTIVE_BLOCKS.map((template) => {
          const Icon = template.icon;

          return (
            <button
              key={template.name}
              type="button"
              onClick={() => handleInsert(template)}
              className="w-full group flex items-start gap-2.5 p-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted/30 hover:border-primary/50 transition-all text-left shadow-2xs"
            >
              <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-semibold text-foreground text-xs">{template.name}</div>
                <div className="text-3xs text-muted-foreground line-clamp-1 mt-0.5">
                  {template.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default DocumentInsertMenu;
