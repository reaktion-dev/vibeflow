import { NextRequest, NextResponse } from 'next/server';

import { getAsset, getAssetBuffer } from '@/lib/artifacts/service';
import { getAuthorizedProject } from '@/lib/projects/server';

interface Params {
  params: Promise<{ id: string; assetId: string }>;
}

/**
 * GET /api/projects/[id]/assets/[assetId] — Serve or download asset
 *
 * Streams the asset buffer directly from R2/storage through the server.
 * This guarantees same-origin delivery without CORS redirect errors in browser fetch() and canvas editors.
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: projectId, assetId } = await params;
    await getAuthorizedProject(projectId);

    const asset = await getAsset(projectId, assetId);
    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get('download') === '1' || searchParams.get('download') === 'true';

    // Stream buffer directly through Next.js server to prevent CORS breakage on cross-origin R2 redirects
    const buffer = await getAssetBuffer(assetId);

    const headers: Record<string, string> = {
      'Content-Type': asset.mimeType ?? 'application/octet-stream',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    };

    if (isDownload) {
      headers['Content-Disposition'] = `attachment; filename="${asset.name}"`;
    }

    return new NextResponse(new Uint8Array(buffer), { headers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get asset' },
      { status: error.message?.includes('Unauthorized') ? 401 : 404 }
    );
  }
}
