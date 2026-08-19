import { createAsset, getAssetBuffer } from '@/lib/artifacts/service';
import { getToolContext } from '@/lib/ai/harness/tools/context';
import { svgDocumentSchema, type SvgDocument } from '@/lib/artifacts/contracts';

/**
 * Bitmap tracing service — raster → SVG paths.
 *
 * Uses @visioncortex/vtracer (WASM, no native deps) as primary tracer.
 * Produces an SVG asset with editable paths stored in R2, plus the SVG
 * document model for the PixiJS mini-editor.
 *
 * Per the spec (EXT-008):
 * - preset: 'photo' | 'poster' | 'bw'
 * - mode: 'spline' (smooth curves)
 * - simplify: 0-10 (higher = simpler paths)
 *
 * The traced SVG is stored as:
 * 1. An `svg`-type asset in R2 (the raw SVG string)
 * 2. A parsed SvgDocument in design_project.canvas_data (for the editor)
 */

/**
 * Trace a raster image asset into editable SVG paths.
 *
 * @param projectId - Project scope
 * @param assetId - The image asset to trace
 * @param preset - Tracing preset (poster=flat graphics, photo=detailed, bw=B&W)
 * @param simplify - Path simplification (0-10)
 */
export async function traceAssetImage(input: {
  projectId: string;
  assetId: string;
  preset: 'photo' | 'poster' | 'bw';
  simplify: number;
}): Promise<{ svgAssetId: string; pathCount: number; svgDocument: SvgDocument }> {
  const { projectId, assetId, preset, simplify } = input;

  // Download the image buffer from R2
  const imageBuffer = await getAssetBuffer(assetId);

  // Trace using vtracer (WASM — no native deps, runs on Vercel)
  const { traceToSvg } = await import('@/lib/artifacts/trace');
  const svgString = await traceToSvg(imageBuffer, {
    preset,
    mode: 'spline',
    simplify,
  });

  // Parse the traced SVG into our SVG document model
  const svgDocument = parseSvgToDocument(svgString);

  // Store the SVG as an asset in R2
  const result = await createAsset({
    projectId,
    name: `Traced SVG`,
    type: 'svg',
    mimeType: 'image/svg+xml',
    body: Buffer.from(svgString, 'utf-8'),
    metadata: {
      status: 'ready',
      source: {
        provider: 'vtracer',
        model: `vtracer-${preset}`,
        prompt: '',
        params: { preset, mode: 'spline', simplify },
      },
    },
  });

  // Store the SVG document in design_project.canvas_data
  await saveCanvasData(projectId, svgDocument);

  return {
    svgAssetId: result.id,
    pathCount: svgDocument.layers.reduce((sum, l) => sum + l.paths.length, 0),
    svgDocument,
  };
}

/**
 * Parse an SVG string into our SVG document model.
 *
 * Extracts paths (<path d="...">) and groups them into a single layer.
 * The PixiJS editor will maintain a parallel path data model for editing.
 */
function parseSvgToDocument(svgString: string): SvgDocument {
  // Extract viewBox
  const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch?.[1] ?? '0 0 1024 1024';

  // Extract width/height for viewBox fallback
  const widthMatch = svgString.match(/width="(\d+)"/);
  const heightMatch = svgString.match(/height="(\d+)"/);
  const resolvedViewBox =
    viewBoxMatch?.[1] ??
    (widthMatch && heightMatch
      ? `0 0 ${widthMatch[1]} ${heightMatch[1]}`
      : '0 0 1024 1024');

  // Extract all <path> elements with their attributes
  const pathRegex =
    /<path\s+([^>]*?)d="([^"]+)"([^>]*?)\/?>/g;
  const fillRegex = /fill="([^"]+)"/;
  const strokeRegex = /stroke="([^"]+)"/;
  const strokeWidthRegex = /stroke-width="([^"]+)"/;
  const opacityRegex = /opacity="([^"]+)"/;

  const paths: SvgDocument['layers'][0]['paths'] = [];
  let match: RegExpExecArray | null;

  // Combine all attributes before and after d=
  while ((match = pathRegex.exec(svgString)) !== null) {
    const attrs = match[1] + match[3]; // before + after d="..."
    const d = match[2];

    const fillMatch = attrs.match(fillRegex);
    const strokeMatch = attrs.match(strokeRegex);
    const strokeWidthMatch = attrs.match(strokeWidthRegex);
    const opacityMatch = attrs.match(opacityRegex);

    paths.push({
      d,
      fill: fillMatch?.[1] ?? '#000000',
      stroke: strokeMatch?.[1] ?? null,
      strokeWidth: strokeWidthMatch ? parseFloat(strokeWidthMatch[1]) : undefined,
      opacity: opacityMatch ? parseFloat(opacityMatch[1]) : undefined,
    });
  }

  // Group all paths into a single layer (the editor can split later)
  const document: SvgDocument = {
    viewBox: resolvedViewBox,
    layers: [
      {
        id: `layer_${Date.now()}`,
        name: 'Traced paths',
        visible: true,
        locked: false,
        paths,
        elements: [],
      },
    ],
    exportPreset: {
      format: 'png',
      scale: 1,
    },
  };

  return svgDocumentSchema.parse(document);
}

/**
 * Save the SVG document to design_project.canvas_data.
 */
export async function saveCanvasData(
  projectId: string,
  svgDocument: SvgDocument
): Promise<void> {
  const { db } = await import('@/lib/db');
  const { designProjectTable } = await import('@/lib/db/schema');
  const { eq } = await import('drizzle-orm');
  const { nanoid } = await import('nanoid');

  // Try to update existing design_project row
  const existing = await db
    .select()
    .from(designProjectTable)
    .where(eq(designProjectTable.projectId, projectId));

  if (existing.length > 0) {
    await db
      .update(designProjectTable)
      .set({
        canvasData: JSON.stringify(svgDocument),
        updatedAt: new Date(),
      })
      .where(eq(designProjectTable.projectId, projectId));
  } else {
    await db.insert(designProjectTable).values({
      id: `des_${nanoid()}`,
      projectId,
      canvasData: JSON.stringify(svgDocument),
    });
  }
}
