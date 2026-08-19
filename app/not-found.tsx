import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="text-6xl font-bold tracking-tight text-foreground">404</p>
      <p className="text-muted-foreground">This page could not be found.</p>
      <Link
        href="/"
        className="text-sm font-medium text-primary transition-colors hover:underline"
      >
        ← Back to home
      </Link>
    </div>
  );
}
