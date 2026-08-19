'use client';

import { useState } from 'react';
import { X, Code2, Palette, Video, Workflow, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

type WorkspaceType = 'code' | 'design' | 'video' | 'flow';

interface ProjectCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const WORKSPACE_TYPES: {
  id: WorkspaceType;
  label: string;
  description: string;
  icon: typeof Code2;
  color: string;
  bgColor: string;
}[] = [
  {
    id: 'code',
    label: 'Code Workspace',
    description: 'AI-powered coding agent with file editing, terminal, and sandbox',
    icon: Code2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'design',
    label: 'Design Canvas',
    description: 'Visual design workspace with AI image generation and layers',
    icon: Palette,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    id: 'video',
    label: 'Video Studio',
    description: 'Remotion-based video composition with timeline and templates',
    icon: Video,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    id: 'flow',
    label: 'Workflow Builder',
    description: 'Visual node-based agent orchestration and automation',
    icon: Workflow,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
];

export function ProjectCreationModal({
  isOpen,
  onClose,
  onSuccess,
}: ProjectCreationModalProps) {
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [gitUrl, setGitUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const selectedType = WORKSPACE_TYPES.find((t) => t.id === workspaceType);

  const handleCreate = async () => {
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    setIsLoading(true);
    try {
      const body: Record<string, any> = {
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
        type: workspaceType ?? 'code',
      };

      // Only include gitUrl if provided and it's a code project
      if (workspaceType === 'code' && gitUrl.trim()) {
        body.gitUrl = gitUrl.trim();
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create project');
      }

      toast.success(`${selectedType?.label ?? 'Project'} created!`);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('type');
    setWorkspaceType(null);
    setProjectName('');
    setProjectDescription('');
    setGitUrl('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {step === 'type' ? 'Create a New Project' : 'Project Details'}
            </h2>
            {step === 'details' && selectedType && (
              <p className="text-sm text-muted-foreground mt-1">
                Setting up a {selectedType.label}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'type' ? (
            <div className="space-y-3">
              {WORKSPACE_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = workspaceType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      setWorkspaceType(type.id);
                      setStep('details');
                    }}
                    className={cn(
                      'w-full p-4 rounded-lg border text-left transition flex items-center gap-3',
                      isSelected
                        ? 'bg-primary/10 border-primary/50'
                        : 'bg-muted border-border hover:border-primary/50'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                        type.bgColor
                      )}
                    >
                      <Icon className={cn('h-5 w-5', type.color)} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">
                        {type.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {type.description}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected type badge */}
              {selectedType && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1.5">
                    <selectedType.icon className={cn('h-3 w-3', selectedType.color)} />
                    {selectedType.label}
                  </Badge>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My awesome project"
                  autoFocus
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && projectName.trim()) {
                      handleCreate();
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description{' '}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="What are you building?"
                  rows={2}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              {workspaceType === 'code' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Git Repository URL{' '}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="url"
                    value={gitUrl}
                    onChange={(e) => setGitUrl(e.target.value)}
                    placeholder="https://github.com/user/repo.git"
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports HTTPS, SSH, and GitHub URLs
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/50">
          <Button
            variant="ghost"
            onClick={() => {
              if (step === 'details') {
                handleBack();
              } else {
                onClose();
              }
            }}
          >
            {step === 'type' ? (
              'Cancel'
            ) : (
              <>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </>
            )}
          </Button>
          {step === 'details' && (
            <Button
              onClick={handleCreate}
              disabled={!projectName.trim() || isLoading}
              className="gap-2"
            >
              {isLoading && (
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              )}
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
