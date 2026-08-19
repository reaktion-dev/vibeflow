import { notFound } from "next/navigation";
import { getProject } from "@/app/actions/projects";
import { ProjectWorkspace } from "@/components/ide/ProjectWorkspace";
import { ContentWorkspace } from "@/components/workspace/ContentWorkspace";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  let project;
  try {
    project = await getProject(id);
  } catch {
    notFound();
  }

  // Route by project type — code projects keep the existing IDE,
  // content workspaces (design/video/flow) get the agent-first surface.
  if (project.type === 'code') {
    return (
      <ProjectWorkspace
        projectId={id}
        projectName={project.name}
      />
    );
  }

  return (
    <ContentWorkspace
      projectId={id}
      projectName={project.name}
      projectType={project.type}
    />
  );
}
