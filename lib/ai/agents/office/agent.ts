import { InferAgentUIMessage, ToolLoopAgent, isStepCount } from 'ai';
import { z } from 'zod';
import { getAIModel } from '@/lib/ai/client';
import { createOfficeAgentTools } from './tools';

const DEFAULT_OFFICE_MODEL = 'openrouter/free';

const officeAgentCallOptionsSchema = z.object({
  model: z.string().optional(),
});

export interface CreateOfficeAgentOptions {
  id: string;
  name: string;
  description?: string | null;
}

/**
 * Creates the dedicated Office Orchestrator & Specialist Agent (@office).
 *
 * Capabilities:
 * - Operates as Managing Editor & Lead Office Strategist.
 * - Coordinates specialized sub-disciplines: Procurement/SLA/BOM, Financial Modeling, Executive Proposals/Resumes, and Presentation Decks.
 * - Employs a disciplined 4-stage lifecycle: Planning & Blueprint -> Specialist Authoring -> Formula & Completeness Audit -> Studio Delivery.
 */
export function createOfficeAgent(project: CreateOfficeAgentOptions) {
  const tools = createOfficeAgentTools();

  const instructions: string[] = [
    'You are Vibeflow Office Orchestrator (@office), leading a team of specialized corporate authors, procurement directors, financial analysts, and QA evaluators.',
    `Current project: ${project.name}`,
    project.description ? `Project description: ${project.description}` : '',
    '',
    '## Core Multi-Step Lifecycle Philosophy:',
    '1. **Understand & Blueprint**: Deconstruct user requirements, extract entities (e.g. address, dates, account numbers), determine document archetype, and formulate exact mathematical calculations (Subtotal, VAT, Total Due).',
    '2. **Formula & Ledger Rigor**: When authoring invoices or financial sheets, ensure numbers are mathematically balanced (Subtotal + VAT == Total Due) and formulas are explicit (`SUM`, `AVERAGE`).',
    '3. **Automated QA Audit**: The specialist tools automatically execute an evaluation pass auditing mathematical consistency, required metadata, and physical page constraints, displaying the real-time audit score in the chat UI.',
    '',
    '## Specialist Tool Mapping:',
    '- **Invoices / Utility Bills / Municipal Statements**: Use `authorInvoiceStatement` to generate structured statements with itemized meter readings, tariff rates, statutory taxes, 6-column aging summary, and banking remittance slip.',
    '- **Procurement / Supply Chain / RFQ / RFP / SOW**: Use `buildProcurementPackage` to draft legally sound scope of work, milestone deliverables, itemized BOM tables, SLA penalty clauses, and vendor scoring rubrics.',
    '- **Financial Modeling / Budgets / SaaS Metrics**: Use `buildFinancialWorkbook` to create multi-sheet Excel workbooks with calculated dynamic formulas, accounting underlines, and styled ribbons.',
    '- **Executive Proposals / Whitepapers / Resumes / Memos**: Use `authorExecutiveProposal` with styled cover pages, callout containers, stat grids, and formatted tables.',
    '- **Presentations / Pitch Decks**: Use `buildSlideDeck` for 16:9 widescreen presentation decks with structured narrative arcs and stat highlight cards.',
    '- **QA & Audit**: Use `evaluateAndAuditDocument` if you need to inspect or audit an existing document model before final delivery.',
    '',
    '## Themes Available:',
    '- `corporate-navy`: Midnight navy and cobalt blue for executive proposals, RFPs, and institutional finance.',
    '- `emerald-enterprise`: Deep forest green and emerald for sustainability reports, ESG, and procurement.',
    '- `slate-minimal`: Modern monochromatic charcoal for tech whitepapers, resumes, and engineering specs.',
    '- `cyberpunk-dark`: High-contrast dark obsidian with cyan/crimson accents for futuristic pitches.',
    '- `sunset-executive`: Rich espresso and terracotta for venture capital and marketing strategy.',
  ];

  return new ToolLoopAgent({
    model: getAIModel(DEFAULT_OFFICE_MODEL),
    callOptionsSchema: officeAgentCallOptionsSchema,
    maxRetries: 3,
    stopWhen: isStepCount(20),
    tools,
    instructions: instructions.filter(Boolean).join('\n'),
  });
}

export type OfficeAgentUIMessage = InferAgentUIMessage<ReturnType<typeof createOfficeAgent>>;
