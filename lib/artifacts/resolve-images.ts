import { getAssetBuffer } from '@/lib/artifacts/service';
import type { SvgDocument } from '@/lib/artifacts/contracts';

/**
 * Image resolution for SVG rendering.
 *
 * resvg-js renders SVG strings but cannot fetch URLs — image elements must
 * use inline base64 data URLs or local file paths.
 *
 * This service resolves image element assetIds to base64 data URLs by
 * downloading from R2, then replaces them in the SVG string.
 */

/**
 * Resolve all image assetId references in an SVG document to base64 data URLs.
 *
 * @param document - The SVG document with image elements
 * @returns Map of assetId → base64 data URL
 */
export async function resolveImageReferences(
  document: SvgDocument
): Promise<Map<string, string>> {
  const assetIds = new Set<string>();

  for (const layer of document.layers) {
    for (const element of layer.elements) {
      if (element.type === 'image' && element.assetId) {
        assetIds.add(element.assetId);
      }
    }
  }

  const resolved = new Map<string, string>();

  for (const assetId of assetIds) {
    try {
      const buffer = await getAssetBuffer(assetId);
      // Detect MIME type from buffer magic bytes
      const mimeType = detectMimeType(buffer);
      const base64 = buffer.toString('base64');
      resolved.set(assetId, `data:${mimeType};base64,${base64}`);
    } catch (error) {
      console.warn(`[vibeflow] Failed to resolve image asset ${assetId}:`, error);
    }
  }

  return resolved;
}

/**
 * Resolve image references in an SVG document and produce a renderable SVG string.
 *
 * Combines resolveImageReferences + svgDocumentToString.
 */
export async function resolveAndRenderSvg(
  document: SvgDocument
): Promise<string> {
  const { svgDocumentToString } = await import('@/lib/artifacts/compose');
  const resolved = await resolveImageReferences(document);
  return svgDocumentToString(document, resolved);
}

/**
 * Detect image MIME type from buffer magic bytes.
 */
function detectMimeType(buffer: Buffer): string {
  if (buffer.length < 4) return 'image/png';

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // WebP: R I F F .... W E B P
  if (
    buffer.length >= 12 &&
    buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
    buffer.slice(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'image/gif';
  }

  // SVG: check for <?xml or <svg
  const head = buffer.slice(0, 100).toString('utf-8');
  if (head.includes('<svg') || head.includes('<?xml')) {
    return 'image/svg+xml';
  }

  return 'image/png';
}
