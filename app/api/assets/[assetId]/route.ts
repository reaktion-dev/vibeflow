import { NextRequest, NextResponse } from 'next/server';
import { getAssetBuffer } from '@/lib/artifacts/service';
import { db } from '@/lib/db';
import { assetTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface Params {
  params: Promise<{ assetId: string }>;
}

/**
 * GET /api/assets/[assetId] — Direct Asset Resolver Alias
 *
 * Resolves project assets by asset ID directly to support universal asset references
 * and backwards-compatible embedded template URLs.
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { assetId } = await params;

    const [asset] = await db
      .select()
      .from(assetTable)
      .where(eq(assetTable.id, assetId));

    if (!asset) {
      return NextResponse.json(
        { success: false, error: `Asset not found: ${assetId}` },
        { status: 404 }
      );
    }

    const buffer = await getAssetBuffer(assetId);
    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get('download') === '1' || searchParams.get('download') === 'true';

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
      { status: 500 }
    );
  }
}
