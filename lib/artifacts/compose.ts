import { svgDocumentSchema, type SvgDocument, type SvgElement } from '@/lib/artifacts/contracts';

/**
 * SVG composition service for the Design workspace.
 *
 * Builds composite SVG documents that layer:
 * - Raster backgrounds (stock photos, fetched images)
 * - Vector shapes (rects, paths, cards)
 * - Text elements (headlines, body text, branding)
 * - Transparent PNG cutouts (web-scraped, AI-generated, or uploaded)
 *
 * The agent calls composeDesign with a layer spec, and the service produces
 * an SVG document stored in design_project.canvas_data and as an SVG asset.
 *
 * At export time, image references (assetId) are resolved to base64 data URLs
 * so resvg can render them inline (resvg doesn't fetch URLs).
 */

export interface ComposeLayerInput {
  name: string;
  elements: SvgElement[];
  visible?: boolean;
}

export interface ComposeDesignInput {
  projectId: string;
  width: number;
  height: number;
  layers: ComposeLayerInput[];
  background?: string; // hex color or 'transparent'
}

/**
 * Build an SVG document from layer inputs.
 *
 * The document uses a flat element list per layer — paths, rects, images, text.
 * The agent specifies each element's position, size, and style.
 *
 * Image elements reference assetId — at render/export time, the assetId is
 * resolved to a base64 data URL via resolveImageReferences().
 */
export function composeSvgDocument(input: ComposeDesignInput): SvgDocument {
  const { width, height, layers } = input;

  const document: SvgDocument = {
    viewBox: `0 0 ${width} ${height}`,
    layers: layers.map((layer, i) => ({
      id: `layer_${i}_${Date.now()}`,
      name: layer.name,
      visible: layer.visible ?? true,
      locked: false,
      paths: [],
      elements: layer.elements,
    })),
    exportPreset: {
      format: 'png',
      scale: 1,
    },
  };

  return svgDocumentSchema.parse(document);
}

/**
 * Convert an SVG document to an SVG string.
 *
 * Renders all layers and elements into a complete <svg> document.
 * Image elements use `href` if set, or fall back to a placeholder.
 *
 * @param document - The SVG document model
 * @param resolvedImages - Map of assetId → base64 data URL (for rendering)
 */
export function svgDocumentToString(
  document: SvgDocument,
  resolvedImages?: Map<string, string>
): string {
  const [_, _w, h] = document.viewBox.split(/\s+/);
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${document.viewBox}" width="${document.viewBox.split(/\s+/)[2]}" height="${document.viewBox.split(/\s+/)[3]}">`,
  ];

  for (const layer of document.layers) {
    if (!layer.visible) continue;

    parts.push(`  <g id="${layer.id}" data-name="${escapeXml(layer.name)}">`);

    // Render legacy paths (backward compat with traced SVGs)
    for (const path of layer.paths) {
      const attrs: string[] = [`d="${path.d}"`];
      if (path.fill !== null && path.fill !== undefined) attrs.push(`fill="${path.fill}"`);
      if (path.stroke !== null && path.stroke !== undefined) attrs.push(`stroke="${path.stroke}"`);
      if (path.strokeWidth !== undefined) attrs.push(`stroke-width="${path.strokeWidth}"`);
      if (path.opacity !== undefined) attrs.push(`opacity="${path.opacity}"`);
      parts.push(`    <path ${attrs.join(' ')} />`);
    }

    // Render elements (new composition model)
    for (const element of layer.elements) {
      parts.push(renderElement(element, resolvedImages));
    }

    parts.push('  </g>');
  }

  parts.push('</svg>');
  return parts.join('\n');
}

function renderElement(element: SvgElement, resolvedImages?: Map<string, string>): string {
  switch (element.type) {
    case 'image': {
      const href =
        resolvedImages?.get(element.assetId) ??
        element.href ??
        '';
      const attrs: string[] = [
        `x="${element.x}"`,
        `y="${element.y}"`,
        `width="${element.width}"`,
        `height="${element.height}"`,
        `href="${href}"`,
        `preserveAspectRatio="${element.preserveAspectRatio}"`,
      ];
      if (element.opacity !== undefined) attrs.push(`opacity="${element.opacity}"`);
      return `    <image ${attrs.join(' ')} />`;
    }

    case 'text': {
      const attrs: string[] = [
        `x="${element.x}"`,
        `y="${element.y}"`,
        `font-family="${escapeXml(element.fontFamily)}"`,
        `font-size="${element.fontSize}"`,
        `font-weight="${element.fontWeight}"`,
        `fill="${element.fill}"`,
        `text-anchor="${element.textAnchor}"`,
      ];
      if (element.opacity !== undefined) attrs.push(`opacity="${element.opacity}"`);
      return `    <text ${attrs.join(' ')}>${escapeXml(element.text)}</text>`;
    }

    case 'rect': {
      const attrs: string[] = [
        `x="${element.x}"`,
        `y="${element.y}"`,
        `width="${element.width}"`,
        `height="${element.height}"`,
        `rx="${element.rx}"`,
      ];
      if (element.fill !== null && element.fill !== undefined) attrs.push(`fill="${element.fill}"`);
      else attrs.push('fill="none"');
      if (element.stroke !== null && element.stroke !== undefined) attrs.push(`stroke="${element.stroke}"`);
      if (element.strokeWidth !== undefined) attrs.push(`stroke-width="${element.strokeWidth}"`);
      if (element.opacity !== undefined) attrs.push(`opacity="${element.opacity}"`);
      return `    <rect ${attrs.join(' ')} />`;
    }

    // path type — fallback for traced paths in a union
    default: {
      if ('d' in element) {
        const path = element;
        const attrs: string[] = [`d="${path.d}"`];
        if (path.fill !== null && path.fill !== undefined) attrs.push(`fill="${path.fill}"`);
        if (path.stroke !== null && path.stroke !== undefined) attrs.push(`stroke="${path.stroke}"`);
        if (path.strokeWidth !== undefined) attrs.push(`stroke-width="${path.strokeWidth}"`);
        if (path.opacity !== undefined) attrs.push(`opacity="${path.opacity}"`);
        return `    <path ${attrs.join(' ')} />`;
      }
      return '';
    }
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
