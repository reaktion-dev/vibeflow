'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTerminalCommand } from '@/hooks/useFileOperations';
import { Play, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface TerminalOutput {
  type: 'start' | 'output' | 'error' | 'complete';
  data?: string;
  exitCode?: number;
  command?: string;
}

interface TerminalProps {
  projectId: string;
}

export function Terminal({ projectId }: TerminalProps) {
  const [output, setOutput] = useState<TerminalOutput[]>([]);
  const [command, setCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const executeCommand = useTerminalCommand();

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!command.trim()) {
      toast.error('Please enter a command');
      return;
    }

    try {
      setIsExecuting(true);
      setOutput([]);

      await executeCommand(projectId, command, '/', (data: TerminalOutput) => {
        setOutput((prev) => [...prev, data]);
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Command failed'
      );
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClear = () => {
    setOutput([]);
    setCommand('');
  };

  return (
    <div className="h-full flex flex-col bg-background border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <h3 className="text-sm font-medium">Terminal</h3>
        <button
          onClick={handleClear}
          className="p-1.5 hover:bg-secondary rounded transition"
          title="Clear"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Output */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-0"
      >
        {output.length === 0 ? (
          <div className="text-muted-foreground">
            $ Ready for commands...
          </div>
        ) : (
          output.map((line, idx) => (
            <div key={idx}>
              {line.type === 'start' && (
                <div className="text-primary">
                  $ {line.command}
                </div>
              )}
              {line.type === 'output' && (
                <div className="text-foreground whitespace-pre-wrap">
                  {line.data}
                </div>
              )}
              {line.type === 'error' && (
                <div className="text-red-500 whitespace-pre-wrap">
                  {line.data}
                </div>
              )}
              {line.type === 'complete' && (
                <div className="text-muted-foreground text-xs mt-1">
                  (exit code: {line.exitCode})
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleExecute}
        className="flex items-center gap-2 px-4 py-3 border-t border-border bg-card"
      >
        <span className="text-primary">$</span>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter command..."
          disabled={isExecuting}
          className="flex-1 bg-background text-foreground text-sm outline-none placeholder-muted-foreground disabled:opacity-50"
          autoFocus
        />
        <button
          type="submit"
          disabled={isExecuting}
          className="p-1.5 hover:bg-secondary rounded transition disabled:opacity-50"
          title="Execute"
        >
          <Play className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
