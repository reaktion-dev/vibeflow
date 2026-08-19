import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { getAuthorizedProject } from '@/lib/projects/server';
import { db } from '@/lib/db';
import { designProjectTable } from '@/lib/db/schema';

/**
 * GET /api/projects/[id]/canvas
 * Returns the design project's canvas data (SVG document for the mini-editor).
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    await getAuthorizedProject(projectId);

    const [design] = await db
      .select()
      .from(designProjectTable)
      .where(eq(designProjectTable.projectId, projectId));

    if (!design) {
      return NextResponse.json({ success: true, data: null });
    }

    let canvasData = null;
    if (design.canvasData) {
      try {
        canvasData = JSON.parse(design.canvasData);
      } catch {
        canvasData = null;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        canvasWidth: design.canvasWidth,
        canvasHeight: design.canvasHeight,
        canvasData,
        artboardColor: design.artboardColor,
        version: design.version,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load canvas data';
    return NextResponse.json(
      { success: false, error: message },
      { status: message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]/canvas
 * Update the canvas data (e.g., when the user edits paths in the mini-editor).
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    await getAuthorizedProject(projectId);

    const body = await request.json();
    const { canvasData } = body;

    if (!canvasData) {
      return NextResponse.json(
        { success: false, error: 'canvasData is required' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(designProjectTable)
      .where(eq(designProjectTable.projectId, projectId));

    const serialized = typeof canvasData === 'string' ? canvasData : JSON.stringify(canvasData);

    if (existing) {
      await db
        .update(designProjectTable)
        .set({
          canvasData: serialized,
          updatedAt: new Date(),
        })
        .where(eq(designProjectTable.projectId, projectId));
    } else {
      const { nanoid } = await import('nanoid');
      await db.insert(designProjectTable).values({
        id: `des_${nanoid()}`,
        projectId,
        canvasData: serialized,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update canvas data';
    return NextResponse.json(
      { success: false, error: message },
      { status: message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
