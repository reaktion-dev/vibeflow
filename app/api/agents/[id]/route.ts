import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

const updateAgentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  role: z.enum(['coder', 'designer', 'video', 'orchestrator', 'general']).optional(),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(100).optional(),
  maxTokens: z.number().min(1).max(128000).optional(),
  tools: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/agents/[id] — Get agent details
 */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = await getUserId();

    const [agent] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.userId, userId)));

    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get linked projects
    const linkedProjects = await db
      .select({ projectId: agentProjects.projectId })
      .from(agentProjects)
      .where(eq(agentProjects.agentId, id));

    return NextResponse.json({
      success: true,
      data: { ...agent, projectIds: linkedProjects.map((p) => p.projectId) },
    });
  } catch (error: any) {
    console.error('[vibeflow] Agent GET error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch agent' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

/**
 * PUT /api/agents/[id] — Update an agent
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = await getUserId();
    const body = await request.json();
    const validated = updateAgentSchema.parse(body);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (validated.name !== undefined) updateData.name = validated.name.trim();
    if (validated.description !== undefined) updateData.description = validated.description?.trim();
    if (validated.role !== undefined) updateData.role = validated.role;
    if (validated.model !== undefined) updateData.model = validated.model;
    if (validated.systemPrompt !== undefined) updateData.systemPrompt = validated.systemPrompt?.trim();
    if (validated.temperature !== undefined) updateData.temperature = validated.temperature;
    if (validated.maxTokens !== undefined) updateData.maxTokens = validated.maxTokens;
    if (validated.tools !== undefined) updateData.tools = JSON.stringify(validated.tools);
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

    const [updated] = await db
      .update(agents)
      .set(updateData)
      .where(and(eq(agents.id, id), eq(agents.userId, userId)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[vibeflow] Agent PUT error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update agent' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

/**
 * DELETE /api/agents/[id] — Delete an agent
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = await getUserId();

    // Delete project links first
    await db.delete(agentProjects).where(eq(agentProjects.agentId, id));

    const [deleted] = await db
      .delete(agents)
      .where(and(eq(agents.id, id), eq(agents.userId, userId)))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Agent deleted' });
  } catch (error: any) {
    console.error('[vibeflow] Agent DELETE error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete agent' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
