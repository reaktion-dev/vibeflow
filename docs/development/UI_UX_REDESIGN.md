# AI Dev Platform - UI/UX Redesign (v0.app / Bolt.new Aesthetic)

## Overview

The platform has been redesigned with a modern, AI-first interface inspired by v0.app and Bolt.new. The new design emphasizes:

- **Centered, chat-first experience** - Large prompt input area takes center stage
- **Minimal, distraction-free layout** - Clean dark theme with strategic use of color
- **Resizable panels** - Flexible layout for different working styles
- **AI-first workflows** - Integrated AI chat sidebar with agent tool calling
- **Modern component library** - Shadcn UI components with AI Elements support

## New Architecture

### Layout Structure

```
┌─────────────────────────────────────────────┐
│  Sidebar          │   Main Content          │
├──────────────────┼────────────────────────┤
│                  │  DashboardContent      │
│  - New Project   │  - Centered Heading    │
│  - Projects      │  - Large Prompt Area   │
│  - Recent        │  - Quick Actions       │
│  - Templates     │  - Integration Badges  │
│  - Search        │  - Project Grid        │
│                  │                        │
└──────────────────┴────────────────────────┘

IDE Layout (when project opened):
┌──────────────────────────────────────────┐
│  Header: Project Name / Run / Deploy      │
├──────┬────────────────────────┬──────────┤
│      │                        │          │
│File  │    Editor Pane         │   AI     │
│Tree  │   (with preview)       │  Chat    │
│      │                        │ Sidebar  │
├──────┼────────────────────────┤          │
│      │    Terminal Output     │          │
│      │  (Real-time Streaming) │          │
└──────┴────────────────────────┴──────────┘
```

### Component Hierarchy

```
app/page.tsx (Main Dashboard)
├── Sidebar
│   ├── Brand + Logo
│   ├── New Project Button
│   ├── Search Bar
│   └── Navigation Menu
└── DashboardContent
    ├── Header (Welcome message)
    ├── Centered Prompt Area
    │   ├── Textarea Input
    │   ├── Tool Buttons (+, Icon)
    │   └── Create Button
    ├── Quick Actions Grid
    │   ├── Clone from Git
    │   ├── Upload Project
    │   ├── Use Template
    │   └── AI Agent
    └── Integration Badges

app/projects/[id]/page.tsx (Project IDE)
└── ResizableIDE
    ├── Header
    ├── Main Content (3-panel layout)
    │   ├── FileTree
    │   ├── EditorPane + Terminal
    │   └── ChatSidebar
    └── Footer Controls
```

## Key Components

### 1. Sidebar (`components/layout/Sidebar.tsx`)
- Left navigation with project/search/templates
- Brand identity with logo
- Quick access buttons
- Status information at bottom

**Features:**
- Persistent across pages
- Responsive icon-based navigation
- Search functionality
- New project quick-action

### 2. Dashboard Content (`components/dashboard/DashboardContent.tsx`)
- Centered, attention-focused layout
- Large prompt input area
- Quick action cards (4 options)
- Integration badges
- Project grid display

**Features:**
- v0.app-inspired "What do you want to create?" heading
- Visible file tools and actions within prompt area
- Integration showcase (GitHub, GitLab, DevOps, Web)
- Status badges for projects (active/building/failed)

### 3. Project Creation Modal (`components/dashboard/ProjectCreationModal.tsx`)
- Step 1: Choose project type (Git clone, Upload, Template)
- Step 2: Enter details (project name, Git URL)
- Loading state with spinner
- Integrated toast notifications

**Features:**
- Modal-based workflow
- Multi-step process
- Type-specific fields
- Error handling with user feedback

### 4. Resizable IDE (`components/ide/ResizableIDE.tsx`)
- Three-pane layout: Files | Editor+Terminal | Chat
- Fixed-width sidebar panels
- Collapsible file tree and chat
- Header with project info and action buttons

**Features:**
- Toggle visibility of file tree
- Toggle visibility of AI chat
- Real-time terminal streaming
- Responsive footer controls
- Smooth collapse/expand animations

### 5. File Tree (`components/ide/FileTree.tsx`)
- Hierarchical file display
- Expand/collapse folders
- File selection
- Icon-based file type indicators

### 6. Editor Pane (`components/ide/EditorPane.tsx`)
- Code display with syntax highlighting
- File content preview
- Placeholder for actual code editor integration

### 7. Terminal (`components/ide/Terminal.tsx`)
- Real-time command output
- SSE-based streaming
- Command history display
- Scrollable output area

### 8. AI Chat Sidebar (`components/ai/ChatSidebar.tsx`)
- Conversation history
- Input field for prompts
- AI response streaming
- Tool-calling visualization
- Context-aware assistance (project files, terminal, etc.)

## Styling & Theme

### Color Palette

The platform uses a developer-focused dark theme:

```
Primary: oklch(0.58 0.243 264.376) - Purple/Blue
Background: oklch(0.11 0 0) - Almost black
Card: oklch(0.14 0 0) - Very dark gray
Muted: oklch(0.25 0 0) - Dark gray
Foreground: oklch(0.93 0 0) - Off-white
Border: oklch(1 0 0 / 8%) - Subtle borders
```

### Typography

- Headers: Semibold to Bold weights
- Body text: Regular weight, 0.9+ opacity for legibility
- Code/Terminal: Monospace font (via Tailwind font-mono)

### Spacing & Layout

- Padding: 4px → 32px scale (Tailwind spacing)
- Gaps: Consistent 2-4px for component spacing
- Borders: 1px with subtle color at 8% opacity
- Radius: 8px default (lg variant)

### Interactive States

```css
Button Default: bg-primary text-primary-foreground
Button Hover: bg-primary/90
Button Disabled: opacity-50 pointer-events-none

Input Focus: ring-2 ring-primary/50
Panel Hover: border-primary/50 opacity-80
```

## Integration Points

### 1. Daytona Sandbox Integration
- File operations via `/api/projects/[id]/files`
- Terminal commands via `/api/projects/[id]/terminal`
- Bidirectional real-time updates

### 2. AI SDK v7 Integration
- Chat streaming via `/api/projects/[id]/chat`
- Multi-provider support (OpenAI, Anthropic, Google, etc.)
- Tool-calling for agent operations
- Context-aware prompt engineering

### 3. Git Operations
- Clone projects from any Git URL
- SSH key support
- Repository detection (GitHub, GitLab, Gitea, etc.)

## Future Enhancements

### Phase 2 - Advanced IDE Features
- [ ] Full code editor with syntax highlighting (Monaco/CodeMirror)
- [ ] Git diff visualization
- [ ] Multi-file editing with tabs
- [ ] Keyboard shortcuts and command palette
- [ ] Theme customization

### Phase 3 - Advanced AI Features
- [ ] AI Elements `PromptInput` component for rich prompts
- [ ] AI Elements `Conversation` component for chat history
- [ ] Multi-turn conversation context
- [ ] Agent memory and context persistence
- [ ] Code generation and refactoring

### Phase 4 - Team & Collaboration
- [ ] Workspace sharing
- [ ] Real-time collaboration (via Daytona shared sessions)
- [ ] Comments and annotations
- [ ] Activity timeline

### Phase 5 - DevOps & Deployment
- [ ] Build process visualization
- [ ] Deployment targets (Vercel, AWS, Netlify, etc.)
- [ ] Environment variable management
- [ ] Logs streaming and filtering

## Development Notes

### Running the App

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run type checking
pnpm tsc --noEmit
```

### Key Dependencies

- `next@16` - Framework
- `react@19` - UI library
- `tailwindcss@4` - Styling
- `shadcn/ui` - Component library
- `lucide-react` - Icons
- `swr` - Data fetching & caching
- `ai@next` - AI SDK v7
- `zod` - Type validation
- `react-hot-toast` - Notifications
- `react-resizable-panels` - Resizable layouts

### Environment Variables

```env
DAYTONA_API_KEY=xxx          # Daytona Cloud API key
DAYTONA_API_BASE_URL=https://api.daytona.io
VERCEL_AI_GATEWAY_KEY=xxx    # AI Gateway key (optional with Vercel deployment)
OPENAI_API_KEY=xxx           # OpenAI API key (or use AI Gateway)
```

## File Structure

```
app/
├── page.tsx                    # Dashboard page
├── layout.tsx                  # Root layout
├── globals.css                 # Theme + global styles
├── api/
│   └── projects/
│       ├── route.ts            # Create/list projects
│       └── [id]/
│           ├── route.ts        # Get/update project
│           ├── files/route.ts   # File operations
│           ├── terminal/route.ts # Terminal/command execution
│           └── chat/route.ts    # AI chat with streaming
└── projects/[id]/
    └── page.tsx                # IDE for specific project

components/
├── layout/
│   └── Sidebar.tsx             # Left navigation
├── dashboard/
│   ├── DashboardContent.tsx    # Main dashboard view
│   └── ProjectCreationModal.tsx # Project creation flow
├── ide/
│   ├── ResizableIDE.tsx        # Main IDE layout
│   ├── FileTree.tsx            # File browser
│   ├── EditorPane.tsx          # Code editor
│   └── Terminal.tsx            # Command output
├── ai/
│   └── ChatSidebar.tsx         # AI assistant chat
└── ui/
    ├── button.tsx              # Button component
    └── [other shadcn components]

hooks/
├── useProject.ts               # Project data & operations
├── useFileOperations.ts        # File CRUD operations
└── useAIChat.ts                # AI chat state management

lib/
├── env.ts                      # Environment validation
├── types.ts                    # TypeScript interfaces
├── utils/
│   ├── errors.ts              # Error handling
│   └── streaming.ts           # SSE streaming utilities
├── daytona/
│   ├── client.ts              # Daytona API client
│   └── operations.ts          # High-level operations
├── ai/
│   └── client.ts              # AI SDK setup & tools
└── projects/
    └── service.ts             # Project business logic
```

## Next Steps for Developer

1. **Fix TypeScript errors** - Review error list and fix remaining type issues
2. **Test core flows**:
   - Create new project from Git URL
   - Open project in IDE
   - View files and terminal
   - Send chat message to AI
3. **Add real AI Elements components**:
   - Replace ChatSidebar with AI Elements `PromptInput`
   - Add `Conversation` component for chat display
   - Implement streaming message updates
4. **Connect to real Daytona instance**:
   - Set DAYTONA_API_KEY environment variable
   - Test file listing and operations
   - Test terminal command execution
5. **Polish and deploy**:
   - Add animations and transitions
   - Implement keyboard shortcuts
   - Add loading skeletons
   - Deploy to Vercel

## Design Inspiration References

- **v0.app** - Centered input area, sidebar navigation, integration badges
- **Bolt.new** - Resizable editor panels, AI-first workflow, minimal chrome
- **Replit** - Terminal integration, file tree, real-time collaboration
- **VSCode** - Familiar IDE layout, activity bar, status bar

The combination creates a modern, AI-powered development environment that feels both familiar to developers and fresh for new workflows.
