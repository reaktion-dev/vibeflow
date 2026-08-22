import { tool } from 'ai';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';

import { getToolContext } from './context';
import { getAuthorizedProject, listAuthorizedProjectFiles } from '@/lib/projects/server';
import { createZipBuffer } from '@/lib/utils/zip';
import { createAsset, getAssetDownloadUrl } from '@/lib/artifacts/service';
import { db } from '@/lib/db';
import { accountTable } from '@/lib/db/schema';
import axios from 'axios';

export function createWorkspaceExportTools() {
  return {
    exportProjectZip: tool({
      description:
        'Package the current project workspace into a downloadable .zip archive. Returns a direct download URL.',
      inputSchema: z.object({
        filename: z
          .string()
          .optional()
          .describe('Custom filename for the zip (defaults to project name)'),
      }),
      execute: async ({ filename }) => {
        const { projectId } = getToolContext();
        const project = await getAuthorizedProject(projectId);
        const files = await listAuthorizedProjectFiles(projectId);

        const entries = files.map((f) => ({
          path: f.path,
          content: f.content || '',
        }));

        const zipBuffer = createZipBuffer(entries);
        const name = filename || `${project.name.toLowerCase().replace(/[^a-z0-9-_]/g, '-')}.zip`;

        const asset = await createAsset({
          projectId,
          name,
          type: 'export',
          mimeType: 'application/zip',
          body: zipBuffer,
        });

        const downloadUrl = await getAssetDownloadUrl(projectId, asset.id);

        return {
          success: true,
          assetId: asset.id,
          filename: name,
          sizeBytes: zipBuffer.length,
          fileCount: entries.length,
          downloadUrl,
          message: `Successfully packaged ${entries.length} files into ${name}.`,
        };
      },
    }),

    createGitHubPR: tool({
      description:
        'Create a new GitHub branch and open a Pull Request with the current project files.',
      inputSchema: z.object({
        repoUrl: z
          .string()
          .describe('GitHub repository URL or "owner/repo" (e.g. "octocat/Hello-World")'),
        title: z.string().describe('Pull Request title'),
        description: z
          .string()
          .optional()
          .describe('Pull Request description/body in markdown'),
        branchName: z
          .string()
          .optional()
          .describe('New branch name (e.g. "feat/game-prototype")'),
        githubToken: z
          .string()
          .optional()
          .describe('Optional GitHub Personal Access Token (if not using OAuth session)'),
      }),
      execute: async ({ repoUrl, title, description, branchName, githubToken }) => {
        const { projectId, userId } = getToolContext();
        const project = await getAuthorizedProject(projectId);
        const files = await listAuthorizedProjectFiles(projectId);

        // Resolve GitHub token
        let token = githubToken;
        if (!token) {
          const [ghAccount] = await db
            .select()
            .from(accountTable)
            .where(
              and(
                eq(accountTable.userId, userId),
                eq(accountTable.providerId, 'github')
              )
            )
            .limit(1);

          token = ghAccount?.accessToken || undefined;
        }

        if (!token) {
          throw new Error(
            'GitHub authentication not found. Please provide a githubToken or sign in with GitHub.'
          );
        }

        // Parse owner/repo
        const cleanRepo = repoUrl
          .replace(/^https?:\/\/github\.com\//i, '')
          .replace(/\.git$/i, '')
          .trim();

        const [owner, repo] = cleanRepo.split('/');
        if (!owner || !repo) {
          throw new Error(`Invalid repository format: "${repoUrl}". Expected "owner/repo".`);
        }

        const ghClient = axios.create({
          baseURL: 'https://api.github.com',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'Vibeflow-CodingAgent',
          },
        });

        // 1. Get default branch & base commit SHA
        const { data: repoData } = await ghClient.get(`/repos/${owner}/${repo}`);
        const defaultBranch = repoData.default_branch || 'main';

        const { data: refData } = await ghClient.get(
          `/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`
        );
        const baseCommitSha = refData.object.sha;

        // 2. Create new branch ref
        const newBranch = branchName || `vibeflow-${Date.now().toString(36)}`;
        try {
          await ghClient.post(`/repos/${owner}/${repo}/git/refs`, {
            ref: `refs/heads/${newBranch}`,
            sha: baseCommitSha,
          });
        } catch (err: any) {
          // If branch exists, continue
          if (err.response?.status !== 422) throw err;
        }

        // 3. Create tree with files
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
        const commitMessage = `${title}\n\nAutomated commit via Vibeflow Coding Agent`;
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

        // 6. Create Pull Request
        const prBody =
          description ||
          `### Description\n${title}\n\nGenerated by Vibeflow Coding Agent for project: **${project.name}**.`;

        const { data: prData } = await ghClient.post(`/repos/${owner}/${repo}/pulls`, {
          title,
          body: prBody,
          head: newBranch,
          base: defaultBranch,
        });

        return {
          success: true,
          prUrl: prData.html_url,
          prNumber: prData.number,
          branch: newBranch,
          baseBranch: defaultBranch,
          message: `Pull Request #${prData.number} created successfully: ${prData.html_url}`,
        };
      },
    }),
  };
}
