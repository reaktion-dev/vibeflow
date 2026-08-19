import { and, eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { db } from '@/lib/db';
import { assetTable } from '@/lib/db/schema';
import { getAuthorizedProject } from '@/lib/projects/server';
import {
  uploadToR2,
  deleteFromR2,
  buildObjectKey,
  getSignedDownloadUrl,
  isR2Configured,
} from '@/lib/storage/r2';
import {
  assetMetadataSchema,
  type AssetMetadata,
  type AssetType,
} from '@/lib/artifacts/contracts';

/**
 * Asset service — CRUD for the `asset` table with R2 storage integration.
 *
 * `asset.url` stores the R2 object key (not a public URL).
 * Private access is via signed URLs generated on read.
 */

function extFromMime(mimeType: string): string {
  const exts: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'video/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      'pptx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  };
  return exts[mimeType] ?? 'bin';
}

function parseMetadata(raw: string | null): AssetMetadata {
  if (!raw) return assetMetadataSchema.parse({});
  try {
    return assetMetadataSchema.parse(JSON.parse(raw));
  } catch {
    return assetMetadataSchema.parse({});
  }
}

/**
 * Create an asset record (pending status) and upload buffer to R2.
 *
 * This is the primary entry point for workspace tools — it handles both
 * the DB row and storage in one call.
 */
export async function createAsset(input: {
  projectId: string;
  name: string;
  type: AssetType;
  mimeType: string;
  body: Buffer | Uint8Array;
  metadata?: Partial<AssetMetadata>;
}): Promise<{ id: string; url: string; sizeBytes: number }> {
  await getAuthorizedProject(input.projectId);

  const assetId = `ast_${nanoid()}`;
  const ext = extFromMime(input.mimeType);
  const objectKey = buildObjectKey(
    input.projectId,
    assetId,
    input.type,
    ext
  );

  // Upload to R2
  if (isR2Configured()) {
    await uploadToR2(objectKey, input.body, {
      contentType: input.mimeType,
    });
  }

  // Build metadata
  const metadata = assetMetadataSchema.parse({
    status: 'ready',
    costMicros: 0,
    approvals: [],
    ...input.metadata,
  });

  const sizeBytes = Buffer.byteLength(input.body);

  await db.insert(assetTable).values({
    id: assetId,
    projectId: input.projectId,
    name: input.name,
    type: input.type,
    mimeType: input.mimeType,
    url: objectKey,
    sizeBytes,
    metadata: JSON.stringify(metadata),
  });

  return { id: assetId, url: objectKey, sizeBytes };
}

/**
 * Create a placeholder asset (pending status) before generation starts.
 * The buffer is uploaded later via `finalizeAsset`.
 */
export async function createPendingAsset(input: {
  projectId: string;
  name: string;
  type: AssetType;
  mimeType: string;
  metadata?: Partial<AssetMetadata>;
}): Promise<string> {
  await getAuthorizedProject(input.projectId);

  const assetId = `ast_${nanoid()}`;
  const ext = extFromMime(input.mimeType);
  const objectKey = buildObjectKey(
    input.projectId,
    assetId,
    input.type,
    ext
  );

  const metadata = assetMetadataSchema.parse({
    status: 'pending',
    ...input.metadata,
  });

  await db.insert(assetTable).values({
    id: assetId,
    projectId: input.projectId,
    name: input.name,
    type: input.type,
    mimeType: input.mimeType,
    url: objectKey,
    sizeBytes: null,
    metadata: JSON.stringify(metadata),
  });

  return assetId;
}

/**
 * Finalize a pending asset: upload buffer to R2 and update status to ready.
 */
export async function finalizeAsset(
  assetId: string,
  body: Buffer | Uint8Array,
  metadataUpdates?: Partial<AssetMetadata>
): Promise<void> {
  const [asset] = await db.select().from(assetTable).where(eq(assetTable.id, assetId));
  if (!asset) throw new Error(`Asset not found: ${assetId}`);

  if (isR2Configured()) {
    await uploadToR2(asset.url, body, {
      contentType: asset.mimeType ?? 'application/octet-stream',
    });
  }

  const currentMeta = parseMetadata(asset.metadata);
  const updatedMeta = { ...currentMeta, ...metadataUpdates, status: 'ready' as const };

  await db
    .update(assetTable)
    .set({
      sizeBytes: Buffer.byteLength(body),
      metadata: JSON.stringify(updatedMeta),
    })
    .where(eq(assetTable.id, assetId));
}

/**
 * Mark an asset as failed.
 */
export async function failAsset(
  assetId: string,
  errorMessage?: string
): Promise<void> {
  const [asset] = await db.select().from(assetTable).where(eq(assetTable.id, assetId));
  if (!asset) throw new Error(`Asset not found: ${assetId}`);

  const currentMeta = parseMetadata(asset.metadata);

  await db
    .update(assetTable)
    .set({
      metadata: JSON.stringify({ ...currentMeta, status: 'failed', error: errorMessage }),
    })
    .where(eq(assetTable.id, assetId));
}

/**
 * List all assets for a project, optionally filtered by type.
 */
export async function listAssets(
  projectId: string,
  typeFilter?: AssetType
) {
  await getAuthorizedProject(projectId);

  const query = db
    .select()
    .from(assetTable)
    .where(
      typeFilter
        ? and(
            eq(assetTable.projectId, projectId),
            eq(assetTable.type, typeFilter)
          )
        : eq(assetTable.projectId, projectId)
    )
    .orderBy(desc(assetTable.createdAt));

  return query;
}

/**
 * Get a single asset by ID (project-scoped).
 */
export async function getAsset(projectId: string, assetId: string) {
  await getAuthorizedProject(projectId);

  const [asset] = await db
    .select()
    .from(assetTable)
    .where(
      and(eq(assetTable.id, assetId), eq(assetTable.projectId, projectId))
    );

  if (!asset) throw new Error(`Asset not found: ${assetId}`);

  return {
    ...asset,
    metadataParsed: parseMetadata(asset.metadata),
  };
}

/**
 * Delete an asset and its R2 object.
 */
export async function deleteAsset(projectId: string, assetId: string) {
  await getAuthorizedProject(projectId);

  const [asset] = await db
    .select()
    .from(assetTable)
    .where(
      and(eq(assetTable.id, assetId), eq(assetTable.projectId, projectId))
    );

  if (!asset) throw new Error(`Asset not found: ${assetId}`);

  if (isR2Configured()) {
    await deleteFromR2(asset.url);
  }

  await db.delete(assetTable).where(eq(assetTable.id, assetId));
}

/**
 * Get a signed URL for downloading a private asset.
 */
export async function getAssetDownloadUrl(
  projectId: string,
  assetId: string,
  expiresInSeconds = 900
): Promise<string> {
  const asset = await getAsset(projectId, assetId);

  if (isR2Configured()) {
    return getSignedDownloadUrl(asset.url, expiresInSeconds);
  }

  // Fallback: return the key directly (dev without R2)
  return asset.url;
}

/**
 * Download the raw buffer of an asset from R2.
 */
export async function getAssetBuffer(
  assetId: string
): Promise<Buffer> {
  const [asset] = await db.select().from(assetTable).where(eq(assetTable.id, assetId));
  if (!asset) throw new Error(`Asset not found: ${assetId}`);

  const { downloadFromR2 } = await import('@/lib/storage/r2');
  return downloadFromR2(asset.url);
}

/**
 * Update asset metadata.
 */
export async function updateAssetMetadata(
  assetId: string,
  updates: Partial<AssetMetadata>
): Promise<void> {
  const [asset] = await db.select().from(assetTable).where(eq(assetTable.id, assetId));
  if (!asset) throw new Error(`Asset not found: ${assetId}`);

  const currentMeta = parseMetadata(asset.metadata);
  const updatedMeta = { ...currentMeta, ...updates };

  await db
    .update(assetTable)
    .set({ metadata: JSON.stringify(updatedMeta) })
    .where(eq(assetTable.id, assetId));
}
