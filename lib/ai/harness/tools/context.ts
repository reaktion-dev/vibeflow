import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request context for harness custom tools.
 *
 * Custom tools registered on HarnessAgent.tools run on the host (Next.js),
 * not in the sandbox. They need access to the current project ID and budget
 * without taking them as tool parameters (the agent shouldn't control these).
 *
 * AsyncLocalStorage propagates the context across async boundaries within
 * a single request.
 */

export interface ToolContext {
  projectId: string;
  userId: string;
}

const toolContextStorage = new AsyncLocalStorage<ToolContext>();

/**
 * Run a function with a tool context set.
 * Used by the chat API route to inject projectId/userId before streaming.
 */
export function runWithToolContext<T>(
  context: ToolContext,
  fn: () => T
): T {
  return toolContextStorage.run(context, fn);
}

/**
 * Get the current tool context. Throws if called outside a context.
 */
export function getToolContext(): ToolContext {
  const ctx = toolContextStorage.getStore();
  if (!ctx) {
    throw new Error(
      'Tool context not set. Custom tools must be called within runWithToolContext().'
    );
  }
  return ctx;
}

/**
 * Get the current tool context, or null if outside a context.
 */
export function getToolContextOrNull(): ToolContext | null {
  return toolContextStorage.getStore();
}
