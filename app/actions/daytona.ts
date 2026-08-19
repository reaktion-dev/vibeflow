'use server'

import { getDaytonaClient } from '@/lib/daytona/client'
import { updateProject, getProject } from './projects'

const daytona = getDaytonaClient()

/**
 * Provision a new Daytona sandbox for a project
 */
export async function provisionSandbox(projectId: string) {
  try {
    const project = await getProject(projectId)

    console.log('[v0] Provisioning sandbox for project:', project.name)

    // Update project status to provisioning
    await updateProject(projectId, { status: 'active' })

    // Create sandbox in Daytona
    const sandbox = await daytona.createSandbox({
      name: project.name,
      project: project.template || 'blank',
    })

    console.log('[v0] Sandbox created:', sandbox.id)

    // Update project with sandbox ID
    const updated = await updateProject(projectId, {
      sandboxId: sandbox.id,
    })

    return updated
  } catch (error: any) {
    console.error('[v0] Failed to provision sandbox:', error.message)
    throw error
  }
}

/**
 * Get sandbox status
 */
export async function getSandboxStatus(projectId: string) {
  try {
    const project = await getProject(projectId)

    if (!project.sandboxId) {
      return {
        status: 'not_provisioned',
      }
    }

    const sandbox = await daytona.getSandbox(project.sandboxId)
    return {
      status: sandbox.status || 'unknown',
      sandbox,
    }
  } catch (error: any) {
    console.error('[v0] Failed to get sandbox status:', error.message)
    throw error
  }
}

/**
 * Execute a command in the project's sandbox
 */
export async function executeCommand(
  projectId: string,
  command: string,
  options?: {
    workingDirectory?: string
    environment?: Record<string, string>
  }
) {
  try {
    const project = await getProject(projectId)

    if (!project.sandboxId) {
      throw new Error('Sandbox not provisioned for this project')
    }

    console.log('[v0] Executing command:', command)

    const result = await daytona.executeCommand(project.sandboxId, command, options)
    return result
  } catch (error: any) {
    console.error('[v0] Failed to execute command:', error.message)
    throw error
  }
}

/**
 * Read a file from the sandbox
 */
export async function readSandboxFile(projectId: string, filePath: string) {
  try {
    const project = await getProject(projectId)

    if (!project.sandboxId) {
      throw new Error('Sandbox not provisioned for this project')
    }

    const content = await daytona.readFile(project.sandboxId, filePath)
    return content
  } catch (error: any) {
    console.error('[v0] Failed to read file:', error.message)
    throw error
  }
}

/**
 * Write a file to the sandbox
 */
export async function writeSandboxFile(
  projectId: string,
  filePath: string,
  content: string
) {
  try {
    const project = await getProject(projectId)

    if (!project.sandboxId) {
      throw new Error('Sandbox not provisioned for this project')
    }

    await daytona.writeFile(project.sandboxId, filePath, content)
  } catch (error: any) {
    console.error('[v0] Failed to write file:', error.message)
    throw error
  }
}

/**
 * Delete a file from the sandbox
 */
export async function deleteSandboxFile(projectId: string, filePath: string) {
  try {
    const project = await getProject(projectId)

    if (!project.sandboxId) {
      throw new Error('Sandbox not provisioned for this project')
    }

    await daytona.deleteFile(project.sandboxId, filePath)
  } catch (error: any) {
    console.error('[v0] Failed to delete file:', error.message)
    throw error
  }
}

/**
 * List files in sandbox directory
 */
export async function listSandboxFiles(
  projectId: string,
  dirPath: string = '/'
) {
  try {
    const project = await getProject(projectId)

    if (!project.sandboxId) {
      throw new Error('Sandbox not provisioned for this project')
    }

    const files = await daytona.listFiles(project.sandboxId, dirPath)
    return files
  } catch (error: any) {
    console.error('[v0] Failed to list files:', error.message)
    throw error
  }
}

/**
 * Clone a Git repository into the sandbox
 */
export async function cloneGitRepository(
  projectId: string,
  repoUrl: string,
  options?: {
    branch?: string
  }
) {
  try {
    const project = await getProject(projectId)

    if (!project.sandboxId) {
      throw new Error('Sandbox not provisioned for this project')
    }

    console.log('[v0] Cloning repository:', repoUrl)

    const result = await daytona.initGit(project.sandboxId, repoUrl, {
      branch: options?.branch || 'main',
    })

    return result
  } catch (error: any) {
    console.error('[v0] Failed to clone repository:', error.message)
    throw error
  }
}

/**
 * Get Git status
 */
export async function getGitStatus(projectId: string) {
  try {
    const project = await getProject(projectId)

    if (!project.sandboxId) {
      throw new Error('Sandbox not provisioned for this project')
    }

    const status = await daytona.getGitStatus(project.sandboxId)
    return status
  } catch (error: any) {
    console.error('[v0] Failed to get git status:', error.message)
    throw error
  }
}

/**
 * Delete a sandbox
 */
export async function deleteSandbox(projectId: string) {
  try {
    const project = await getProject(projectId)

    if (!project.sandboxId) {
      return
    }

    console.log('[v0] Deleting sandbox:', project.sandboxId)

    await daytona.deleteSandbox(project.sandboxId)
    await updateProject(projectId, {
      sandboxId: undefined,
    })
  } catch (error: any) {
    console.error('[v0] Failed to delete sandbox:', error.message)
    throw error
  }
}
