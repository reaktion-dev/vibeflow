import { Check, ShieldAlert, X } from 'lucide-react';

import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';
import { Button } from '@/components/ui/button';
import { FileChangeEvent } from './file-change-event';

interface HarnessToolPartsProps {
  part: any;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
}

/**
 * Unified renderer for harness tool parts.
 * 
 * Handles:
 * - Built-in OpenCode tools: read, write, edit, bash, grep, glob, ls, webfetch, skill
 * - Dynamic tools: fileChange, compaction
 * - Approval requests (from permissionMode: 'allow-reads')
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
  const approval = part.approval;
  const isDynamic = part.type === 'dynamic-tool';
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

    // Fallback for unknown dynamic tools
    return (
      <div className="my-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs">
        <p className="font-medium">{toolName}</p>
        {part.result ? (
          <pre className="mt-1 overflow-auto text-xs">
            {JSON.stringify(part.result, null, 2)}
          </pre>
        ) : null}
      </div>
    );
  }

  // Handle regular tool parts (read, write, bash, etc.)
  const showInput = part.input != null;
  const showOutput =
    part.state === 'output-available' ||
    part.state === 'output-error' ||
    part.state === 'output-denied';

  return (
    <Tool defaultOpen={part.state !== 'output-available'}>
      <ToolHeader
        state={part.state}
        title={toolName}
        toolName={toolName}
        type={part.type}
      />
      <ToolContent>
        {showInput ? <ToolInput input={part.input} /> : null}

        {part.state === 'approval-requested' ? (
          <div className="space-y-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
            <div className="flex items-start gap-2 text-sm">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-yellow-600" />
              <div>
                <p className="font-medium">Approval required</p>
                <p className="text-muted-foreground text-xs">
                  This tool requires permission to execute.
                  {approval?.reason ? ` ${approval.reason}` : ''}
                </p>
              </div>
            </div>

            {!approval?.isAutomatic && approval?.id ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => onApprove(approval.id)}
                  size="sm"
                  type="button"
                >
                  <Check className="size-4" />
                  Approve
                </Button>
                <Button
                  onClick={() => onDeny(approval.id)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <X className="size-4" />
                  Deny
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {part.state === 'approval-responded' ? (
          <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            {approval?.approved ? 'Approved' : 'Denied'}
            {approval?.isAutomatic ? ' automatically' : ' by user'}.
            {approval?.reason ? ` ${approval.reason}` : ''}
          </div>
        ) : null}

        {part.state === 'output-denied' ? (
          <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 text-xs text-muted-foreground">
            Tool execution was denied.
            {approval?.reason ? ` ${approval.reason}` : ''}
          </div>
        ) : null}

        {showOutput ? (
          <ToolOutput
            errorText={part.state === 'output-error' ? part.errorText : undefined}
            output={part.output}
          />
        ) : null}
      </ToolContent>
    </Tool>
  );
}
