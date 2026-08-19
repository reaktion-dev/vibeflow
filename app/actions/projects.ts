'use server'

import { nanoid } from 'nanoid'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projects, files, conversations, chatMessages, codeProjectTable, designProjectTable, videoProjectTable, workflowDetailTable } from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

// ── Project CRUD ─────────────────────────────────────────────────────────────

export async function getProjects() {
  const userId = await getUserId()
  return db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt))
}

export async function getProject(projectId: string) {
  const userId = await getUserId()
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
  if (!project) throw new Error('Project not found')
  return project
}

export async function createProject(input: {
  name: string
  description?: string
  type?: 'code' | 'design' | 'video' | 'flow'
  gitUrl?: string
  gitBranch?: string
  template?: string
}) {
  const userId = await getUserId()

  if (!input.name || input.name.trim().length === 0) {
    throw new Error('Project name is required')
  }
  if (input.name.length > 255) {
    throw new Error('Project name must be less than 255 characters')
  }

  const projectId = nanoid()
  const projectType = input.type ?? 'code'

  const [project] = await db
    .insert(projects)
    .values({
      id: projectId,
      userId,
      name: input.name.trim(),
      description: input.description?.trim(),
      type: projectType,
      status: 'active',
      gitUrl: input.gitUrl?.trim(),
      gitBranch: input.gitBranch || 'main',
      template: input.template || 'blank',
    })
    .returning()

  // Seed the type-specific detail table
  const detailId = nanoid()
  switch (projectType) {
    case 'code':
      await db.insert(codeProjectTable).values({
        id: detailId,
        projectId,
        framework: input.template || 'blank',
        language: 'typescript',
        packageManager: 'pnpm',
        repoBranch: input.gitBranch || 'main',
      })
      break
    case 'design':
      await db.insert(designProjectTable).values({
        id: detailId,
        projectId,
      })
      break
    case 'video':
      await db.insert(videoProjectTable).values({
        id: detailId,
        projectId,
      })
      break
    case 'flow':
      await db.insert(workflowDetailTable).values({
        id: detailId,
        projectId,
      })
      break
  }

  revalidatePath('/')
  return project
}

export async function updateProject(
  projectId: string,
  input: {
    name?: string
    description?: string
    gitUrl?: string
    gitBranch?: string
    status?: 'active' | 'archived' | 'deleted'
    sandboxId?: string
  }
) {
  const userId = await getUserId()

  await getProject(projectId)

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  }

  if (input.name !== undefined) {
    if (input.name.trim().length === 0) throw new Error('Project name cannot be empty')
    updateData.name = input.name.trim()
  }
  if (input.description !== undefined) updateData.description = input.description.trim()
  if (input.gitUrl !== undefined) updateData.gitUrl = input.gitUrl.trim()
  if (input.gitBranch !== undefined) updateData.gitBranch = input.gitBranch.trim()
  if (input.status !== undefined) updateData.status = input.status
  if (input.sandboxId !== undefined) updateData.sandboxId = input.sandboxId

  const [updated] = await db
    .update(projects)
    .set(updateData)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning()

  revalidatePath('/')
  return updated
}

export async function deleteProject(projectId: string) {
  const userId = await getUserId()

  await getProject(projectId)

  // Delete related data (cascade handles most, but be explicit for chat)
  await db.delete(files).where(eq(files.projectId, projectId))

  // Delete conversations and their messages
  const convos = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.projectId, projectId))
  for (const convo of convos) {
    await db.delete(chatMessages).where(eq(chatMessages.conversationId, convo.id))
  }
  await db.delete(conversations).where(eq(conversations.projectId, projectId))

  await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))

  revalidatePath('/')
}

// ── File operations ──────────────────────────────────────────────────────────

export async function getProjectFiles(projectId: string) {
  const userId = await getUserId()
  await getProject(projectId)

  return db
    .select()
    .from(files)
    .where(and(eq(files.projectId, projectId), eq(files.userId, userId)))
    .orderBy(files.path)
}

export async function getFile(projectId: string, filePath: string) {
  const userId = await getUserId()
  await getProject(projectId)

  const [file] = await db
    .select()
    .from(files)
    .where(
      and(
        eq(files.projectId, projectId),
        eq(files.userId, userId),
        eq(files.path, filePath)
      )
    )

  if (!file) throw new Error('File not found')
  return file
}

export async function upsertFile(
  projectId: string,
  input: {
    path: string
    content: string
    language?: string
  }
) {
  const userId = await getUserId()
  await getProject(projectId)

  if (!input.path || input.path.trim().length === 0) {
    throw new Error('File path is required')
  }

  const [existing] = await db
    .select()
    .from(files)
    .where(
      and(
        eq(files.projectId, projectId),
        eq(files.userId, userId),
        eq(files.path, input.path)
      )
    )

  if (existing) {
    const [updated] = await db
      .update(files)
      .set({
        content: input.content,
        language: input.language,
        sizeBytes: Buffer.byteLength(input.content, 'utf-8'),
        updatedAt: new Date(),
      })
      .where(eq(files.id, existing.id))
      .returning()
    return updated
  } else {
    const [created] = await db
      .insert(files)
      .values({
        id: nanoid(),
        projectId,
        userId,
        path: input.path,
        content: input.content,
        language: input.language,
        sizeBytes: Buffer.byteLength(input.content, 'utf-8'),
      })
      .returning()
    return created
  }
}

export async function deleteFile(projectId: string, filePath: string) {
  const userId = await getUserId()
  await getProject(projectId)

  await db
    .delete(files)
    .where(
      and(
        eq(files.projectId, projectId),
        eq(files.userId, userId),
        eq(files.path, filePath)
      )
    )

  revalidatePath(`/projects/${projectId}`)
}

// ── Chat operations (conversation-based) ─────────────────────────────────────

export async function getOrCreateConversation(projectId: string) {
  const userId = await getUserId()
  await getProject(projectId)

  // Get or create the default conversation for this project
  const [existing] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.projectId, projectId),
        eq(conversations.status, 'active')
      )
    )
    .orderBy(desc(conversations.createdAt))
    .limit(1)

  if (existing) return existing

  const [created] = await db
    .insert(conversations)
    .values({
      id: nanoid(),
      projectId,
      title: 'Chat',
      status: 'active',
    })
    .returning()

  return created
}

export async function getChatMessages(projectId: string) {
  const userId = await getUserId()
  await getProject(projectId)

  const convo = await getOrCreateConversation(projectId)

  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, convo.id))
    .orderBy(chatMessages.createdAt)
}

export async function addChatMessage(
  projectId: string,
  input: {
    role: 'user' | 'assistant' | 'system' | 'tool'
    content: string
    model?: string
  }
) {
  await getProject(projectId)
  const convo = await getOrCreateConversation(projectId)

  if (!input.role || !input.content) {
    throw new Error('Role and content are required')
  }

  const [message] = await db
    .insert(chatMessages)
    .values({
      id: nanoid(),
      conversationId: convo.id,
      role: input.role,
      content: input.content,
      model: input.model,
    })
    .returning()

  return message
}

export async function deleteChatMessages(projectId: string) {
  await getProject(projectId)
  const convo = await getOrCreateConversation(projectId)

  await db
    .delete(chatMessages)
    .where(eq(chatMessages.conversationId, convo.id))
}
