import { NextRequest, NextResponse } from 'next/server'
import { getProject } from '@/app/actions/projects'
import { executeCommand } from '@/app/actions/daytona'
import { z } from 'zod'

interface Params {
  params: Promise<{ id: string }>
}

const executeCommandSchema = z.object({
  command: z.string().min(1, 'Command is required'),
  workingDirectory: z.string().optional(),
})

/**
 * POST /api/projects/[id]/terminal
 * Execute a command in the sandbox
 * Returns streaming SSE response
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

    const project = await getProject(id)
    if (!project.sandboxId) {
      return NextResponse.json(
        { success: false, error: 'Sandbox not provisioned for this project' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = executeCommandSchema.parse(body)

    const encoder = new TextEncoder()

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial message
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'start',
                command: validated.command,
                timestamp: new Date().toISOString(),
              })}\n\n`
            )
          )

          // Execute command
          console.log('[v0] Executing command:', validated.command)
          const result = await executeCommand(id, validated.command, {
            workingDirectory: validated.workingDirectory,
          })

          // Send output
          if (result.output) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'output',
                  data: result.output,
                })}\n\n`
              )
            )
          }

          // Send error if any
          if (result.error) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'error',
                  data: result.error,
                })}\n\n`
              )
            )
          }

          // Send completion
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'complete',
                exitCode: result.exitCode || 0,
                timestamp: new Date().toISOString(),
              })}\n\n`
            )
          )

          controller.close()
        } catch (error: any) {
          console.error('[v0] Command execution error:', error.message)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                data: error instanceof Error ? error.message : 'Command execution failed',
              })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
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

    console.error('[v0] Terminal POST error:', error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to execute command',
      },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    )
  }
}
