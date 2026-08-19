import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAuthorizedProject } from '@/lib/projects/server';
import { getAssetBuffer } from '@/lib/artifacts/service';
import { exportDesign } from '@/lib/artifacts/export';
import type { ExportOptions } from '@/lib/artifacts/render';

/**
 * POST /api/projects/[id]/export
 * Export an SVG asset as SVG + raster (user-initiated, not via agent).
 */
const exportSchema = z.object({
  svgAssetId: z.string(),
  name: z.string().default('design-export'),
  format: z.enum(['png', 'jpeg', 'webp']).default('png'),
  scale: z.union([z.literal(1), z.literal(2)]).default(1),
  quality: z.number().min(1).max(100).optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    await getAuthorizedProject(projectId);

    const body = exportSchema.parse(await request.json());

    // Download the SVG from R2
    const svgBuffer = await getAssetBuffer(body.svgAssetId);
    const svgString = svgBuffer.toString('utf-8');

    const result = await exportDesign({
      projectId,
      svgString,
      name: body.name,
      options: {
        format: body.format,
        scale: body.scale,
        quality: body.quality,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json(
      { success: false, error: message },
      { status: message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
