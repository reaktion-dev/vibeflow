import { describe, it, expect } from 'vitest';

import { composeSvgDocument, svgDocumentToString } from '@/lib/artifacts/compose';
import { svgDocumentSchema, type SvgDocument } from '@/lib/artifacts/contracts';

describe('SVG composition', () => {
  it('builds a document from layer inputs', () => {
    const doc = composeSvgDocument({
      projectId: 'p_test',
      width: 1080,
      height: 1080,
      layers: [
        {
          name: 'background',
          elements: [
            {
              type: 'rect' as const,
              x: 0,
              y: 0,
              width: 1080,
              height: 1080,
              fill: '#1a1a2e',
            },
          ],
        },
        {
          name: 'content',
          elements: [
            {
              type: 'text' as const,
              text: 'Hello World',
              x: 540,
              y: 540,
              fontSize: 48,
              fontWeight: 'bold' as const,
              fill: '#ffffff',
              textAnchor: 'middle' as const,
            },
          ],
        },
      ],
    });

    expect(doc.viewBox).toBe('0 0 1080 1080');
    expect(doc.layers).toHaveLength(2);
    expect(doc.layers[0].elements).toHaveLength(1);
    expect(doc.layers[0].elements[0].type).toBe('rect');
    expect(doc.layers[1].elements[0].type).toBe('text');
  });

  it('produces valid SVG string from a composed document', () => {
    const doc = composeSvgDocument({
      projectId: 'p_test',
      width: 800,
      height: 600,
      layers: [
        {
          name: 'bg',
          elements: [
            {
              type: 'rect' as const,
              x: 0,
              y: 0,
              width: 800,
              height: 600,
              fill: '#ff0000',
            },
          ],
        },
      ],
    });

    const svgString = svgDocumentToString(doc);

    expect(svgString).toContain('<svg');
    expect(svgString).toContain('viewBox="0 0 800 600"');
    expect(svgString).toContain('width="800"');
    expect(svgString).toContain('height="600"');
    expect(svgString).toContain('<rect');
    expect(svgString).toContain('fill="#ff0000"');
    expect(svgString).toContain('</svg>');
  });

  it('renders text elements with correct attributes', () => {
    const doc = composeSvgDocument({
      projectId: 'p_test',
      width: 400,
      height: 200,
      layers: [
        {
          name: 'text-layer',
          elements: [
            {
              type: 'text' as const,
              text: 'Sale!',
              x: 200,
              y: 100,
              fontSize: 32,
              fontWeight: 'bold' as const,
              fill: '#ff6600',
              textAnchor: 'middle' as const,
            },
          ],
        },
      ],
    });

    const svgString = svgDocumentToString(doc);

    expect(svgString).toContain('<text');
    expect(svgString).toContain('font-size="32"');
    expect(svgString).toContain('font-weight="bold"');
    expect(svgString).toContain('fill="#ff6600"');
    expect(svgString).toContain('text-anchor="middle"');
    expect(svgString).toContain('Sale!');
  });

  it('renders image elements with resolved data URLs', () => {
    const doc = composeSvgDocument({
      projectId: 'p_test',
      width: 500,
      height: 500,
      layers: [
        {
          name: 'image-layer',
          elements: [
            {
              type: 'image' as const,
              assetId: 'ast_test123',
              x: 50,
              y: 50,
              width: 400,
              height: 400,
            },
          ],
        },
      ],
    });

    const resolvedImages = new Map([
      ['ast_test123', 'data:image/png;base64,iVBORw0KGgo='],
    ]);

    const svgString = svgDocumentToString(doc, resolvedImages);

    expect(svgString).toContain('<image');
    expect(svgString).toContain('href="data:image/png;base64,iVBORw0KGgo="');
    expect(svgString).toContain('width="400"');
    expect(svgString).toContain('height="400"');
  });

  it('renders image elements with placeholder when not resolved', () => {
    const doc = composeSvgDocument({
      projectId: 'p_test',
      width: 500,
      height: 500,
      layers: [
        {
          name: 'image-layer',
          elements: [
            {
              type: 'image' as const,
              assetId: 'ast_missing',
              x: 0,
              y: 0,
              width: 200,
              height: 200,
            },
          ],
        },
      ],
    });

    // No resolved images — should render with empty href
    const svgString = svgDocumentToString(doc);
    expect(svgString).toContain('<image');
    expect(svgString).toContain('href=""');
  });

  it('renders rects with corner radius', () => {
    const doc = composeSvgDocument({
      projectId: 'p_test',
      width: 300,
      height: 300,
      layers: [
        {
          name: 'card',
          elements: [
            {
              type: 'rect' as const,
              x: 20,
              y: 20,
              width: 260,
              height: 260,
              fill: '#3b82f6',
              rx: 16,
            },
          ],
        },
      ],
    });

    const svgString = svgDocumentToString(doc);

    expect(svgString).toContain('rx="16"');
  });

  it('escapes XML special characters in text', () => {
    const doc = composeSvgDocument({
      projectId: 'p_test',
      width: 200,
      height: 100,
      layers: [
        {
          name: 'text',
          elements: [
            {
              type: 'text' as const,
              text: '<script>alert("xss")</script>',
              x: 10,
              y: 50,
            },
          ],
        },
      ],
    });

    const svgString = svgDocumentToString(doc);

    // The text should be escaped, not rendered as actual XML
    expect(svgString).toContain('&lt;script&gt;');
    expect(svgString).not.toContain('<script>alert');
  });

  it('hides invisible layers', () => {
    const doc = composeSvgDocument({
      projectId: 'p_test',
      width: 200,
      height: 200,
      layers: [
        {
          name: 'visible',
          visible: true,
          elements: [
            { type: 'rect' as const, x: 0, y: 0, width: 100, height: 100, fill: '#f00' },
          ],
        },
        {
          name: 'hidden',
          visible: false,
          elements: [
            { type: 'rect' as const, x: 0, y: 0, width: 100, height: 100, fill: '#0f0' },
          ],
        },
      ],
    });

    const svgString = svgDocumentToString(doc);

    expect(svgString).toContain('#f00');
    expect(svgString).not.toContain('#0f0');
  });

  it('composes a multi-layer design with mixed elements', () => {
    const doc = composeSvgDocument({
      projectId: 'p_test',
      width: 1080,
      height: 1080,
      layers: [
        {
          name: 'background-image',
          elements: [
            {
              type: 'image' as const,
              assetId: 'ast_bg',
              x: 0,
              y: 0,
              width: 1080,
              height: 1080,
            },
          ],
        },
        {
          name: 'overlay-card',
          elements: [
            {
              type: 'rect' as const,
              x: 100,
              y: 700,
              width: 880,
              height: 280,
              fill: 'rgba(0,0,0,0.7)',
              rx: 24,
            },
          ],
        },
        {
          name: 'headline',
          elements: [
            {
              type: 'text' as const,
              text: 'Premium Quality',
              x: 540,
              y: 820,
              fontSize: 56,
              fontWeight: 'bold' as const,
              fill: '#ffffff',
              textAnchor: 'middle' as const,
            },
            {
              type: 'text' as const,
              text: 'Experience the difference',
              x: 540,
              y: 880,
              fontSize: 28,
              fill: '#cccccc',
              textAnchor: 'middle' as const,
            },
          ],
        },
      ],
    });

    const svgString = svgDocumentToString(doc, new Map([['ast_bg', 'data:image/jpeg;base64,/9j/4AAQ']]));

    // Verify all elements are present
    expect(svgString).toContain('<image');
    expect(svgString).toContain('data:image/jpeg;base64,/9j/4AAQ');
    expect(svgString).toContain('<rect');
    expect(svgString).toContain('rx="24"');
    expect(svgString).toContain('Premium Quality');
    expect(svgString).toContain('Experience the difference');
    expect(svgString).toContain('font-weight="bold"');

    // Verify layer order (background first, headline last)
    const bgIndex = svgString.indexOf('data:image/jpeg');
    const cardIndex = svgString.indexOf('rx="24"');
    const textIndex = svgString.indexOf('Premium Quality');
    expect(bgIndex).toBeLessThan(cardIndex);
    expect(cardIndex).toBeLessThan(textIndex);
  });
});

describe('SVG document contract with composition elements', () => {
  it('accepts a document with image, rect, and text elements', () => {
    const doc = svgDocumentSchema.parse({
      viewBox: '0 0 800 600',
      layers: [
        {
          id: 'l1',
          name: 'layer1',
          elements: [
            {
              type: 'image',
              assetId: 'ast_1',
              x: 0,
              y: 0,
              width: 800,
              height: 600,
            },
            {
              type: 'rect',
              x: 50,
              y: 50,
              width: 200,
              height: 100,
              fill: '#3b82f6',
              rx: 12,
            },
            {
              type: 'text',
              text: 'Hello',
              x: 150,
              y: 100,
              fontSize: 24,
              fill: '#ffffff',
            },
          ],
          paths: [],
        },
      ],
      exportPreset: { format: 'png', scale: 1 },
    });

    expect(doc.layers[0].elements).toHaveLength(3);
    expect(doc.layers[0].elements[0].type).toBe('image');
    expect(doc.layers[0].elements[1].type).toBe('rect');
    expect(doc.layers[0].elements[2].type).toBe('text');
  });

  it('accepts a document with only paths (backward compat)', () => {
    const doc = svgDocumentSchema.parse({
      viewBox: '0 0 100 100',
      layers: [
        {
          id: 'l1',
          name: 'traced',
          paths: [{ d: 'M0 0 L100 100', fill: '#000' }],
          elements: [],
        },
      ],
      exportPreset: { format: 'png' },
    });

    expect(doc.layers[0].paths).toHaveLength(1);
    expect(doc.layers[0].elements).toHaveLength(0);
  });

  it('accepts a document with both paths and elements', () => {
    const doc = svgDocumentSchema.parse({
      viewBox: '0 0 100 100',
      layers: [
        {
          id: 'l1',
          name: 'mixed',
          paths: [{ d: 'M0 0 L50 50', fill: '#ff0000' }],
          elements: [
            {
              type: 'rect',
              x: 10,
              y: 10,
              width: 30,
              height: 30,
              fill: '#00ff00',
            },
          ],
        },
      ],
      exportPreset: { format: 'png' },
    });

    expect(doc.layers[0].paths).toHaveLength(1);
    expect(doc.layers[0].elements).toHaveLength(1);
  });
});
