import { notFound } from "next/navigation";
import { getProject } from "@/app/actions/projects";
import { UnifiedProjectShell } from "@/components/workspace/UnifiedProjectShell";

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
    <UnifiedProjectShell
      projectId={id}
      projectName={project.name}
      initialType={project.type}
    />
  );
}
