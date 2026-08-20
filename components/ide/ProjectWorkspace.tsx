"use client";

import { ResizableIDE } from "./ResizableIDE";

interface ProjectWorkspaceProps {
  projectId: string;
  projectName: string;
}

export function ProjectWorkspace({ projectId, projectName }: ProjectWorkspaceProps) {
  return <ResizableIDE projectId={projectId} projectName={projectName} />;
}
