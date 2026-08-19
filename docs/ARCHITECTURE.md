# Vibeflow — Architecture & Implementation Plan

## Vision

Vibeflow is an **agentic development and content creation platform** that combines:
- **AI-powered coding agents** (MCP/ACP protocols)
- **Design canvases** (PixiJS + AI image generation)
- **Video studio** (Remotion-based composition)
- **Visual workflow builder** (node-based agent orchestration)
- **Remote workspace** (Daytona sandboxes)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          VIBEFLOW PLATFORM                               │
├────────────┬────────────┬────────────┬────────────┬─────────────────────┤
│   CODING   │   DESIGN   │   VIDEO    │   FLOW     │   WORKSPACE         │
│   AGENT    │   CANVAS   │   STUDIO   │   BUILDER  │   MANAGER           │
│            │            │            │            │                     │
│  AI SDK    │  PixiJS    │  Remotion  │  @xyflow   │  Daytona            │
│  MCP       │  Fabric.js │  React     │  Zustand   │  Sandboxes          │
│  ACP       │  AI Gen    │  Canvas    │  Custom    │  Git                │
│  Shiki     │  Layers    │  FFmpeg    │  Nodes     │  Filesystem         │
└─────┬──────┴─────┬──────┴─────┬──────┴─────┬──────┴────────┬────────────┘
      │            │            │            │               │
      └────────────┴────────────┴────────────┴───────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │      CORE LAYER          │
                    │                          │
                    │  Auth (Better Auth)       │
                    │  DB (Drizzle + Neon)      │
                    │  AI Gateway (Vercel)      │
                    │  Daytona Cloud API        │
                    │  MCP Server Registry      │
                    └──────────────────────────┘
```

---

## Phase 1: Rebrand & Refactor

### Goal
Rename "Flowspace" → "Vibeflow", restructure for multi-workspace model.

### Changes
| File | Change |
|------|--------|
| `app/layout.tsx` | Update metadata title/description to Vibeflow |
| `app/page.tsx` | Update component references |
| `components/landing/landing-page.tsx` | Update branding |
| `components/landing/landing-hero.tsx` | New hero copy |
| `components/landing/landing-topbar.tsx` | Vibeflow logo/title |
| `components/landing/landing-sidebar.tsx` | Navigation for all workspace types |
| `README.md` | Full rewrite for Vibeflow |
| `package.json` | Name → "vibeflow" |

### New Directory Structure
```
app/
├── page.tsx                          # Landing/home
├── layout.tsx                        # Root layout
├── auth/                             # Auth pages (existing)
├── workspaces/                       # Workspace management
│   ├── page.tsx                      # Workspace list
│   └── [id]/
│       ├── page.tsx                  # Workspace overview
│       ├── code/page.tsx             # Coding agent workspace
│       ├── design/page.tsx           # Design canvas workspace
│       ├── video/page.tsx            # Video studio workspace
│       └── flow/page.tsx             # Workflow builder
├── api/
│   ├── auth/                         # Auth routes (existing)
│   ├── projects/                     # Project CRUD (existing)
│   ├── agents/                       # Agent orchestration
│   │   ├── route.ts                  # List/create agents
│   │   ├── [id]/route.ts             # Agent CRUD
│   │   ├── [id]/chat/route.ts        # Agent chat (MCP)
│   │   └── [id]/execute/route.ts     # Agent execution
│   ├── mcp/                          # MCP server management
│   │   ├── servers/route.ts          # List/register MCP servers
│   │   └── tools/route.ts            # List available tools
│   ├── design/                       # Design canvas API
│   │   ├── generate/route.ts         # AI image generation
│   │   └── export/route.ts           # Export assets
│   ├── video/                        # Video studio API
│   │   ├── render/route.ts           # Trigger Remotion render
│   │   ├── preview/route.ts          # Preview compositions
│   │   └── templates/route.ts        # Video templates
│   └── workflows/                    # Workflow builder API
│       ├── route.ts                  # CRUD workflows
│       └── [id]/execute/route.ts     # Execute workflow
└── globals.css                       # Updated theme

components/
├── landing/                          # Landing page (existing, updated)
├── auth/                             # Auth forms (existing)
├── ide/                              # Coding workspace (existing, refactored)
├── design/                           # NEW: Design canvas
│   ├── DesignCanvas.tsx              # Main PixiJS canvas
│   ├── LayerPanel.tsx                # Layer management
│   ├── ToolPalette.tsx               # Drawing tools
│   ├── PropertyPanel.tsx             # Object properties
│   ├── AIGenerationPanel.tsx         # AI image gen controls
│   └── ExportDialog.tsx              # Export options
├── video/                            # NEW: Video studio
│   ├── VideoTimeline.tsx             # Timeline component
│   ├── CompositionPreview.tsx        # Remotion preview
│   ├── VideoPropertyPanel.tsx        # Property editor
│   ├── TemplateLibrary.tsx           # Video templates
│   └── RenderControls.tsx            # Render settings
├── workflow/                         # NEW: Flow builder
│   ├── FlowBuilder.tsx               # Main @xyflow container
│   ├── nodes/                        # Custom node types
│   │   ├── AgentNode.tsx             # AI agent node
│   │   ├── ToolNode.tsx              # Tool execution node
│   │   ├── InputNode.tsx             # Input/trigger node
│   │   ├── OutputNode.tsx            # Output/result node
│   │   └── ConditionNode.tsx         # Conditional logic
│   └── edges/                        # Custom edge types
│       └── AnimatedEdge.tsx          # Animated connection
├── ai/                               # AI components (existing, expanded)
│   ├── ChatSidebar.tsx               # Existing
│   ├── AgentOrchestrator.tsx         # NEW: Multi-agent UI
│   └── MCPToolSelector.tsx           # NEW: Tool selection
├── workspace/                        # NEW: Workspace shell
│   ├── WorkspaceLayout.tsx           # Workspace container
│   ├── WorkspaceTabs.tsx             # Tab navigation
│   └── WorkspaceToolbar.tsx          # Action toolbar
├── ui/                               # shadcn components (existing)
└── layout/                           # Layout components (existing)

lib/
├── ai/                               # AI client (existing, expanded)
│   ├── client.ts                     # Existing AI SDK setup
│   ├── agents.ts                     # NEW: Agent definitions
│   └── prompts.ts                    # NEW: System prompts
├── mcp/                              # NEW: MCP protocol layer
│   ├── client.ts                     # MCP client implementation
│   ├── server.ts                     # MCP server for Vibeflow tools
│   ├── registry.ts                   # MCP server registry
│   └── tools.ts                      # Tool definitions
├── acp/                              # NEW: ACP protocol layer
│   ├── protocol.ts                   # Agent Communication Protocol
│   ├── registry.ts                   # Agent registry
│   └── messages.ts                   # Message types
├── daytona/                          # Sandbox client (existing)
├── design/                           # NEW: Design engine
│   ├── canvas.ts                     # PixiJS canvas manager
│   ├── layers.ts                     # Layer system
│   ├── tools.ts                      # Drawing tools
│   ├── ai-generation.ts              # AI image generation
│   └── export.ts                     # Export utilities
├── video/                            # NEW: Video engine
│   ├── remotion.ts                   # Remotion integration
│   ├── templates.ts                  # Video templates
│   ├── timeline.ts                   # Timeline management
│   └── render.ts                     # Render pipeline
├── workflow/                         # NEW: Workflow engine
│   ├── executor.ts                   # Workflow execution
│   ├── validator.ts                  # Workflow validation
│   └── node-types.ts                 # Node type definitions
├── db/                               # Database (existing, expanded)
│   ├── schema.ts                     # Add new tables
│   └── index.ts                      # DB connection
├── auth.ts                           # Auth config (existing)
├── auth-client.ts                    # Auth client (existing)
├── env.ts                            # Env config (existing, expanded)
├── types.ts                          # Global types (existing, expanded)
└── utils.ts                          # Utilities (existing)

hooks/
├── useProject.ts                     # Existing
├── useFileOperations.ts              # Existing
├── useAIChat.ts                      # Existing
├── useWorkspace.ts                   # NEW: Workspace state
├── useDesignCanvas.ts                # NEW: Canvas operations
├── useVideoStudio.ts                 # NEW: Video operations
├── useWorkflow.ts                    # NEW: Workflow operations
└── useAgent.ts                       # NEW: Agent operations
```

### New Database Tables

```sql
-- Workspace table
CREATE TABLE workspace (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'code' | 'design' | 'video' | 'flow'
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent table
CREATE TABLE agent (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  model TEXT NOT NULL DEFAULT 'gpt-4-turbo',
  system_prompt TEXT,
  tools JSONB DEFAULT '[]',
  workspace_id TEXT REFERENCES workspace(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent conversation
CREATE TABLE agent_conversation (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agent(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  tool_calls JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MCP server registry
CREATE TABLE mcp_server (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  tools JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active',
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Design project
CREATE TABLE design_project (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  workspace_id TEXT REFERENCES workspace(id) ON DELETE SET NULL,
  canvas_data JSONB DEFAULT '{}',
  layers JSONB DEFAULT '[]',
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Video project
CREATE TABLE video_project (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  workspace_id TEXT REFERENCES workspace(id) ON DELETE SET NULL,
  composition JSONB DEFAULT '{}',
  timeline JSONB DEFAULT '[]',
  duration INTEGER DEFAULT 30,
  fps INTEGER DEFAULT 30,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workflow
CREATE TABLE workflow (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  nodes JSONB DEFAULT '[]',
  edges JSONB DEFAULT '[]',
  workspace_id TEXT REFERENCES workspace(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Phase 2: MCP + ACP Agent Layer

### MCP (Model Context Protocol) Implementation

MCP provides a standard way for agents to connect to tools and data sources.

```
┌─────────────────────────────────────────────────┐
│              MCP Architecture                     │
│                                                   │
│  ┌─────────┐    ┌──────────┐    ┌─────────────┐ │
│  │ AI Agent│◄──►│MCP Client│◄──►│MCP Server   │ │
│  │ (AI SDK)│    │          │    │(Tool Host)  │ │
│  └─────────┘    └──────────┘    └─────────────┘ │
│                                                   │
│  Tool Sources:                                    │
│  ├─ File System (sandbox)                        │
│  ├─ Terminal (sandbox)                           │
│  ├─ Database (Drizzle)                           │
│  ├─ Design Canvas (PixiJS)                       │
│  ├─ Video Studio (Remotion)                      │
│  └─ External APIs (via registry)                 │
└─────────────────────────────────────────────────┘
```

**MCP Client** (`lib/mcp/client.ts`):
- Connects to MCP servers
- Discovers available tools
- Invokes tools with arguments
- Handles streaming responses

**MCP Server** (`lib/mcp/server.ts`):
- Exposes Vibeflow tools via MCP protocol
- File system operations
- Terminal execution
- Design canvas manipulation
- Video composition control

### ACP (Agent Communication Protocol) Implementation

ACP enables agent-to-agent communication for multi-agent workflows.

```
┌─────────────────────────────────────────────────┐
│              ACP Architecture                     │
│                                                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │ Coder   │  │ Designer│  │ Video   │         │
│  │ Agent   │  │ Agent   │  │ Agent   │         │
│  └────┬────┘  └────┬────┘  └────┬────┘         │
│       │            │            │                │
│       └────────────┼────────────┘                │
│                    │                             │
│            ┌───────┴───────┐                    │
│            │  ACP Router   │                    │
│            │  (Message Bus)│                    │
│            └───────────────┘                    │
│                                                   │
│  Message Types:                                   │
│  ├─ task.assign     - Assign task to agent       │
│  ├─ task.complete   - Agent completed task       │
│  ├─ data.transfer   - Share data between agents  │
│  ├─ status.update   - Agent status change        │
│  └─ error.report    - Error propagation          │
└─────────────────────────────────────────────────┘
```

**Key Agent Types**:
| Agent | Role | Tools |
|-------|------|-------|
| **CoderAgent** | Write/debug code | readFile, writeFile, runCommand, analyzeCode |
| **DesignerAgent** | Create/edit designs | createLayer, applyFilter, generateImage |
| **VideoAgent** | Compose/edit video | addClip, renderComposition, applyEffect |
| **OrchestratorAgent** | Coordinate workflows | assignTask, monitorProgress, aggregateResults |

---

## Phase 3: AI-Powered Design Canvas

### Tech Stack
- **PixiJS** — WebGL-accelerated 2D rendering
- **Fabric.js** — Object model for canvas manipulation
- **AI Generation** — DALL-E 3 / Stable Diffusion integration

### Canvas Features
1. **Drawing Tools**: Brush, pencil, shape, text, eraser
2. **Layer System**: Add, remove, reorder, group, lock layers
3. **AI Generation**: Text-to-image, inpainting, style transfer
4. **Filters**: Blur, sharpen, color adjustments, effects
5. **Export**: PNG, JPG, SVG, PDF

### Architecture
```
┌─────────────────────────────────────────────────┐
│            Design Canvas Architecture             │
│                                                   │
│  ┌───────────────────────────────────────────┐  │
│  │              Canvas Manager               │  │
│  │  ┌─────────┐ ┌─────────┐ ┌────────────┐ │  │
│  │  │ PixiJS  │ │ Fabric  │ │ AI Engine  │ │  │
│  │  │ Renderer│ │ Objects │ │ Generation │ │  │
│  │  └─────────┘ └─────────┘ └────────────┘ │  │
│  └───────────────────────────────────────────┘  │
│                    ▲                             │
│  ┌─────────────────┴─────────────────────────┐  │
│  │           Layer System                     │  │
│  │  └─ Background Layer                      │  │
│  │  └─ Image Layer                           │  │
│  │  └─ Shape Layer                           │  │
│  │  └─ Text Layer                            │  │
│  │  └─ AI Generated Layer                    │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## Phase 4: Remotion Video Studio

### Tech Stack
- **Remotion** — React-based video composition
- **FFmpeg** — Server-side video processing
- **Canvas API** — Frame rendering

### Video Features
1. **Timeline Editor**: Add, trim, reorder clips
2. **Composition Builder**: React components as video scenes
3. **Template Library**: Pre-built video templates
4. **AI Script Generation**: Generate video scripts from prompts
5. **Render Pipeline**: Server-side rendering with progress tracking

### Architecture
```
┌─────────────────────────────────────────────────┐
│            Video Studio Architecture              │
│                                                   │
│  ┌───────────────────────────────────────────┐  │
│  │           Composition Engine              │  │
│  │  ┌─────────────┐  ┌──────────────────┐  │  │
│  │  │  Remotion   │  │  Template Engine │  │  │
│  │  │  Renderer   │  │  (React comps)   │  │  │
│  │  └─────────────┘  └──────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
│                    ▲                             │
│  ┌─────────────────┴─────────────────────────┐  │
│  │           Timeline Manager                 │  │
│  │  └─ Track 1: Video                        │  │
│  │  └─ Track 2: Audio                        │  │
│  │  └─ Track 3: Text Overlay                 │  │
│  │  └─ Track 4: Effects                      │  │
│  └───────────────────────────────────────────┘  │
│                                                   │
│  ┌───────────────────────────────────────────┐  │
│  │           Render Pipeline                  │  │
│  │  Preview → Render → Export (MP4/WebM)     │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## Phase 5: Visual Workflow Builder

### Tech Stack
- **@xyflow/react** — Node-based editor (already installed)
- **Zustand** — State management for flow
- **Custom Nodes** — Agent, Tool, Input, Output, Condition

### Workflow Features
1. **Drag & Drop**: Add nodes from palette
2. **Node Types**: Agent, Tool, Input, Output, Condition, Loop
3. **Connection Validation**: Type-safe edge connections
4. **Execution Engine**: Run workflows step-by-step
5. **Templates**: Pre-built workflow templates

### Node Types
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Agent Node │  │  Tool Node  │  │ Input Node  │
│  ─────────  │  │  ─────────  │  │  ─────────  │
│  Model:     │  │  MCP Tool:  │  │  Trigger:   │
│  GPT-4      │  │  readFile   │  │  Manual     │
│  Prompt:    │  │  Args: {}   │  │  Schedule   │
│  "Debug..." │  │             │  │  Webhook    │
└─────────────┘  └─────────────┘  └─────────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Output Node │  │Condition Node│ │  Loop Node  │
│  ─────────  │  │  ─────────  │  │  ─────────  │
│  Action:    │  │  IF:        │  │  For each:  │
│  Save file  │  │  result.x   │  │  items in   │
│  Deploy     │  │  THEN/ELSE  │  │  collection │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## Packages to Install

```bash
# Phase 2: MCP/ACP
pnpm add @modelcontextprotocol/sdk

# Phase 3: Design Canvas
pnpm add pixi.js @pixi/react fabric

# Phase 4: Video Studio
pnpm add remotion @remotion/player @remotion/renderer

# Already installed
# @xyflow/react — Workflow builder
# ai — AI SDK
# @ai-sdk/vercel — AI Gateway
# zustand — State management
# shiki — Code highlighting
# @rive-app/react-webgl2 — Animations
```

---

## Implementation Order

1. **Phase 1** (This session): Rebrand + Refactor
   - Rename to Vibeflow
   - Update all metadata, titles, copy
   - Restructure directories for multi-workspace
   - Update database schema with new tables
   - Create workspace shell component

2. **Phase 2** (Next session): Agent System
   - MCP client/server implementation
   - ACP protocol layer
   - Agent definitions and orchestration
   - Enhanced chat with tool calling

3. **Phase 3** (Future): Design Canvas
   - PixiJS canvas integration
   - Layer system
   - Drawing tools
   - AI image generation

4. **Phase 4** (Future): Video Studio
   - Remotion setup
   - Timeline editor
   - Composition builder
   - Render pipeline

5. **Phase 5** (Future): Workflow Builder
   - Custom @xyflow nodes
   - Execution engine
   - Agent integration
   - Template library

---

## Environment Variables

```bash
# Existing
DAYTONA_API_KEY=
DAYTONA_API_BASE_URL=
VERCEL_AI_GATEWAY_KEY=
OPENAI_API_KEY=
BETTER_AUTH_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
DATABASE_URL=

# Phase 2: MCP/ACP
MCP_REGISTRY_URL=           # Optional: MCP server registry
ACP_SECRET=                 # Secret for ACP message signing

# Phase 3: Design Canvas
STABILITY_API_KEY=          # For AI image generation
REPLICATE_API_TOKEN=        # Alternative AI image gen

# Phase 4: Video Studio
REMOTION_LICENSE_KEY=       # Remotion license (optional)
FFMPEG_PATH=                # Path to ffmpeg binary

# Phase 5: Workflow Builder
WORKFLOW_EXECUTOR_URL=      # Optional: Remote executor
```
