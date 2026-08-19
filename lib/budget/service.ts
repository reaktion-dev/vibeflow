import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { projectBudgetTable } from '@/lib/db/schema';
import { getAuthorizedProject } from '@/lib/projects/server';
import { getEnv } from '@/lib/env';
import { BudgetExceededError } from '@/lib/budget/errors';

export { BudgetExceededError } from '@/lib/budget/errors';

/**
 * Budget service — per-project spend ledger with atomic increments.
 *
 * The user sets the budget at project creation (budgetCents).
 * Generation endpoints reject when `spentCents + estimatedCost > budgetCents`
 * unless an approved override exists. Enforcement is server-side — the agent
 * cannot bypass it.
 *
 * An env-level ceiling (BUDGET_CEILING_CENTS, default $1000) caps the
 * per-project budget at creation.
 */

export interface BudgetState {
  projectId: string;
  budgetCents: number;
  spentCents: number;
  overBudget: boolean;
  remainingCents: number;
}

/**
 * Initialize the budget for a project at creation time.
 */
export async function initProjectBudget(
  projectId: string,
  budgetCents: number
): Promise<void> {
  await getAuthorizedProject(projectId);

  const env = getEnv();
  const ceiling = env.BUDGET_CEILING_CENTS;
  const clampedBudget = Math.min(budgetCents, ceiling);

  await db.insert(projectBudgetTable).values({
    id: `bud_${projectId}`,
    projectId,
    budgetCents: clampedBudget,
    spentCents: 0,
    overBudget: false,
  });
}

/**
 * Get the current budget state for a project.
 */
export async function getProjectBudget(projectId: string): Promise<BudgetState> {
  const [budget] = await db
    .select()
    .from(projectBudgetTable)
    .where(eq(projectBudgetTable.projectId, projectId));

  if (!budget) {
    throw new Error(`Budget not found for project: ${projectId}`);
  }

  return {
    projectId,
    budgetCents: budget.budgetCents,
    spentCents: budget.spentCents,
    overBudget: budget.overBudget,
    remainingCents: budget.budgetCents - budget.spentCents,
  };
}

/**
 * Check if an estimated cost fits within the remaining budget.
 *
 * Returns `allowed: false` when `spentCents + estimatedCostCents > budgetCents`.
 */
export async function checkBudget(
  projectId: string,
  estimatedCostCents: number
): Promise<{ allowed: boolean; remainingCents: number; budgetCents: number }> {
  const budget = await getProjectBudget(projectId);
  const projected = budget.spentCents + estimatedCostCents;
  const allowed = projected <= budget.budgetCents;

  return {
    allowed,
    remainingCents: budget.remainingCents,
    budgetCents: budget.budgetCents,
  };
}

/**
 * Record spend atomically. Increments spentCents and sets overBudget flag.
 *
 * Throws if the spend would exceed the budget and no override is provided.
 */
export async function recordSpend(
  projectId: string,
  costCents: number,
  options?: { override?: boolean }
): Promise<BudgetState> {
  const budget = await getProjectBudget(projectId);
  const projected = budget.spentCents + costCents;
  const exceedsBudget = projected > budget.budgetCents;

  if (exceedsBudget && !options?.override) {
    throw new BudgetExceededError(
      `Spend of ${costCents} cents would exceed project budget. ` +
        `Spent: ${budget.spentCents}, Budget: ${budget.budgetCents}, ` +
        `Remaining: ${budget.remainingCents}.`
    );
  }

  // Atomic increment + set overBudget flag
  await db
    .update(projectBudgetTable)
    .set({
      spentCents: sql`${projectBudgetTable.spentCents} + ${costCents}`,
      overBudget: sql`(${projectBudgetTable.spentCents} + ${costCents}) > ${projectBudgetTable.budgetCents}`,
      updatedAt: new Date(),
    })
    .where(eq(projectBudgetTable.projectId, projectId));

  return getProjectBudget(projectId);
}

/**
 * Refund spend (e.g., on generation failure).
 */
export async function refundSpend(
  projectId: string,
  costCents: number
): Promise<BudgetState> {
  await db
    .update(projectBudgetTable)
    .set({
      spentCents: sql`GREATEST(${projectBudgetTable.spentCents} - ${costCents}, 0)`,
      overBudget: sql`(GREATEST(${projectBudgetTable.spentCents} - ${costCents}, 0)) > ${projectBudgetTable.budgetCents}`,
      updatedAt: new Date(),
    })
    .where(eq(projectBudgetTable.projectId, projectId));

  return getProjectBudget(projectId);
}

/**
 * Update the budget cap for a project.
 */
export async function updateProjectBudget(
  projectId: string,
  newBudgetCents: number
): Promise<BudgetState> {
  await getAuthorizedProject(projectId);

  const env = getEnv();
  const ceiling = env.BUDGET_CEILING_CENTS;
  const clampedBudget = Math.min(newBudgetCents, ceiling);

  await db
    .update(projectBudgetTable)
    .set({
      budgetCents: clampedBudget,
      overBudget: sql`${projectBudgetTable.spentCents} > ${clampedBudget}`,
      updatedAt: new Date(),
    })
    .where(eq(projectBudgetTable.projectId, projectId));

  return getProjectBudget(projectId);
}
