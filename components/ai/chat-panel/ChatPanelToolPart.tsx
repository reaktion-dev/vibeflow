import { Check, ShieldAlert, X } from 'lucide-react';

import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';
import { Button } from '@/components/ui/button';

interface ChatPanelToolPartProps {
  part: any;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
}

export function ChatPanelToolPart({
  part,
  onApprove,
  onDeny,
}: ChatPanelToolPartProps) {
  const approval = part.approval;
  const title = part.type === 'dynamic-tool' ? part.toolName : undefined;
  const showInput = part.input != null;
  const showOutput =
    part.state === 'output-available' ||
    part.state === 'output-error' ||
    part.state === 'output-denied';

  return (
    <Tool defaultOpen={part.state !== 'output-available'}>
      <ToolHeader
        state={part.state}
        title={title}
        toolName={part.toolName}
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
                  Review this tool call before it executes.
                  {approval?.reason ? ` Reason: ${approval.reason}` : ''}
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
