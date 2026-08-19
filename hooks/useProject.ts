'use client';

import useSWR from 'swr';
import { Project } from '@/lib/types';
import axios from 'axios';

const fetcher = (url: string) => axios.get(url).then((res) => res.data.data);

/**
 * Hook to fetch and manage a specific project
 */
export function useProject(projectId?: string) {
  const { data, error, isLoading, mutate } = useSWR<Project>(
    projectId ? `/api/projects/${projectId}` : null,
    fetcher
  );

  return {
    project: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch all projects
 */
export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<Project[]>(
    '/api/projects',
    fetcher
  );

  return {
    projects: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to create a new project
 */
export function useCreateProject() {
  return async (
    name: string,
    gitUrl?: string,
    description?: string
  ): Promise<Project> => {
    const response = await axios.post('/api/projects', {
      name,
      gitUrl,
      description,
    });

    return response.data.data;
  };
}

/**
 * Hook to delete a project
 */
export function useDeleteProject() {
  return async (projectId: string): Promise<void> => {
    await axios.delete(`/api/projects/${projectId}`);
  };
}
