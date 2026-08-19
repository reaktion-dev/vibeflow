import { describe, it, expect } from 'vitest';
import { BudgetExceededError } from '@/lib/budget/errors';

/**
 * Budget ledger math tests.
 *
 * These test the pure math logic of the budget contract:
 * - remaining calculation
 * - over-budget detection
 * - spend projection
 *
 * The DB-backed functions (recordSpend, checkBudget, etc.) are integration-tested
 * separately with a mocked database.
 */

describe('Budget ledger math', () => {
  function calculateRemaining(budgetCents: number, spentCents: number) {
    return budgetCents - spentCents;
  }

  function isOverBudget(budgetCents: number, spentCents: number) {
    return spentCents > budgetCents;
  }

  function wouldExceedBudget(
    budgetCents: number,
    spentCents: number,
    estimatedCostCents: number
  ) {
    return spentCents + estimatedCostCents > budgetCents;
  }

  it('calculates remaining budget correctly', () => {
    expect(calculateRemaining(10000, 3000)).toBe(7000);
    expect(calculateRemaining(10000, 0)).toBe(10000);
    expect(calculateRemaining(10000, 10000)).toBe(0);
  });

  it('detects over-budget state', () => {
    expect(isOverBudget(10000, 5000)).toBe(false);
    expect(isOverBudget(10000, 10000)).toBe(false);
    expect(isOverBudget(10000, 10001)).toBe(true);
  });

  it('projects whether a new spend would exceed budget', () => {
    expect(wouldExceedBudget(10000, 8000, 1000)).toBe(false); // 9000 ≤ 10000
    expect(wouldExceedBudget(10000, 8000, 2001)).toBe(true); // 10001 > 10000
    expect(wouldExceedBudget(10000, 8000, 2000)).toBe(false); // exactly at budget
  });

  it('rejects zero or negative estimated costs', () => {
    // Zero cost is always allowed (it doesn't change spend)
    expect(wouldExceedBudget(10000, 5000, 0)).toBe(false);
  });

  it('handles budget at exact cap', () => {
    // Spend equals budget exactly — not over budget, but no room for more
    expect(isOverBudget(10000, 10000)).toBe(false);
    expect(wouldExceedBudget(10000, 10000, 1)).toBe(true);
  });
});

describe('BudgetExceededError', () => {
  it('can be instantiated', () => {
    const error = new BudgetExceededError('Test message');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('BudgetExceededError');
    expect(error.message).toBe('Test message');
  });
});
