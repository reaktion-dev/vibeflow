# Architecture Overview

Visual and detailed breakdown of the Daytona AI Dev Platform architecture.

## System Architecture Diagram

```
┌────────────────────────────────────────────────────────────┐
│                   BROWSER / CLIENT                         │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │            React 19 Application                     │  │
│  │                                                     │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │         Dashboard Page                       │  │  │
│  │  │  - ProjectList Component                     │  │  │
│  │  │  - New Project Form                          │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                     │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │         IDE Page                            │  │  │
│  │  │  - IDELayout Component                       │  │  │
│  │  │  ├─ FileTree (Left Sidebar)                  │  │  │
│  │  │  ├─ EditorPane (Center)                      │  │  │
│  │  │  ├─ Terminal (Bottom)                        │  │  │
│  │  │  └─ ChatSidebar (Right Sidebar)              │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                     │  │
│  │  Custom Hooks (Data Management)                    │  │
│  │  ├─ useProject()         - Project CRUD           │  │
│  │  ├─ useFileTree()        - File browser state      │  │
│  │  ├─ useFileContent()     - Editor state            │  │
│  │  ├─ useTerminalCommand() - Terminal SSE stream     │  │
│  │  └─ useAIChat()          - Chat SSE stream         │  │
│  │                                                     │  │
│  │  State Libraries                                   │  │
│  │  ├─ SWR (Data fetching, caching)                   │  │
│  │  └─ React Hooks (Local component state)            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│                      ↓ HTTP / SSE                           │
│                                                             │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│              NEXT.JS API LAYER / SERVER                    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  API Route Handlers (app/api/)                             │
│  ├─ POST   /projects              ← Create project         │
│  ├─ GET    /projects              ← List projects          │
│  ├─ GET    /projects/[id]         ← Get project            │
│  ├─ DELETE /projects/[id]         ← Delete project         │
│  │                                                          │
│  ├─ GET    /projects/[id]/files          ← List/read files │
│  ├─ POST   /projects/[id]/files          ← Write files     │
│  ├─ DELETE /projects/[id]/files          ← Delete files    │
│  │                                                          │
│  ├─ POST   /projects/[id]/terminal       ← Run cmd (SSE)   │
│  └─ POST   /projects/[id]/chat           ← AI chat (SSE)   │
│                                                             │
│  Business Logic Layer (lib/)                               │
│  ├─ daytona/                                               │
│  │  ├─ client.ts      ← Daytona API wrapper               │
│  │  └─ operations.ts  ← High-level sandbox ops            │
│  │                                                         │
│  ├─ ai/                                                    │
│  │  └─ client.ts      ← AI SDK + tool definitions         │
│  │                                                         │
│  ├─ projects/                                              │
│  │  └─ service.ts     ← Project business logic            │
│  │                                                         │
│  └─ utils/                                                 │
│     ├─ errors.ts      ← Custom error classes              │
│     └─ streaming.ts   ← SSE helper functions              │
│                                                             │
│                      ↓                                      │
│                                                             │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│            EXTERNAL SERVICES / INTEGRATIONS                │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Daytona Cloud                                             │
│  ├─ API Endpoint: https://api.daytona.io                  │
│  ├─ Auth: Bearer Token (DAYTONA_API_KEY)                  │
│  └─ Operations:                                            │
│     ├─ Create/delete sandboxes                             │
│     ├─ Execute shell commands                              │
│     ├─ Read/write files                                    │
│     ├─ List directory contents                             │
│     └─ Initialize git repositories                         │
│                                                             │
│  Vercel AI Gateway (Multi-provider)                        │
│  ├─ Supports 100+ models                                   │
│  ├─ Providers:                                             │
│  │  ├─ OpenAI (GPT-4, GPT-4 Turbo)                        │
│  │  ├─ Anthropic (Claude 3)                                │
│  │  ├─ Google (Gemini)                                     │
│  │  ├─ Mistral (Large models)                              │
│  │  └─ Others...                                           │
│  ├─ Features:                                              │
│  │  ├─ Streaming text generation                           │
│  │  ├─ Tool calling                                        │
│  │  ├─ Structured outputs                                  │
│  │  └─ Multi-step agent loops                              │
│  │                                                          │
│  Git Repositories                                          │
│  ├─ GitHub, GitLab, custom Git servers                     │
│  └─ Used for initial project setup (git clone)             │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Project Creation Flow

```
User Input (Dashboard)
        ↓
ProjectList Component
        ↓
useCreateProject Hook
        ↓
POST /api/projects
        ↓
Validation (Zod)
        ↓
createProject Service
        ├─ createSandbox() → Daytona API
        └─ If Git URL: cloneRepository() → Daytona API
        ↓
Save Project Record
        ↓
Return Project Data
        ↓
useProjects Revalidates
        ↓
UI Updates with New Project
```

### File Editing Flow

```
User Clicks File (FileTree)
        ↓
setSelectedFile State
        ↓
EditorPane Mounts
        ↓
useFileContent Hook
        ↓
SWR Fetches: GET /api/projects/[id]/files?action=read
        ↓
readFile Service → Daytona API
        ↓
Content Loaded in Editor
        ↓
User Edits Content
        ↓
User Clicks Save
        ↓
useWriteFile Hook
        ↓
POST /api/projects/[id]/files
        ↓
writeFile Service → Daytona API
        ↓
File Saved
        ↓
useFileContent Revalidates (Optional)
```

### Terminal Command Flow

```
User Types Command
        ↓
Terminal Component
        ↓
User Presses Enter
        ↓
useTerminalCommand Hook
        ↓
POST /api/projects/[id]/terminal (Stream)
        ↓
Validation (Zod)
        ↓
executeCommand Service
        ↓
Daytona API Executes
        ↓
ReadableStream + SSE Response
        ├─ { type: 'start', command: '...' }
        ├─ { type: 'output', data: '...' }
        ├─ { type: 'error', data: '...' }
        └─ { type: 'complete', exitCode: 0 }
        ↓
Hook Receives Each Event
        ↓
Terminal UI Updates in Real-time
```

### AI Chat Flow

```
User Types Message
        ↓
ChatSidebar Component
        ↓
User Presses Enter or Send
        ↓
useAIChat Hook
        ↓
Add Message to Local State
        ↓
POST /api/projects/[id]/chat (Stream)
        ├─ Messages Array
        ├─ Model (optional)
        └─ System Prompt (with context)
        ↓
Validation (Zod)
        ↓
streamChatWithTools (AI SDK)
        ├─ Load AI Model
        ├─ Send with Tool Definitions
        └─ Receive Streaming Response
        ↓
ReadableStream + SSE Response
        ├─ { type: 'text', data: 'token' }
        ├─ { type: 'tool-call', tool: 'name' }
        ├─ { type: 'tool-result', result: '...' }
        └─ { type: 'complete' }
        ↓
Hook Accumulates Tokens
        ↓
ChatSidebar Updates with Full Response
        ↓
Message Stored in Chat History
```

## Component Hierarchy

```
RootLayout (app/layout.tsx)
├─ Metadata & Viewport Settings
└─ HTML/Body with Dark Theme

Dashboard Page (app/page.tsx)
├─ ProjectList Component
│  ├─ useProjects Hook
│  ├─ useCreateProject Hook
│  └─ Project Cards + Create Form
└─ Toaster (Toast Notifications)

Project IDE Page (app/projects/[id]/page.tsx)
└─ IDELayout Component
   ├─ useProject Hook (get project details)
   ├─ useFileTree Hook (list files)
   │
   ├─ Header (Navigation + Controls)
   │
   ├─ FileTree Component
   │  ├─ useFileTree Hook
   │  └─ FileTreeNode Components (recursive)
   │
   ├─ EditorPane Component
   │  ├─ useFileContent Hook
   │  ├─ useWriteFile Hook
   │  └─ Textarea Input
   │
   ├─ Terminal Component
   │  ├─ useTerminalCommand Hook
   │  ├─ Command Output Display
   │  └─ Command Input
   │
   └─ ChatSidebar Component
      ├─ useAIChat Hook
      ├─ Message Display
      └─ Message Input
```

## State Management

### Local Component State
```typescript
// FileTree.tsx
const [expandedDirs, setExpandedDirs] = useState<Set<string>>();

// Terminal.tsx
const [output, setOutput] = useState<TerminalOutput[]>();
const [command, setCommand] = useState('');

// ChatSidebar.tsx
const [input, setInput] = useState('');
```

### Hook State (SWR)
```typescript
// useProject.ts
const { data: project, mutate } = useSWR(
  projectId ? `/api/projects/${projectId}` : null,
  fetcher
);

// useFileTree.ts
const { data: files } = useSWR(
  projectId ? `/api/projects/${projectId}/files?path=/` : null,
  fetcher
);
```

### Server State (Daytona)
```
Project Data ← Daytona Sandbox
├─ Files on Disk
├─ Git History
├─ Environment Variables
└─ Running Processes

No Local Cache - Always Fresh from Source
```

## Error Handling

```
API Route Error
        ↓
Try/Catch Block
        ├─ Instanceof Check
        │  ├─ DaytonaError
        │  ├─ AIError
        │  ├─ ValidationError
        │  └─ NotFoundError
        │
        └─ Custom Error Response
           ├─ StatusCode
           ├─ Error Message
           └─ Error Code
        ↓
Return JSON Response
        ↓
Hook Catches Error
        ↓
Toast Notification
        ↓
Console Logging
```

## Type Safety Flow

```
User Input (Form/API Request)
        ↓
Zod Schema Validation
        ├─ If Invalid → Return 400
        └─ If Valid → Parse to TypeScript Type
        ↓
Service Layer (Typed)
        ├─ Input: Validated Type
        └─ Output: Typed Response
        ↓
API Response (Typed JSON)
        ↓
Hook Receives Response
        ├─ Automatically Typed
        └─ No Runtime Type Checking Needed
        ↓
Component Uses Typed Data
        └─ Full IDE Autocomplete
```

## Streaming Architecture

### Server-Sent Events (SSE)

```
Client Request
        ↓
Server Creates ReadableStream
        ├─ Encoder for UTF-8
        └─ Controller for Events
        ↓
For Each Event:
  controller.enqueue(encoder.encode(
    `data: ${JSON.stringify(event)}\n\n`
  ))
        ↓
Client Receives Bytes
        ├─ Decode UTF-8
        ├─ Split by '\n\n'
        ├─ Parse JSON
        └─ Process Event
        ↓
Update UI in Real-time
```

### SSE Response Format

```json
{
  "type": "start|output|error|complete",
  "data": "string content",
  "exitCode": 0,
  "timestamp": "ISO string"
}
```

## Modular Architecture Benefits

```
Clear Separation
├─ UI Layer (components/)
│  └─ No business logic
│
├─ State Layer (hooks/)
│  └─ No UI logic
│
├─ Business Logic (lib/)
│  └─ No React dependency
│
└─ API Layer (app/api/)
   └─ Routes only

Easy to Test
├─ Test services independently
├─ Mock Daytona/AI for unit tests
├─ Test components with mocked hooks
└─ E2E test full workflows

Easy to Maintain
├─ Find code quickly
├─ Understand data flow
├─ Easy refactoring
└─ Low coupling

Easy to Extend
├─ Add new features following pattern
├─ Reuse existing hooks/services
├─ No code duplication
└─ Clear extension points
```

## Performance Characteristics

```
Load Time
├─ Initial Page Load: ~1-2s
├─ IDE Load: ~500-800ms
└─ SSE First Event: ~100-200ms

Response Times
├─ File List: ~50-100ms
├─ File Read: ~50-150ms
├─ File Write: ~100-200ms
├─ Simple Command: ~200-500ms
└─ AI Response: ~2-10s (depends on model)

Caching Strategy
├─ SWR: Automatic cache + revalidate
├─ File Content: No caching (always fresh)
├─ Project List: Cached with manual revalidate
└─ Sandbox State: Real-time from Daytona
```

This architecture ensures scalability, maintainability, and extensibility while keeping the codebase clean and understandable.
