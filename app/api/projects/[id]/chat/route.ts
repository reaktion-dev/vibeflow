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

import { codingAgent } from '@/lib/ai/harness/opencode-agent';
import { resumeOrCreateSession, detachAndPersist } from '@/lib/ai/harness/session-store';
import { getHarnessErrorMessage } from '@ai-sdk/harness/agent';
import { createContentAgent } from '@/lib/ai/agents/content-agent';
import { getAuthorizedProject } from '@/lib/projects/server';
import { runWithToolContext } from '@/lib/ai/harness/tools/context';
import { db } from '@/lib/db';
import { conversations, chatMessages } from '@/lib/db/schema';
import { getProjectBudget, BudgetExceededError } from '@/lib/budget/service';

export const maxDuration = 30;

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
 * - `code` → HarnessAgent (OpenCode + Firecracker sandbox, session resume/detach)
 * - `design`/`video`/`flow` → ToolLoopAgent (host-side, no sandbox)
 *
 * Both agent types stream UIMessage parts via toUIMessageStream and support
 * toolApproval for paid tools. The content agent uses AsyncLocalStorage
 * (runWithToolContext) for projectId/userId/projectType propagation.
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: projectId } = await params;
    const body = requestSchema.parse(await request.json());
    const project = await getAuthorizedProject(projectId);

    // Ensure conversation exists
    const convo = await ensureConversation(projectId, body.conversationId);

    // Persist the latest user message
    const lastUserMsg = body.messages.filter((m) => m.role === 'user').pop();
    if (lastUserMsg) {
      const textParts = (lastUserMsg.parts ?? []).filter(
        (p): p is { type: 'text'; text: string } => p.type === 'text'
      );
      const content = textParts.map((p) => p.text).join('\n');
      if (content.trim()) {
        await persistUserMessage(convo.id, content);
      }
    }

    // Convert UI messages to model messages
    const messages = await convertToModelMessages(body.messages);

    // Route to the correct agent based on project type
    const isCodeProject = project.type === 'code';

    // Wrap in runWithToolContext so host-executed workspace tools
    // (listAssets, getAssetUrl, generateImage, traceImage, checkBudget)
    // have access to projectId/userId/projectType without being agent parameters.
    return runWithToolContext(
      { projectId, userId: project.userId, projectType: project.type },
      () =>
        createUIMessageStreamResponse({
          stream: createUIMessageStream({
            execute: async ({ writer }) => {
              if (isCodeProject) {
                // ── Code projects: HarnessAgent (sandbox + session resume) ──
                const session = await resumeOrCreateSession({
                  agent: codingAgent,
                  projectId,
                });

                try {
                  const result = await codingAgent.stream({ session, messages });

                  writer.merge(
                    toUIMessageStream({
                      stream: result.stream,
                      onError: getHarnessErrorMessage,
                      onEnd: async () => {
                        await detachAndPersist({ projectId, session });
                      },
                    })
                  );
                } catch (error) {
                  await session.destroy();
                  throw error;
                }
              } else {
                // ── Content projects: ToolLoopAgent (host-side, no sandbox) ──
                const agent = createContentAgent({
                  id: project.id,
                  name: project.name,
                  type: project.type as 'design' | 'video' | 'flow',
                  description: project.description,
                });

                const result = await agent.stream({
                  messages,
                  options: { model: body.model },
                });

                writer.merge(
                  toUIMessageStream({
                    stream: result.stream,
                    onError: (error) => {
                      console.error('[vibeflow] Content agent stream error:', error);
                      return 'An error occurred during generation.';
                    },
                  })
                );
              }
            },
            onError: isCodeProject
              ? getHarnessErrorMessage
              : (error) => {
                  console.error('[vibeflow] Chat stream error:', error);
                  return 'An error occurred during the chat request.';
                },
          }),
          init: {
            headers: {
              'X-Conversation-Id': convo.id,
              'X-Project-Id': projectId,
            },
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
