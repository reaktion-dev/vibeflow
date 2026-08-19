import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { getEnv } from '@/lib/env';

/**
 * Cloudflare R2 storage client.
 *
 * R2 is S3-compatible. Objects are private by default — `asset.url` stores the
 * R2 object key (not a public URL), and reads go through signed URLs or a
 * server-side proxy.
 *
 * Media moves via presigned URLs (Vercel 4.5MB payload cap means we never
 * stream large media through request bodies).
 */

let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (r2Client) return r2Client;

  const env = getEnv();

  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET_NAME
  ) {
    throw new Error(
      'R2 storage not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.'
    );
  }

  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

  return r2Client;
}

function getBucketName(): string {
  const env = getEnv();
  if (!env.R2_BUCKET_NAME) {
    throw new Error('R2_BUCKET_NAME is not set');
  }
  return env.R2_BUCKET_NAME;
}

/**
 * Build the R2 object key for a project asset.
 * Format: {projectId}/{type}/{assetId}.{ext}
 */
export function buildObjectKey(
  projectId: string,
  assetId: string,
  type: string,
  ext: string
): string {
  return `${projectId}/${type}/${assetId}.${ext}`;
}

/**
 * Upload a buffer to R2. Returns the object key.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  options?: {
    contentType?: string;
    metadata?: Record<string, string>;
  }
): Promise<string> {
  const client = getR2Client();
  const bucket = getBucketName();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: options?.contentType,
      Metadata: options?.metadata,
    })
  );

  return key;
}

/**
 * Download an object from R2 as a Buffer.
 */
export async function downloadFromR2(key: string): Promise<Buffer> {
  const client = getR2Client();
  const bucket = getBucketName();

  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  if (!response.Body) {
    throw new Error(`R2 object not found: ${key}`);
  }

  const buffer = await response.Body.transformToByteArray();
  return Buffer.from(buffer);
}

/**
 * Delete an object from R2.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  const bucket = getBucketName();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

/**
 * Get object metadata (size, content-type) without downloading the body.
 */
export async function headObject(
  key: string
): Promise<{ size?: number; contentType?: string }> {
  const client = getR2Client();
  const bucket = getBucketName();

  const response = await client.send(
    new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  return {
    size: response.ContentLength,
    contentType: response.ContentType,
  };
}

/**
 * Generate a short-lived signed URL for private object access.
 *
 * Used when serving assets to the client without making them public.
 * The URL expires after `expiresInSeconds` (default 15 min).
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds = 900
): Promise<string> {
  const client = getR2Client();
  const bucket = getBucketName();

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
    { expiresIn: expiresInSeconds }
  );
}

/**
 * Generate a presigned upload URL for direct client-to-R2 uploads.
 *
 * Used for large media that would exceed the Vercel 4.5MB payload cap.
 */
export async function getSignedUploadUrl(
  key: string,
  expiresInSeconds = 600
): Promise<string> {
  const client = getR2Client();
  const bucket = getBucketName();

  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
    { expiresIn: expiresInSeconds }
  );
}

/**
 * Check if R2 is configured (non-throwing).
 */
export function isR2Configured(): boolean {
  const env = getEnv();
  return Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET_NAME
  );
}
