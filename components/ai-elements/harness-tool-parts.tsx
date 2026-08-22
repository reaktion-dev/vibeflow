'use client';

import { VisualToolPart } from './visual-tool-part';
import { FileChangeEvent } from './file-change-event';

interface HarnessToolPartsProps {
  part: any;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
}

/**
 * Unified renderer for tool execution parts in the chat stream.
 * 
 * Delegates to VisualToolPart for human-friendly icon cards,
 * image search carousels, SVG design cards, and approval buttons.
 */
export function HarnessToolParts({
  part,
  onApprove,
  onDeny,
}: HarnessToolPartsProps) {
  const toolName =
    part.toolName ||
    (part as any).name ||
    (part as any).toolInvocation?.toolName ||
    (typeof part.type === 'string' && part.type.startsWith('tool-') ? part.type.replace(/^tool-/, '') : '') ||
    'tool';

  const isDynamic = part.type === 'dynamic-tool';

  // Handle dynamic tools (fileChange, compaction)
  if (isDynamic) {
    if (toolName === 'fileChange') {
      return (
        <div className="my-2">
          <FileChangeEvent result={part.result} />
        </div>
      );
    }

    if (toolName === 'compaction') {
      return (
        <div className="my-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium">Context compaction</span> — The agent compressed
          its conversation history to preserve capacity.
        </div>
      );
    }
  }

  // Render visual tool execution card
  return (
    <VisualToolPart
      part={part}
      onApprove={onApprove}
      onDeny={onDeny}
    />
  );
}

export default HarnessToolParts;
