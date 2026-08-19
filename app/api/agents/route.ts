import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { agents, agentProjects } from '@/lib/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { headers } from 'next/headers';

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Unauthorized');
  return session.user.id;
}

const createAgentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  role: z.enum(['coder', 'designer', 'video', 'orchestrator', 'general']).default('general'),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(100).optional(),
  maxTokens: z.number().min(1).max(128000).optional(),
  tools: z.array(z.string()).optional(),
  projectId: z.string().optional(),
});

/**
 * GET /api/agents — List all agents for the authenticated user
 */
export async function GET() {
  try {
    const userId = await getUserId();

    const agentList = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, userId))
      .orderBy(desc(agents.createdAt));

    return NextResponse.json({ success: true, data: agentList });
  } catch (error: any) {
    console.error('[vibeflow] Agents GET error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch agents' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

/**
 * POST /api/agents — Create a new agent
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const validated = createAgentSchema.parse(body);

    const [agent] = await db
      .insert(agents)
      .values({
        id: nanoid(),
        userId,
        name: validated.name.trim(),
        description: validated.description?.trim(),
        role: validated.role,
        model: validated.model || 'openrouter/free',
        systemPrompt: validated.systemPrompt?.trim(),
        temperature: validated.temperature,
        maxTokens: validated.maxTokens,
        tools: JSON.stringify(validated.tools ?? []),
      })
      .returning();

    // If a projectId was provided, link the agent to that project
    if (validated.projectId) {
      await db.insert(agentProjects).values({
        id: nanoid(),
        agentId: agent.id,
        projectId: validated.projectId,
      });
    }

    return NextResponse.json({ success: true, data: agent }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[vibeflow] Agents POST error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create agent' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
