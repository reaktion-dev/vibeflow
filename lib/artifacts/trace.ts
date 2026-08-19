/**
 * Bitmap tracing utilities — raster → SVG paths.
 *
 * Primary: @visioncortex/vtracer (WASM, no native deps).
 * Presets: 'photo' (detailed), 'poster' (flat graphics — best), 'bw' (B&W).
 *
 * Per the spec (EXT-008):
 *   vtracer.convertBuffer(buffer, { preset, mode: 'spline', simplify })
 *
 * Falls back to a basic potrace-based path if vtracer is unavailable.
 */

export interface TraceOptions {
  preset: 'photo' | 'poster' | 'bw';
  mode?: 'spline' | 'polygon';
  simplify?: number;
}

/**
 * Trace a raster image buffer into an SVG string.
 *
 * @param imageBuffer - PNG/JPEG/WebP buffer
 * @param options - Tracing options
 * @returns SVG string with <path> elements
 */
export async function traceToSvg(
  imageBuffer: Buffer,
  options: TraceOptions
): Promise<string> {
  const { preset, mode = 'spline', simplify = 1 } = options;

  try {
    // Primary: vtracer (WASM, no native deps)
    const vtracer = await import('@visioncortex/vtracer');

    const svgString = vtracer.convertBuffer(imageBuffer, {
      preset,
      mode,
      simplify,
    });

    return svgString;
  } catch {
    // Fallback: potrace for flat graphics
    // potrace only does B&W, but it's a reasonable fallback
    return traceWithPotrace(imageBuffer);
  }
}

/**
 * Fallback tracer using potrace (B&W only, good for flat graphics).
 */
async function traceWithPotrace(imageBuffer: Buffer): Promise<string> {
  const potrace = await import('potrace');

  return new Promise((resolve, reject) => {
    potrace.trace(imageBuffer, (err: Error | null, svg: string) => {
      if (err) reject(err);
      else resolve(svg);
    });
  });
}
