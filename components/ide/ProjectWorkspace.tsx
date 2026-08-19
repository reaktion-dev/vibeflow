"use client";

import { Toaster } from "react-hot-toast";
import { ResizableIDE } from "./ResizableIDE";

interface ProjectWorkspaceProps {
  projectId: string;
  projectName: string;
}

export function ProjectWorkspace({ projectId, projectName }: ProjectWorkspaceProps) {
  return (
    <>
      <ResizableIDE projectId={projectId} projectName={projectName} />
      <Toaster position="bottom-right" />
    </>
  );
}
