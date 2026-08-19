import { FileEdit } from 'lucide-react';

interface FileChangeEventProps {
  result: any;
}

/**
 * Render a fileChange dynamic tool part emitted by the harness.
 * 
 * This event is triggered when the harness runtime modifies workspace files
 * in ways that don't map to discrete tool calls (e.g., internal OpenCode edits).
 */
export function FileChangeEvent({ result }: FileChangeEventProps) {
  if (!result || typeof result !== 'object') {
    return null;
  }

  const changes = Array.isArray(result.changes) ? result.changes : [result];

  return (
    <div className="space-y-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
      <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
        <FileEdit className="size-4" />
        <span>Workspace changes detected</span>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        {changes.map((change: any, idx: number) => {
          const path = change.path || change.file || 'unknown';
          const operation = change.operation || change.type || 'modified';

          return (
            <div key={idx} className="flex items-center gap-2">
              <span className="font-mono text-foreground">{path}</span>
              <span className="text-blue-600">({operation})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
