import type {
  HarnessAgentResumeSessionState,
  HarnessAgentSession,
} from '@ai-sdk/harness/agent';
import { db } from '@/lib/db';
import { conversations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * In-memory session state store for development.
 * In production, this should persist to the database (conversations.resumeState column).
 */
const sessionStates = new Map<string, HarnessAgentResumeSessionState>();

type SessionFactory = {
  createSession(options?: {
    sessionId?: string;
    resumeFrom?: HarnessAgentResumeSessionState;
  }): Promise<HarnessAgentSession>;
};

/**
 * Resume or create a harness session for a project.
 * 
 * The sessionId is set to the projectId, giving the sandbox a stable identity.
 * When detached, the sandbox stays warm and can reattach cheaply on the next request.
 * 
 * @param agent - The HarnessAgent factory (codingAgent)
 * @param projectId - The project ID (used as sessionId)
 */
export async function resumeOrCreateSession({
  agent,
  projectId,
}: {
  agent: SessionFactory;
  projectId: string;
}) {
  // Try to load resume state from memory
  const resumeFrom = sessionStates.get(projectId);

  // TODO: In production, load from database:
  // const [convo] = await db
  //   .select()
  //   .from(conversations)
  //   .where(
  //     and(
  //       eq(conversations.projectId, projectId),
  //       eq(conversations.status, 'active')
  //     )
  //   )
  //   .limit(1);
  // const resumeFrom = convo?.resumeState as HarnessAgentResumeSessionState | undefined;

  return agent.createSession(
    resumeFrom
      ? { sessionId: projectId, resumeFrom }
      : { sessionId: projectId }
  );
}

/**
 * Detach and persist the harness session state.
 * 
 * `detach()` parks the sandbox warm without destroying it.
 * The resume state includes the native conversation history and any unfinished turn state.
 * 
 * @param projectId - The project ID
 * @param session - The active HarnessAgentSession
 */
export async function detachAndPersist({
  projectId,
  session,
}: {
  projectId: string;
  session: HarnessAgentSession;
}) {
  const state = await session.detach();
  
  // Store in memory for now
  sessionStates.set(projectId, state);

  // TODO: In production, persist to database:
  // await db
  //   .update(conversations)
  //   .set({ 
  //     resumeState: state as any,
  //     updatedAt: new Date(),
  //   })
  //   .where(
  //     and(
  //       eq(conversations.projectId, projectId),
  //       eq(conversations.status, 'active')
  //     )
  //   );
}

/**
 * Destroy a session completely (for cleanup, errors, or project deletion).
 * 
 * Unlike `detach()`, this stops the sandbox and discards resumability.
 */
export async function destroySession({
  projectId,
  session,
}: {
  projectId: string;
  session: HarnessAgentSession;
}) {
  await session.destroy();
  sessionStates.delete(projectId);

  // TODO: In production, clear resume state from database:
  // await db
  //   .update(conversations)
  //   .set({ resumeState: null })
  //   .where(
  //     and(
  //       eq(conversations.projectId, projectId),
  //       eq(conversations.status, 'active')
  //     )
  //   );
}

/**
 * Clear all in-memory session states (useful for testing).
 */
export function clearAllSessions() {
  sessionStates.clear();
}
