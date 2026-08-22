import { DesignDocument } from './types';

export class DesignHistory {
  private undoStack: DesignDocument[] = [];
  private redoStack: DesignDocument[] = [];
  private maxHistory: number;

  constructor(maxHistory = 30) {
    this.maxHistory = maxHistory;
  }

  public pushState(doc: DesignDocument) {
    // Clone snapshot
    const snapshot = JSON.parse(JSON.stringify(doc));
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    // Any new action clears the redo stack
    this.redoStack = [];
  }

  public undo(currentDoc: DesignDocument): DesignDocument | null {
    if (this.undoStack.length === 0) return null;

    const previous = this.undoStack.pop()!;
    this.redoStack.push(JSON.parse(JSON.stringify(currentDoc)));
    return previous;
  }

  public redo(currentDoc: DesignDocument): DesignDocument | null {
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

  public clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
