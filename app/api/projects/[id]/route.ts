import { NextRequest, NextResponse } from 'next/server'
import { getProject, updateProject, deleteProject } from '@/app/actions/projects'
import { z } from 'zod'

interface Params {
  params: Promise<{ id: string }>
}

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  gitUrl: z.string().url().optional(),
  gitBranch: z.string().optional(),
  status: z.enum(['active', 'archived', 'deleted']).optional(),
  sandboxId: z.string().optional(),
})

/**
 * GET /api/projects/[id] - Get project details
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
    return NextResponse.json({
      success: true,
      data: project,
    })
  } catch (error: any) {
    console.error('[v0] Project GET error:', error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch project',
      },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    )
  }
}

/**
 * PUT /api/projects/[id] - Update project
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = updateProjectSchema.parse(body)

    const updated = await updateProject(id, validated)
    return NextResponse.json({
      success: true,
      data: updated,
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

    console.error('[v0] Project PUT error:', error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update project',
      },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    )
  }
}

/**
 * DELETE /api/projects/[id] - Delete project
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

    await deleteProject(id)
    return NextResponse.json({
      success: true,
      message: 'Project deleted',
    })
  } catch (error: any) {
    console.error('[v0] Project DELETE error:', error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete project',
      },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    )
  }
}
