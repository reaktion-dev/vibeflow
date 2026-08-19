import { NextRequest, NextResponse } from 'next/server';

import { getAsset, getAssetBuffer } from '@/lib/artifacts/service';
import { getAuthorizedProject } from '@/lib/projects/server';
import { isR2Configured, getSignedDownloadUrl } from '@/lib/storage/r2';

interface Params {
  params: Promise<{ id: string; assetId: string }>;
}

/**
 * GET /api/projects/[id]/assets/[assetId] — Download or redirect to asset
 *
 * If R2 is configured, returns a 302 redirect to a signed URL.
 * If R2 is not configured (dev), streams the buffer directly.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id: projectId, assetId } = await params;
    await getAuthorizedProject(projectId);

    const asset = await getAsset(projectId, assetId);

    // If R2 is configured, redirect to a signed URL
    if (isR2Configured()) {
      const url = await getSignedDownloadUrl(asset.url, 900);
      return NextResponse.redirect(url);
    }

    // Dev fallback: stream the buffer directly
    const buffer = await getAssetBuffer(assetId);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': asset.mimeType ?? 'application/octet-stream',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get asset' },
      { status: error.message?.includes('Unauthorized') ? 401 : 404 }
    );
  }
}
