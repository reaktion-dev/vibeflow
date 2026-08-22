import { OfficeDocumentModel } from './types';

/**
 * Immutable Bounded Memento Undo/Redo History Stack for Office Documents
 */
export class OfficeHistory {
  private undoStack: OfficeDocumentModel[] = [];
  private redoStack: OfficeDocumentModel[] = [];
  private maxHistory: number;

  constructor(maxHistory = 30) {
    this.maxHistory = maxHistory;
  }

  public pushState(doc: OfficeDocumentModel): void {
    const clone = JSON.parse(JSON.stringify(doc)) as OfficeDocumentModel;
    this.undoStack.push(clone);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  public undo(currentDoc: OfficeDocumentModel): OfficeDocumentModel | null {
    if (this.undoStack.length === 0) return null;
    const previous = this.undoStack.pop()!;
    this.redoStack.push(JSON.parse(JSON.stringify(currentDoc)));
    return previous;
  }

  public redo(currentDoc: OfficeDocumentModel): OfficeDocumentModel | null {
    if (this.redoStack.length === 0) return null;
    const next = this.redoStack.pop()!;
    this.undoStack.push(JSON.parse(JSON.stringify(currentDoc)));
    return next;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
