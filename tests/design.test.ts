import { describe, it, expect } from 'vitest';

/**
 * Tests for the SVG document parsing logic in lib/ai/agents/image-trace.ts.
 *
 * These test the parseSvgToDocument function indirectly by verifying
 * that the SVG document contract accepts real traced output shapes.
 * The actual tracing requires an image buffer (tested in integration).
 */

import { svgDocumentSchema } from '@/lib/artifacts/contracts';

describe('SVG document parsing (Design workspace)', () => {
  it('accepts a minimal traced SVG document', () => {
    const doc = {
      viewBox: '0 0 1024 1024',
      layers: [
        {
          id: 'layer_1',
          name: 'Traced paths',
          visible: true,
          locked: false,
          paths: [
            {
              d: 'M0 0 L100 0 L100 100 L0 100 Z',
              fill: '#ff0000',
            },
          ],
        },
      ],
      exportPreset: { format: 'png' as const, scale: 1 as const },
    };

    const result = svgDocumentSchema.parse(doc);
    expect(result.viewBox).toBe('0 0 1024 1024');
    expect(result.layers).toHaveLength(1);
    expect(result.layers[0].paths).toHaveLength(1);
    expect(result.layers[0].paths[0].fill).toBe('#ff0000');
  });

  it('accepts a multi-layer document with styles', () => {
    const doc = {
      viewBox: '0 0 1920 1080',
      layers: [
        {
          id: 'l1',
          name: 'background',
          visible: true,
          locked: false,
          paths: [{ d: 'M0 0 H1920 V1080 H0 Z', fill: '#2a2a72' }],
        },
        {
          id: 'l2',
          name: 'skyline',
          visible: true,
          locked: false,
          paths: [
            {
              d: 'M120 540 L120 320 L180 320 L180 540 Z',
              fill: null,
              stroke: '#ffffff',
              strokeWidth: 2,
              opacity: 0.8,
            },
          ],
        },
      ],
      exportPreset: { format: 'webp' as const, scale: 2 as const, quality: 85 },
    };

    const result = svgDocumentSchema.parse(doc);
    expect(result.layers).toHaveLength(2);
    expect(result.layers[1].paths[0].stroke).toBe('#ffffff');
    expect(result.layers[1].paths[0].strokeWidth).toBe(2);
    expect(result.layers[1].paths[0].opacity).toBe(0.8);
    expect(result.exportPreset.format).toBe('webp');
    expect(result.exportPreset.scale).toBe(2);
    expect(result.exportPreset.quality).toBe(85);
  });

  it('applies defaults for optional fields', () => {
    const doc = {
      viewBox: '0 0 512 512',
      layers: [
        {
          id: 'l1',
          name: 'layer',
          paths: [{ d: 'M0 0 L100 100' }],
        },
      ],
      exportPreset: { format: 'png' as const },
    };

    const result = svgDocumentSchema.parse(doc);
    expect(result.layers[0].visible).toBe(true); // default true
    expect(result.layers[0].locked).toBe(false); // default false
    expect(result.exportPreset.scale).toBe(1); // default 1
  });

  it('accepts a document with empty layers (edge case — app should handle)', () => {
    const result = svgDocumentSchema.parse({
      viewBox: '0 0 100 100',
      layers: [],
      exportPreset: { format: 'png' },
    });
    expect(result.layers).toHaveLength(0);
  });

  it('rejects a path with no d attribute', () => {
    expect(() =>
      svgDocumentSchema.parse({
        viewBox: '0 0 100 100',
        layers: [
          {
            id: 'l1',
            name: 'layer',
            paths: [{ fill: '#000' }],
          },
        ],
        exportPreset: { format: 'png' },
      })
    ).toThrow();
  });

  it('rejects an invalid export format', () => {
    expect(() =>
      svgDocumentSchema.parse({
        viewBox: '0 0 100 100',
        layers: [
          {
            id: 'l1',
            name: 'layer',
            paths: [{ d: 'M0 0' }],
          },
        ],
        exportPreset: { format: 'gif' },
      })
    ).toThrow();
  });
});

describe('Image generation budget math', () => {
  // These mirror the cost logic in lib/ai/agents/image-gen.ts
  // without importing server-only modules

  const IMAGE_COST_CENTS: Record<string, number> = {
    'bytedance-seed/seedream-5-0-lite': 1,
    'bytedance-seed/seedream-5-0-pro': 5,
    'qwen/qwen-image-3': 3,
    'krea/krea-2-large': 4,
  };

  function getImageCostCents(model: string, count: number): number {
    const perImage = IMAGE_COST_CENTS[model] ?? 2;
    return perImage * count;
  }

  it('calculates cost for a single lite image', () => {
    expect(getImageCostCents('bytedance-seed/seedream-5-0-lite', 1)).toBe(1);
  });

  it('calculates cost for multiple pro images', () => {
    expect(getImageCostCents('bytedance-seed/seedream-5-0-pro', 3)).toBe(15);
  });

  it('uses default 2 cents for unknown models', () => {
    expect(getImageCostCents('unknown/model', 2)).toBe(4);
  });

  it('cost fits within a typical budget', () => {
    const budgetCents = 500; // $5
    const cost = getImageCostCents('bytedance-seed/seedream-5-0-pro', 3);
    expect(cost).toBeLessThanOrEqual(budgetCents);
  });

  it('cost exceeds a small budget', () => {
    const budgetCents = 3; // $0.03
    const cost = getImageCostCents('bytedance-seed/seedream-5-0-pro', 1);
    expect(cost).toBeGreaterThan(budgetCents);
  });
});
