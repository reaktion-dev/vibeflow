import { NextRequest, NextResponse } from 'next/server'
import { getProject, getProjectFiles, getFile, upsertFile, deleteFile } from '@/app/actions/projects'
import { listSandboxFiles, readSandboxFile, writeSandboxFile, deleteSandboxFile } from '@/app/actions/daytona'
import { z } from 'zod'

interface Params {
  params: Promise<{ id: string }>
}

const readFileSchema = z.object({
  path: z.string().min(1, 'File path is required'),
})

const writeFileSchema = z.object({
  path: z.string().min(1, 'File path is required'),
  content: z.string(),
  language: z.string().optional(),
})

const deleteFileSchema = z.object({
  path: z.string().min(1, 'File path is required'),
})

/**
 * GET /api/projects/[id]/files
 * Query params:
 * - path: directory path to list (defaults to /)
 * - action: 'list' (default) or 'read'
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    const project = await getProject(id)
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'
    const path = searchParams.get('path') || '/'

    if (action === 'read') {
      // Read file from sandbox if present, otherwise database
      if (project.sandboxId) {
        try {
          const content = await readSandboxFile(id, path)
          return NextResponse.json({
            success: true,
            data: { path, content },
          })
        } catch {
          // Fallback to database
        }
      }

      const file = await getFile(id, path).catch(() => null)
      return NextResponse.json({
        success: true,
        data: { path, content: file?.content || '' },
      })
    } else {
      // List from sandbox if available, otherwise database
      if (project.sandboxId) {
        try {
          const files = await listSandboxFiles(id, path)
          return NextResponse.json({
            success: true,
            data: files,
          })
        } catch {
          // Fallback to database
        }
      }

      const dbFiles = await getProjectFiles(id)
      return NextResponse.json({
        success: true,
        data: dbFiles,
      })
    }
  } catch (error: any) {
    console.error('[v0] Files GET error:', error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch files',
      },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    )
  }
}

/**
 * POST /api/projects/[id]/files
 * Write file content
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = writeFileSchema.parse(body)

    // Write to database
    await upsertFile(id, validated)

    // Write to sandbox if available
    const project = await getProject(id)
    if (project.sandboxId) {
      try {
        await writeSandboxFile(id, validated.path, validated.content)
      } catch (e) {
        console.warn('[v0] Sandbox file write failed:', e)
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'File written successfully',
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    console.error('[v0] Files POST error:', error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to write file',
      },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    )
  }
}

/**
 * DELETE /api/projects/[id]/files
 * Delete a file
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = deleteFileSchema.parse(body)

    // Delete from database
    await deleteFile(id, validated.path)

    // Delete from sandbox if available
    const project = await getProject(id)
    if (project.sandboxId) {
      try {
        await deleteSandboxFile(id, validated.path)
      } catch (e) {
        console.warn('[v0] Sandbox file delete failed:', e)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    console.error('[v0] Files DELETE error:', error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete file',
      },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    )
  }
}
