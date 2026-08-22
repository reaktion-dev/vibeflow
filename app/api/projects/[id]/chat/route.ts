import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  toUIMessageStream,
  type UIMessage,
} from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { eq, and, desc } from 'drizzle-orm';

import { getCodingAgent } from '@/lib/ai/harness/opencode-agent';
import { resumeOrCreateSession, detachAndPersist } from '@/lib/ai/harness/session-store';
import { syncSandboxToDb } from '@/lib/ai/harness/sandbox-sync';
import { getHarnessErrorMessage } from '@ai-sdk/harness/agent';
import { createProjectAgent } from '@/lib/ai/agents/project-agent';
import { createContentAgent } from '@/lib/ai/agents/content-agent';
import { createDesignAgent } from '@/lib/ai/agents/design';
import { getAuthorizedProject } from '@/lib/projects/server';
import { runWithToolContext } from '@/lib/ai/harness/tools/context';
import { db } from '@/lib/db';
import { conversations, chatMessages } from '@/lib/db/schema';
import { getProjectBudget, BudgetExceededError } from '@/lib/budget/service';
import { extractLatestUserPrompt } from '@/lib/ai/chat-transport';

// Allow sufficient time for sandbox boot + OpenCode bootstrap + agent turn
export const maxDuration = 120;

/**
 * Format a streaming error for the client.
 *
 * Surfaces provider errors (502, 429, etc.) so users understand what went
 * wrong instead of seeing a generic "An error occurred" message. Safe to
 * send — these are provider-level messages, not internal stack traces.
 */
function formatStreamError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (
      msg.includes('FreeUsageLimitError') ||
      msg.includes('Rate limit exceeded') ||
      (error as any).statusCode === 429 ||
      (error as any).lastError?.statusCode === 429
    ) {
      return 'The free tier usage rate limit was reached for this OpenCode model. Please select "Nemotron 3 Ultra" or "Free Models Router" in the model picker to continue without limits.';
    }

    if (
      msg.includes('AI Gateway requires a valid credit card') ||
      msg.includes('customer_verification_required') ||
      (error as any).statusCode === 403
    ) {
      return 'Vercel AI Gateway requires a verified credit card on file. Please select "Free Models Router" or any OpenRouter free model in the model picker to continue for free.';
    }

    // AI SDK wraps provider errors with a `cause` that has the status code
    const cause = (error as Error & { cause?: { code?: number; message?: string } }).cause;
    const code = cause?.code ?? (error as Error & { code?: number }).code;
    const detail = cause?.message ?? error.message;

    if (code === 502 || code === 503) {
      return `The AI provider is temporarily unavailable (${detail}). Please try again — the request will auto-retry.`;
    }
    if (code === 429) {
      return `Rate limit reached (${detail}). Please select "Nemotron 3 Ultra" or "Free Models Router" in the model selector.`;
    }
    return detail;
  }
  return typeof error === 'string' ? error : 'An unexpected error occurred.';
}

interface Params {
  params: Promise<{ id: string }>;
}

const requestSchema = z.object({
  messages: z.array(z.custom<UIMessage>()).default([]),
  model: z.string().optional(),
  currentFile: z.string().optional(),
  conversationId: z.string().optional(),
});

/**
 * Ensure a conversation exists for this project, optionally reusing an existing one.
 */
async function ensureConversation(projectId: string, conversationId?: string) {
  if (conversationId) {
    const [existing] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.projectId, projectId),
          eq(conversations.status, 'active')
        )
      );
    if (existing) return existing;
  }

  // Get the most recent active conversation, or create a new one
  const [recent] = await db
    .select()
    .from(conversations)
    .where(
      and(eq(conversations.projectId, projectId), eq(conversations.status, 'active'))
    )
    .orderBy(desc(conversations.updatedAt))
    .limit(1);

  if (recent) return recent;

  const [created] = await db
    .insert(conversations)
    .values({
      id: nanoid(),
      projectId,
      title: 'Chat',
      status: 'active',
    })
    .returning();

  return created;
}

/**
 * Persist a user message to the database.
 */
async function persistUserMessage(
  conversationId: string,
  content: string
) {
  await db.insert(chatMessages).values({
    id: nanoid(),
    conversationId,
    role: 'user',
    content,
  });
}

/**
 * Persist an assistant message to the database.
 */
async function persistAssistantMessage(
  conversationId: string,
  content: string,
  model?: string
) {
  await db.insert(chatMessages).values({
    id: nanoid(),
    conversationId,
    role: 'assistant',
    content,
    model,
  });

  // Touch conversation updatedAt
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));
}

/**
 * GET /api/projects/[id]/chat
 * Load prior messages for a conversation.
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await getAuthorizedProject(id);

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, conversationId))
        .orderBy(chatMessages.createdAt);

      return NextResponse.json({ success: true, data: messages });
    }

    // Return the latest conversation's messages
    const [convo] = await db
      .select()
      .from(conversations)
      .where(
        and(eq(conversations.projectId, id), eq(conversations.status, 'active'))
      )
      .orderBy(desc(conversations.updatedAt))
      .limit(1);

    if (!convo) {
      return NextResponse.json({ success: true, data: [] });
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, convo.id))
      .orderBy(chatMessages.createdAt);

    return NextResponse.json({
      success: true,
      data: messages,
      conversationId: convo.id,
    });
  } catch (error) {
    console.error('[vibeflow] Chat GET error:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}

/**
 * POST /api/projects/[id]/chat
 *
 * Routes to the correct agent based on project type:
 *
 * - `code` → **HarnessAgent** (OpenCode + Firecracker sandbox)
 *   Uses `prompt` (latest user text only) — the harness maintains its own
 *   conversation context and workspace inside the sandbox. Session is
 *   detached (parked warm) after each turn for fast resume.
 *   Falls back to ToolLoopAgent if the sandbox fails to start.
 *
 * - `design`/`video`/`flow` → **ToolLoopAgent** (host-side, no sandbox)
 *   Uses `messages` (full history) — standard stateless chat pattern.
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: projectId } = await params;
    const body = requestSchema.parse(await request.json());
    const project = await getAuthorizedProject(projectId);

    // Ensure conversation exists
    const convo = await ensureConversation(projectId, body.conversationId);

    // Extract and persist the latest user message
    const latestPrompt = extractLatestUserPrompt(body.messages);
    if (latestPrompt) {
      await persistUserMessage(convo.id, latestPrompt);
    }

    // Convert UI messages to model messages (used by ToolLoopAgent and content agent)
    const modelMessages = await convertToModelMessages(body.messages);

    // Route to the correct agent based on project type
    const isCodeProject = project.type === 'code';

    // Wrap in runWithToolContext so host-executed workspace tools
    // (listAssets, getAssetUrl, bundleStaticPreview, checkBudget)
    // have access to projectId/userId/projectType.
    return runWithToolContext(
      { projectId, userId: project.userId, projectType: project.type },
      () =>
        createUIMessageStreamResponse({
          stream: createUIMessageStream({
            execute: async ({ writer }) => {
              if (isCodeProject) {
                // ── Code projects: HarnessAgent (OpenCode + sandbox) ──
                // Try HarnessAgent first; fall back to ToolLoopAgent on failure.
                try {
                  const agent = getCodingAgent(body.model);
                  const session = await resumeOrCreateSession({
                    agent,
                    projectId,
                  });

                  try {
                    // HarnessAgent uses `prompt` (latest user text), NOT `messages`.
                    // The harness maintains native conversation context inside the sandbox.
                    const result = await agent.stream({
                      session,
                      prompt: latestPrompt,
                    });

                    writer.merge(
                      toUIMessageStream({
                        stream: result.stream,
                        onError: getHarnessErrorMessage,
                        onFinish: async () => {
                          // Sync files from sandbox → DB so Live Preview and Code Editor update
                          await syncSandboxToDb({ session, projectId });
                          // Park sandbox warm for fast resume on the next turn
                          await detachAndPersist({ projectId, session });
                        },
                      })
                    );
                  } catch (turnError) {
                    // Turn failed — park the session (don't destroy, preserve sandbox for retry)
                    try {
                      await detachAndPersist({ projectId, session });
                    } catch {
                      // Best-effort detach
                    }
                    throw turnError;
                  }
                } catch (harnessError) {
                  // HarnessAgent failed (sandbox boot, auth, etc.) — fall back to ToolLoopAgent
                  console.warn(
                    '[vibeflow] HarnessAgent failed, falling back to ToolLoopAgent:',
                    harnessError instanceof Error ? harnessError.message : harnessError
                  );

                  const fallbackAgent = createProjectAgent({
                    id: project.id,
                    name: project.name,
                    description: project.description,
                  });

                  try {
                    const result = await fallbackAgent.stream({
                      messages: modelMessages,
                      options: { model: body.model, currentFile: body.currentFile },
                    });

                    writer.merge(
                      toUIMessageStream({
                        stream: result.stream,
                        onError: (error) => {
                          console.error('[vibeflow] Fallback agent stream error:', error);
                          return formatStreamError(error);
                        },
                      })
                    );
                  } catch (fallbackInitError) {
                    console.warn(
                      '[vibeflow] Fallback agent stream init failed, failing over to OpenRouter free model:',
                      fallbackInitError
                    );

                    const retryResult = await fallbackAgent.stream({
                      messages: modelMessages,
                      options: {
                        model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
                        currentFile: body.currentFile,
                      },
                    });

                    writer.merge(
                      toUIMessageStream({
                        stream: retryResult.stream,
                        onError: (error) => {
                          console.error('[vibeflow] Fallback retry stream error:', error);
                          return formatStreamError(error);
                        },
                      })
                    );
                  }
                }
              } else if (project.type === 'design') {
                // ── Design projects: Dedicated Design Agent (Template Engine + Art Director) ──
                const agent = createDesignAgent({
                  id: project.id,
                  name: project.name,
                  description: project.description,
                });

                const result = await agent.stream({
                  messages: modelMessages,
                  options: { model: body.model },
                });

                writer.merge(
                  toUIMessageStream({
                    stream: result.stream,
                    onError: (error) => {
                      console.error('[vibeflow] Design agent stream error:', error);
                      return formatStreamError(error);
                    },
                  })
                );
              } else {
                // ── Other content projects (video/flow): ToolLoopAgent (host-side) ──
                const agent = createContentAgent({
                  id: project.id,
                  name: project.name,
                  type: project.type as 'video' | 'flow',
                  description: project.description,
                });

                const result = await agent.stream({
                  messages: modelMessages,
                  options: { model: body.model },
                });

                writer.merge(
                  toUIMessageStream({
                    stream: result.stream,
                    onError: (error) => {
                      console.error('[vibeflow] Content agent stream error:', error);
                      return formatStreamError(error);
                    },
                  })
                );
              }
            },
            onError: (error) => {
              console.error('[vibeflow] Chat stream error:', error);
              return formatStreamError(error);
            },
          }),
          headers: {
            'X-Conversation-Id': convo.id,
            'X-Project-Id': projectId,
          },
        })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('[vibeflow] Chat POST error:', error);

    if (error instanceof BudgetExceededError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'BUDGET_EXCEEDED',
        },
        { status: 402 }
      );
    }

    const message =
      error instanceof Error ? error.message : 'Failed to process chat request';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
