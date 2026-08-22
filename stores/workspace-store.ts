import { create } from 'zustand';

/**
 * A selected artifact in the content workspace.
 * `url` is optional — callers that only know the asset id can leave it out
 * (the preview URL is derived from the id at render time).
 */
export interface SelectedAsset {
  id: string;
  name: string;
  type: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  url?: string | null;
}

interface WorkspaceStore {
  // Content workspace — selected artifact
  selectedAsset: SelectedAsset | null;
  setSelectedAsset: (asset: SelectedAsset | null) => void;

  // Content workspace — artifact gallery panel
  showGallery: boolean;
  setShowGallery: (show: boolean) => void;
  toggleGallery: () => void;

  // Content workspace — design mode ('view' = preview stage + chat; 'edit' = full studio editor + inspector)
  designMode: 'view' | 'edit';
  setDesignMode: (mode: 'view' | 'edit') => void;

  // IDE — selected file
  selectedFile: string | null;
  setSelectedFile: (path: string | null) => void;

  // Shared chat sidebar (content workspace + IDEs)
  showChat: boolean;
  setShowChat: (show: boolean) => void;
  toggleChat: () => void;

  // IDE — file tree sidebar
  showFileTree: boolean;
  setShowFileTree: (show: boolean) => void;
  toggleFileTree: () => void;

  // IDE — editor/split layout mode
  layoutMode: 'editor' | 'split';
  setLayoutMode: (mode: 'editor' | 'split') => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()((set) => ({
  selectedAsset: null,
  setSelectedAsset: (asset) => set({ selectedAsset: asset }),

  showGallery: true,
  setShowGallery: (show) => set({ showGallery: show }),
  toggleGallery: () => set((state) => ({ showGallery: !state.showGallery })),

  designMode: 'view',
  setDesignMode: (mode) => set({ designMode: mode }),

  selectedFile: null,
  setSelectedFile: (path) => set({ selectedFile: path }),

  showChat: true,
  setShowChat: (show) => set({ showChat: show }),
  toggleChat: () => set((state) => ({ showChat: !state.showChat })),

  showFileTree: true,
  setShowFileTree: (show) => set({ showFileTree: show }),
  toggleFileTree: () => set((state) => ({ showFileTree: !state.showFileTree })),

  layoutMode: 'editor',
  setLayoutMode: (mode) => set({ layoutMode: mode }),
}));