/**
 * Budget error types — extracted to a separate module so they can be imported
 * by tests and frontend code without pulling in the database connection pool.
 */

export class BudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BudgetExceededError';
  }
}
