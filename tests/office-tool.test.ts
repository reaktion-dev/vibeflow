import { describe, it, expect } from 'vitest';
import { generateDocxBuffer } from '@/lib/office-tool/generators/docx';
import { generateXlsxBuffer } from '@/lib/office-tool/generators/xlsx';
import { generatePptxBuffer } from '@/lib/office-tool/generators/pptx';
import { generatePdfBuffer } from '@/lib/office-tool/pdf/service';
import { evaluateOfficeDocument } from '@/lib/office-tool/evaluator';
import { useOfficeStore } from '@/lib/office-tool/useOfficeStore';
import { OfficeHistory } from '@/lib/office-tool/history';
import {
  WordDocModel,
  SpreadsheetModel,
  PresentationModel,
} from '@/lib/office-tool/types';

describe('Office Tool Generators, Store, & Evaluation Suite', () => {
  // ── 1. Word Document Generator Test ────────────────────────────────────────
  it('generates a valid binary .docx buffer from WordDocModel', async () => {
    const model: WordDocModel = {
      id: 'doc_test_1',
      title: 'Enterprise Procurement RFP',
      subtitle: 'Global Cloud Infrastructure RFP Package',
      author: 'Strategic Sourcing Team',
      organization: 'Acme Global',
      theme: 'corporate-navy',
      hasCoverPage: true,
      sections: [
        {
          id: 'sec_1',
          type: 'heading',
          level: 1,
          text: '1. Executive Statement of Work',
        },
        {
          id: 'sec_2',
          type: 'paragraph',
          lead: true,
          text: 'Acme Global seeks proposals for high-availability multi-region cloud services.',
        },
        {
          id: 'sec_3',
          type: 'callout',
          title: 'Mandatory Requirement',
          text: 'All responses must comply with ISO 27001 and SOC 2 Type II certifications.',
        },
        {
          id: 'sec_4',
          type: 'stat-grid',
          stats: [
            { label: 'Total Budget', value: '$1.2M' },
            { label: 'Target Uptime', value: '99.99%' },
            { label: 'Contract Term', value: '3 Years' },
          ],
        },
        {
          id: 'sec_5',
          type: 'table',
          headers: ['Line Item', 'Description', 'Quantity', 'Max Price'],
          rows: [
            ['1.1', 'Core Compute Nodes', '400', '$400,000'],
            ['1.2', 'Dedicated Interconnect', '2', '$150,000'],
          ],
        },
      ],
    };

    const buffer = await generateDocxBuffer(model);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // PK zip signature for OOXML (.docx)
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  // ── 2. Excel Spreadsheet Generator Test ────────────────────────────────────
  it('generates a valid multi-sheet binary .xlsx buffer with formulas from SpreadsheetModel', async () => {
    const model: SpreadsheetModel = {
      id: 'sheet_test_1',
      title: 'Financial Projections',
      theme: 'emerald-enterprise',
      sheets: [
        {
          name: 'Revenue Forecast',
          freezeHeader: true,
          columns: [
            { header: 'Month', key: 'month', width: 14 },
            { header: 'Units Sold', key: 'units', width: 16, format: 'number' },
            { header: 'Unit Price', key: 'price', width: 16, format: 'currency' },
            { header: 'Total Revenue', key: 'revenue', width: 20, format: 'currency' },
          ],
          rows: [
            {
              cells: {
                month: { value: 'Jan 2026' },
                units: { value: 500 },
                price: { value: 45 },
                revenue: { value: 22500, formula: 'B2*C2' },
              },
            },
            {
              cells: {
                month: { value: 'Feb 2026' },
                units: { value: 650 },
                price: { value: 45 },
                revenue: { value: 29250, formula: 'B3*C3' },
              },
            },
            {
              isTotal: true,
              cells: {
                month: { value: 'Total', bold: true },
                units: { value: 1150, formula: 'SUM(B2:B3)', bold: true },
                price: { value: 45, bold: true },
                revenue: { value: 51750, formula: 'SUM(D2:D3)', bold: true },
              },
            },
          ],
        },
      ],
    };

    const buffer = await generateXlsxBuffer(model);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // PK zip signature for OOXML (.xlsx)
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  // ── 3. PowerPoint Presentation Generator Test ──────────────────────────────
  it('generates a valid 16:9 widescreen binary .pptx buffer from PresentationModel', async () => {
    const model: PresentationModel = {
      id: 'pres_test_1',
      title: 'Vibeflow Q1 Strategy Deck',
      subtitle: 'Executive Presentation for Board of Directors',
      author: 'Executive Leadership',
      theme: 'slate-minimal',
      aspectRatio: '16:9',
      slides: [
        {
          id: 's1',
          layout: 'title',
          badge: 'Board Briefing',
          title: 'Q1 Corporate Strategy',
          subtitle: 'Accelerating Autonomous Product Engineering',
        },
        {
          id: 's2',
          layout: 'stats',
          title: 'Key Operational Metrics',
          stats: [
            { label: 'ARR Growth', value: '+240%' },
            { label: 'Active Orgs', value: '450+' },
          ],
        },
        {
          id: 's3',
          layout: 'two-column',
          title: 'Strategic Priorities',
          leftColumn: {
            title: 'Product Velocity',
            bullets: ['Deploy Office Workspace', 'Expand Vector Studio'],
          },
          rightColumn: {
            title: 'Market Expansion',
            bullets: ['Enterprise procurement push', 'Global partner network'],
          },
        },
      ],
    };

    const buffer = await generatePptxBuffer(model);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // PK zip signature for OOXML (.pptx)
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  // ── 4. Evaluator & Formula Mathematical Audit Test ─────────────────────────
  it('evaluates spreadsheet formulas and flags syntax errors correctly', () => {
    const validModel: SpreadsheetModel = {
      id: 's_val',
      title: 'Valid Model',
      theme: 'corporate-navy',
      sheets: [
        {
          name: 'Sheet1',
          columns: [{ header: 'Revenue', key: 'rev' }],
          rows: [
            { cells: { rev: { value: 100 } } },
            { cells: { rev: { value: 200 } } },
            { cells: { rev: { value: 300, formula: 'SUM(A2:A3)' } } },
          ],
        },
      ],
    };

    const validAudit = evaluateOfficeDocument({ type: 'spreadsheet', model: validModel }, ['Revenue']);
    expect(validAudit.passed).toBe(true);
    expect(validAudit.formulaAudit.errorsFound.length).toBe(0);
    expect(validAudit.overallScore).toBeGreaterThanOrEqual(80);

    const invalidModel: SpreadsheetModel = {
      id: 's_inval',
      title: 'Invalid Model',
      theme: 'corporate-navy',
      sheets: [
        {
          name: 'Sheet1',
          columns: [{ header: 'Sales', key: 'sales' }],
          rows: [
            { cells: { sales: { value: 100, formula: 'UNKNOWNFUNC(A1:A2' } } }, // Unclosed parenthesis & unknown function
          ],
        },
      ],
    };

    const invalidAudit = evaluateOfficeDocument({ type: 'spreadsheet', model: invalidModel });
    expect(invalidAudit.passed).toBe(false);
    expect(invalidAudit.formulaAudit.errorsFound.length).toBeGreaterThan(0);
  });

  // ── 5. Office Store & Debounced Mutation Test ──────────────────────────────
  it('mutates document, sheet, and presentation state with debounced history transactions', () => {
    const store = useOfficeStore.getState();
    store.loadSample('document');

    expect(useOfficeStore.getState().activeDocType).toBe('document');
    const initialSectionCount = (useOfficeStore.getState().activeDoc as any).model.sections.length;

    // Add Section
    useOfficeStore.getState().addWordSection({
      id: 'sec_custom_test',
      type: 'paragraph',
      text: 'Custom added test paragraph for evaluation.',
    });

    expect((useOfficeStore.getState().activeDoc as any).model.sections.length).toBe(initialSectionCount + 1);
    expect(useOfficeStore.getState().canUndo).toBe(true);

    // Continuous updates with pushHistory: false (debounced typing)
    for (let i = 1; i <= 10; i++) {
      useOfficeStore.getState().updateWordSection('sec_custom_test', { text: `Typed character frame ${i}` }, { pushHistory: false });
    }

    const currentSection = (useOfficeStore.getState().activeDoc as any).model.sections.find(
      (s: any) => s.id === 'sec_custom_test'
    );
    expect(currentSection?.text).toBe('Typed character frame 10');

    // Undo should restore state cleanly
    useOfficeStore.getState().undo();
    expect((useOfficeStore.getState().activeDoc as any).model.sections.length).toBe(initialSectionCount);
  });

  // ── 6. Page Budget & Orientation Variations Test ───────────────────────────
  it('generates .docx and .xlsx with explicit page sizes, strict-1-page margins, and landscape fit', async () => {
    // 6A. A4 Resume with strict 1-page compact margins
    const a4ResumeModel: WordDocModel = {
      id: 'doc_resume_a4',
      title: 'Jane Doe - Senior Engineering Leader',
      theme: 'slate-minimal',
      hasCoverPage: false,
      pageSize: 'a4',
      pageFit: 'strict-1-page',
      sections: [
        {
          id: 's_lead',
          type: 'paragraph',
          lead: true,
          text: 'Visionary Engineering VP with 12+ years building cloud-scale autonomous systems.',
        },
        {
          id: 's_skills',
          type: 'table',
          headers: ['Domain', 'Technologies', 'Leadership'],
          rows: [
            ['Cloud Architecture', 'AWS, GCP, Kubernetes, Terraform', 'Org Design & Scale'],
            ['Agentic AI', 'AI SDK, LLM fine-tuning, RAG', 'Budget & Vendor SOWs'],
          ],
        },
      ],
    };

    const docxBuffer = await generateDocxBuffer(a4ResumeModel);
    expect(docxBuffer).toBeInstanceOf(Buffer);
    expect(docxBuffer.length).toBeGreaterThan(1000);
    expect(docxBuffer[0]).toBe(0x50);
    expect(docxBuffer[1]).toBe(0x4b);

    // 6B. Wide 8-column spreadsheet with auto-landscape print setup
    const wideSheetModel: SpreadsheetModel = {
      id: 'sheet_wide',
      title: 'Global Supply Chain BOM',
      theme: 'corporate-navy',
      sheets: [
        {
          name: 'BOM Cost Breakdown',
          columns: [
            { header: 'Part #', key: 'part' },
            { header: 'Supplier', key: 'supplier' },
            { header: 'Region', key: 'region' },
            { header: 'Lead Time', key: 'lead' },
            { header: 'MOQ', key: 'moq' },
            { header: 'Unit Cost', key: 'unitCost' },
            { header: 'Tax', key: 'tax' },
            { header: 'Total Est', key: 'total' },
          ],
          rows: [
            {
              cells: {
                part: { value: 'IC-9901' },
                supplier: { value: 'Global Semi' },
                region: { value: 'APAC' },
                lead: { value: '4 Weeks' },
                moq: { value: 1000 },
                unitCost: { value: '$12.50' },
                tax: { value: '5%' },
                total: { value: '$13,125.00' },
              },
            },
          ],
        },
      ],
    };

    const xlsxBuffer = await generateXlsxBuffer(wideSheetModel);
    expect(xlsxBuffer).toBeInstanceOf(Buffer);
    expect(xlsxBuffer.length).toBeGreaterThan(1000);
    expect(xlsxBuffer[0]).toBe(0x50);
    expect(xlsxBuffer[1]).toBe(0x4b);
  });

  // ── 7. Vector PDF Generator Test (@react-pdf/renderer) ─────────────────────
  it('generates an immutable vector PDF buffer with %PDF header from WordDocModel', async () => {
    const model: WordDocModel = {
      id: 'pdf_test_doc',
      title: 'Enterprise AI Transformation Proposal',
      subtitle: 'Executive Framework & Commercial Pricing Matrix',
      author: 'Autonomous Engineering Team',
      organization: 'Vibeflow Enterprise',
      theme: 'corporate-navy',
      hasCoverPage: true,
      pageSize: 'letter',
      sections: [
        {
          id: 'sec_p1',
          type: 'heading',
          level: 1,
          text: '1. Executive Value Proposition',
        },
        {
          id: 'sec_p2',
          type: 'paragraph',
          lead: true,
          text: 'This proposal outlines an end-to-end framework for deploying multi-agent autonomous engineering pipelines.',
        },
        {
          id: 'sec_p3',
          type: 'stat-grid',
          stats: [
            { label: 'Time Saved', value: '74%' },
            { label: 'ROI Projected', value: '380%' },
            { label: 'Compliance Score', value: '99.8%' },
          ],
        },
        {
          id: 'sec_p4',
          type: 'callout',
          title: 'Core Value Proposition',
          badge: 'High Impact',
          text: 'By unifying Vector Design, Office Documentation, and Full-Stack Code generation inside isolated sandboxes, the organization eliminates multi-tool friction.',
        },
        {
          id: 'sec_p5',
          type: 'table',
          headers: ['Phase', 'Deliverable', 'Timeline', 'Cost (USD)'],
          rows: [
            ['Phase 1', 'Architectural Blueprint & Security Review', 'Weeks 1-3', '$35,000'],
            ['Phase 2', 'Multi-Agent Sandbox Integration', 'Weeks 4-8', '$85,000'],
          ],
        },
      ],
    };

    const pdfBuffer = await generatePdfBuffer(model);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    // %PDF magic bytes signature (0x25, 0x50, 0x44, 0x46)
    expect(pdfBuffer[0]).toBe(0x25); // %
    expect(pdfBuffer[1]).toBe(0x50); // P
    expect(pdfBuffer[2]).toBe(0x44); // D
    expect(pdfBuffer[3]).toBe(0x46); // F
  });

  // ── 8. Document Studio Store: Selection, Reorder & Meta Mutations ──────────
  it('handles section selection, drag/reordering, and metadata mutations cleanly', () => {
    const store = useOfficeStore.getState();
    store.loadSample('document');

    const initialDoc = useOfficeStore.getState().activeDoc;
    if (initialDoc.type !== 'document') throw new Error('Expected document model');
    expect(initialDoc.model.sections.length).toBeGreaterThan(2);

    const firstSectionId = initialDoc.model.sections[0].id;
    const secondSectionId = initialDoc.model.sections[1].id;

    // 1. Selection
    store.selectSection(firstSectionId);
    expect(useOfficeStore.getState().selectedSectionId).toBe(firstSectionId);
    expect(useOfficeStore.getState().getSelectedSection()?.id).toBe(firstSectionId);

    // 2. Reordering
    store.reorderWordSections(0, 1);
    const reorderedDoc = useOfficeStore.getState().activeDoc;
    if (reorderedDoc.type !== 'document') throw new Error('Expected document model');
    expect(reorderedDoc.model.sections[0].id).toBe(secondSectionId);
    expect(reorderedDoc.model.sections[1].id).toBe(firstSectionId);

    // 3. Metadata updates
    store.updateWordDocumentMeta({
      title: 'Updated Strategic RFP 2026',
      pageSize: 'a4',
      pageFit: 'strict-1-page',
    });
    const updatedMetaDoc = useOfficeStore.getState().activeDoc;
    if (updatedMetaDoc.type !== 'document') throw new Error('Expected document model');
    expect(updatedMetaDoc.model.title).toBe('Updated Strategic RFP 2026');
    expect(updatedMetaDoc.model.pageSize).toBe('a4');
    expect(updatedMetaDoc.model.pageFit).toBe('strict-1-page');
  });

  // ── 9. High-Design Archetypes: Two-Column Resume & Invoice Generator ────────
  it('generates high-design vector PDFs for Resume and Invoice archetypes', async () => {
    // 1. Two-Column Resume Model (Pieter Vorster style)
    const resumeModel: WordDocModel = {
      id: 'cv_pieter_vorster',
      title: 'Pieter Vorster',
      subtitle: 'Senior Wildlife Conservationist',
      theme: 'slate-minimal',
      archetype: 'two-column-resume',
      hasCoverPage: false,
      pageSize: 'a4',
      pageFit: 'strict-1-page',
      sidebarBio: 'Experienced Wildlife Conservationist with a demonstrated history of working in the environmental services industry.',
      sidebarHobbies: ['Hiking', 'Bird Watching', 'Photography'],
      contactInfo: {
        location: 'Johannesburg, South Africa',
        phone: '+27 123 456 789',
        email: 'p.vorster@example.com',
      },
      sections: [
        {
          id: 'cv_exp',
          type: 'timeline',
          categoryTitle: 'Work Experience',
          items: [
            {
              title: 'Wildlife Conservationist',
              institution: 'South African National Parks',
              period: 'Jan 2015 - Dec 2021',
              bullets: ['Managed and protected wildlife populations', 'Conducted research on animal behaviour'],
            },
          ],
        },
        {
          id: 'cv_skills',
          type: 'skill-gauges',
          categoryTitle: 'Core Skills',
          skills: [
            { name: 'Wildlife Management', levelPercent: 95 },
            { name: 'Ecological Research', levelPercent: 90 },
          ],
        },
      ],
    };

    const resumeBuffer = await generatePdfBuffer(resumeModel);
    expect(resumeBuffer).toBeInstanceOf(Buffer);
    expect(resumeBuffer.length).toBeGreaterThan(1000);
    expect(resumeBuffer[0]).toBe(0x25); // %
    expect(resumeBuffer[1]).toBe(0x50); // P

    // 2. Invoice Model (City of Joburg style)
    const invoiceModel: WordDocModel = {
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
        remittanceBank: 'Standard Bank',
        remittanceAccount: '8001280315',
      },
      sections: [
        {
          id: 'inv_table',
          type: 'table',
          headers: ['Stand Size', 'Number of Dwellings', 'Valuation Date', 'Market Value', 'Region'],
          rows: [['1142 m2', '1', '2026/01/01', 'R 3,395,000.00', 'Region E WARD 32']],
        },
      ],
    };

    const invoiceBuffer = await generatePdfBuffer(invoiceModel);
    expect(invoiceBuffer).toBeInstanceOf(Buffer);
    expect(invoiceBuffer.length).toBeGreaterThan(1000);
    expect(invoiceBuffer[0]).toBe(0x25);
    expect(invoiceBuffer[1]).toBe(0x50);
  });

  // ── 10. Complete Archetype Catalog: Memo, Profile, Spec, Contract, Case Study, Datasheet ──
  it('generates immutable vector PDFs for all specialized executive archetypes', async () => {
    const archetypes: Array<{ archetype: WordDocModel['archetype']; title: string }> = [
      { archetype: 'executive-memo', title: 'Q4 Strategy Briefing' },
      { archetype: 'company-profile', title: 'Enterprise Capabilities Profile' },
      { archetype: 'technical-whitepaper', title: 'Distributed Sandbox RFC' },
      { archetype: 'legal-contract', title: 'Master Services Agreement' },
      { archetype: 'case-study', title: 'Enterprise ROI Case Study' },
      { archetype: 'product-datasheet', title: 'Autonomous Engine Datasheet' },
    ];

    for (const item of archetypes) {
      const model: WordDocModel = {
        id: `test_${item.archetype}`,
        title: item.title,
        subtitle: 'Enterprise Documentation',
        theme: 'corporate-navy',
        archetype: item.archetype,
        hasCoverPage: false,
        pageSize: 'letter',
        pageFit: 'strict-1-page',
        sections: [
          {
            id: 'sec_stat',
            type: 'stat-grid',
            stats: [
              { label: 'Metric A', value: '99%' },
              { label: 'Metric B', value: '$4.2M' },
            ],
          },
          {
            id: 'sec_p',
            type: 'paragraph',
            text: 'Autonomous multi-agent execution pipeline verification.',
          },
          {
            id: 'sec_code',
            type: 'code-block',
            code: 'const result = await pipeline.execute();',
          },
          {
            id: 'sec_quote',
            type: 'quote-hero',
            quote: 'Transformative software velocity acceleration.',
            authorName: 'Jane Doe',
            authorTitle: 'CTO',
          },
        ],
      };

      const buffer = await generatePdfBuffer(model);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
      expect(buffer[0]).toBe(0x25); // %
      expect(buffer[1]).toBe(0x50); // P
    }
  });

  // ── 11. Composite Multi-Archetype Document Publication ─────────────────────
  it('generates a unified multi-page composite publication combining multiple distinct archetypes', async () => {
    const store = useOfficeStore.getState();
    store.loadArchetype('composite');

    const compositeDoc = useOfficeStore.getState().activeDoc;
    if (compositeDoc.type !== 'document') throw new Error('Expected document model');
    expect(compositeDoc.model.archetype).toBe('composite');
    expect(compositeDoc.model.pages?.length).toBe(4);

    const pdfBuffer = await generatePdfBuffer(compositeDoc.model);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(3000);
    expect(pdfBuffer[0]).toBe(0x25); // %
    expect(pdfBuffer[1]).toBe(0x50); // P
    expect(pdfBuffer[2]).toBe(0x44); // D
    expect(pdfBuffer[3]).toBe(0x46); // F
  });
});
