import { z } from 'zod';

/**
 * Zod schemas for artifact metadata and contracts.
 * These are the source of truth for the `asset.metadata` JSON column
 * and all workspace manifests.
 */

// ─── Asset Types ────────────────────────────────────────────────────────────────

export const assetTypeEnum = z.enum([
  'image',
  'svg',
  'video',
  'audio',
  'document',
  'export',
  'pipeline',
]);

export const assetStatusEnum = z.enum([
  'pending',
  'running',
  'ready',
  'failed',
]);

// ─── Asset Metadata ─────────────────────────────────────────────────────────────

export const assetSourceSchema = z.object({
  provider: z.string(),
  model: z.string(),
  prompt: z.string(),
  seed: z.number().int().optional(),
  params: z.record(z.unknown()).optional(),
});

export const assetMetadataSchema = z.object({
  status: assetStatusEnum.default('pending'),
  source: assetSourceSchema.optional(),
  costMicros: z.number().int().nonnegative().default(0),
  approvals: z
    .array(
      z.object({
        approved: z.boolean(),
        approvedAt: z.string().optional(),
        reason: z.string().optional(),
      })
    )
    .default([]),
  // Free-form per-type metadata (dimensions, duration, etc.)
  extra: z.record(z.unknown()).optional(),
});

// ─── Asset Record (the full row as stored in DB) ────────────────────────────────

export const assetRecordSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  type: assetTypeEnum,
  mimeType: z.string().nullable(),
  url: z.string(), // R2 object key
  sizeBytes: z.number().int().nullable(),
  metadata: assetMetadataSchema,
  createdAt: z.date(),
});

export type AssetType = z.infer<typeof assetTypeEnum>;
export type AssetStatus = z.infer<typeof assetStatusEnum>;
export type AssetSource = z.infer<typeof assetSourceSchema>;
export type AssetMetadata = z.infer<typeof assetMetadataSchema>;
export type AssetRecord = z.infer<typeof assetRecordSchema>;

// ─── SVG Document (Design workspace mini-editor) ────────────────────────────────

export const svgPathSchema = z.object({
  d: z.string(),
  fill: z.string().nullable().optional(),
  stroke: z.string().nullable().optional(),
  strokeWidth: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export const svgLayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  visible: z.boolean().default(true),
  locked: z.boolean().default(false),
  paths: z.array(svgPathSchema),
});

export const exportPresetSchema = z.object({
  format: z.enum(['png', 'jpeg', 'webp']),
  scale: z.union([z.literal(1), z.literal(2)]).default(1),
  quality: z.number().min(1).max(100).optional(),
});

export const svgDocumentSchema = z.object({
  viewBox: z.string(),
  layers: z.array(svgLayerSchema),
  exportPreset: exportPresetSchema,
});

export type SvgPath = z.infer<typeof svgPathSchema>;
export type SvgLayer = z.infer<typeof svgLayerSchema>;
export type ExportPreset = z.infer<typeof exportPresetSchema>;
export type SvgDocument = z.infer<typeof svgDocumentSchema>;

// ─── Video Scene Manifest ─────────────────────────────────────────────────────

export const videoSceneSchema = z.object({
  imagePrompt: z.string(),
  voiceLine: z.string(),
  durationSec: z.number().int().positive(),
  captions: z.string().optional(),
});

export const videoManifestSchema = z.object({
  title: z.string(),
  scenes: z.array(videoSceneSchema),
  voice: z.object({
    voiceId: z.string(),
    model: z.string(),
  }),
  format: z.object({
    resolution: z.string(),
    fps: z.number().int().positive(),
  }),
});

export type VideoScene = z.infer<typeof videoSceneSchema>;
export type VideoManifest = z.infer<typeof videoManifestSchema>;

// ─── Pipeline Manifest (Flow workspace) ────────────────────────────────────────

export const pipelineStageTypeEnum = z.enum([
  'input',
  'agent',
  'tool',
  'condition',
  'output',
]);

export const pipelineStageSchema = z.object({
  id: z.string(),
  type: pipelineStageTypeEnum,
  params: z.record(z.unknown()),
});

export const pipelineManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  stages: z.array(pipelineStageSchema),
  version: z.number().int().default(1),
});

export type PipelineStageType = z.infer<typeof pipelineStageTypeEnum>;
export type PipelineStage = z.infer<typeof pipelineStageSchema>;
export type PipelineManifest = z.infer<typeof pipelineManifestSchema>;
