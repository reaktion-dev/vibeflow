'use client';

import { useOfficeStore } from '@/lib/office-tool/useOfficeStore';
import { SpreadsheetModel, SheetCell, OFFICE_THEMES } from '@/lib/office-tool/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Plus, FunctionSquare } from 'lucide-react';

interface SpreadsheetViewportProps {
  isEditable?: boolean;
}

export function SpreadsheetViewport({ isEditable = false }: SpreadsheetViewportProps) {
  const activeDoc = useOfficeStore((s) => s.activeDoc);
  const activeSheetIndex = useOfficeStore((s) => s.activeSheetIndex);
  const setActiveSheetIndex = useOfficeStore((s) => s.setActiveSheetIndex);
  const selectedCell = useOfficeStore((s) => s.selectedCell);
  const setSelectedCell = useOfficeStore((s) => s.setSelectedCell);
  const updateSpreadsheetCell = useOfficeStore((s) => s.updateSpreadsheetCell);

  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colKey: string } | null>(null);
  const [formulaBarInput, setFormulaBarInput] = useState('');

  if (activeDoc.type !== 'spreadsheet') return null;
  const workbook = activeDoc.model;
  const sheet = workbook.sheets[activeSheetIndex] || workbook.sheets[0];
  const theme = OFFICE_THEMES[workbook.theme] ?? OFFICE_THEMES['corporate-navy'];

  if (!sheet) return null;

  // Active cell value / formula for formula bar
  const activeCellData = selectedCell
    ? sheet.rows[selectedCell.rowIdx]?.cells[selectedCell.colKey]
    : null;

  const activeCoordinate = selectedCell
    ? `${String.fromCharCode(65 + sheet.columns.findIndex((c) => c.key === selectedCell.colKey))}${selectedCell.rowIdx + 2}`
    : 'A1';

  return (
    <div className="flex size-full flex-col overflow-hidden bg-background">
      {/* ── 1. Top Formula Bar ─────────────────────────────────────────────── */}
      <div className="flex h-10 items-center border-b border-border/80 bg-muted/20 px-4 gap-3">
        {/* Cell Coordinate Pill */}
        <div className="flex items-center justify-center w-14 h-7 rounded border border-border/80 bg-background font-mono text-xs font-bold text-primary shadow-2xs">
          {activeCoordinate}
        </div>

        {/* Function Icon Divider */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <FunctionSquare className="size-4 text-emerald-500" />
        </div>

        {/* Formula / Value Input */}
        <input
          type="text"
          value={
            selectedCell
              ? activeCellData?.formula
                ? `=${activeCellData.formula}`
                : String(activeCellData?.value ?? '')
              : ''
          }
          onChange={(e) => {
            if (!selectedCell) return;
            const val = e.target.value;
            if (val.startsWith('=')) {
              updateSpreadsheetCell(activeSheetIndex, selectedCell.rowIdx, selectedCell.colKey, {
                formula: val.slice(1),
              });
            } else {
              const parsedNum = Number(val);
              updateSpreadsheetCell(activeSheetIndex, selectedCell.rowIdx, selectedCell.colKey, {
                value: isNaN(parsedNum) ? val : parsedNum,
                formula: undefined,
              });
            }
          }}
          disabled={!isEditable || !selectedCell}
          placeholder={isEditable ? 'Enter value or =FORMULA (e.g. =SUM(B2:B10))' : 'Select a cell'}
          className="flex-1 h-7 rounded border border-border/60 bg-background px-2.5 font-mono text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all shadow-2xs"
        />
      </div>

      {/* ── 2. Interactive Spreadsheet Grid ────────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-slate-950 p-4">
        <div className="inline-block min-w-full rounded-md border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
          <table className="w-full border-collapse text-xs font-mono select-none">
            {/* Header Column Names */}
            <thead>
              <tr style={{ backgroundColor: theme.primary }}>
                {/* Top-Left Corner Cell */}
                <th className="w-12 border-r border-b border-slate-700/80 px-2 py-2 text-center text-slate-400 font-semibold text-2xs">
                  #
                </th>
                {sheet.columns.map((col, idx) => (
                  <th
                    key={col.key}
                    style={{ width: col.width ? `${col.width * 8}px` : 'auto' }}
                    className="border-r border-b border-slate-700/80 px-3 py-2 text-center font-bold text-white tracking-wider uppercase text-2xs"
                  >
                    <div className="text-white/60 text-3xs font-mono">{String.fromCharCode(65 + idx)}</div>
                    <div>{col.header}</div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Data Rows */}
            <tbody className="divide-y divide-slate-800/80">
              {sheet.rows.map((row, rIdx) => {
                const isTotal = !!row.isTotal;
                const isZebra = rIdx % 2 === 1 && !isTotal;

                return (
                  <tr
                    key={rIdx}
                    className={cn(
                      'transition-colors',
                      isTotal
                        ? 'bg-slate-800/90 font-bold border-t-2 border-b-2 border-primary/50'
                        : isZebra
                        ? 'bg-slate-900/50'
                        : 'bg-slate-950'
                    )}
                  >
                    {/* Row Number */}
                    <td className="border-r border-slate-800 px-2 py-1.5 text-center text-slate-500 font-mono text-2xs">
                      {rIdx + 2}
                    </td>

                    {/* Cells */}
                    {sheet.columns.map((col) => {
                      const cell = row.cells[col.key] || { value: '' };
                      const isSelected =
                        selectedCell?.sheetIndex === activeSheetIndex &&
                        selectedCell?.rowIdx === rIdx &&
                        selectedCell?.colKey === col.key;

                      const isEditingThisCell =
                        editingCell?.rowIdx === rIdx && editingCell?.colKey === col.key;

                      return (
                        <td
                          key={col.key}
                          onClick={() => {
                            setSelectedCell({
                              sheetIndex: activeSheetIndex,
                              rowIdx: rIdx,
                              colKey: col.key,
                            });
                          }}
                          onDoubleClick={() => {
                            if (isEditable) {
                              setEditingCell({ rowIdx: rIdx, colKey: col.key });
                            }
                          }}
                          className={cn(
                            'border-r border-slate-800/80 px-3 py-1.5 font-mono text-xs transition-all relative',
                            col.align === 'left' ? 'text-left' : 'text-right',
                            isSelected
                              ? 'ring-2 ring-primary ring-inset bg-primary/10 text-white font-semibold'
                              : 'text-slate-300 hover:bg-slate-800/40',
                            isTotal && 'text-emerald-400 font-bold'
                          )}
                        >
                          {isEditingThisCell ? (
                            <input
                              autoFocus
                              type="text"
                              defaultValue={cell.formula ? `=${cell.formula}` : String(cell.value)}
                              onBlur={(e) => {
                                const val = e.target.value;
                                if (val.startsWith('=')) {
                                  updateSpreadsheetCell(activeSheetIndex, rIdx, col.key, {
                                    formula: val.slice(1),
                                  });
                                } else {
                                  const num = Number(val);
                                  updateSpreadsheetCell(activeSheetIndex, rIdx, col.key, {
                                    value: isNaN(num) ? val : num,
                                    formula: undefined,
                                  });
                                }
                                setEditingCell(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              className="w-full bg-slate-800 text-white border border-primary outline-none px-1 rounded font-mono text-xs"
                            />
                          ) : (
                            formatCellValue(cell.value, cell.format || col.format)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 3. Bottom Sheet Tabs ───────────────────────────────────────────── */}
      <div className="flex h-9 items-center border-t border-border/80 bg-muted/30 px-3 gap-1 overflow-x-auto">
        {workbook.sheets.map((s, idx) => (
          <button
            key={s.name}
            onClick={() => setActiveSheetIndex(idx)}
            className={cn(
              'flex items-center gap-1.5 rounded-t-md border-t border-x px-3 py-1 text-xs font-semibold transition-all',
              activeSheetIndex === idx
                ? 'bg-background text-primary border-border shadow-xs'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <span>{s.name}</span>
          </button>
        ))}

        {isEditable && (
          <button
            onClick={() => {
              // Add Sheet action
            }}
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground ml-1"
            title="Add New Sheet"
          >
            <Plus className="size-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function formatCellValue(value: any, format?: string): string {
  if (value === undefined || value === null || value === '') return '-';

  if (typeof value === 'number') {
    if (format === 'currency') {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (format === 'percent') {
      return `${(value * (value <= 1 ? 100 : 1)).toFixed(1)}%`;
    }
    return value.toLocaleString('en-US');
  }

  return String(value);
}

export default SpreadsheetViewport;
