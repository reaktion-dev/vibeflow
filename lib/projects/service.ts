import { Project, Sandbox } from '../types';
import {
  createSandbox,
  deleteSandbox,
  cloneRepository,
} from '../daytona/operations';

// In-memory storage for MVP (replace with database in production)
const projectsStore: Map<string, Project> = new Map();

/**
 * Generate unique ID
 */
function generateId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new project
 */
export async function createProject(
  name: string,
  gitUrl?: string,
  description?: string
): Promise<Project> {
  try {
    // Create sandbox first
    const sandbox = await createSandbox(name);

    // Clone repository if provided
    if (gitUrl) {
      try {
        await cloneRepository(sandbox.id, gitUrl);
      } catch (error) {
        console.warn(`Failed to clone repository, but sandbox created:`, error);
      }
    }

    // Create project record
    const project: Project = {
      id: generateId(),
      name,
      description,
      gitUrl,
      sandboxId: sandbox.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    projectsStore.set(project.id, project);

    console.log(`[v0] Project created: ${project.id}`);
    return project;
  } catch (error) {
    console.error('Failed to create project:', error);
    throw error;
  }
}

/**
 * Get project by ID
 */
export function getProject(projectId: string): Project | undefined {
  return projectsStore.get(projectId);
}

/**
 * List all projects
 */
export function listProjects(): Project[] {
  return Array.from(projectsStore.values());
}

/**
 * Update project
 */
export function updateProject(
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'createdAt'>>
): Project {
  const project = projectsStore.get(projectId);
  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const updated: Project = {
    ...project,
    ...updates,
    updatedAt: new Date(),
  };

  projectsStore.set(projectId, updated);
  return updated;
}

/**
 * Delete project and its sandbox
 */
export async function deleteProject(projectId: string): Promise<void> {
  try {
    const project = projectsStore.get(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Delete sandbox
    await deleteSandbox(project.sandboxId);

    // Delete project record
    projectsStore.delete(projectId);

    console.log(`[v0] Project deleted: ${projectId}`);
  } catch (error) {
    console.error('Failed to delete project:', error);
    throw error;
  }
}

/**
 * Get sandbox ID for project
 */
export function getProjectSandboxId(projectId: string): string {
  const project = projectsStore.get(projectId);
  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }
  return project.sandboxId;
}
