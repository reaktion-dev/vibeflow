/**
 * SVG → raster rendering — pure functions with no DB/R2 dependencies.
 *
 * Pipeline (per spec EXT-009):
 * 1. SVG string → @resvg/resvg-js (deterministic PNG, usvg preprocessing)
 * 2. PNG → sharp (JPG/WebP conversion, resizing)
 *
 * Font caveat: fontFiles + loadSystemFonts: false for reproducible text.
 */

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'webp';
  scale: 1 | 2;
  quality?: number; // 1-100, for jpeg/webp
  width?: number; // override viewBox width
  background?: string; // e.g. 'rgba(255,255,255,1)' or '#ffffff'
}

/**
 * Render an SVG string to a raster buffer (PNG, JPEG, or WebP).
 *
 * @returns { buffer, mimeType }
 */
export async function renderSvgToRaster(
  svgString: string,
  options: ExportOptions
): Promise<{ buffer: Buffer; mimeType: string }> {
  const { format, scale, quality = 85, width = 1200, background = 'rgba(255,255,255,1)' } = options;

  // Step 1: SVG → PNG via resvg (deterministic)
  const { Resvg } = await import('@resvg/resvg-js');
  const resvg = new Resvg(svgString, {
    fitTo: {
      mode: 'width',
      value: width * scale,
    },
    background,
    font: {
      loadSystemFonts: false,
    },
  });
  const pngBuffer = resvg.render().asPng();

  // Step 2: If PNG requested, return directly
  if (format === 'png') {
    return { buffer: Buffer.from(pngBuffer), mimeType: 'image/png' };
  }

  // Step 3: PNG → JPEG/WebP via sharp
  const sharp = (await import('sharp')).default;
  const transformer = sharp(Buffer.from(pngBuffer));

  if (format === 'jpeg') {
    const buffer = await transformer
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    return { buffer, mimeType: 'image/jpeg' };
  }

  if (format === 'webp') {
    const buffer = await transformer
      .webp({ quality })
      .toBuffer();
    return { buffer, mimeType: 'image/webp' };
  }

  throw new Error(`Unsupported export format: ${format}`);
}
