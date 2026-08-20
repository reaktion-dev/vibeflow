import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAuthorizedProject } from '@/lib/projects/server';
import { getAssetBuffer } from '@/lib/artifacts/service';
import { exportDesign } from '@/lib/artifacts/export';
import type { ExportOptions } from '@/lib/artifacts/render';

/**
 * POST /api/projects/[id]/export
 * Export an SVG asset as SVG + raster (user-initiated, not via agent).
 *
 * Accepts either `svgAssetId` (export the stored asset) or an inline `svg`
 * string (export user-edited SVG — the mini-editor serializes its in-memory
 * DOM and sends it here so edits aren't lost).
 */
const exportSchema = z
  .object({
    svgAssetId: z.string().optional(),
    svg: z.string().optional(),
    name: z.string().default('design-export'),
    format: z.enum(['png', 'jpeg', 'webp']).default('png'),
    scale: z.union([z.literal(1), z.literal(2)]).default(1),
    quality: z.number().min(1).max(100).optional(),
  })
  .refine((data) => Boolean(data.svgAssetId) || Boolean(data.svg), {
    message: 'Provide either svgAssetId (stored asset) or svg (inline SVG)',
  });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    await getAuthorizedProject(projectId);

    const body = exportSchema.parse(await request.json());

    // Prefer an inline SVG string (reflects user edits in the mini-editor),
    // fall back to the stored asset.
    let svgString: string;
    if (body.svg) {
      svgString = body.svg;
    } else if (body.svgAssetId) {
      const svgBuffer = await getAssetBuffer(body.svgAssetId);
      svgString = svgBuffer.toString('utf-8');
    } else {
      // Unreachable — the schema refine requires one of the two.
      return NextResponse.json(
        { success: false, error: 'No SVG provided' },
        { status: 400 }
      );
    }

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
