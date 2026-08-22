import { z } from 'zod';

/**
 * Supported Office Document Types
 */
export type OfficeDocType = 'document' | 'spreadsheet' | 'presentation';

/**
 * Curated Professional Themes
 */
export type OfficeThemeName =
  | 'corporate-navy'
  | 'emerald-enterprise'
  | 'slate-minimal'
  | 'cyberpunk-dark'
  | 'sunset-executive';

export interface OfficeThemePalette {
  name: OfficeThemeName;
  label: string;
  primary: string;      // Hex
  secondary: string;    // Hex
  accent: string;       // Hex
  bgLight: string;      // Hex
  textDark: string;     // Hex
  border: string;       // Hex
}

export const OFFICE_THEMES: Record<OfficeThemeName, OfficeThemePalette> = {
  'corporate-navy': {
    name: 'corporate-navy',
    label: 'Corporate Navy',
    primary: '#0F2942',
    secondary: '#2563EB',
    accent: '#38BDF8',
    bgLight: '#F8FAFC',
    textDark: '#0F172A',
    border: '#E2E8F0',
  },
  'emerald-enterprise': {
    name: 'emerald-enterprise',
    label: 'Emerald Enterprise',
    primary: '#064E3B',
    secondary: '#059669',
    accent: '#34D399',
    bgLight: '#F0FDF4',
    textDark: '#06281E',
    border: '#D1FAE5',
  },
  'slate-minimal': {
    name: 'slate-minimal',
    label: 'Slate Minimal',
    primary: '#1E293B',
    secondary: '#475569',
    accent: '#64748B',
    bgLight: '#F8FAFC',
    textDark: '#020617',
    border: '#CBD5E1',
  },
  'cyberpunk-dark': {
    name: 'cyberpunk-dark',
    label: 'Cyberpunk Dark',
    primary: '#090D16',
    secondary: '#06B6D4',
    accent: '#F43F5E',
    bgLight: '#0F172A',
    textDark: '#F8FAFC',
    border: '#1E293B',
  },
  'sunset-executive': {
    name: 'sunset-executive',
    label: 'Sunset Executive',
    primary: '#431407',
    secondary: '#EA580C',
    accent: '#F59E0B',
    bgLight: '#FFFBEB',
    textDark: '#291107',
    border: '#FED7AA',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. WORD DOCUMENT (.docx) AST
// ═══════════════════════════════════════════════════════════════════════════════

export type DocSectionType =
  | 'heading'
  | 'paragraph'
  | 'callout'
  | 'stat-grid'
  | 'table'
  | 'bullet-list'
  | 'numbered-list'
  | 'timeline'
  | 'skill-gauges'
  | 'code-block'
  | 'signature-block'
  | 'quote-hero'
  | 'before-after'
  | 'feature-matrix'
  | 'divider';

export interface DocSectionBase {
  id: string;
  type: DocSectionType;
}

export interface DocHeadingSection extends DocSectionBase {
  type: 'heading';
  text: string;
  level: 1 | 2 | 3 | 4;
}

export interface DocParagraphSection extends DocSectionBase {
  type: 'paragraph';
  text: string;
  lead?: boolean; // Large lead paragraph
}

export interface DocCalloutSection extends DocSectionBase {
  type: 'callout';
  title?: string;
  text: string;
  badge?: string;
  variant?: 'info' | 'warning' | 'success' | 'highlight';
}

export interface DocStatGridSection extends DocSectionBase {
  type: 'stat-grid';
  stats: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
}

export interface DocTableSection extends DocSectionBase {
  type: 'table';
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface DocListSection extends DocSectionBase {
  type: 'bullet-list' | 'numbered-list';
  items: string[];
}

export interface DocTimelineItem {
  title: string;
  institution: string; // e.g. "Kruger National Park" or "University of Pretoria"
  period: string;      // e.g. "Jan 2015 - Dec 2021"
  bullets: string[];
}

export interface DocTimelineSection extends DocSectionBase {
  type: 'timeline';
  categoryTitle?: string; // e.g. "WORK EXPERIENCE" or "EDUCATION"
  items: DocTimelineItem[];
}

export interface DocSkillGaugeItem {
  name: string;
  levelPercent: number; // 0 - 100
  label?: string;       // e.g. "Expert" or "Native"
}

export interface DocSkillGaugesSection extends DocSectionBase {
  type: 'skill-gauges';
  categoryTitle?: string; // e.g. "CORE SKILLS"
  skills: DocSkillGaugeItem[];
}

export interface DocCodeBlockSection extends DocSectionBase {
  type: 'code-block';
  language?: string;
  code: string;
  caption?: string;
}

export interface DocSignatureParty {
  role: string;          // e.g. "For Provider" / "For Client"
  entityName: string;    // e.g. "Vibeflow Technologies Inc."
  signatoryName: string; // e.g. "Alex Mercer"
  signatoryTitle: string;// e.g. "Chief Technology Officer"
  date?: string;
}

export interface DocSignatureBlockSection extends DocSectionBase {
  type: 'signature-block';
  title?: string;
  parties: DocSignatureParty[];
}

export interface DocQuoteHeroSection extends DocSectionBase {
  type: 'quote-hero';
  quote: string;
  authorName: string;
  authorTitle: string;
  companyName?: string;
}

export interface DocBeforeAfterSection extends DocSectionBase {
  type: 'before-after';
  title?: string;
  before: { title: string; points: string[] };
  after: { title: string; points: string[] };
}

export interface DocFeatureMatrixSection extends DocSectionBase {
  type: 'feature-matrix';
  title?: string;
  headers: string[];
  features: Array<{
    name: string;
    tiers: Array<boolean | string>;
  }>;
}

export interface DocDividerSection extends DocSectionBase {
  type: 'divider';
}

export type DocSection =
  | DocHeadingSection
  | DocParagraphSection
  | DocCalloutSection
  | DocStatGridSection
  | DocTableSection
  | DocListSection
  | DocTimelineSection
  | DocSkillGaugesSection
  | DocCodeBlockSection
  | DocSignatureBlockSection
  | DocQuoteHeroSection
  | DocBeforeAfterSection
  | DocFeatureMatrixSection
  | DocDividerSection;

export type DocumentArchetype =
  | 'executive-proposal'
  | 'two-column-resume'
  | 'invoice-statement'
  | 'executive-memo'
  | 'company-profile'
  | 'technical-whitepaper'
  | 'legal-contract'
  | 'case-study'
  | 'product-datasheet'
  | 'composite';

export interface DocPageModule {
  id: string;
  title: string;
  subtitle?: string;
  archetype: Exclude<DocumentArchetype, 'composite'>;
  pageFit?: 'strict-1-page' | 'multi-page';
  orientation?: 'portrait' | 'landscape';
  headshotUrl?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    location?: string;
    website?: string;
    linkedin?: string;
  };
  sidebarBio?: string;
  sidebarLinks?: Array<{ label: string; url: string }>;
  sidebarReferences?: Array<{ name: string; org: string; contact: string }>;
  sidebarHobbies?: string[];
  invoiceMeta?: {
    accountNumber: string;
    pinCode?: string;
    taxInvoiceNumber: string;
    clientAddress?: string;
    dueDate: string;
    agingBuckets?: Array<{ label: string; amount: string }>;
    remittanceBank?: string;
    remittanceAccount?: string;
  };
  sections: DocSection[];
}

export interface WordDocModel {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  organization?: string;
  date?: string;
  theme: OfficeThemeName;
  archetype?: DocumentArchetype;
  hasCoverPage: boolean;
  pageSize?: 'letter' | 'a4'; // Default: 'letter'
  pageFit?: 'strict-1-page' | 'multi-page'; // Controls margin density
  orientation?: 'portrait' | 'landscape';
  headshotUrl?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    location?: string;
    website?: string;
    linkedin?: string;
  };
  sidebarBio?: string;
  sidebarLinks?: Array<{ label: string; url: string }>;
  sidebarReferences?: Array<{ name: string; org: string; contact: string }>;
  sidebarHobbies?: string[];
  invoiceMeta?: {
    accountNumber: string;
    pinCode?: string;
    taxInvoiceNumber: string;
    clientAddress?: string;
    dueDate: string;
    agingBuckets?: Array<{ label: string; amount: string }>;
    remittanceBank?: string;
    remittanceAccount?: string;
  };
  sections: DocSection[];
  pages?: DocPageModule[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. SPREADSHEET (.xlsx) AST
// ═══════════════════════════════════════════════════════════════════════════════

export type CellFormatType = 'text' | 'number' | 'currency' | 'percent' | 'date' | 'formula';

export interface SheetCell {
  value: string | number;
  formula?: string; // e.g. "SUM(B2:B10)"
  format?: CellFormatType;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  bg?: string; // Hex override
  fg?: string;
}

export interface SheetColumn {
  header: string;
  key: string;
  width?: number;
  format?: CellFormatType;
  align?: 'left' | 'center' | 'right';
}

export interface SheetRow {
  cells: Record<string, SheetCell>; // column key -> SheetCell
  isHeader?: boolean;
  isTotal?: boolean;
}

export interface SheetModel {
  name: string;
  columns: SheetColumn[];
  rows: SheetRow[];
  freezeHeader?: boolean;
  orientation?: 'portrait' | 'landscape';
}

export interface SpreadsheetModel {
  id: string;
  title: string;
  theme: OfficeThemeName;
  sheets: SheetModel[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PRESENTATION (.pptx) AST
// ═══════════════════════════════════════════════════════════════════════════════

export type SlideLayoutType =
  | 'title'
  | 'stats'
  | 'two-column'
  | 'cards'
  | 'timeline'
  | 'table';

export interface SlideModel {
  id: string;
  layout: SlideLayoutType;
  title: string;
  subtitle?: string;
  badge?: string;
  stats?: Array<{ label: string; value: string; note?: string }>;
  cards?: Array<{ title: string; body: string; tag?: string }>;
  leftColumn?: { title: string; bullets: string[] };
  rightColumn?: { title: string; bullets: string[] };
  timelineSteps?: Array<{ phase: string; title: string; description: string; date?: string }>;
  tableData?: { headers: string[]; rows: string[][] };
  speakerNotes?: string;
}

export interface PresentationModel {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  theme: OfficeThemeName;
  aspectRatio: '16:9';
  slides: SlideModel[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. UNIFIED OFFICE DOCUMENT & EVALUATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export type OfficeDocumentModel =
  | { type: 'document'; model: WordDocModel }
  | { type: 'spreadsheet'; model: SpreadsheetModel }
  | { type: 'presentation'; model: PresentationModel };

export interface OfficeAuditReport {
  overallScore: number; // 0 to 100
  passed: boolean;
  formulaAudit: {
    totalFormulasTested: number;
    errorsFound: Array<{
      sheet: string;
      cell: string;
      formula: string;
      error: string;
    }>;
  };
  completenessAudit: {
    requirementsChecked: Array<{
      requirement: string;
      satisfied: boolean;
      details: string;
    }>;
  };
  typographyAndLayoutScore: number;
  actionableRefinements: string[];
}
