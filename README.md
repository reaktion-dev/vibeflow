# Vibeflow — Agentic Development & Content Creation Platform

AI-powered coding agents, design canvases, video studio, and visual workflows — all in one remote workspace.

## Overview

Vibeflow is a comprehensive platform that combines:

- **🤖 AI Coding Agents** — MCP/ACP protocol-driven agents that write, debug, and deploy code
- **🎨 Design Canvas** — PixiJS-powered graphics editor with AI image generation
- **🎬 Video Studio** — Remotion-based video composition and rendering
- **⚡ Visual Workflows** — Node-based agent orchestration and automation
- **🖥️ Remote Workspace** — Daytona sandboxes for isolated development

## Features

### Coding Agent
- AI SDK v7 with multi-provider support (OpenAI, Anthropic, Google)
- MCP (Model Context Protocol) for tool integration
- ACP (Agent Communication Protocol) for agent-to-agent communication
- Real-time terminal and file operations
- Code analysis and refactoring

### Design Canvas
- WebGL-accelerated rendering with PixiJS
- Layer-based composition
- AI image generation (text-to-image, inpainting)
- Drawing tools (brush, shapes, text)
- Export to PNG, JPG, SVG

### Video Studio
- React-based video composition with Remotion
- Timeline editor with tracks
- Pre-built video templates
- AI script generation
- Server-side rendering pipeline

### Visual Workflows
- Drag-and-drop node editor (@xyflow/react)
- Agent, Tool, Input, Output, Condition nodes
- Type-safe connections
- Execution engine with progress tracking

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS |
| **UI** | shadcn/ui, Lucide Icons, Framer Motion |
| **AI** | AI SDK v7, Vercel AI Gateway, MCP |
| **Design** | PixiJS, Fabric.js |
| **Video** | Remotion, FFmpeg |
| **Workflows** | @xyflow/react, Zustand |
| **Backend** | Next.js API Routes, Drizzle ORM |
| **Database** | Neon PostgreSQL |
| **Auth** | Better Auth (GitHub OAuth, Email/Password) |
| **Sandbox** | Daytona Cloud API |

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- Daytona Cloud API key
- AI provider API key (OpenAI, Anthropic, etc.)

### Installation

```bash
git clone <repo-url>
cd vibeflow
pnpm install
```

### Environment Variables

```bash
# Required
DAYTONA_API_KEY=your_daytona_api_key
OPENAI_API_KEY=your_openai_key

# Optional
VERCEL_AI_GATEWAY_KEY=your_ai_gateway_key
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed system design.

## License

MIT
