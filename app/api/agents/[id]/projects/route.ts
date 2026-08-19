import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { agents, agentProjects } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Unauthorized');
  return session.user.id;
}

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/agents/[id]/projects — List projects linked to this agent
 */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = await getUserId();

    // Verify agent ownership
    const [agent] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.userId, userId)));
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    const links = await db
      .select()
      .from(agentProjects)
      .where(eq(agentProjects.agentId, id));

    return NextResponse.json({ success: true, data: links });
  } catch (error: any) {
    console.error('[vibeflow] Agent projects GET error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch agent projects' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

const linkSchema = z.object({
  projectId: z.string().min(1),
});

/**
 * POST /api/agents/[id]/projects — Link agent to a project
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = await getUserId();
    const body = await request.json();
    const { projectId } = linkSchema.parse(body);

    // Verify agent ownership
    const [agent] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.userId, userId)));
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    // Check if already linked
    const [existing] = await db
      .select()
      .from(agentProjects)
      .where(and(eq(agentProjects.agentId, id), eq(agentProjects.projectId, projectId)));

    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    const [link] = await db
      .insert(agentProjects)
      .values({ id: nanoid(), agentId: id, projectId })
      .returning();

    return NextResponse.json({ success: true, data: link }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[vibeflow] Agent projects POST error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to link agent' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

/**
 * DELETE /api/agents/[id]/projects — Unlink agent from a project
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'projectId query param required' },
        { status: 400 }
      );
    }

    // Verify agent ownership
    const [agent] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.userId, userId)));
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    await db
      .delete(agentProjects)
      .where(and(eq(agentProjects.agentId, id), eq(agentProjects.projectId, projectId)));

    return NextResponse.json({ success: true, message: 'Agent unlinked from project' });
  } catch (error: any) {
    console.error('[vibeflow] Agent projects DELETE error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to unlink agent' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
