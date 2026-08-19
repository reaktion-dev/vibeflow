import { createAsset } from '@/lib/artifacts/service';
import { renderSvgToRaster, type ExportOptions } from '@/lib/artifacts/render';

/**
 * Design export service — renders SVG → raster and stores both as assets.
 *
 * Per AC-013: produces an SVG file (native, editable in Illustrator/Inkscape/Figma)
 * AND a rasterized PNG/JPG/WebP at the chosen scale.
 *
 * Supports composite SVGs with embedded images — the svgString passed in
 * should already have image references resolved to base64 data URLs
 * (via resolveImageReferences + svgDocumentToString).
 */

/**
 * Export an SVG document as both native SVG + rasterized format.
 *
 * @param projectId - Project scope
 * @param svgString - The SVG to export (with images already resolved to data URLs)
 * @param name - Base file name (without extension)
 * @param options - Raster export options
 */
export async function exportDesign(input: {
  projectId: string;
  svgString: string;
  name: string;
  options: ExportOptions;
}): Promise<{ svgAssetId: string; rasterAssetId: string }> {
  const { projectId, svgString, name, options } = input;

  // Store the native SVG (always — AC-013 requires SVG export)
  const svgResult = await createAsset({
    projectId,
    name: `${name}.svg`,
    type: 'export',
    mimeType: 'image/svg+xml',
    body: Buffer.from(svgString, 'utf-8'),
    metadata: {
      status: 'ready',
      source: {
        provider: 'vibeflow',
        model: 'export-svg',
        prompt: '',
        params: { format: 'svg' },
      },
    },
  });

  // Render and store the raster format
  const { buffer, mimeType } = await renderSvgToRaster(svgString, options);
  const ext = options.format === 'jpeg' ? 'jpg' : options.format;

  const rasterResult = await createAsset({
    projectId,
    name: `${name}.${ext}`,
    type: 'export',
    mimeType,
    body: buffer,
    metadata: {
      status: 'ready',
      source: {
        provider: 'vibeflow',
        model: 'export-raster',
        prompt: '',
        params: {
          format: options.format,
          scale: options.scale,
          quality: options.quality,
        },
      },
    },
  });

  return {
    svgAssetId: svgResult.id,
    rasterAssetId: rasterResult.id,
  };
}

export { renderSvgToRaster, type ExportOptions } from '@/lib/artifacts/render';
