import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedProject, listAuthorizedProjectFiles } from '@/lib/projects/server';
import { createZipBuffer } from '@/lib/utils/zip';

export const maxDuration = 30;

/**
 * GET /api/projects/[id]/zip
 * Stream a zip archive of the project workspace directly to the user.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const project = await getAuthorizedProject(projectId);
    const files = await listAuthorizedProjectFiles(projectId);

    const entries = files.map((f) => ({
      path: f.path,
      content: f.content || '',
    }));

    const zipBuffer = createZipBuffer(entries);
    const cleanProjectName = project.name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const filename = `${cleanProjectName || 'project'}.zip`;

    return new Response(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(zipBuffer.length),
      },
    });
  } catch (error) {
    console.error('[vibeflow] ZIP download error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate ZIP';
    return NextResponse.json(
      { success: false, error: message },
      { status: message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
