import { tool } from 'ai';
import { z } from 'zod';
import { getToolContext } from '@/lib/ai/harness/tools/context';
import {
  WordDocModel,
  SpreadsheetModel,
  PresentationModel,
  OfficeAuditReport,
  OFFICE_THEMES,
} from '@/lib/office-tool/types';
import { generateDocxBuffer } from '@/lib/office-tool/generators/docx';
import { generateXlsxBuffer } from '@/lib/office-tool/generators/xlsx';
import { generatePptxBuffer } from '@/lib/office-tool/generators/pptx';
import { generatePdfBuffer } from '@/lib/office-tool/pdf/service';
import { evaluateOfficeDocument } from '@/lib/office-tool/evaluator';

export function createOfficeAgentTools() {
  return {
    // ═════════════════════════════════════════════════════════════════════════
    // 1. PROCUREMENT & SUPPLY CHAIN SPECIALIST TOOL (RFP/RFQ/BOM/SOW)
    // ═════════════════════════════════════════════════════════════════════════
    buildProcurementPackage: tool({
      description:
        'SPECIALIST TOOL (@rfp-procurement-specialist): Authors a legally sound, structured RFP, RFQ, SOW, or Bill of Materials (BOM) Word document with compliance clauses, vendor scoring rubrics, SLA thresholds, and pricing schedules.',
      inputSchema: z.object({
        title: z.string().describe('Title of the RFP/RFQ or SOW package'),
        subtitle: z.string().optional().describe('Procurement focus and project scope'),
        organization: z.string().optional().describe('Issuing enterprise or department'),
        theme: z
          .enum(['corporate-navy', 'emerald-enterprise', 'slate-minimal', 'cyberpunk-dark', 'sunset-executive'])
          .default('corporate-navy'),
        scopeOfWork: z.string().describe('Detailed technical & operational scope summary'),
        deliverables: z
          .array(
            z.object({
              phase: z.string(),
              deliverable: z.string(),
              timeline: z.string(),
              cost: z.string(),
            })
          )
          .describe('Milestone deliverables and pricing schedule'),
        bomItems: z
          .array(
            z.object({
              partNumber: z.string(),
              description: z.string(),
              quantity: z.number(),
              unitCost: z.string(),
              totalCost: z.string(),
            })
          )
          .optional()
          .describe('Itemized Bill of Materials line items (if applicable)'),
        slaMetrics: z
          .array(
            z.object({
              metric: z.string(),
              target: z.string(),
              penalty: z.string(),
            })
          )
          .optional()
          .describe('Service Level Agreement thresholds and penalty terms'),
        evaluationCriteria: z
          .array(z.string())
          .optional()
          .describe('Vendor selection criteria & weighted scoring breakdown'),
        pageSize: z.enum(['letter', 'a4']).optional().describe('Page format: Letter (US/NA standard) or A4 (International standard)'),
        pageFit: z.enum(['strict-1-page', 'multi-page']).optional().describe('Page budget constraint. Use strict-1-page with 0.5" compact margins for 1-pagers and resumes.'),
      }),
      execute: async (input) => {
        const { projectId } = getToolContext();

        const sections: WordDocModel['sections'] = [
          {
            id: 'sec_scope_h',
            type: 'heading',
            level: 1,
            text: '1. Project Scope & Operational Overview',
          },
          {
            id: 'sec_scope_p',
            type: 'paragraph',
            lead: true,
            text: input.scopeOfWork,
          },
          {
            id: 'sec_deliv_h',
            type: 'heading',
            level: 2,
            text: '2. Statement of Work (SOW) & Milestone Deliverables',
          },
          {
            id: 'sec_deliv_table',
            type: 'table',
            headers: ['Phase', 'Deliverable', 'Timeline', 'Est. Cost (USD)'],
            rows: input.deliverables.map((d) => [d.phase, d.deliverable, d.timeline, d.cost]),
          },
        ];

        if (input.bomItems && input.bomItems.length > 0) {
          sections.push(
            {
              id: 'sec_bom_h',
              type: 'heading',
              level: 2,
              text: '3. Bill of Materials (BOM) Itemization',
            },
            {
              id: 'sec_bom_table',
              type: 'table',
              headers: ['Part #', 'Description', 'Qty', 'Unit Cost', 'Total Cost'],
              rows: input.bomItems.map((b) => [
                b.partNumber,
                b.description,
                String(b.quantity),
                b.unitCost,
                b.totalCost,
              ]),
            }
          );
        }

        if (input.slaMetrics && input.slaMetrics.length > 0) {
          sections.push(
            {
              id: 'sec_sla_h',
              type: 'heading',
              level: 2,
              text: '4. Service Level Agreements (SLA) & Compliance Penalties',
            },
            {
              id: 'sec_sla_table',
              type: 'table',
              headers: ['Performance Metric', 'Required SLA Target', 'Failure Penalty / Credit'],
              rows: input.slaMetrics.map((s) => [s.metric, s.target, s.penalty]),
            }
          );
        }

        if (input.evaluationCriteria && input.evaluationCriteria.length > 0) {
          sections.push(
            {
              id: 'sec_eval_h',
              type: 'heading',
              level: 2,
              text: '5. Vendor Evaluation & Scoring Rubric',
            },
            {
              id: 'sec_eval_list',
              type: 'numbered-list',
              items: input.evaluationCriteria,
            }
          );
        }

        const model: WordDocModel = {
          id: `rfp_${Date.now().toString(36)}`,
          title: input.title,
          subtitle: input.subtitle,
          organization: input.organization,
          theme: input.theme,
          hasCoverPage: input.pageFit !== 'strict-1-page',
          pageSize: input.pageSize ?? 'letter',
          pageFit: input.pageFit ?? 'multi-page',
          sections,
        };

        // Generate binary and persist to Asset Vault
        const buffer = await generateDocxBuffer(model);
        const { createAsset } = await import('@/lib/artifacts/service');
        const assetName = `${input.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'rfp-package'}.docx`;

        const asset = await createAsset({
          projectId,
          name: assetName,
          type: 'document',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          body: buffer,
          metadata: {
            title: input.title,
            docType: 'document',
            sectionsCount: sections.length,
            model,
          },
        });

        // Run automated evaluation audit
        const audit = evaluateOfficeDocument(
          { type: 'document', model },
          ['Scope', 'Deliverables', 'Evaluation']
        );

        return {
          success: true,
          assetId: asset.id,
          assetName: asset.name,
          url: `/api/projects/${projectId}/assets/${asset.id}`,
          model,
          auditScore: audit.overallScore,
          auditPassed: audit.passed,
          refinements: audit.actionableRefinements,
        };
      },
    }),

    // ═════════════════════════════════════════════════════════════════════════
    // 2. FINANCIAL ANALYST SPECIALIST TOOL (MULTI-SHEET EXCEL WITH FORMULAS)
    // ═════════════════════════════════════════════════════════════════════════
    buildFinancialWorkbook: tool({
      description:
        'SPECIALIST TOOL (@financial-analyst): Builds an audit-ready multi-sheet Microsoft Excel (.xlsx) financial model with calculated dynamic formulas (SUM, AVERAGE, ratios), accounting underlines, and styled ribbons.',
      inputSchema: z.object({
        title: z.string().describe('Title of the financial model or workbook'),
        theme: z
          .enum(['corporate-navy', 'emerald-enterprise', 'slate-minimal', 'cyberpunk-dark', 'sunset-executive'])
          .default('corporate-navy'),
        sheets: z.array(
          z.object({
            name: z.string().describe('Sheet name (e.g. "P&L Forecast", "Unit Economics")'),
            columns: z.array(
              z.object({
                header: z.string(),
                key: z.string(),
                width: z.number().optional(),
                format: z.enum(['text', 'number', 'currency', 'percent', 'date']).default('text'),
                align: z.enum(['left', 'center', 'right']).optional(),
              })
            ),
            rows: z.array(
              z.object({
                isTotal: z.boolean().optional(),
                cells: z.record(
                  z.string(),
                  z.object({
                    value: z.union([z.string(), z.number()]),
                    formula: z.string().optional().describe('Formula without leading = (e.g. "SUM(B2:B5)")'),
                    format: z.enum(['text', 'number', 'currency', 'percent', 'date']).optional(),
                    bold: z.boolean().optional(),
                  })
                ),
              })
            ),
          })
        ),
      }),
      execute: async (input) => {
        const { projectId } = getToolContext();

        const model: SpreadsheetModel = {
          id: `sheet_${Date.now().toString(36)}`,
          title: input.title,
          theme: input.theme,
          sheets: input.sheets.map((s) => ({
            name: s.name,
            freezeHeader: true,
            columns: s.columns.map((c) => ({
              header: c.header,
              key: c.key,
              width: c.width,
              format: c.format as any,
              align: c.align,
            })),
            rows: s.rows.map((r) => ({
              isTotal: r.isTotal,
              cells: r.cells as any,
            })),
          })),
        };

        // Run automated mathematical formula audit
        const audit = evaluateOfficeDocument({ type: 'spreadsheet', model });

        // Generate binary and persist to Asset Vault
        const buffer = await generateXlsxBuffer(model);
        const { createAsset } = await import('@/lib/artifacts/service');
        const assetName = `${input.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'financial-model'}.xlsx`;

        const asset = await createAsset({
          projectId,
          name: assetName,
          type: 'document',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          body: buffer,
          metadata: {
            title: input.title,
            docType: 'spreadsheet',
            sheetCount: model.sheets.length,
            formulasAudited: audit.formulaAudit.totalFormulasTested,
            model,
          },
        });

        return {
          success: true,
          assetId: asset.id,
          assetName: asset.name,
          url: `/api/projects/${projectId}/assets/${asset.id}`,
          model,
          auditScore: audit.overallScore,
          auditPassed: audit.passed,
          formulaErrorsFound: audit.formulaAudit.errorsFound,
          refinements: audit.actionableRefinements,
        };
      },
    }),

    // ═════════════════════════════════════════════════════════════════════════
    // 3. INVOICE & UTILITY STATEMENT SPECIALIST TOOL
    // ═════════════════════════════════════════════════════════════════════════
    authorInvoiceStatement: tool({
      description:
        'SPECIALIST TOOL (@tax-invoice-specialist): Authors a structured municipal utility bill, tax invoice, or commercial account statement with validated math, aging matrix, and remittance advice.',
      inputSchema: z.object({
        title: z.string().describe('Statement title e.g. "Municipal Utility Account"'),
        organization: z.string().describe('Issuing utility or company name'),
        theme: z
          .enum(['corporate-navy', 'emerald-enterprise', 'slate-minimal', 'cyberpunk-dark', 'sunset-executive'])
          .default('corporate-navy'),
        pageSize: z.enum(['letter', 'a4']).default('a4'),
        pageFit: z.enum(['strict-1-page', 'multi-page']).default('strict-1-page'),
        invoiceMeta: z.object({
          taxInvoiceNumber: z.string(),
          accountNumber: z.string(),
          pinCode: z.string().optional(),
          dueDate: z.string(),
          clientAddress: z.string().describe('Billing address of recipient'),
          remittanceBank: z.string().optional(),
          remittanceAccount: z.string().optional(),
        }),
        lineItems: z.array(
          z.object({
            description: z.string(),
            category: z.string(),
            readingOrUsage: z.string().optional(),
            rate: z.string().optional(),
            amount: z.number().describe('Numeric currency amount'),
          })
        ),
        taxRatePercent: z.number().default(15),
      }),
      execute: async (input) => {
        const { projectId } = getToolContext();

        // 1. Calculate and verify ledger math
        const subtotal = input.lineItems.reduce((sum, item) => sum + item.amount, 0);
        const taxAmount = (subtotal * input.taxRatePercent) / 100;
        const totalDue = subtotal + taxAmount;

        const tableRows = input.lineItems.map((item) => [
          item.description,
          item.category,
          item.readingOrUsage || '-',
          item.rate || '-',
          `$${item.amount.toFixed(2)}`,
        ]);

        tableRows.push([
          `Value Added Tax (VAT @ ${input.taxRatePercent}%)`,
          'Statutory Tax',
          '-',
          `${input.taxRatePercent}%`,
          `$${taxAmount.toFixed(2)}`,
        ]);

        const model: WordDocModel = {
          id: `inv_${Date.now().toString(36)}`,
          title: input.title,
          organization: input.organization,
          theme: input.theme,
          archetype: 'invoice-statement',
          hasCoverPage: false,
          pageSize: input.pageSize,
          pageFit: input.pageFit,
          invoiceMeta: {
            ...input.invoiceMeta,
            agingBuckets: [
              { label: '90 Days+', amount: '$0.00' },
              { label: '60 Days', amount: '$0.00' },
              { label: '30 Days', amount: '$0.00' },
              { label: 'Current', amount: `$${totalDue.toFixed(2)}` },
              { label: 'Total Due', amount: `$${totalDue.toFixed(2)}` },
            ],
          },
          sections: [
            {
              id: 'sec_inv_table',
              type: 'table',
              headers: ['Service Description', 'Category', 'Usage / Interval', 'Rate', 'Total Amount'],
              rows: tableRows,
            },
          ],
        };

        const buffer = await generatePdfBuffer(model);
        const { createAsset } = await import('@/lib/artifacts/service');
        const assetName = `${input.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'invoice'}.pdf`;

        const asset = await createAsset({
          projectId,
          name: assetName,
          type: 'document',
          mimeType: 'application/pdf',
          body: buffer,
          metadata: {
            title: input.title,
            docType: 'document',
            archetype: 'invoice-statement',
            totalDue: `$${totalDue.toFixed(2)}`,
            subtotal: `$${subtotal.toFixed(2)}`,
            taxAmount: `$${taxAmount.toFixed(2)}`,
            model,
          },
        });

        const audit = evaluateOfficeDocument({ type: 'document', model }, ['Description', 'Account']);

        return {
          success: true,
          assetId: asset.id,
          assetName: asset.name,
          url: `/api/projects/${projectId}/assets/${asset.id}`,
          model,
          ledgerVerification: {
            subtotal: `$${subtotal.toFixed(2)}`,
            taxAmount: `$${taxAmount.toFixed(2)}`,
            totalDue: `$${totalDue.toFixed(2)}`,
            isMathBalanced: true,
            lineItemsCount: input.lineItems.length,
          },
          auditScore: audit.overallScore,
          auditPassed: audit.passed,
          refinements: audit.actionableRefinements,
        };
      },
    }),

    // ═════════════════════════════════════════════════════════════════════════
    // 4. EXECUTIVE AUTHOR SPECIALIST TOOL (PROPOSALS, RESUMES, WHITEPAPERS)
    // ═════════════════════════════════════════════════════════════════════════
    authorExecutiveProposal: tool({
      description:
        'SPECIALIST TOOL (@executive-author): Authors persuasive business proposals, whitepapers, modern resumes, or executive memos with cover page, callout containers, stat grids, and formatted tables.',
      inputSchema: z.object({
        title: z.string().describe('Primary title'),
        subtitle: z.string().optional(),
        author: z.string().optional(),
        organization: z.string().optional(),
        theme: z
          .enum(['corporate-navy', 'emerald-enterprise', 'slate-minimal', 'cyberpunk-dark', 'sunset-executive'])
          .default('corporate-navy'),
        pageSize: z.enum(['letter', 'a4']).optional().describe('Page format: Letter (US/NA standard) or A4 (International standard)'),
        pageFit: z.enum(['strict-1-page', 'multi-page']).optional().describe('Page budget: strict-1-page (0.5" compact margins for 1-pagers & resumes) or multi-page'),
        sections: z.array(
          z.discriminatedUnion('type', [
            z.object({
              id: z.string(),
              type: z.literal('heading'),
              level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
              text: z.string(),
            }),
            z.object({
              id: z.string(),
              type: z.literal('paragraph'),
              lead: z.boolean().optional(),
              text: z.string(),
            }),
            z.object({
              id: z.string(),
              type: z.literal('callout'),
              title: z.string().optional(),
              badge: z.string().optional(),
              text: z.string(),
            }),
            z.object({
              id: z.string(),
              type: z.literal('stat-grid'),
              stats: z.array(
                z.object({
                  label: z.string(),
                  value: z.string(),
                  description: z.string().optional(),
                })
              ),
            }),
            z.object({
              id: z.string(),
              type: z.literal('table'),
              headers: z.array(z.string()),
              rows: z.array(z.array(z.string())),
            }),
            z.object({
              id: z.string(),
              type: z.literal('bullet-list'),
              items: z.array(z.string()),
            }),
          ])
        ),
      }),
      execute: async (input) => {
        const { projectId } = getToolContext();

        const model: WordDocModel = {
          id: `doc_${Date.now().toString(36)}`,
          title: input.title,
          subtitle: input.subtitle,
          author: input.author,
          organization: input.organization,
          theme: input.theme,
          hasCoverPage: input.pageFit === 'strict-1-page' ? false : input.hasCoverPage,
          pageSize: input.pageSize ?? 'letter',
          pageFit: input.pageFit ?? 'multi-page',
          sections: input.sections as any,
        };

        const buffer = await generateDocxBuffer(model);
        const { createAsset } = await import('@/lib/artifacts/service');
        const assetName = `${input.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'proposal'}.docx`;

        const asset = await createAsset({
          projectId,
          name: assetName,
          type: 'document',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          body: buffer,
          metadata: {
            title: input.title,
            docType: 'document',
            sectionsCount: model.sections.length,
            model,
          },
        });

        const audit = evaluateOfficeDocument({ type: 'document', model });

        return {
          success: true,
          assetId: asset.id,
          assetName: asset.name,
          url: `/api/projects/${projectId}/assets/${asset.id}`,
          model,
          auditScore: audit.overallScore,
          auditPassed: audit.passed,
          refinements: audit.actionableRefinements,
        };
      },
    }),

    // ═════════════════════════════════════════════════════════════════════════
    // 4. DECK ARCHITECT SPECIALIST TOOL (16:9 PRESENTATION DECKS)
    // ═════════════════════════════════════════════════════════════════════════
    buildSlideDeck: tool({
      description:
        'SPECIALIST TOOL (@deck-architect): Compiles a high-impact, widescreen 16:9 PowerPoint (.pptx) presentation deck with card blocks, stat grids, and structured narrative slides.',
      inputSchema: z.object({
        title: z.string().describe('Deck title'),
        subtitle: z.string().optional(),
        author: z.string().optional(),
        theme: z
          .enum(['corporate-navy', 'emerald-enterprise', 'slate-minimal', 'cyberpunk-dark', 'sunset-executive'])
          .default('corporate-navy'),
        slides: z.array(
          z.object({
            id: z.string(),
            layout: z.enum(['title', 'stats', 'two-column', 'cards', 'timeline']),
            title: z.string(),
            subtitle: z.string().optional(),
            badge: z.string().optional(),
            stats: z
              .array(z.object({ label: z.string(), value: z.string(), note: z.string().optional() }))
              .optional(),
            cards: z
              .array(z.object({ title: z.string(), body: z.string(), tag: z.string().optional() }))
              .optional(),
            leftColumn: z
              .object({ title: z.string(), bullets: z.array(z.string()) })
              .optional(),
            rightColumn: z
              .object({ title: z.string(), bullets: z.array(z.string()) })
              .optional(),
            speakerNotes: z.string().optional(),
          })
        ),
      }),
      execute: async (input) => {
        const { projectId } = getToolContext();

        const model: PresentationModel = {
          id: `deck_${Date.now().toString(36)}`,
          title: input.title,
          subtitle: input.subtitle,
          author: input.author,
          theme: input.theme,
          aspectRatio: '16:9',
          slides: input.slides as any,
        };

        const buffer = await generatePptxBuffer(model);
        const { createAsset } = await import('@/lib/artifacts/service');
        const assetName = `${input.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'presentation'}.pptx`;

        const asset = await createAsset({
          projectId,
          name: assetName,
          type: 'document',
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          body: buffer,
          metadata: {
            title: input.title,
            docType: 'presentation',
            slideCount: model.slides.length,
            model,
          },
        });

        const audit = evaluateOfficeDocument({ type: 'presentation', model });

        return {
          success: true,
          assetId: asset.id,
          assetName: asset.name,
          url: `/api/projects/${projectId}/assets/${asset.id}`,
          model,
          auditScore: audit.overallScore,
          auditPassed: audit.passed,
          refinements: audit.actionableRefinements,
        };
      },
    }),

    // ═════════════════════════════════════════════════════════════════════════
    // 5. EVALUATION & AUDIT TOOL (@document-evaluator)
    // ═════════════════════════════════════════════════════════════════════════
    evaluateAndAuditDocument: tool({
      description:
        'EVALUATION TOOL (@document-evaluator): Runs an independent quality assurance pass on any document model, checking formula mathematical correctness, requirement completeness, and typography consistency.',
      inputSchema: z.object({
        docType: z.enum(['document', 'spreadsheet', 'presentation']),
        modelJson: z.string().describe('JSON serialized document AST model'),
        requiredCheckpoints: z
          .array(z.string())
          .optional()
          .describe('Required section headings, metrics, or slide topics to audit'),
      }),
      execute: async ({ docType, modelJson, requiredCheckpoints = [] }) => {
        try {
          const parsed = JSON.parse(modelJson);
          const doc: any = { type: docType, model: parsed };
          const report = evaluateOfficeDocument(doc, requiredCheckpoints);
          return {
            success: true,
            score: report.overallScore,
            passed: report.passed,
            formulaAudit: report.formulaAudit,
            completenessAudit: report.completenessAudit,
            actionableRefinements: report.actionableRefinements,
          };
        } catch (err: any) {
          return { success: false, error: err.message || 'Failed to parse model JSON' };
        }
      },
    }),

    // ═════════════════════════════════════════════════════════════════════════
    // 6. ARCHETYPE CATALOG TOOL
    // ═════════════════════════════════════════════════════════════════════════
    listOfficeArchetypes: tool({
      description:
        'Catalog tool returning available professional document archetypes, theme color palettes, and structural templates.',
      inputSchema: z.object({}),
      execute: async () => {
        return {
          themes: Object.values(OFFICE_THEMES),
          archetypes: [
            {
              id: 'rfp-procurement',
              format: 'document',
              name: 'Procurement Package (RFP / RFQ / SOW)',
              description: 'Legally structured procurement document with BOM, SLA thresholds, and vendor scoring.',
            },
            {
              id: 'financial-model',
              format: 'spreadsheet',
              name: 'Financial Projections & Budget Model',
              description: 'Multi-sheet workbook with validated formulas, accounting underlines, and totals.',
            },
            {
              id: 'executive-proposal',
              format: 'document',
              name: 'Executive Proposal / Whitepaper',
              description: 'Sleek C-suite proposal with cover page, stat boxes, and pricing matrix.',
            },
            {
              id: 'pitch-deck',
              format: 'presentation',
              name: 'Widescreen Investor / Pitch Deck',
              description: '16:9 widescreen presentation with stat callouts and comparison cards.',
            },
          ],
        };
      },
    }),
  };
}
