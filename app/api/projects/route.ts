import { NextRequest, NextResponse } from 'next/server'
import { getProjects, createProject } from '@/app/actions/projects'
import { z } from 'zod'

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().optional(),
  type: z.enum(['code', 'design', 'video', 'flow']).default('code'),
  gitUrl: z.string().url().optional(),
  gitBranch: z.string().default('main'),
  template: z.string().default('blank'),
})

/**
 * GET /api/projects - List all projects for the authenticated user
 */
export async function GET() {
  try {
    const projectList = await getProjects()
    return NextResponse.json({
      success: true,
      data: projectList,
    })
  } catch (error: any) {
    console.error('[v0] Projects GET error:', error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch projects',
      },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    )
  }
}

/**
 * POST /api/projects - Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validated = createProjectSchema.parse(body)

    // Create project
    const project = await createProject(validated)

    return NextResponse.json(
      {
        success: true,
        data: project,
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

    console.error('[v0] Projects POST error:', error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create project',
      },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    )
  }
}
