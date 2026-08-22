import { create } from 'zustand';
import {
  DesignDocument,
  SceneNode,
  TextNode,
  RectNode,
  CircleNode,
  ImageNode,
  PathNode,
  ActiveTool,
} from './types';
import { DesignHistory } from './history';
import { svgStringToSceneGraph, sceneGraphToSvgString, createEmptyDocument } from './parser';

interface UpdateNodeOptions {
  pushHistory?: boolean;
}

interface DesignStore {
  // Document state
  document: DesignDocument;
  isDirty: boolean;
  isLoading: boolean;
  history: DesignHistory;

  // Viewport & Canvas state
  zoom: number;
  panOffset: { x: number; y: number };
  activeTool: ActiveTool;

  // Selection state
  selectedNodeId: string | null;
  hoveredNodeId: string | null;

  // Actions
  loadFromSvg: (svgString: string, docId?: string, docName?: string) => void;
  loadEmptyDocument: (docId?: string, docName?: string) => void;
  getSvgString: () => string;

  // Viewport actions
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setPanOffset: (offset: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  resetViewport: () => void;
  setActiveTool: (tool: ActiveTool) => void;

  // Selection actions
  selectNode: (nodeId: string | null) => void;
  setHoveredNode: (nodeId: string | null) => void;
  getSelectedNode: () => SceneNode | null;

  // Mutation actions (with optional history batching/debouncing)
  updateNode: (nodeId: string, updates: Partial<SceneNode>, options?: UpdateNodeOptions) => void;
  commitSnapshot: (docBeforeChange?: DesignDocument) => void;
  addNode: (node: SceneNode, parentGroupId?: string) => void;
  deleteNode: (nodeId: string) => void;
  toggleNodeVisibility: (nodeId: string) => void;
  toggleNodeLock: (nodeId: string) => void;

  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const historyManager = new DesignHistory();

export const useDesignStore = create<DesignStore>((set, get) => ({
  document: createEmptyDocument('doc_default', 'Untitled Design'),
  isDirty: false,
  isLoading: false,
  history: historyManager,

  zoom: 1,
  panOffset: { x: 0, y: 0 },
  activeTool: 'select',

  selectedNodeId: null,
  hoveredNodeId: null,

  canUndo: false,
  canRedo: false,

  loadFromSvg: (svgString: string, docId = 'doc_default', docName = 'Design') => {
    set({ isLoading: true });
    try {
      const doc = svgStringToSceneGraph(svgString, docId, docName);
      historyManager.clear();
      historyManager.pushState(doc);
      set({
        document: doc,
        isDirty: false,
        isLoading: false,
        selectedNodeId: null,
        canUndo: false,
        canRedo: false,
      });
    } catch (err) {
      console.error('[useDesignStore] Error loading SVG:', err);
      set({ isLoading: false });
    }
  },

  loadEmptyDocument: (docId = 'doc_default', docName = 'New Design') => {
    const doc = createEmptyDocument(docId, docName);
    historyManager.clear();
    historyManager.pushState(doc);
    set({
      document: doc,
      isDirty: false,
      selectedNodeId: null,
      canUndo: false,
      canRedo: false,
    });
  },

  getSvgString: () => {
    return sceneGraphToSvgString(get().document);
  },

  setZoom: (zoomOrFn) => {
    set((state) => ({
      zoom: typeof zoomOrFn === 'function' ? zoomOrFn(state.zoom) : zoomOrFn,
    }));
  },

  setPanOffset: (offsetOrFn) => {
    set((state) => ({
      panOffset: typeof offsetOrFn === 'function' ? offsetOrFn(state.panOffset) : offsetOrFn,
    }));
  },

  resetViewport: () => {
    set({ zoom: 1, panOffset: { x: 0, y: 0 } });
  },

  setActiveTool: (tool) => {
    set({ activeTool: tool });
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  setHoveredNode: (nodeId) => {
    set({ hoveredNodeId: nodeId });
  },

  getSelectedNode: () => {
    const { document, selectedNodeId } = get();
    if (!selectedNodeId) return null;

    function findNode(nodes: SceneNode[]): SceneNode | null {
      for (const node of nodes) {
        if (node.id === selectedNodeId) return node;
        if (node.type === 'group') {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    }

    return findNode(document.rootNodes);
  },

  updateNode: (nodeId, updates, options) => {
    const { document, history } = get();

    if (options?.pushHistory !== false) {
      history.pushState(document);
    }

    function mutateNodes(nodes: SceneNode[]): SceneNode[] {
      return nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, ...updates } as SceneNode;
        }
        if (node.type === 'group') {
          return { ...node, children: mutateNodes(node.children) };
        }
        return node;
      });
    }

    const updatedDoc: DesignDocument = {
      ...document,
      rootNodes: mutateNodes(document.rootNodes),
    };

    set({
      document: updatedDoc,
      isDirty: true,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  commitSnapshot: (docBeforeChange) => {
    const { document, history } = get();
    if (docBeforeChange) {
      history.pushState(docBeforeChange);
    } else {
      history.pushState(document);
    }
    set({
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  addNode: (node, parentGroupId) => {
    const { document, history } = get();
    history.pushState(document);

    let updatedRoot = [...document.rootNodes];

    if (parentGroupId) {
      function addToGroup(nodes: SceneNode[]): SceneNode[] {
        return nodes.map((n) => {
          if (n.id === parentGroupId && n.type === 'group') {
            return { ...n, children: [...n.children, node] };
          }
          if (n.type === 'group') {
            return { ...n, children: addToGroup(n.children) };
          }
          return n;
        });
      }
      updatedRoot = addToGroup(updatedRoot);
    } else {
      updatedRoot.push(node);
    }

    set({
      document: { ...document, rootNodes: updatedRoot },
      isDirty: true,
      selectedNodeId: node.id,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  deleteNode: (nodeId) => {
    const { document, history } = get();
    history.pushState(document);

    function removeNode(nodes: SceneNode[]): SceneNode[] {
      return nodes
        .filter((n) => n.id !== nodeId)
        .map((n) => {
          if (n.type === 'group') {
            return { ...n, children: removeNode(n.children) };
          }
          return n;
        });
    }

    set({
      document: { ...document, rootNodes: removeNode(document.rootNodes) },
      isDirty: true,
      selectedNodeId: null,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  toggleNodeVisibility: (nodeId) => {
    const { document, history } = get();
    history.pushState(document);

    function toggle(nodes: SceneNode[]): SceneNode[] {
      return nodes.map((n) => {
        if (n.id === nodeId) {
          return { ...n, visible: !n.visible } as SceneNode;
        }
        if (n.type === 'group') {
          return { ...n, children: toggle(n.children) };
        }
        return n;
      });
    }

    set({
      document: { ...document, rootNodes: toggle(document.rootNodes) },
      isDirty: true,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  toggleNodeLock: (nodeId) => {
    const { document, history } = get();
    history.pushState(document);

    function toggle(nodes: SceneNode[]): SceneNode[] {
      return nodes.map((n) => {
        if (n.id === nodeId) {
          return { ...n, locked: !n.locked } as SceneNode;
        }
        if (n.type === 'group') {
          return { ...n, children: toggle(n.children) };
        }
        return n;
      });
    }

    set({
      document: { ...document, rootNodes: toggle(document.rootNodes) },
      isDirty: true,
    });
  },

  undo: () => {
    const { document, history } = get();
    const previous = history.undo(document);
    if (previous) {
      set({
        document: previous,
        isDirty: true,
        canUndo: history.canUndo(),
        canRedo: history.canRedo(),
      });
    }
  },

  redo: () => {
    const { document, history } = get();
    const next = history.redo(document);
    if (next) {
      set({
        document: next,
        isDirty: true,
        canUndo: history.canUndo(),
        canRedo: history.canRedo(),
      });
    }
  },
}));
