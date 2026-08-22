---
name: vibeflow-workspace-architecture
description: >
  Architectural blueprint for building Vibeflow workspaces (Design, Video, Flow, Audio).
  Covers the 4-tier layered architecture, data flow, Zustand store patterns,
  AI agent tool design, adaptive workspace layout morphing, debounced history
  transactions, and same-origin asset streaming. Reference this skill when
  creating or extending any workspace type.
---

# Vibeflow Workspace Architecture Blueprint

This skill documents the proven architecture of the Designer Workspace as a
reusable template for all Vibeflow workspace types.

## 4-Tier Layered Architecture

Every workspace MUST follow this strict layer separation:

```
┌──────────────────────────────────────────────────────────────────────┐
│                     1. AI & AGENT LAYER                              │
│  ToolLoopAgent → structured tools → deterministic artifact gen       │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ Generates asset → R2 + DB
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  2. STORAGE & PERSISTENCE LAYER                      │
│  Cloudflare R2 (binaries) · Drizzle/Neon DB (metadata + cache)       │
│  Next.js same-origin streaming routes                                │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ Fetches content
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   3. STORE & CORE LIB LAYER                          │
│  Domain types · Bidirectional parser · Zustand store · History mgr    │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ Binds reactive state
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    4. UI & WORKSPACE LAYER                            │
│  Adaptive layout (View ↔ Edit) · Canvas viewport · Panels/Inspectors │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Core Domain Library (`lib/<workspace>-tool/`)

Each workspace type gets a dedicated core library at `lib/<workspace>-tool/`.
This is **pure TypeScript with zero React dependencies**.

### Required Modules

| Module | Responsibility | Design Workspace Reference |
|---|---|---|
| `types.ts` | Domain node contracts as discriminated unions + composite document type | `SceneNode` union, `DesignDocument` |
| `parser.ts` | Bidirectional serialization between file format and in-memory AST | SVG ↔ Scene Graph |
| `history.ts` | Bounded memento undo/redo stack with deep-clone snapshots | `DesignHistory` class |

### Key Patterns

- **Discriminated Union + Composite Tree:** Define a `BaseNode` with shared fields (`id`, `type`, `name`, `visible`, `locked`, `opacity`), then extend with type-specific interfaces. Use a union type for the node and support recursive nesting via a `GroupNode` containing `children`.
- **Bidirectional Serialization:** Parse the canonical file format (SVG, JSON timeline, flow graph) into the typed AST, and serialize back losslessly. Guard SSR with `typeof window === 'undefined'`.
- **Bounded Memento History:** Deep-clone via `JSON.parse(JSON.stringify(doc))`. Cap at 30 snapshots. Clear redo stack on new push. Expose `canUndo()`/`canRedo()` for UI binding.

---

## Layer 2: Dedicated Zustand Store (`lib/<workspace>-tool/use<Workspace>Store.ts`)

Each workspace gets its **own** Zustand store. Do NOT pollute `stores/workspace-store.ts` with domain-specific state.

### Required State Shape

```ts
interface WorkspaceStore {
  // Document state
  document: DocumentType;
  isDirty: boolean;
  isLoading: boolean;
  history: HistoryManager;

  // Viewport state
  zoom: number;
  panOffset: { x: number; y: number };
  activeTool: ToolType;

  // Selection state
  selectedNodeId: string | null;
  hoveredNodeId: string | null;

  // Document I/O
  loadFromSource: (source: string, docId?: string) => void;
  loadEmpty: (docId?: string) => void;
  serialize: () => string;

  // Mutation actions (with history opt-out for continuous operations)
  updateNode: (id: string, updates: Partial<Node>, options?: { pushHistory?: boolean }) => void;
  commitSnapshot: (docBeforeChange?: DocumentType) => void;
  addNode: (node: Node) => void;
  deleteNode: (id: string) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}
```

### Debounced Drag Transaction Pattern (CRITICAL)

For continuous interactions (dragging, scrubbing, resizing) at 60fps:

1. **Pointer Down:** Snapshot the document state *before* any mutation:
   ```ts
   dragStartDocSnapshotRef.current = JSON.parse(JSON.stringify(document));
   ```
2. **Pointer Move:** Update continuously WITHOUT pushing history:
   ```ts
   updateNode(id, { x, y }, { pushHistory: false });
   ```
3. **Pointer Up:** Commit the pre-drag snapshot as ONE undo entry:
   ```ts
   commitSnapshot(dragStartDocSnapshotRef.current);
   ```

This ensures `Ctrl+Z` reverts the entire drag in one step.

---

## Layer 3: UI Components (`components/workspace/<workspace>/`)

### Directory Structure

```
components/workspace/<workspace>/
├── <Workspace>StudioRoot.tsx     # Root orchestrator (mode, fetch, save, export)
├── canvas/
│   └── <Canvas>Viewport.tsx      # Interactive canvas (pan, zoom, select, drag)
└── panels/
    ├── <Workspace>Toolbar.tsx    # Top bar: mode toggle, tools, zoom, undo/redo, save
    ├── ElementInspector.tsx      # Type-polymorphic property panel
    ├── LayerTreePanel.tsx        # Recursive node hierarchy with visibility/lock toggles
    └── InsertElementMenu.tsx     # Quick-add palette for new elements
```

### Adaptive Workspace Morphing (View ↔ Edit)

The workspace layout MUST adapt based on `designMode` in `workspace-store.ts`:

| Aspect | View Mode | Edit Mode |
|---|---|---|
| **Left sidebar** | AI Chat Panel (conversation) | Studio Inspector/Layers/Insert tabs |
| **Canvas** | Static centered preview | Interactive viewport with gizmos |
| **Toolbar** | Minimal (mode switch, zoom, export) | Full (tools, undo/redo, save) |
| **Artifacts drawer** | Available | Suppressed for max canvas area |

The mode toggle lives in the Toolbar as a `[👁 View | ✏️ Edit]` pill.

### Canvas Viewport Patterns

- Render the **native document format** (e.g., SVG DOM) for full visual fidelity (gradients, filters, defs).
- Overlay an **interactive gizmo layer** (HTML/CSS absolute-positioned) for selection bounds, resize handles, and transform controls.
- Use `getBBox()` (or equivalent) for precise bounding boxes, with mathematical fallback from AST node attributes.
- Track drag state with `useRef` (not `useState`) to avoid React re-render overhead during 60fps interactions.

---

## Layer 4: AI Agent & Tools (`lib/ai/agents/<workspace>/`)

### Agent Factory (`agent.ts`)

- Use AI SDK `ToolLoopAgent` with step count limits.
- System prompt guides the LLM through a disciplined multi-step pipeline specific to the workspace domain.
- Mark budget-consuming tools (image generation, video rendering) with `'user-approval'`; keep read-only and template tools free.

### Tool Implementations (`tools.ts`)

Every workspace agent MUST include these tool categories:

| Category | Design Example | Purpose |
|---|---|---|
| **List templates/presets** | `listDesignTemplates` | Let the agent discover available archetypes |
| **Compose/generate artifact** | `composeFromTemplate` | Deterministic artifact creation (the PRIMARY tool) |
| **Search external assets** | `searchImages` | Find reference material from the web |
| **Fetch/import assets** | `fetchImage` | Download external content into project R2 vault |
| **AI generation** | `generateImage` | Budget-gated generative content |
| **Transform/convert** | `traceImage` | Convert between formats (raster→vector, etc.) |
| **Export** | `exportDesign` | Render to distributable formats |
| **Budget check** | `checkBudget` | Query spend ledger before costly operations |

### Key Tool Patterns

- **Dynamic lazy imports:** Defer heavy Node/native deps (`sharp`, `resvg`, `potrace`) to tool execution time with `await import(...)`.
- **Execution context injection:** Read `projectId` and `userId` from `getToolContext()`.
- **Self-contained pipeline:** The compose tool generates the artifact, writes to R2, creates the DB record, and returns the API URL — all in one tool call.
- **Project-scoped asset URLs:** Always construct `/api/projects/${projectId}/assets/${assetId}` for embedded references.

---

## Asset Streaming & URL Resolution

### Problem
SVGs (and other embedded documents) containing external asset references (`<image href="...">`) face CORS blocking and canvas tainting when pointing to external CDN URLs or R2 presigned redirects.

### Solution: Same-Origin Binary Streaming

1. **Template solver / AI tools** insert relative same-origin paths:
   ```
   /api/projects/[projectId]/assets/[assetId]
   ```
2. **API route** (`app/api/projects/[id]/assets/[assetId]/route.ts`) validates auth, fetches the raw buffer from R2 via `getAssetBuffer()`, and streams it with proper `Content-Type` and `Cache-Control` headers.
3. **Universal fallback** (`app/api/assets/[assetId]/route.ts`) resolves assets globally when project context is unavailable.

---

## Testing Strategy

Each workspace core library MUST have unit tests in `tests/<workspace>-tool.test.ts`:

- Empty document creation with correct defaults
- Bidirectional serialization round-trip
- History stack push/undo/redo/branch-invalidation
- Store mutations (add, update, delete, toggle)
- Debounced drag transaction (N continuous updates → 1 undo step)

Tests are pure vitest, node environment, no DOM mocks needed for core logic.

---

## Workspace Integration Checklist

When creating a new workspace type:

- [ ] Create `lib/<workspace>-tool/` with `types.ts`, `parser.ts`, `history.ts`
- [ ] Create `lib/<workspace>-tool/use<Workspace>Store.ts` (Zustand)
- [ ] Create `components/workspace/<workspace>/` with StudioRoot, Canvas, and Panels
- [ ] Create `lib/ai/agents/<workspace>/agent.ts` and `tools.ts`
- [ ] Add workspace type to `ContentWorkspace.tsx` polymorphic rendering
- [ ] Add `designMode` equivalent to `stores/workspace-store.ts`
- [ ] Add tests in `tests/<workspace>-tool.test.ts`
- [ ] Verify asset URLs resolve through same-origin streaming routes

---

## Reference Implementation

The Design Workspace is the canonical reference:

| Layer | Files |
|---|---|
| Core | `lib/design-tool/{types,parser,history}.ts` |
| Store | `lib/design-tool/useDesignStore.ts` |
| UI Root | `components/workspace/design/DesignStudioRoot.tsx` |
| Canvas | `components/workspace/design/canvas/PixiCanvasViewport.tsx` |
| Panels | `components/workspace/design/panels/{DesignToolbar,ElementInspector,LayerTreePanel,InsertElementMenu}.tsx` |
| Agent | `lib/ai/agents/design/{agent,tools}.ts` |
| Templates | `lib/artifacts/templates/{types,solver,catalog}.ts` |
| Tests | `tests/{design-tool,design}.test.ts` |
