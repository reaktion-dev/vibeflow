import Link from "next/link";

export default function ProjectNotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <p className="text-lg font-semibold text-foreground">Project not found</p>
      <p className="text-sm text-muted-foreground">
        It may have been deleted, or you don&apos;t have access to it.
      </p>
      <Link
        href="/dashboard"
        className="text-sm font-medium text-primary transition-colors hover:underline"
      >
        ← Back to dashboard
      </Link>
    </div>
  );
}
