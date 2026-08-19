import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getProjectBudget, updateProjectBudget } from '@/lib/budget/service';
import { getAuthorizedProject } from '@/lib/projects/server';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id]/budget — Get the project budget state
 */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id: projectId } = await params;
    await getAuthorizedProject(projectId);

    const budget = await getProjectBudget(projectId);

    return NextResponse.json({ success: true, data: budget });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get budget' },
      { status: error.message?.includes('Unauthorized') ? 401 : 404 }
    );
  }
}

const updateBudgetSchema = z.object({
  budgetCents: z.number().int().positive(),
});

/**
 * PUT /api/projects/[id]/budget — Update the project budget cap
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id: projectId } = await params;
    await getAuthorizedProject(projectId);

    const body = await request.json();
    const validated = updateBudgetSchema.parse(body);

    const budget = await updateProjectBudget(projectId, validated.budgetCents);

    return NextResponse.json({ success: true, data: budget });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update budget' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
