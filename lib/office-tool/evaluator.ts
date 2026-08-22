import {
  OfficeDocumentModel,
  SpreadsheetModel,
  WordDocModel,
  PresentationModel,
  OfficeAuditReport,
} from './types';

/**
 * Autonomous Evaluation & Quality Assurance Engine for Office Documents
 * Audits mathematical formulas, completeness against domain requirements,
 * and structural consistency.
 */
export function evaluateOfficeDocument(
  doc: OfficeDocumentModel,
  requiredSectionsOrMetrics: string[] = []
): OfficeAuditReport {
  switch (doc.type) {
    case 'spreadsheet':
      return evaluateSpreadsheet(doc.model, requiredSectionsOrMetrics);
    case 'document':
      return evaluateWordDocument(doc.model, requiredSectionsOrMetrics);
    case 'presentation':
      return evaluatePresentation(doc.model, requiredSectionsOrMetrics);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPREADSHEET FORMULA & BALANCE AUDIT
// ═══════════════════════════════════════════════════════════════════════════════

function evaluateSpreadsheet(
  model: SpreadsheetModel,
  requiredMetrics: string[]
): OfficeAuditReport {
  let totalFormulasTested = 0;
  const formulaErrors: OfficeAuditReport['formulaAudit']['errorsFound'] = [];
  const completenessChecks: OfficeAuditReport['completenessAudit']['requirementsChecked'] = [];

  // 1. Audit Sheets & Formulas
  for (const sheet of model.sheets) {
    for (let rIdx = 0; rIdx < sheet.rows.length; rIdx++) {
      const row = sheet.rows[rIdx];
      for (const [colKey, cell] of Object.entries(row.cells)) {
        if (cell.formula) {
          totalFormulasTested++;
          const error = validateFormulaSyntax(cell.formula, sheet);
          if (error) {
            formulaErrors.push({
              sheet: sheet.name,
              cell: `${colKey}${rIdx + 2}`,
              formula: cell.formula,
              error,
            });
          }
        }
      }
    }
  }

  // 2. Completeness Checks against required metrics
  for (const metric of requiredMetrics) {
    let found = false;
    for (const sheet of model.sheets) {
      for (const col of sheet.columns) {
        if (col.header.toLowerCase().includes(metric.toLowerCase())) {
          found = true;
          break;
        }
      }
      if (found) break;
    }

    completenessChecks.push({
      requirement: `Metric / Column: ${metric}`,
      satisfied: found,
      details: found
        ? `Found column matching requirement "${metric}"`
        : `Missing required column/metric "${metric}"`,
    });
  }

  // 3. Score Calculation
  const formulaPenalty = formulaErrors.length * 20;
  const completenessScore =
    completenessChecks.length > 0
      ? (completenessChecks.filter((c) => c.satisfied).length / completenessChecks.length) * 100
      : 100;

  const typographyScore = model.sheets.length > 0 && model.sheets.every((s) => s.rows.length > 0) ? 95 : 60;
  const overallScore = Math.max(
    0,
    Math.min(100, Math.round(completenessScore * 0.5 + typographyScore * 0.5 - formulaPenalty))
  );

  const actionableRefinements: string[] = [];
  if (formulaErrors.length > 0) {
    actionableRefinements.push(`Fix ${formulaErrors.length} invalid formula syntax error(s).`);
  }
  for (const check of completenessChecks) {
    if (!check.satisfied) {
      actionableRefinements.push(`Add required column or metric: "${check.requirement}".`);
    }
  }

  return {
    overallScore,
    passed: overallScore >= 80 && formulaErrors.length === 0,
    formulaAudit: {
      totalFormulasTested,
      errorsFound: formulaErrors,
    },
    completenessAudit: {
      requirementsChecked: completenessChecks,
    },
    typographyAndLayoutScore: typographyScore,
    actionableRefinements,
  };
}

function validateFormulaSyntax(formula: string, sheet: any): string | null {
  const clean = formula.trim().replace(/^=/, '');

  // 1. Check balanced parentheses
  let depth = 0;
  for (const char of clean) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (depth < 0) return 'Mismatched closing parenthesis';
  }
  if (depth !== 0) return 'Unclosed opening parenthesis';

  // 2. Check known function names
  const funcMatch = clean.match(/^([A-Z]+)\(/i);
  if (funcMatch) {
    const fnName = funcMatch[1].toUpperCase();
    const knownFns = [
      'SUM',
      'AVERAGE',
      'COUNT',
      'MIN',
      'MAX',
      'IF',
      'VLOOKUP',
      'HLOOKUP',
      'INDEX',
      'MATCH',
      'XLOOKUP',
      'NPV',
      'IRR',
      'ROUND',
      'CONCAT',
    ];
    if (!knownFns.includes(fnName)) {
      return `Unknown or unsupported Excel function: ${fnName}`;
    }
  }

  // 3. Check for obvious divide-by-zero or empty terms
  if (clean.includes('/0') && !clean.includes('/0.')) {
    return 'Division by zero detected';
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORD DOCUMENT COMPLETENESS & STRUCTURE AUDIT
// ═══════════════════════════════════════════════════════════════════════════════

function evaluateWordDocument(
  model: WordDocModel,
  requiredSections: string[]
): OfficeAuditReport {
  const completenessChecks: OfficeAuditReport['completenessAudit']['requirementsChecked'] = [];

  const allHeadingTexts = model.sections
    .filter((s) => s.type === 'heading')
    .map((s: any) => s.text.toLowerCase());

  for (const req of requiredSections) {
    const satisfied = allHeadingTexts.some((h) => h.includes(req.toLowerCase()));
    completenessChecks.push({
      requirement: `Section: ${req}`,
      satisfied,
      details: satisfied
        ? `Found section heading matching "${req}"`
        : `Missing required section heading matching "${req}"`,
    });
  }

  // Word Count
  let totalWordCount = 0;
  for (const s of model.sections) {
    if (s.type === 'paragraph' || s.type === 'callout') {
      totalWordCount += (s.text || '').split(/\s+/).filter(Boolean).length;
    }
  }

  const hasTables = model.sections.some((s) => s.type === 'table');
  const hasCallouts = model.sections.some((s) => s.type === 'callout');

  let layoutScore = 80;
  if (model.hasCoverPage) layoutScore += 10;
  if (hasTables) layoutScore += 5;
  if (hasCallouts) layoutScore += 5;
  layoutScore = Math.min(100, layoutScore);

  const completenessScore =
    completenessChecks.length > 0
      ? (completenessChecks.filter((c) => c.satisfied).length / completenessChecks.length) * 100
      : 100;

  const overallScore = Math.round(completenessScore * 0.6 + layoutScore * 0.4);

  const actionableRefinements: string[] = [];
  for (const check of completenessChecks) {
    if (!check.satisfied) {
      actionableRefinements.push(`Draft missing section: "${check.requirement}".`);
    }
  }
  if (totalWordCount < 100) {
    actionableRefinements.push('Document content is brief; expand details in body paragraphs.');
  }

  return {
    overallScore,
    passed: overallScore >= 80,
    formulaAudit: { totalFormulasTested: 0, errorsFound: [] },
    completenessAudit: { requirementsChecked: completenessChecks },
    typographyAndLayoutScore: layoutScore,
    actionableRefinements,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESENTATION SLIDE DECK QA AUDIT
// ═══════════════════════════════════════════════════════════════════════════════

function evaluatePresentation(
  model: PresentationModel,
  requiredTopics: string[]
): OfficeAuditReport {
  const completenessChecks: OfficeAuditReport['completenessAudit']['requirementsChecked'] = [];

  const slideTitles = model.slides.map((s) => s.title.toLowerCase());

  for (const topic of requiredTopics) {
    const satisfied = slideTitles.some((t) => t.includes(topic.toLowerCase()));
    completenessChecks.push({
      requirement: `Slide Topic: ${topic}`,
      satisfied,
      details: satisfied
        ? `Found slide matching topic "${topic}"`
        : `Missing slide covering topic "${topic}"`,
    });
  }

  const hasTitleSlide = model.slides.length > 0 && model.slides[0].layout === 'title';
  const hasStatsSlide = model.slides.some((s) => s.layout === 'stats');

  let layoutScore = 75;
  if (hasTitleSlide) layoutScore += 15;
  if (hasStatsSlide) layoutScore += 10;
  layoutScore = Math.min(100, layoutScore);

  const completenessScore =
    completenessChecks.length > 0
      ? (completenessChecks.filter((c) => c.satisfied).length / completenessChecks.length) * 100
      : 100;

  const overallScore = Math.round(completenessScore * 0.6 + layoutScore * 0.4);

  const actionableRefinements: string[] = [];
  if (!hasTitleSlide) {
    actionableRefinements.push('Add an introductory Title slide with presentation metadata.');
  }
  for (const check of completenessChecks) {
    if (!check.satisfied) {
      actionableRefinements.push(`Add a slide covering topic: "${check.requirement}".`);
    }
  }

  return {
    overallScore,
    passed: overallScore >= 75,
    formulaAudit: { totalFormulasTested: 0, errorsFound: [] },
    completenessAudit: { requirementsChecked: completenessChecks },
    typographyAndLayoutScore: layoutScore,
    actionableRefinements,
  };
}
