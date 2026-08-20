'use client';

import useSWR from 'swr';
import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BudgetBarProps {
  projectId: string;
}

interface BudgetData {
  projectId: string;
  budgetCents: number;
  spentCents: number;
  overBudget: boolean;
  remainingCents: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function BudgetBar({ projectId }: BudgetBarProps) {
  const { data } = useSWR<{ success: boolean; data: BudgetData }>(
    `/api/projects/${projectId}/budget`,
    fetcher,
    { refreshInterval: 10000 }
  );

  const budget = data?.data;
  if (!budget) return null;

  const percent = budget.budgetCents > 0
    ? Math.min(100, (budget.spentCents / budget.budgetCents) * 100)
    : 0;

  const barColor =
    percent >= 90 ? 'bg-red-500'
    : percent >= 70 ? 'bg-yellow-500'
    : 'bg-primary';

  const iconColor =
    percent >= 90 ? 'text-red-500'
    : percent >= 70 ? 'text-yellow-500'
    : 'text-muted-foreground';

  return (
    <div className="flex items-center gap-2">
      <Wallet className={cn('h-3.5 w-3.5', iconColor)} />
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted/60">
          <div
            className={cn('h-full rounded-full transition-all duration-500', barColor)}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/80">
          {formatCurrency(budget.spentCents)} / {formatCurrency(budget.budgetCents)}
        </span>
      </div>
    </div>
  );
}
