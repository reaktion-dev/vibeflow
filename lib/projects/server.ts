import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { files, projects } from '@/lib/db/schema';

async function getAuthenticatedUserId() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  return session.user.id;
}

export async function getAuthorizedProject(projectId: string) {
  const userId = await getAuthenticatedUserId();

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

  if (!project) {
    throw new Error('Project not found');
  }

  return project;
}

export async function listAuthorizedProjectFiles(projectId: string) {
  await getAuthorizedProject(projectId);

  return db.select().from(files).where(eq(files.projectId, projectId)).orderBy(files.path);
}

export async function getAuthorizedProjectFile(projectId: string, path: string) {
  await getAuthorizedProject(projectId);

  const [file] = await db
    .select()
    .from(files)
    .where(and(eq(files.projectId, projectId), eq(files.path, path)));

  if (!file) {
    throw new Error('File not found');
  }

  return file;
}

export async function upsertAuthorizedProjectFile(
  projectId: string,
  input: {
    path: string;
    content: string;
  }
) {
  await getAuthorizedProject(projectId);

  const [existing] = await db
    .select()
    .from(files)
    .where(and(eq(files.projectId, projectId), eq(files.path, input.path)));

  if (existing) {
    const [updated] = await db
      .update(files)
      .set({
        content: input.content,
        updatedAt: new Date(),
      })
      .where(eq(files.id, existing.id))
      .returning();

    return updated;
  }

  const userId = await getAuthenticatedUserId();

  const [created] = await db
    .insert(files)
    .values({
      id: nanoid(),
      projectId,
      userId,
      path: input.path,
      content: input.content,
    })
    .returning();

  return created;
}

export async function deleteAuthorizedProjectFile(projectId: string, path: string) {
  await getAuthorizedProject(projectId);

  await db
    .delete(files)
    .where(and(eq(files.projectId, projectId), eq(files.path, path)));
}
