'use client';

import { useState } from 'react';
import { Download, GitPullRequest, ExternalLink, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface ProjectExportDropdownProps {
  projectId: string;
  projectName: string;
  onOpenPreviewTab?: () => void;
}

export function ProjectExportDropdown({
  projectId,
  projectName,
  onOpenPreviewTab,
}: ProjectExportDropdownProps) {
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isPrModalOpen, setIsPrModalOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [prTitle, setPrTitle] = useState(`Feature: ${projectName}`);
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [createdPrUrl, setCreatedPrUrl] = useState<string | null>(null);

  const handleDownloadZip = async () => {
    try {
      setIsExportingZip(true);
      const res = await fetch(`/api/projects/${projectId}/zip`);
      if (!res.ok) throw new Error('Failed to generate ZIP');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.toLowerCase().replace(/[^a-z0-9-_]/g, '-') || 'project'}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('ZIP package downloaded successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Download failed');
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleCreatePr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim() || !prTitle.trim()) {
      toast.error('Repository URL and Title are required');
      return;
    }

    try {
      setIsCreatingPr(true);
      const res = await fetch(`/api/projects/${projectId}/github-pr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          title: prTitle.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create Pull Request');
      }

      setCreatedPrUrl(data.data.prUrl);
      toast.success(`PR #${data.data.prNumber} opened on GitHub!`);
    } catch (err: any) {
      toast.error(err.message || 'PR creation failed');
    } finally {
      setIsCreatingPr(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        {onOpenPreviewTab && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenPreviewTab}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            title="Open Live Preview in New Tab"
          >
            <ExternalLink className="size-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadZip}
          disabled={isExportingZip}
          className="h-8 gap-1.5 text-xs font-medium"
        >
          {isExportingZip ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          <span>Download ZIP</span>
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={() => setIsPrModalOpen(true)}
          className="h-8 gap-1.5 text-xs font-medium"
        >
          <GitPullRequest className="size-3.5" />
          <span className="hidden sm:inline">Create PR</span>
        </Button>
      </div>

      {/* PR Creation Modal */}
      {isPrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <GitPullRequest className="size-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Open GitHub Pull Request</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPrModalOpen(false);
                  setCreatedPrUrl(null);
                }}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>

            {createdPrUrl ? (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-xs text-green-600">
                  <Check className="size-4 shrink-0" />
                  <span>Pull Request successfully opened!</span>
                </div>
                <a
                  href={createdPrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition"
                >
                  View Pull Request on GitHub
                  <ExternalLink className="size-3" />
                </a>
              </div>
            ) : (
              <form onSubmit={handleCreatePr} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">GitHub Repository</label>
                  <input
                    type="text"
                    required
                    placeholder="owner/repo (e.g. facebook/react)"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-[11px] text-muted-foreground">Uses your GitHub account connection or token</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Pull Request Title</label>
                  <input
                    type="text"
                    required
                    value={prTitle}
                    onChange={(e) => setPrTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPrModalOpen(false)}
                    disabled={isCreatingPr}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isCreatingPr}
                    className="text-xs gap-1.5"
                  >
                    {isCreatingPr && <Loader2 className="size-3 animate-spin" />}
                    Open PR
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
