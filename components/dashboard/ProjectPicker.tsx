'use client';

import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, FolderOpen, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

export interface PickerProject {
  id: string;
  name: string;
  type: 'code' | 'design' | 'video' | 'flow';
}

interface ProjectPickerProps {
  projects: PickerProject[];
  selectedProjectId: string | null;
  onSelect: (projectId: string | null) => void;
  disabled?: boolean;
}

const TYPE_DOT: Record<PickerProject['type'], string> = {
  code: 'bg-blue-500',
  design: 'bg-purple-500',
  video: 'bg-orange-500',
  flow: 'bg-green-500',
};

export function ProjectPicker({
  projects,
  selectedProjectId,
  onSelect,
  disabled,
}: ProjectPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return projects;
    const q = query.toLowerCase();
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, query]);

  const handleSelect = (id: string | null) => {
    onSelect(id);
    setOpen(false);
    setQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="gap-1.5 rounded-lg px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {selected ? (
              <>
                <span
                  className={cn('h-2 w-2 rounded-full', TYPE_DOT[selected.type])}
                />
                <span className="max-w-[120px] truncate">{selected.name}</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                <span>New project</span>
              </>
            )}
            <ChevronsUpDown className="h-3 w-3 opacity-50" />
          </Button>
        }
      />
      <PopoverContent
        align="end"
        className="w-64 p-0 shadow-lg shadow-black/10"
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search projects..."
            value={query}
            onValueChange={setQuery}
            className="h-9 text-xs"
          />
          <CommandList>
            <CommandEmpty className="text-xs">No projects found.</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={() => handleSelect(null)} className="text-xs">
                <Plus className="mr-2 h-3.5 w-3.5" />
                <span>New project</span>
                {selectedProjectId === null && (
                  <Check className="ml-auto h-3.5 w-3.5" />
                )}
              </CommandItem>
            </CommandGroup>
            {filtered.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Existing projects">
                  {filtered.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.id}
                      onSelect={() => handleSelect(p.id)}
                      className="text-xs"
                    >
                      <span
                        className={cn(
                          'mr-2 h-2 w-2 shrink-0 rounded-full',
                          TYPE_DOT[p.type]
                        )}
                      />
                      <span className="truncate">{p.name}</span>
                      {selectedProjectId === p.id && (
                        <Check className="ml-auto h-3.5 w-3.5" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
