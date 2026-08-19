import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { eq, and, desc } from 'drizzle-orm';

import { db } from '@/lib/db';
import { conversations, chatMessages } from '@/lib/db/schema';
import { getAuthorizedProject } from '@/lib/projects/server';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id]/conversations — List conversations for a project
 */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await getAuthorizedProject(id);

    const convoList = await db
      .select()
      .from(conversations)
      .where(eq(conversations.projectId, id))
      .orderBy(desc(conversations.updatedAt));

    return NextResponse.json({ success: true, data: convoList });
  } catch (error: any) {
    console.error('[vibeflow] Conversations GET error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch conversations' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

const createConversationSchema = z.object({
  title: z.string().optional(),
  agentId: z.string().optional(),
});

/**
 * POST /api/projects/[id]/conversations — Create a new conversation
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await getAuthorizedProject(id);
    const body = await request.json();
    const validated = createConversationSchema.parse(body);

    const [convo] = await db
      .insert(conversations)
      .values({
        id: nanoid(),
        projectId: id,
        agentId: validated.agentId,
        title: validated.title || 'New Chat',
        status: 'active',
      })
      .returning();

    return NextResponse.json({ success: true, data: convo }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[vibeflow] Conversations POST error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create conversation' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
