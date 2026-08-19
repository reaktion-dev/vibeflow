import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { eq, and, desc } from 'drizzle-orm';

import { db } from '@/lib/db';
import { chatMessages, conversations } from '@/lib/db/schema';
import { getAuthorizedProject } from '@/lib/projects/server';

interface Params {
  params: Promise<{ id: string; conversationId: string }>;
}

/**
 * GET /api/projects/[id]/conversations/[conversationId]/messages — List messages
 */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id, conversationId } = await params;
    await getAuthorizedProject(id);

    // Verify conversation belongs to this project
    const [convo] = await db
      .select()
      .from(conversations)
      .where(
        and(eq(conversations.id, conversationId), eq(conversations.projectId, id))
      );

    if (!convo) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt);

    return NextResponse.json({ success: true, data: messages });
  } catch (error: any) {
    console.error('[vibeflow] Messages GET error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch messages' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

const addMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.string().min(1),
  model: z.string().optional(),
  toolCalls: z.string().optional(),
  parentMessageId: z.string().optional(),
  tokenUsage: z.number().optional(),
  costMicros: z.number().optional(),
});

/**
 * POST /api/projects/[id]/conversations/[conversationId]/messages — Add a message
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id, conversationId } = await params;
    await getAuthorizedProject(id);

    // Verify conversation belongs to this project
    const [convo] = await db
      .select()
      .from(conversations)
      .where(
        and(eq(conversations.id, conversationId), eq(conversations.projectId, id))
      );

    if (!convo) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = addMessageSchema.parse(body);

    const [message] = await db
      .insert(chatMessages)
      .values({
        id: nanoid(),
        conversationId,
        parentMessageId: validated.parentMessageId,
        role: validated.role,
        content: validated.content,
        model: validated.model,
        toolCalls: validated.toolCalls,
        tokenUsage: validated.tokenUsage,
        costMicros: validated.costMicros,
      })
      .returning();

    // Update conversation's updatedAt
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[vibeflow] Messages POST error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add message' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
