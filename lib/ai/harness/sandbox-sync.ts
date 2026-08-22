import { db } from '@/lib/db';
import { files, projects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { HarnessAgentSession } from '@ai-sdk/harness/agent';

export function getSandboxHandle(session: any): any {
  if (session && typeof session.getSandboxSession === 'function') {
    return session.getSandboxSession();
  }
  return session;
}

/**
 * Seeds files from PostgreSQL into the Harness sandbox workspace on session start.
 */
export async function seedSandboxFromDb({
  session,
  projectId,
  sessionWorkDir,
  abortSignal,
}: {
  session: HarnessAgentSession | any;
  projectId: string;
  sessionWorkDir: string;
  abortSignal?: AbortSignal;
}) {
  const sandbox = getSandboxHandle(session);
  if (!sandbox || typeof sandbox.writeTextFile !== 'function') return;

  try {
    const dbFiles = await db
      .select()
      .from(files)
      .where(eq(files.projectId, projectId));

    if (dbFiles.length === 0) {
      // Create a starter README if project is empty
      await sandbox.writeTextFile({
        path: `${sessionWorkDir}/README.md`,
        content: '# Vibeflow Project\n\nAsk the agent to create or modify code, apps, or games.',
        abortSignal,
      });
      return;
    }

    for (const f of dbFiles) {
      if (f.content != null) {
        const cleanPath = f.path.replace(/^\//, '');
        await sandbox.writeTextFile({
          path: `${sessionWorkDir}/${cleanPath}`,
          content: f.content,
          abortSignal,
        });
      }
    }
  } catch (err) {
    console.warn('[vibeflow] Error seeding sandbox from DB:', err);
  }
}

/**
 * Syncs files created/modified in the sandbox workspace back into PostgreSQL.
 * Called at the end of each agent turn so the DB, Live Preview, and ZIP export are 100% in sync.
 */
export async function syncSandboxToDb({
  session,
  projectId,
  sessionWorkDir = 'workspace',
  abortSignal,
}: {
  session: HarnessAgentSession | any;
  projectId: string;
  sessionWorkDir?: string;
  abortSignal?: AbortSignal;
}) {
  const sandbox = getSandboxHandle(session);
  if (!sandbox || typeof sandbox.run !== 'function' || typeof sandbox.readTextFile !== 'function') {
    return;
  }

  try {
    // 1. Get project to obtain owner userId
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) return;
    const userId = project.userId;

    // 2. Find all non-hidden, non-node_modules files in the workspace directory
    const findResult = await sandbox.run({
      command: `cd "${sessionWorkDir}" 2>/dev/null && find . -maxdepth 6 -type f -not -path "*/.*" -not -path "*node_modules*" -not -path "*dist*" -not -path "*.git*"`,
      abortSignal,
    });

    if (findResult.exitCode !== 0 || !findResult.stdout) {
      return;
    }

    const filePaths = findResult.stdout
      .split('\n')
      .map((p: string) => p.trim())
      .filter((p: string) => p && p !== '.' && !p.startsWith('find:'));

    for (const relPath of filePaths) {
      const cleanRelPath = relPath.replace(/^\.\//, '');
      const fullPath = `${sessionWorkDir}/${cleanRelPath}`;

      try {
        const content = await sandbox.readTextFile({
          path: fullPath,
          abortSignal,
        });

        const normalizedPath = `/${cleanRelPath}`;

        // Upsert into files table
        const [existing] = await db
          .select()
          .from(files)
          .where(and(eq(files.projectId, projectId), eq(files.path, normalizedPath)))
          .limit(1);

        if (existing) {
          if (existing.content !== content) {
            await db
              .update(files)
              .set({
                content,
                sizeBytes: Buffer.byteLength(content, 'utf-8'),
                updatedAt: new Date(),
              })
              .where(eq(files.id, existing.id));
          }
        } else {
          await db.insert(files).values({
            id: nanoid(),
            projectId,
            userId,
            path: normalizedPath,
            content,
            sizeBytes: Buffer.byteLength(content, 'utf-8'),
          });
        }
      } catch (readErr) {
        // Ignore read errors for binary or transient files
      }
    }
  } catch (err) {
    console.warn('[vibeflow] Error syncing sandbox files to DB:', err);
  }
}
