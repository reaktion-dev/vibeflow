'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useProjects, useCreateProject } from '@/hooks/useProject';
import { Project } from '@/lib/types';
import toast from 'react-hot-toast';
import { Plus, Zap, GitBranch, Calendar } from 'lucide-react';

export function ProjectList() {
  const { projects, isLoading, mutate } = useProjects();
  const createProject = useCreateProject();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gitUrl: '',
    description: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      setIsCreating(true);
      await createProject(
        formData.name,
        formData.gitUrl || undefined,
        formData.description
      );
      toast.success('Project created successfully');
      setFormData({ name: '', gitUrl: '', description: '' });
      setShowForm(false);
      mutate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create project'
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 bg-card rounded-lg border border-border animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projects</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Project Name
              </label>
              <input
                type="text"
                placeholder="My awesome project"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Git Repository URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://github.com/user/repo.git"
                value={formData.gitUrl}
                onChange={(e) =>
                  setFormData({ ...formData, gitUrl: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                placeholder="What is this project about?"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isCreating}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Project'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ name: '', gitUrl: '', description: '' });
                }}
                className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first project to get started
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group"
            >
              <div className="h-full bg-card border border-border rounded-lg p-6 hover:border-primary transition cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold group-hover:text-primary transition">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <Zap className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition" />
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  {project.gitUrl && (
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-3 h-3" />
                      <span className="truncate">{project.gitUrl}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
