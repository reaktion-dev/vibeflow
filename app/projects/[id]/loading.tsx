export default function ProjectLoading() {
  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <div className="h-12 animate-pulse border-b border-border bg-card/50" />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 shrink-0 animate-pulse border-r border-border bg-card" />
        <div className="flex-1 animate-pulse bg-background" />
        <div className="w-80 shrink-0 animate-pulse border-l border-border bg-card" />
      </div>
    </div>
  );
}
