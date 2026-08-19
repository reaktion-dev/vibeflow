import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { getAuthorizedProject } from '@/lib/projects/server';
import { getAvailableImageModels } from '@/lib/ai/agents/image-gen';
import { db } from '@/lib/db';
import { projectTable } from '@/lib/db/schema';

/**
 * GET /api/projects/[id]/image-models
 * Returns available image models + the project's currently selected model (AC-011).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const project = await getAuthorizedProject(projectId);

    let config: { imageModel?: string } = {};
    if (project.config) {
      try {
        config = JSON.parse(project.config);
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        models: getAvailableImageModels(),
        selectedModel: config.imageModel ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load image models';
    return NextResponse.json(
      { success: false, error: message },
      { status: message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]/image-models
 * Save the user's image model choice to project.config (AC-011).
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const { modelId } = await request.json();
    const project = await getAuthorizedProject(projectId);

    if (!modelId || typeof modelId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'modelId is required' },
        { status: 400 }
      );
    }

    let config: Record<string, unknown> = {};
    if (project.config) {
      try {
        config = JSON.parse(project.config);
      } catch {
        // ignore
      }
    }

    config.imageModel = modelId;

    await db
      .update(projectTable)
      .set({ config: JSON.stringify(config) })
      .where(eq(projectTable.id, projectId));

    return NextResponse.json({ success: true, data: { imageModel: modelId } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save image model';
    return NextResponse.json(
      { success: false, error: message },
      { status: message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
