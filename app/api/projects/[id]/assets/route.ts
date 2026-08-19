import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { listAssets, deleteAsset, getAssetDownloadUrl } from '@/lib/artifacts/service';
import { getAuthorizedProject } from '@/lib/projects/server';
import { assetTypeEnum } from '@/lib/artifacts/contracts';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id]/assets — List all assets for a project
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: projectId } = await params;
    await getAuthorizedProject(projectId);

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type');

    const assets = await listAssets(
      projectId,
      typeFilter ? (assetTypeEnum.parse(typeFilter)) : undefined
    );

    // Parse metadata for each asset and return a clean shape
    const data = assets.map((a) => {
      let metadata: any = {};
      try {
        metadata = JSON.parse(a.metadata || '{}');
      } catch {
        metadata = {};
      }
      return {
        id: a.id,
        name: a.name,
        type: a.type,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
        status: metadata.status ?? 'ready',
        createdAt: a.createdAt,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list assets' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]/assets?assetId=xxx — Delete an asset
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id: projectId } = await params;
    await getAuthorizedProject(projectId);

    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');

    if (!assetId) {
      return NextResponse.json(
        { success: false, error: 'assetId query parameter is required' },
        { status: 400 }
      );
    }

    await deleteAsset(projectId, assetId);

    return NextResponse.json({ success: true, message: 'Asset deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete asset' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
