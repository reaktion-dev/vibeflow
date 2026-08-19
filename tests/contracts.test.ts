import { describe, it, expect } from 'vitest';
import {
  assetMetadataSchema,
  svgDocumentSchema,
  videoManifestSchema,
  pipelineManifestSchema,
  assetTypeEnum,
} from '@/lib/artifacts/contracts';

describe('Asset metadata contract', () => {
  it('parses a complete asset metadata record', () => {
    const input = {
      status: 'ready',
      source: {
        provider: 'openrouter',
        model: 'qwen/qwen-image-3',
        prompt: 'flat vector-style city skyline',
        seed: 42,
      },
      costMicros: 180000,
      approvals: [{ approved: true, approvedAt: '2026-01-01T00:00:00Z' }],
    };

    const result = assetMetadataSchema.parse(input);
    expect(result.status).toBe('ready');
    expect(result.costMicros).toBe(180000);
    expect(result.source?.seed).toBe(42);
    expect(result.approvals).toHaveLength(1);
  });

  it('applies defaults for missing fields', () => {
    const result = assetMetadataSchema.parse({});
    expect(result.status).toBe('pending');
    expect(result.costMicros).toBe(0);
    expect(result.approvals).toEqual([]);
  });

  it('rejects invalid status', () => {
    expect(() => assetMetadataSchema.parse({ status: 'invalid' })).toThrow();
  });
});

describe('Asset type enum', () => {
  it('accepts all canonical types', () => {
    const validTypes = [
      'image',
      'svg',
      'video',
      'audio',
      'document',
      'export',
      'pipeline',
    ];
    for (const type of validTypes) {
      expect(assetTypeEnum.parse(type)).toBe(type);
    }
  });

  it('rejects unknown types', () => {
    expect(() => assetTypeEnum.parse('unknown')).toThrow();
  });
});

describe('SVG document contract (Design workspace)', () => {
  it('parses a valid SVG document', () => {
    const doc = {
      viewBox: '0 0 1920 1080',
      layers: [
        {
          id: 'l1',
          name: 'skyline',
          visible: true,
          locked: false,
          paths: [
            {
              d: 'M0,540 L120,320 L240,540 Z',
              fill: '#2a2a72',
              stroke: null,
            },
          ],
        },
      ],
      exportPreset: {
        format: 'png',
        scale: 2,
        quality: 85,
      },
    };

    const result = svgDocumentSchema.parse(doc);
    expect(result.viewBox).toBe('0 0 1920 1080');
    expect(result.layers[0].paths[0].d).toBe('M0,540 L120,320 L240,540 Z');
    expect(result.exportPreset.scale).toBe(2);
  });

  it('applies default visibility/lock on layers', () => {
    const result = svgDocumentSchema.parse({
      viewBox: '0 0 100 100',
      layers: [{ id: 'l1', name: 'test', paths: [] }],
      exportPreset: { format: 'png' },
    });
    expect(result.layers[0].visible).toBe(true);
    expect(result.layers[0].locked).toBe(false);
    expect(result.exportPreset.scale).toBe(1);
  });

  it('rejects invalid export format', () => {
    expect(() =>
      svgDocumentSchema.parse({
        viewBox: '0 0 100 100',
        layers: [],
        exportPreset: { format: 'gif' },
      })
    ).toThrow();
  });
});

describe('Video scene manifest', () => {
  it('parses a valid video manifest', () => {
    const manifest = {
      title: 'Demo Video',
      scenes: [
        {
          imagePrompt: 'cinematic wide shot of a library',
          voiceLine: 'Chapter one...',
          durationSec: 6,
        },
      ],
      voice: { voiceId: 'v1', model: 'eleven_turbo_v2' },
      format: { resolution: '1920x1080', fps: 30 },
    };

    const result = videoManifestSchema.parse(manifest);
    expect(result.scenes[0].durationSec).toBe(6);
    expect(result.format.fps).toBe(30);
  });

  it('rejects negative duration', () => {
    expect(() =>
      videoManifestSchema.parse({
        title: 'Test',
        scenes: [{ imagePrompt: 'test', voiceLine: 'test', durationSec: -1 }],
        voice: { voiceId: 'v1', model: 'm1' },
        format: { resolution: '1920x1080', fps: 30 },
      })
    ).toThrow();
  });
});

describe('Pipeline manifest (Flow workspace)', () => {
  it('parses a valid pipeline manifest', () => {
    const manifest = {
      id: 'pipe_1',
      name: 'content-pipeline',
      stages: [
        { id: 's1', type: 'input', params: { source: 'prompt' } },
        { id: 's2', type: 'agent', params: { task: 'write script' } },
        { id: 's3', type: 'tool', params: { tool: 'image-gen' } },
        { id: 's4', type: 'output', params: {} },
      ],
      version: 1,
    };

    const result = pipelineManifestSchema.parse(manifest);
    expect(result.stages).toHaveLength(4);
    expect(result.stages[1].type).toBe('agent');
  });

  it('applies default version', () => {
    const result = pipelineManifestSchema.parse({
      id: 'p1',
      name: 'test',
      stages: [],
    });
    expect(result.version).toBe(1);
  });

  it('rejects invalid stage type', () => {
    expect(() =>
      pipelineManifestSchema.parse({
        id: 'p1',
        name: 'test',
        stages: [{ id: 's1', type: 'loop', params: {} }],
      })
    ).toThrow();
  });
});
