import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import axios from 'axios';
import { eq, and } from 'drizzle-orm';

import { getAuthorizedProject, listAuthorizedProjectFiles } from '@/lib/projects/server';
import { db } from '@/lib/db';
import { accountTable } from '@/lib/db/schema';

export const maxDuration = 30;

const prRequestSchema = z.object({
  repoUrl: z.string().min(1, 'Repository URL is required'),
  title: z.string().min(1, 'PR title is required'),
  description: z.string().optional(),
  branchName: z.string().optional(),
  githubToken: z.string().optional(),
});

/**
 * POST /api/projects/[id]/github-pr
 * Open a GitHub Pull Request with the project files.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const project = await getAuthorizedProject(projectId);
    const body = prRequestSchema.parse(await request.json());
    const files = await listAuthorizedProjectFiles(projectId);

    // Resolve GitHub Token
    let token = body.githubToken;
    if (!token) {
      const [ghAccount] = await db
        .select()
        .from(accountTable)
        .where(
          and(
            eq(accountTable.userId, project.userId),
            eq(accountTable.providerId, 'github')
          )
        )
        .limit(1);

      token = ghAccount?.accessToken || undefined;
    }

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            'GitHub authentication not found. Please provide a GitHub token or connect your GitHub account.',
        },
        { status: 400 }
      );
    }

    // Parse repository owner and name
    const cleanRepo = body.repoUrl
      .replace(/^https?:\/\/github\.com\//i, '')
      .replace(/\.git$/i, '')
      .trim();

    const [owner, repo] = cleanRepo.split('/');
    if (!owner || !repo) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid repository: "${body.repoUrl}". Expected "owner/repo" format.`,
        },
        { status: 400 }
      );
    }

    const ghClient = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Vibeflow-App',
      },
    });

    // 1. Get default branch & commit SHA
    const { data: repoData } = await ghClient.get(`/repos/${owner}/${repo}`);
    const defaultBranch = repoData.default_branch || 'main';

    const { data: refData } = await ghClient.get(
      `/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`
    );
    const baseCommitSha = refData.object.sha;

    // 2. Create new branch ref
    const newBranch = body.branchName || `vibeflow-${Date.now().toString(36)}`;
    try {
      await ghClient.post(`/repos/${owner}/${repo}/git/refs`, {
        ref: `refs/heads/${newBranch}`,
        sha: baseCommitSha,
      });
    } catch (err: any) {
      if (err.response?.status !== 422) throw err;
    }

    // 3. Create tree with project files
    const treeItems = files.map((f) => ({
      path: f.path.replace(/^\//, ''),
      mode: '100644',
      type: 'blob',
      content: f.content || '',
    }));

    const { data: treeData } = await ghClient.post(`/repos/${owner}/${repo}/git/trees`, {
      base_tree: baseCommitSha,
      tree: treeItems,
    });

    // 4. Create commit
    const commitMessage = `${body.title}\n\nAutomated commit via Vibeflow`;
    const { data: commitData } = await ghClient.post(`/repos/${owner}/${repo}/git/commits`, {
      message: commitMessage,
      tree: treeData.sha,
      parents: [baseCommitSha],
    });

    // 5. Update branch ref
    await ghClient.patch(`/repos/${owner}/${repo}/git/refs/heads/${newBranch}`, {
      sha: commitData.sha,
      force: true,
    });

    // 6. Open Pull Request
    const prBody =
      body.description ||
      `### Overview\n${body.title}\n\nCreated automatically by Vibeflow for project **${project.name}**.`;

    const { data: prData } = await ghClient.post(`/repos/${owner}/${repo}/pulls`, {
      title: body.title,
      body: prBody,
      head: newBranch,
      base: defaultBranch,
    });

    return NextResponse.json({
      success: true,
      data: {
        prUrl: prData.html_url,
        prNumber: prData.number,
        branch: newBranch,
        baseBranch: defaultBranch,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[vibeflow] GitHub PR error:', error.response?.data || error.message);
    const message =
      error.response?.data?.message ||
      (error instanceof Error ? error.message : 'Failed to create Pull Request');

    return NextResponse.json(
      { success: false, error: message },
      { status: error.response?.status || 500 }
    );
  }
}
