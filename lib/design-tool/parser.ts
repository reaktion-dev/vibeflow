import {
  DesignDocument,
  SceneNode,
  TextNode,
  RectNode,
  CircleNode,
  ImageNode,
  PathNode,
  GroupNode,
} from './types';

/**
 * Escapes XML special characters for safe attribute and text injection.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Parses raw SVG markup into a living Scene Graph DesignDocument.
 */
export function svgStringToSceneGraph(
  svgString: string,
  docId: string = 'doc_default',
  docName: string = 'Untitled Design'
): DesignDocument {
  if (typeof window === 'undefined') {
    // Fallback for SSR or tests without DOMParser
    return createEmptyDocument(docId, docName);
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(svgString, 'image/svg+xml');

  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    console.warn('[svgStringToSceneGraph] Parser error, returning empty document');
    return createEmptyDocument(docId, docName);
  }

  const svgRoot = xmlDoc.documentElement;
  const viewBox = svgRoot.getAttribute('viewBox') || '0 0 1200 630';
  const [, , vbW, vbH] = viewBox.split(/[\s,]+/).map(Number);
  const width = parseFloat(svgRoot.getAttribute('width') || '') || vbW || 1200;
  const height = parseFloat(svgRoot.getAttribute('height') || '') || vbH || 630;

  // Extract <defs> if present
  const defsEl = svgRoot.querySelector('defs');
  const rawDefs = defsEl ? defsEl.innerHTML : undefined;

  // Parse root children
  const rootNodes: SceneNode[] = [];
  const children = Array.from(svgRoot.childNodes).filter(
    (node) => node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName.toLowerCase() !== 'defs'
  ) as Element[];

  for (let i = 0; i < children.length; i++) {
    const node = parseElementToSceneNode(children[i], `node_${i}`);
    if (node) {
      rootNodes.push(node);
    }
  }

  return {
    id: docId,
    name: docName,
    width,
    height,
    viewBox,
    background: {
      type: 'color',
      color: '#0B132B',
    },
    rootNodes,
    rawDefs,
  };
}

function parseElementToSceneNode(el: Element, fallbackId: string): SceneNode | null {
  const tagName = el.tagName.toLowerCase();
  const id = el.getAttribute('id') || fallbackId;
  const visible = el.getAttribute('display') !== 'none';
  const opacity = parseFloat(el.getAttribute('opacity') || '1');
  const locked = el.getAttribute('data-locked') === 'true';

  switch (tagName) {
    case 'g': {
      const groupChildren: SceneNode[] = [];
      const childElements = Array.from(el.childNodes).filter(
        (n) => n.nodeType === Node.ELEMENT_NODE
      ) as Element[];

      for (let j = 0; j < childElements.length; j++) {
        const childNode = parseElementToSceneNode(childElements[j], `${id}_child_${j}`);
        if (childNode) groupChildren.push(childNode);
      }

      const name = id.replace(/^layer-/, '').replace(/[-_]/g, ' ').toUpperCase() || 'Layer';

      const groupNode: GroupNode = {
        id,
        type: 'group',
        name,
        visible,
        locked,
        opacity,
        x: 0,
        y: 0,
        children: groupChildren,
      };
      return groupNode;
    }

    case 'rect': {
      const x = parseFloat(el.getAttribute('x') || '0');
      const y = parseFloat(el.getAttribute('y') || '0');
      const width = parseFloat(el.getAttribute('width') || '100');
      const height = parseFloat(el.getAttribute('height') || '100');
      const rx = parseFloat(el.getAttribute('rx') || '0');
      const fill = el.getAttribute('fill') || '#ffffff';
      const stroke = el.getAttribute('stroke') || undefined;
      const strokeWidth = el.getAttribute('stroke-width')
        ? parseFloat(el.getAttribute('stroke-width')!)
        : undefined;

      const rectNode: RectNode = {
        id,
        type: 'rect',
        name: `Rectangle ${id.slice(-4)}`,
        visible,
        locked,
        opacity,
        x,
        y,
        width,
        height,
        rx,
        fill,
        stroke,
        strokeWidth,
      };
      return rectNode;
    }

    case 'circle': {
      const cx = parseFloat(el.getAttribute('cx') || '0');
      const cy = parseFloat(el.getAttribute('cy') || '0');
      const r = parseFloat(el.getAttribute('r') || '50');
      const fill = el.getAttribute('fill') || '#ffffff';

      const circleNode: CircleNode = {
        id,
        type: 'circle',
        name: `Circle ${id.slice(-4)}`,
        visible,
        locked,
        opacity,
        x: cx - r,
        y: cy - r,
        r,
        fill,
      };
      return circleNode;
    }

    case 'text':
    case 'tspan': {
      const x = parseFloat(el.getAttribute('x') || '0');
      const y = parseFloat(el.getAttribute('y') || '0');
      const text = el.textContent?.trim() || '';
      const fontSize = parseFloat(el.getAttribute('font-size') || '20');
      const fontFamily = el.getAttribute('font-family') || 'system-ui, sans-serif';
      const fontWeight = (el.getAttribute('font-weight') as any) || 'normal';
      const fill = el.getAttribute('fill') || '#ffffff';
      const textAnchor = (el.getAttribute('text-anchor') as any) || 'start';

      const textNode: TextNode = {
        id,
        type: 'text',
        name: text.length > 20 ? `${text.slice(0, 20)}…` : text || 'Text',
        visible,
        locked,
        opacity,
        x,
        y,
        text,
        fontSize,
        fontFamily,
        fontWeight,
        fill,
        textAnchor,
      };
      return textNode;
    }

    case 'image': {
      const x = parseFloat(el.getAttribute('x') || '0');
      const y = parseFloat(el.getAttribute('y') || '0');
      const width = parseFloat(el.getAttribute('width') || '200');
      const height = parseFloat(el.getAttribute('height') || '200');
      const href = el.getAttribute('href') || el.getAttribute('xlink:href') || '';
      const rx = parseFloat(el.getAttribute('rx') || '0');

      const imageNode: ImageNode = {
        id,
        type: 'image',
        name: `Image ${id.slice(-4)}`,
        visible,
        locked,
        opacity,
        x,
        y,
        width,
        height,
        href,
        rx,
      };
      return imageNode;
    }

    case 'path': {
      const d = el.getAttribute('d') || '';
      const fill = el.getAttribute('fill') || undefined;
      const stroke = el.getAttribute('stroke') || undefined;
      const strokeWidth = el.getAttribute('stroke-width')
        ? parseFloat(el.getAttribute('stroke-width')!)
        : undefined;

      const pathNode: PathNode = {
        id,
        type: 'path',
        name: `Vector Path ${id.slice(-4)}`,
        visible,
        locked,
        opacity,
        x: 0,
        y: 0,
        d,
        fill,
        stroke,
        strokeWidth,
      };
      return pathNode;
    }

    case 'ellipse': {
      const cx = parseFloat(el.getAttribute('cx') || '0');
      const cy = parseFloat(el.getAttribute('cy') || '0');
      const rx = parseFloat(el.getAttribute('rx') || '50');
      const ry = parseFloat(el.getAttribute('ry') || '50');
      const fill = el.getAttribute('fill') || '#ffffff';

      const rectNode: RectNode = {
        id,
        type: 'rect',
        name: `Ellipse ${id.slice(-4)}`,
        visible,
        locked,
        opacity,
        x: cx - rx,
        y: cy - ry,
        width: rx * 2,
        height: ry * 2,
        rx: Math.min(rx, ry),
        fill,
      };
      return rectNode;
    }

    case 'polygon':
    case 'polyline': {
      const points = el.getAttribute('points') || '';
      const coords = points.trim().split(/[\s,]+/);
      let d = '';
      for (let p = 0; p < coords.length; p += 2) {
        if (p === 0) d += `M ${coords[p]} ${coords[p + 1]} `;
        else d += `L ${coords[p]} ${coords[p + 1]} `;
      }
      if (tagName === 'polygon') d += 'Z';

      const fill = el.getAttribute('fill') || undefined;
      const stroke = el.getAttribute('stroke') || undefined;
      const strokeWidth = el.getAttribute('stroke-width') ? parseFloat(el.getAttribute('stroke-width')!) : undefined;

      const pathNode: PathNode = {
        id,
        type: 'path',
        name: `${tagName === 'polygon' ? 'Polygon' : 'Polyline'} ${id.slice(-4)}`,
        visible,
        locked,
        opacity,
        x: 0,
        y: 0,
        d,
        fill,
        stroke,
        strokeWidth,
      };
      return pathNode;
    }

    case 'line': {
      const x1 = el.getAttribute('x1') || '0';
      const y1 = el.getAttribute('y1') || '0';
      const x2 = el.getAttribute('x2') || '0';
      const y2 = el.getAttribute('y2') || '0';
      const stroke = el.getAttribute('stroke') || '#ffffff';
      const strokeWidth = el.getAttribute('stroke-width') ? parseFloat(el.getAttribute('stroke-width')!) : 1;

      const pathNode: PathNode = {
        id,
        type: 'path',
        name: `Line ${id.slice(-4)}`,
        visible,
        locked,
        opacity,
        x: 0,
        y: 0,
        d: `M ${x1} ${y1} L ${x2} ${y2}`,
        stroke,
        strokeWidth,
      };
      return pathNode;
    }

    default:
      return null;
  }
}

/**
 * Serializes a living Scene Graph DesignDocument back to a clean, scalable SVG string.
 */
export function sceneGraphToSvgString(doc: DesignDocument): string {
  const nodeMarkup = doc.rootNodes.map((node) => renderNodeToSvg(node)).join('\n  ');

  const defsBlock = doc.rawDefs ? `\n  <defs>\n    ${doc.rawDefs}\n  </defs>` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${doc.viewBox}" width="${doc.width}" height="${doc.height}">${defsBlock}
  ${nodeMarkup}
</svg>`.trim();
}

function renderNodeToSvg(node: SceneNode): string {
  if (!node.visible) return '';

  const opacityAttr = node.opacity < 1 ? ` opacity="${node.opacity}"` : '';

  switch (node.type) {
    case 'group': {
      const childMarkup = node.children.map((c) => renderNodeToSvg(c)).join('\n    ');
      return `<g id="${escapeXml(node.id)}"${opacityAttr}>
    ${childMarkup}
  </g>`;
    }

    case 'rect': {
      const strokeAttr = node.stroke ? ` stroke="${node.stroke}"` : '';
      const strokeWidthAttr = node.strokeWidth ? ` stroke-width="${node.strokeWidth}"` : '';
      const rxAttr = node.rx ? ` rx="${node.rx}"` : '';

      return `<rect id="${escapeXml(node.id)}" x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" fill="${node.fill}"${rxAttr}${strokeAttr}${strokeWidthAttr}${opacityAttr} />`;
    }

    case 'circle': {
      const cx = node.x + node.r;
      const cy = node.y + node.r;
      const strokeAttr = node.stroke ? ` stroke="${node.stroke}"` : '';
      const strokeWidthAttr = node.strokeWidth ? ` stroke-width="${node.strokeWidth}"` : '';

      return `<circle id="${escapeXml(node.id)}" cx="${cx}" cy="${cy}" r="${node.r}" fill="${node.fill}"${strokeAttr}${strokeWidthAttr}${opacityAttr} />`;
    }

    case 'text': {
      const anchorAttr = node.textAnchor ? ` text-anchor="${node.textAnchor}"` : '';
      const weightAttr = node.fontWeight ? ` font-weight="${node.fontWeight}"` : '';
      const familyAttr = node.fontFamily ? ` font-family="${escapeXml(node.fontFamily)}"` : '';

      return `<text id="${escapeXml(node.id)}" x="${node.x}" y="${node.y}" font-size="${node.fontSize}" fill="${node.fill}"${familyAttr}${weightAttr}${anchorAttr}${opacityAttr}>${escapeXml(node.text)}</text>`;
    }

    case 'image': {
      const rxAttr = node.rx ? ` rx="${node.rx}"` : '';
      return `<image id="${escapeXml(node.id)}" href="${escapeXml(node.href)}" x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" preserveAspectRatio="xMidYMid meet"${rxAttr}${opacityAttr} />`;
    }

    case 'path': {
      const fillAttr = node.fill ? ` fill="${node.fill}"` : ' fill="none"';
      const strokeAttr = node.stroke ? ` stroke="${node.stroke}"` : '';
      const strokeWidthAttr = node.strokeWidth ? ` stroke-width="${node.strokeWidth}"` : '';

      return `<path id="${escapeXml(node.id)}" d="${escapeXml(node.d)}"${fillAttr}${strokeAttr}${strokeWidthAttr}${opacityAttr} />`;
    }
  }
}

export function createEmptyDocument(id: string, name: string): DesignDocument {
  return {
    id,
    name,
    width: 1200,
    height: 630,
    viewBox: '0 0 1200 630',
    background: {
      type: 'color',
      color: '#0B132B',
    },
    rootNodes: [
      {
        id: 'layer-background',
        type: 'group',
        name: 'Background',
        visible: true,
        locked: false,
        opacity: 1,
        x: 0,
        y: 0,
        children: [
          {
            id: 'bg-rect',
            type: 'rect',
            name: 'Backdrop',
            visible: true,
            locked: true,
            opacity: 1,
            x: 0,
            y: 0,
            width: 1200,
            height: 630,
            rx: 0,
            fill: '#0B132B',
          },
        ],
      },
      {
        id: 'layer-content',
        type: 'group',
        name: 'Content',
        visible: true,
        locked: false,
        opacity: 1,
        x: 0,
        y: 0,
        children: [
          {
            id: 'title-text',
            type: 'text',
            name: 'Title Text',
            visible: true,
            locked: false,
            opacity: 1,
            x: 100,
            y: 315,
            text: 'Visual Design Studio',
            fontSize: 48,
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 'bold',
            fill: '#ffffff',
            textAnchor: 'start',
          },
        ],
      },
    ],
  };
}
