import { create } from 'zustand';
import {
  OfficeDocType,
  OfficeDocumentModel,
  WordDocModel,
  SpreadsheetModel,
  PresentationModel,
  DocSection,
  DocPageModule,
  SheetCell,
  SlideModel,
  DocumentArchetype,
} from './types';
import { OfficeHistory } from './history';

interface UpdateOptions {
  pushHistory?: boolean;
}

interface OfficeStore {
  // Document State
  activeDoc: OfficeDocumentModel;
  activeDocType: OfficeDocType;
  isDocumentLoaded: boolean;
  isDirty: boolean;
  isLoading: boolean;
  history: OfficeHistory;

  // Viewport & Selection
  zoom: number;
  activeSheetIndex: number;
  activeSlideIndex: number;
  selectedCell: { sheetIndex: number; rowIdx: number; colKey: string } | null;
  selectedSectionId: string | null;
  selectedPageId: string | null;
  activeStudioTab: 'inspector' | 'outline' | 'insert';

  // Actions
  loadDocument: (doc: OfficeDocumentModel) => void;
  loadSample: (type: OfficeDocType) => void;
  loadArchetype: (archetype: DocumentArchetype) => void;
  clearDocument: () => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setActiveSheetIndex: (idx: number) => void;
  setActiveSlideIndex: (idx: number) => void;
  setSelectedCell: (cell: { sheetIndex: number; rowIdx: number; colKey: string } | null) => void;
  selectSection: (id: string | null) => void;
  selectPage: (id: string | null) => void;
  setActiveStudioTab: (tab: 'inspector' | 'outline' | 'insert') => void;
  getSelectedSection: () => DocSection | null;

  // Document Mutations
  updateWordDocumentMeta: (updates: Partial<Omit<WordDocModel, 'id' | 'sections'>>, options?: UpdateOptions) => void;
  updateWordSection: (sectionId: string, updates: Partial<DocSection>, options?: UpdateOptions) => void;
  addWordSection: (section: DocSection, insertAtIndex?: number) => void;
  deleteWordSection: (sectionId: string) => void;
  reorderWordSections: (fromIndex: number, toIndex: number) => void;

  // Composite Page Module Mutations
  addPageModule: (pageMod: DocPageModule, insertAtIndex?: number) => void;
  deletePageModule: (pageId: string) => void;
  reorderPageModules: (fromIndex: number, toIndex: number) => void;
  updatePageModule: (pageId: string, updates: Partial<DocPageModule>, options?: UpdateOptions) => void;

  // Spreadsheet Mutations
  updateSpreadsheetCell: (
    sheetIndex: number,
    rowIdx: number,
    colKey: string,
    cell: Partial<SheetCell>,
    options?: UpdateOptions
  ) => void;
  addSpreadsheetRow: (sheetIndex: number, rowCells: Record<string, SheetCell>) => void;

  // Presentation Mutations
  updateSlide: (slideId: string, updates: Partial<SlideModel>, options?: UpdateOptions) => void;
  addSlide: (slide: SlideModel, insertAtIndex?: number) => void;

  // History Actions
  commitSnapshot: (docBeforeChange?: OfficeDocumentModel) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const historyManager = new OfficeHistory();

export const useOfficeStore = create<OfficeStore>((set, get) => ({
  activeDoc: createDefaultSample('document'),
  activeDocType: 'document',
  isDocumentLoaded: false,
  isDirty: false,
  isLoading: false,
  history: historyManager,

  zoom: 1,
  activeSheetIndex: 0,
  activeSlideIndex: 0,
  selectedCell: null,
  selectedSectionId: null,
  selectedPageId: null,
  activeStudioTab: 'inspector',

  canUndo: false,
  canRedo: false,

  loadDocument: (doc) => {
    historyManager.clear();
    historyManager.pushState(doc);
    set({
      activeDoc: doc,
      activeDocType: doc.type,
      isDocumentLoaded: true,
      isDirty: false,
      activeSheetIndex: 0,
      activeSlideIndex: 0,
      selectedCell: null,
      selectedSectionId: null,
      selectedPageId: null,
      canUndo: false,
      canRedo: false,
    });
  },

  loadSample: (type) => {
    const sample = createDefaultSample(type);
    historyManager.clear();
    historyManager.pushState(sample);
    set({
      activeDoc: sample,
      activeDocType: type,
      isDocumentLoaded: true,
      isDirty: false,
      activeSheetIndex: 0,
      activeSlideIndex: 0,
      selectedCell: null,
      selectedSectionId: null,
      selectedPageId: null,
      canUndo: false,
      canRedo: false,
    });
  },

  loadArchetype: (archetype) => {
    const sample = createSampleForArchetype(archetype);
    historyManager.clear();
    historyManager.pushState(sample);
    set({
      activeDoc: sample,
      activeDocType: 'document',
      isDocumentLoaded: true,
      isDirty: false,
      activeSheetIndex: 0,
      activeSlideIndex: 0,
      selectedCell: null,
      selectedSectionId: null,
      selectedPageId: null,
      canUndo: false,
      canRedo: false,
    });
  },

  clearDocument: () => {
    historyManager.clear();
    set({
      isDocumentLoaded: false,
      isDirty: false,
      selectedCell: null,
      selectedSectionId: null,
      selectedPageId: null,
      canUndo: false,
      canRedo: false,
    });
  },

  setZoom: (zoomOrFn) => {
    set((state) => ({
      zoom: typeof zoomOrFn === 'function' ? zoomOrFn(state.zoom) : zoomOrFn,
    }));
  },

  setActiveSheetIndex: (idx) => set({ activeSheetIndex: idx, selectedCell: null }),
  setActiveSlideIndex: (idx) => set({ activeSlideIndex: idx }),
  setSelectedCell: (cell) => set({ selectedCell: cell }),
  selectSection: (id) => set({ selectedSectionId: id }),
  selectPage: (id) => set({ selectedPageId: id }),
  setActiveStudioTab: (tab) => set({ activeStudioTab: tab }),

  getSelectedSection: () => {
    const { activeDoc, selectedSectionId } = get();
    if (activeDoc.type !== 'document' || !selectedSectionId) return null;
    return activeDoc.model.sections.find((s) => s.id === selectedSectionId) || null;
  },

  updateWordDocumentMeta: (updates, options) => {
    const { activeDoc, history } = get();
    if (activeDoc.type !== 'document') return;

    if (options?.pushHistory !== false) {
      history.pushState(activeDoc);
    }

    set({
      activeDoc: {
        type: 'document',
        model: { ...activeDoc.model, ...updates },
      },
      isDirty: true,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  updateWordSection: (sectionId, updates, options) => {
    const { activeDoc, history } = get();
    if (activeDoc.type !== 'document') return;

    if (options?.pushHistory !== false) {
      history.pushState(activeDoc);
    }

    const updatedSections = activeDoc.model.sections.map((s) => {
      if (s.id === sectionId) {
        return { ...s, ...updates } as DocSection;
      }
      return s;
    });

    set({
      activeDoc: {
        type: 'document',
        model: { ...activeDoc.model, sections: updatedSections },
      },
      isDirty: true,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  addWordSection: (section, insertAtIndex) => {
    const { activeDoc, history } = get();
    if (activeDoc.type !== 'document') return;

    history.pushState(activeDoc);
    const sections = [...activeDoc.model.sections];
    if (typeof insertAtIndex === 'number') {
      sections.splice(insertAtIndex, 0, section);
    } else {
      sections.push(section);
    }

    set({
      activeDoc: {
        type: 'document',
        model: { ...activeDoc.model, sections },
      },
      isDirty: true,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  deleteWordSection: (sectionId) => {
    const { activeDoc, history, selectedSectionId } = get();
    if (activeDoc.type !== 'document') return;

    history.pushState(activeDoc);
    const sections = activeDoc.model.sections.filter((s) => s.id !== sectionId);

    set({
      activeDoc: {
        type: 'document',
        model: { ...activeDoc.model, sections },
      },
      selectedSectionId: selectedSectionId === sectionId ? null : selectedSectionId,
      isDirty: true,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  reorderWordSections: (fromIndex, toIndex) => {
    const { activeDoc, history } = get();
    if (activeDoc.type !== 'document') return;

    const sections = [...activeDoc.model.sections];
    if (fromIndex < 0 || fromIndex >= sections.length || toIndex < 0 || toIndex >= sections.length) return;

    history.pushState(activeDoc);
    const [moved] = sections.splice(fromIndex, 1);
    sections.splice(toIndex, 0, moved);

    set({
      activeDoc: {
        type: 'document',
        model: { ...activeDoc.model, sections },
      },
      isDirty: true,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  addPageModule: (pageMod, insertAtIndex) => {
    const { activeDoc, history } = get();
    if (activeDoc.type !== 'document') return;

    history.pushState(activeDoc);
    const pages = [...(activeDoc.model.pages || [])];
    if (typeof insertAtIndex === 'number') {
      pages.splice(insertAtIndex, 0, pageMod);
    } else {
      pages.push(pageMod);
    }

    set({
      activeDoc: {
        type: 'document',
        model: {
          ...activeDoc.model,
          archetype: 'composite',
          pages,
        },
      },
      isDirty: true,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  deletePageModule: (pageId) => {
    const { activeDoc, history, selectedPageId } = get();
    if (activeDoc.type !== 'document') return;

    history.pushState(activeDoc);
    const pages = (activeDoc.model.pages || []).filter((p) => p.id !== pageId);

    set({
      activeDoc: {
        type: 'document',
        model: { ...activeDoc.model, pages },
      },
      selectedPageId: selectedPageId === pageId ? null : selectedPageId,
      isDirty: true,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  reorderPageModules: (fromIndex, toIndex) => {
    const { activeDoc, history } = get();
    if (activeDoc.type !== 'document') return;

    const pages = [...(activeDoc.model.pages || [])];
    if (fromIndex < 0 || fromIndex >= pages.length || toIndex < 0 || toIndex >= pages.length) return;

    history.pushState(activeDoc);
    const [moved] = pages.splice(fromIndex, 1);
    pages.splice(toIndex, 0, moved);

    set({
      activeDoc: {
        type: 'document',
        model: { ...activeDoc.model, pages },
      },
      isDirty: true,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  updatePageModule: (pageId, updates, options) => {
    const { activeDoc, history } = get();
    if (activeDoc.type !== 'document') return;

    if (options?.pushHistory !== false) {
      history.pushState(activeDoc);
    }

    const pages = (activeDoc.model.pages || []).map((p) => {
      if (p.id === pageId) {
        return { ...p, ...updates } as DocPageModule;
      }
      return p;
    });

    set({
      activeDoc: {
        type: 'document',
        model: { ...activeDoc.model, pages },
      },
      isDirty: true,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  updateSpreadsheetCell: (sheetIndex, rowIdx, colKey, cellUpdates, options) => {
    const { activeDoc, history } = get();
    if (activeDoc.type !== 'spreadsheet') return;

    if (options?.pushHistory !== false) {
      history.pushState(activeDoc);
    }

    const sheets = [...activeDoc.model.sheets];
    const targetSheet = sheets[sheetIndex];
    if (!targetSheet || !targetSheet.rows[rowIdx]) return;

    const rows = [...targetSheet.rows];
    const existingCell = rows[rowIdx].cells[colKey] || { value: '' };
    rows[rowIdx] = {
      ...rows[rowIdx],
      cells: {
        ...rows[rowIdx].cells,
        [colKey]: { ...existingCell, ...cellUpdates },
      },
    };

    sheets[sheetIndex] = { ...targetSheet, rows };

    set({
      activeDoc: {
        type: 'spreadsheet',
        model: { ...activeDoc.model, sheets },
      },
      isDirty: true,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  addSpreadsheetRow: (sheetIndex, rowCells) => {
    const { activeDoc, history } = get();
    if (activeDoc.type !== 'spreadsheet') return;

    history.pushState(activeDoc);
    const sheets = [...activeDoc.model.sheets];
    const targetSheet = sheets[sheetIndex];
    if (!targetSheet) return;

    sheets[sheetIndex] = {
      ...targetSheet,
      rows: [...targetSheet.rows, { cells: rowCells }],
    };

    set({
      activeDoc: {
        type: 'spreadsheet',
        model: { ...activeDoc.model, sheets },
      },
      isDirty: true,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  updateSlide: (slideId, updates, options) => {
    const { activeDoc, history } = get();
    if (activeDoc.type !== 'presentation') return;

    if (options?.pushHistory !== false) {
      history.pushState(activeDoc);
    }

    const slides = activeDoc.model.slides.map((s) => {
      if (s.id === slideId) return { ...s, ...updates };
      return s;
    });

    set({
      activeDoc: {
        type: 'presentation',
        model: { ...activeDoc.model, slides },
      },
      isDirty: true,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  addSlide: (slide, insertAtIndex) => {
    const { activeDoc, history } = get();
    if (activeDoc.type !== 'presentation') return;

    history.pushState(activeDoc);
    const slides = [...activeDoc.model.slides];
    if (typeof insertAtIndex === 'number') {
      slides.splice(insertAtIndex, 0, slide);
    } else {
      slides.push(slide);
    }

    set({
      activeDoc: {
        type: 'presentation',
        model: { ...activeDoc.model, slides },
      },
      isDirty: true,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  commitSnapshot: (docBeforeChange) => {
    const { activeDoc, history } = get();
    if (docBeforeChange) {
      history.pushState(docBeforeChange);
    } else {
      history.pushState(activeDoc);
    }
    set({
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  undo: () => {
    const { activeDoc, history } = get();
    const prev = history.undo(activeDoc);
    if (prev) {
      set({
        activeDoc: prev,
        activeDocType: prev.type,
        isDirty: true,
        canUndo: history.canUndo(),
        canRedo: history.canRedo(),
      });
    }
  },

  redo: () => {
    const { activeDoc, history } = get();
    const next = history.redo(activeDoc);
    if (next) {
      set({
        activeDoc: next,
        activeDocType: next.type,
        isDirty: true,
        canUndo: history.canUndo(),
        canRedo: history.canRedo(),
      });
    }
  },
}));

function createDefaultSample(type: OfficeDocType): OfficeDocumentModel {
  if (type === 'document') {
    return {
      type: 'document',
      model: {
        id: 'doc_sample_1',
        title: 'Enterprise AI Transformation Proposal',
        subtitle: 'Strategic Roadmap, Architecture, and Commercial Terms',
        author: 'Autonomous Solutions Practice',
        organization: 'Vibeflow Enterprise',
        theme: 'corporate-navy',
        hasCoverPage: true,
        sections: [
          {
            id: 'sec_1',
            type: 'heading',
            level: 1,
            text: '1. Executive Summary',
          },
          {
            id: 'sec_2',
            type: 'paragraph',
            lead: true,
            text: 'This proposal outlines an end-to-end framework for deploying multi-agent autonomous engineering pipelines across enterprise operations, driving a projected 4.2x acceleration in software time-to-market.',
          },
          {
            id: 'sec_3',
            type: 'callout',
            title: 'Core Value Proposition',
            badge: 'Key Finding',
            variant: 'highlight',
            text: 'By unifying Vector Design, Office Documentation, and Full-Stack Code generation inside isolated sandbox environments, the organization eliminates multi-tool friction.',
          },
          {
            id: 'sec_4',
            type: 'stat-grid',
            stats: [
              { label: 'Time Saved', value: '74%', description: 'Per documentation sprint' },
              { label: 'ROI Projected', value: '380%', description: 'First-year return' },
              { label: 'Compliance Score', value: '99.8%', description: 'Audit accuracy' },
            ],
          },
          {
            id: 'sec_5',
            type: 'heading',
            level: 2,
            text: '2. Commercial Deliverables & Pricing Matrix',
          },
          {
            id: 'sec_6',
            type: 'table',
            headers: ['Phase', 'Deliverable', 'Timeline', 'Cost (USD)'],
            rows: [
              ['Phase 1', 'Architectural Blueprint & Security Review', 'Weeks 1–3', '$35,000'],
              ['Phase 2', 'Multi-Agent Sandbox Integration', 'Weeks 4–8', '$85,000'],
              ['Phase 3', 'Production Deployment & SLA Handover', 'Weeks 9–12', '$55,000'],
            ],
          },
        ],
      },
    };
  }

  if (type === 'spreadsheet') {
    return {
      type: 'spreadsheet',
      model: {
        id: 'sheet_sample_1',
        title: 'SaaS Unit Economics & Revenue Forecast',
        theme: 'corporate-navy',
        sheets: [
          {
            name: 'P&L Model',
            freezeHeader: true,
            columns: [
              { header: 'Period', key: 'period', width: 16, align: 'left' },
              { header: 'New Customers', key: 'customers', width: 18, format: 'number', align: 'right' },
              { header: 'ARPU ($)', key: 'arpu', width: 16, format: 'currency', align: 'right' },
              { header: 'Monthly Revenue ($)', key: 'revenue', width: 22, format: 'currency', align: 'right' },
              { header: 'COGS ($)', key: 'cogs', width: 18, format: 'currency', align: 'right' },
              { header: 'Gross Profit ($)', key: 'profit', width: 20, format: 'currency', align: 'right' },
              { header: 'Gross Margin', key: 'margin', width: 16, format: 'percent', align: 'right' },
            ],
            rows: [
              {
                cells: {
                  period: { value: 'Q1 2026' },
                  customers: { value: 120 },
                  arpu: { value: 250 },
                  revenue: { value: 30000, formula: 'B2*C2' },
                  cogs: { value: 6000 },
                  profit: { value: 24000, formula: 'D2-E2' },
                  margin: { value: 0.8, formula: 'F2/D2' },
                },
              },
              {
                cells: {
                  period: { value: 'Q2 2026' },
                  customers: { value: 180 },
                  arpu: { value: 250 },
                  revenue: { value: 45000, formula: 'B3*C3' },
                  cogs: { value: 9000 },
                  profit: { value: 36000, formula: 'D3-E3' },
                  margin: { value: 0.8, formula: 'F3/D3' },
                },
              },
              {
                cells: {
                  period: { value: 'Q3 2026' },
                  customers: { value: 290 },
                  arpu: { value: 275 },
                  revenue: { value: 79750, formula: 'B4*C4' },
                  cogs: { value: 15950 },
                  profit: { value: 63800, formula: 'D4-E4' },
                  margin: { value: 0.8, formula: 'F4/D4' },
                },
              },
              {
                isTotal: true,
                cells: {
                  period: { value: 'Total / Average', bold: true },
                  customers: { value: 590, formula: 'SUM(B2:B4)', bold: true },
                  arpu: { value: 258.33, formula: 'AVERAGE(C2:C4)', bold: true },
                  revenue: { value: 154750, formula: 'SUM(D2:D4)', bold: true },
                  cogs: { value: 30950, formula: 'SUM(E2:E4)', bold: true },
                  profit: { value: 123800, formula: 'SUM(F2:F4)', bold: true },
                  margin: { value: 0.8, formula: 'F5/D5', bold: true },
                },
              },
            ],
          },
        ],
      },
    };
  }

  return {
    type: 'presentation',
    model: {
      id: 'pres_sample_1',
      title: 'Autonomous Multi-Agent Studio',
      subtitle: 'Vibeflow Platform Series A Overview',
      author: 'Vibeflow Leadership Team',
      theme: 'corporate-navy',
      aspectRatio: '16:9',
      slides: [
        {
          id: 'slide_1',
          layout: 'title',
          badge: 'Series A Deck',
          title: 'Vibeflow Autonomous Studio',
          subtitle: 'The Next Generation of AI Content & Systems Engineering',
        },
        {
          id: 'slide_2',
          layout: 'stats',
          badge: 'Traction & Milestones',
          title: 'Unprecedented Growth in Autonomous Workflows',
          stats: [
            { label: 'Workspaces Created', value: '45,000+', note: '+180% MoM' },
            { label: 'Enterprise Customers', value: '120+', note: 'Fortune 500 pilots' },
            { label: 'Token Efficiency', value: '3.8x', note: 'Compared to baseline' },
            { label: 'Net Retention', value: '142%', note: 'Industry leading' },
          ],
        },
        {
          id: 'slide_3',
          layout: 'two-column',
          badge: 'Problem vs. Solution',
          title: 'Bridging the Creative & Engineering Divide',
          leftColumn: {
            title: 'Current Pain Points',
            bullets: [
              'Fragmented toolchains across design, docs, and code.',
              'High latency in manual review cycles.',
              'Loss of domain context when handing off assets.',
            ],
          },
          rightColumn: {
            title: 'The Vibeflow Advantage',
            bullets: [
              'Unified multi-agent workspaces sharing persistent R2 vaults.',
              'Autonomous evaluation and mathematical consistency audits.',
              'Instant in-browser studio editing without external software.',
            ],
          },
        },
      ],
    },
  };
}

export function createSampleForArchetype(archetype: DocumentArchetype): OfficeDocumentModel {
  switch (archetype) {
    case 'two-column-resume':
      return {
        type: 'document',
        model: {
          id: 'cv_pieter_vorster',
          title: 'Pieter Vorster',
          subtitle: 'Senior Wildlife Conservationist',
          theme: 'slate-minimal',
          archetype: 'two-column-resume',
          hasCoverPage: false,
          pageSize: 'a4',
          pageFit: 'strict-1-page',
          sidebarBio: 'Experienced Wildlife Conservationist with a demonstrated history of working in environmental management and research.',
          sidebarHobbies: ['Hiking', 'Bird Watching', 'Photography', 'Field Research'],
          contactInfo: {
            location: 'Johannesburg, South Africa',
            phone: '+27 123 456 789',
            email: 'p.vorster@example.com',
          },
          sidebarLinks: [
            { label: 'LinkedIn', url: 'linkedin.com/in/pietervorster' },
            { label: 'Portfolio', url: 'conservation-africa.org' },
          ],
          sidebarReferences: [
            { name: 'Dr. Johan Botha', org: 'University of Pretoria', contact: '+27 987 654 321' },
          ],
          sections: [
            {
              id: 'sec_exp',
              type: 'timeline',
              categoryTitle: 'Work Experience',
              items: [
                {
                  title: 'Wildlife Conservationist',
                  institution: 'South African National Parks',
                  period: 'Jan 2015 – Dec 2021',
                  bullets: [
                    'Managed and protected wildlife populations in Kruger National Park.',
                    'Conducted field research on animal behaviour and migration dynamics.',
                    'Educated the public and authored ecological conservation reports.',
                  ],
                },
                {
                  title: 'Assistant Conservationist',
                  institution: 'Johannesburg Zoo',
                  period: 'Jan 2010 – Dec 2014',
                  bullets: [
                    'Assisted in health management and animal breeding programs.',
                    'Maintained records of veterinary care and population genetics.',
                  ],
                },
              ],
            },
            {
              id: 'sec_skills',
              type: 'skill-gauges',
              categoryTitle: 'Skills & Proficiencies',
              skills: [
                { name: 'Wildlife Management', levelPercent: 95 },
                { name: 'Ecological Research', levelPercent: 90 },
                { name: 'Data Analysis', levelPercent: 85 },
                { name: 'Project Leadership', levelPercent: 88 },
              ],
            },
          ],
        },
      };

    case 'invoice-statement':
      return {
        type: 'document',
        model: {
          id: 'inv_joburg',
          title: 'M J Young',
          organization: 'City of Joburg Municipal Services',
          theme: 'corporate-navy',
          archetype: 'invoice-statement',
          hasCoverPage: false,
          pageSize: 'a4',
          pageFit: 'strict-1-page',
          invoiceMeta: {
            taxInvoiceNumber: 'INV-136005176930',
            accountNumber: '800128031',
            pinCode: '506109',
            dueDate: '2026-03-20',
            clientAddress: '27 Crummock Avenue, Modderfontein, 1609',
            remittanceBank: 'Standard Bank Corporate',
            remittanceAccount: '8001280315',
          },
          sections: [
            {
              id: 'sec_inv_table',
              type: 'table',
              headers: ['Description / Deliverable Item', 'Category', 'Billing Period', 'Amount (ZAR)'],
              rows: [
                ['Enterprise Multi-Agent Platform SLA', 'Software Subscription', 'Feb 2026', 'R 3,395.00'],
                ['Hermetic MicroVM Compute & Cloud Storage', 'Infrastructure Usage', 'Feb 2026', 'R 1,087.36'],
                ['Value Added Tax (VAT @ 15%)', 'Tax Assessment', 'Feb 2026', 'R 345.00'],
              ],
            },
          ],
        },
      };

    case 'executive-memo':
      return {
        type: 'document',
        model: {
          id: 'memo_sample',
          title: 'Autonomous Multi-Agent Strategy',
          subtitle: 'Q4 Capital Allocation & Architecture Roadmap',
          author: 'Autonomous Solutions Practice',
          organization: 'Vibeflow Enterprise',
          theme: 'corporate-navy',
          archetype: 'executive-memo',
          hasCoverPage: false,
          pageSize: 'letter',
          pageFit: 'strict-1-page',
          sections: [
            {
              id: 'memo_stats',
              type: 'stat-grid',
              stats: [
                { label: 'Projected ROI', value: '380%' },
                { label: 'Time Saved', value: '74%' },
                { label: 'SLA Reliability', value: '99.9%' },
              ],
            },
            {
              id: 'memo_h1',
              type: 'heading',
              level: 1,
              text: '1. Executive Thesis & Context',
            },
            {
              id: 'memo_p1',
              type: 'paragraph',
              lead: true,
              text: 'Modern enterprise development pipelines suffer from severe toolchain fragmentation. Unifying design synthesis, documentation, and code inside isolated microVMs eliminates handoff friction.',
            },
            {
              id: 'memo_h2',
              type: 'heading',
              level: 2,
              text: '2. Proposed Architecture',
            },
            {
              id: 'memo_p2',
              type: 'paragraph',
              text: 'By enforcing sub-millisecond micro-cent budgets and cryptographic audit ledgers, organizations achieve continuous deployment without risk of budget overruns.',
            },
            {
              id: 'memo_callout',
              type: 'callout',
              title: 'Strategic Takeaway',
              badge: 'HIGH IMPACT',
              text: 'Pilot implementations demonstrated a 4.2x acceleration in product delivery cycles within 60 days.',
            },
          ],
        },
      };

    case 'company-profile':
      return {
        type: 'document',
        model: {
          id: 'profile_sample',
          title: 'Enterprise Innovation Practice',
          subtitle: 'Global Systems Architecture & Autonomous Intelligence',
          organization: 'Vibeflow Technologies Inc.',
          author: 'Executive Leadership Group',
          theme: 'corporate-navy',
          archetype: 'company-profile',
          hasCoverPage: true,
          pageSize: 'letter',
          sections: [
            {
              id: 'prof_stats',
              type: 'stat-grid',
              stats: [
                { label: 'Global Enterprises', value: '120+' },
                { label: 'Workspaces Created', value: '45k+' },
                { label: 'Uptime SLA', value: '99.99%' },
              ],
            },
          ],
        },
      };

    case 'technical-whitepaper':
      return {
        type: 'document',
        model: {
          id: 'rfc_sample',
          title: 'Hermetic Sandbox MicroVM Protocol',
          subtitle: 'Architectural Specification & Security Isolation Model',
          author: 'Principal Systems Architect',
          organization: 'Vibeflow Architecture Board',
          theme: 'slate-minimal',
          archetype: 'technical-whitepaper',
          hasCoverPage: false,
          pageSize: 'a4',
          sections: [
            {
              id: 'sec_code_1',
              type: 'code-block',
              code: 'const session = await sandbox.spawn({\n  isolation: "microvm",\n  budgetCeilingCents: 5000\n});',
            },
          ],
        },
      };

    case 'legal-contract':
      return {
        type: 'document',
        model: {
          id: 'contract_sample',
          title: 'Master Services Agreement',
          subtitle: 'Enterprise Client Corporation',
          author: 'Managing Director',
          organization: 'Vibeflow Technologies Inc.',
          theme: 'slate-minimal',
          archetype: 'legal-contract',
          hasCoverPage: false,
          pageSize: 'letter',
          sections: [
            {
              id: 'sec_sign',
              type: 'signature-block',
              parties: [
                {
                  role: 'Provider',
                  entityName: 'Vibeflow Technologies Inc.',
                  signatoryName: 'Alex Mercer',
                  signatoryTitle: 'Chief Technology Officer',
                },
                {
                  role: 'Client',
                  entityName: 'Enterprise Client Corporation',
                  signatoryName: 'Jane Doe',
                  signatoryTitle: 'Executive Officer',
                },
              ],
            },
          ],
        },
      };

    case 'case-study':
      return {
        type: 'document',
        model: {
          id: 'case_study_sample',
          title: 'Accelerating Enterprise Velocity 4x',
          subtitle: 'How Global Solutions Deployed Autonomous Pipelines in 60 Days',
          organization: 'Global Solutions Enterprise',
          theme: 'emerald-enterprise',
          archetype: 'case-study',
          hasCoverPage: false,
          pageSize: 'letter',
          pageFit: 'strict-1-page',
          sections: [
            {
              id: 'cs_quote',
              type: 'quote-hero',
              quote: 'Vibeflow transformed our software delivery pipeline, reducing deployment lead time by 74% within the first 60 days.',
              authorName: 'EVP of Software Engineering',
              authorTitle: 'Global Solutions Enterprise',
            },
            {
              id: 'cs_stats',
              type: 'stat-grid',
              stats: [
                { label: 'Time to Market', value: '-74%' },
                { label: 'Cost Reduction', value: '42%' },
                { label: 'Compliance Audit', value: '100%' },
              ],
            },
          ],
        },
      };

    case 'product-datasheet':
      return {
        type: 'document',
        model: {
          id: 'datasheet_sample',
          title: 'Vibeflow Autonomous Studio Core',
          subtitle: 'High-performance vector synthesis, multi-agent sandbox orchestration, and real-time print engine export.',
          organization: 'Vibeflow Corporation',
          theme: 'cyberpunk-dark',
          archetype: 'product-datasheet',
          hasCoverPage: false,
          pageSize: 'letter',
          pageFit: 'strict-1-page',
          sections: [
            {
              id: 'ds_table',
              type: 'table',
              caption: 'Feature Matrix & Performance SLAs',
              headers: ['Capability Area', 'Specification'],
              rows: [
                ['Vector Render Latency', '< 80ms Native Resvg Engine'],
                ['Sandbox Initialization', '< 450ms Warm MicroVM'],
                ['Audit Trail Fidelity', 'Cryptographic Ed25519 Signatures'],
              ],
            },
          ],
        },
      };

    case 'composite':
      return {
        type: 'document',
        model: {
          id: 'composite_enterprise_pkg',
          title: 'Enterprise Transformation & Governance Package',
          subtitle: 'End-to-End Autonomous Systems Architecture, Scope, Team & Commercial Agreement',
          author: 'Autonomous Practice Lead',
          organization: 'Vibeflow Technologies Inc.',
          theme: 'corporate-navy',
          archetype: 'composite',
          hasCoverPage: true,
          pageSize: 'a4',
          sections: [],
          pages: [
            {
              id: 'pkg_page_1',
              title: 'Executive Proposal & Scope of Work',
              archetype: 'executive-proposal',
              sections: [
                {
                  id: 'sow_h1',
                  type: 'heading',
                  level: 1,
                  text: '1. Executive Statement of Work',
                },
                {
                  id: 'sow_p1',
                  type: 'paragraph',
                  lead: true,
                  text: 'This multi-phase deliverable establishes autonomous design synthesis and microVM sandbox orchestration.',
                },
                {
                  id: 'sow_table',
                  type: 'table',
                  headers: ['Phase', 'Deliverable Milestone', 'Timeline', 'Cost (USD)'],
                  rows: [
                    ['Phase 1', 'Architecture Blueprint & Security Audit', 'Weeks 1–3', '$35,000'],
                    ['Phase 2', 'Multi-Agent Sandbox Integration', 'Weeks 4–8', '$85,000'],
                  ],
                },
              ],
            },
            {
              id: 'pkg_page_2',
              title: 'Lead Architect & Systems Engineer',
              subtitle: 'Principal Autonomous Architect',
              archetype: 'two-column-resume',
              sidebarBio: '12+ years designing distributed systems, microVM isolation, and autonomous compiler toolchains.',
              sidebarHobbies: ['Kernel Hacking', 'Robotics', 'Mountaineering'],
              contactInfo: {
                location: 'San Francisco, CA',
                email: 'lead.architect@vibeflow.ai',
                phone: '+1 415 555 0192',
              },
              sections: [
                {
                  id: 'cv_exp_1',
                  type: 'timeline',
                  categoryTitle: 'Track Record & Systems Scale',
                  items: [
                    {
                      title: 'Principal Systems Architect',
                      institution: 'Vibeflow Technologies',
                      period: '2022 – Present',
                      bullets: [
                        'Architected hermetic microVM sandbox cluster handling 500k daily executions.',
                        'Engineered zero-overhead sub-millisecond spend enforcement ledger.',
                      ],
                    },
                  ],
                },
                {
                  id: 'cv_skills_1',
                  type: 'skill-gauges',
                  categoryTitle: 'Core Disciplines',
                  skills: [
                    { name: 'Distributed Systems', levelPercent: 98 },
                    { name: 'Vector Render Engines', levelPercent: 95 },
                    { name: 'Security & eBPF', levelPercent: 90 },
                  ],
                },
              ],
            },
            {
              id: 'pkg_page_3',
              title: 'Commercial Statement & Fee Schedule',
              archetype: 'invoice-statement',
              invoiceMeta: {
                taxInvoiceNumber: 'INV-2026-00918',
                accountNumber: '800128031',
                pinCode: '506109',
                dueDate: '2026-03-31',
                clientAddress: 'Enterprise Client HQ, Suite 500',
                remittanceBank: 'JPMorgan Chase Corporate',
                remittanceAccount: '8001280315',
              },
              sections: [
                {
                  id: 'inv_table_1',
                  type: 'table',
                  headers: ['Phase / Deliverable Item', 'Category', 'Target Date', 'Fee (USD)'],
                  rows: [
                    ['Phase 1: Architecture Blueprint', 'Fixed Professional Fee', '2026/02/28', '$35,000.00'],
                    ['Phase 2: Core Sandbox Integration', 'Milestone Deliverable', '2026/03/31', '$85,000.00'],
                  ],
                },
              ],
            },
            {
              id: 'pkg_page_4',
              title: 'Master Services Agreement & Execution',
              archetype: 'legal-contract',
              sections: [
                {
                  id: 'contract_sign_1',
                  type: 'signature-block',
                  parties: [
                    {
                      role: 'Provider',
                      entityName: 'Vibeflow Technologies Inc.',
                      signatoryName: 'Alex Mercer',
                      signatoryTitle: 'Chief Technology Officer',
                    },
                    {
                      role: 'Client',
                      entityName: 'Enterprise Client Corporation',
                      signatoryName: 'Jane Doe',
                      signatoryTitle: 'Executive Officer',
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

    case 'executive-proposal':
    default:
      return createDefaultSample('document');
  }
}
