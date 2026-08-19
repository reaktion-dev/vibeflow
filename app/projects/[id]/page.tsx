import { notFound } from "next/navigation";
import { getProject } from "@/app/actions/projects";
import { ProjectWorkspace } from "@/components/ide/ProjectWorkspace";

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

  return (
    <ProjectWorkspace
      projectId={id}
      projectName={project.name}
    />
  );
}
