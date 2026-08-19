# Development Guide

Comprehensive guide for extending and developing the Daytona AI Dev Platform.

## Architecture Philosophy

### Modular Separation of Concerns

```
Data Layer (lib/)
    ↓
API Layer (app/api/)
    ↓
Business Logic (lib/services/)
    ↓
State Management (hooks/)
    ↓
UI Components (components/)
```

This ensures:
- Easy testing at each layer
- Clear dependencies
- Simple to refactor
- Easy to understand code flow

### Key Principles

1. **Never mix concerns** - Components don't call Daytona directly
2. **Types first** - Define interfaces before implementation
3. **Stream first** - Use SSE for real-time operations
4. **Error handling** - Custom error classes for each layer
5. **Validation** - Use Zod for all inputs
6. **Documentation** - Comments explain the why, not the what

## Adding a New Feature

### Example: File Upload to Sandbox

#### 1. Define Types
```typescript
// lib/types.ts
export interface FileUpload {
  projectId: string;
  filePath: string;
  content: string;
  size: number;
  createdAt: Date;
}
```

#### 2. Create Service
```typescript
// lib/daytona/uploads.ts
export async function uploadFile(
  sandboxId: string,
  filePath: string,
  content: string
): Promise<void> {
  // Use getDaytonaClient() to perform operation
}
```

#### 3. Create API Route
```typescript
// app/api/projects/[id]/upload/route.ts
export async function POST(request: NextRequest, { params }: Params) {
  // Validate input with Zod
  // Call service
  // Return response
}
```

#### 4. Create Hook
```typescript
// hooks/useFileUpload.ts
export function useFileUpload() {
  return async (projectId, filePath, content) => {
    // Call API
    // Handle errors
    // Return result
  }
}
```

#### 5. Create Component
```typescript
// components/ide/UploadDialog.tsx
export function UploadDialog({ projectId }) {
  const upload = useFileUpload();
  // Build UI
}
```

#### 6. Integrate
```typescript
// components/ide/IDELayout.tsx
import { UploadDialog } from './UploadDialog';

<UploadDialog projectId={projectId} />
```

## Code Patterns

### Custom Hooks Pattern

```typescript
// Good: Clear, testable hook
export function useFeature(projectId: string) {
  const [state, setState] = useState();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (params) => {
    setIsLoading(true);
    try {
      const result = await api.call(params);
      setState(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { state, error, isLoading, execute };
}
```

### Error Handling Pattern

```typescript
// lib/utils/errors.ts
export class FeatureError extends APIError {
  constructor(message: string) {
    super(500, message, 'FEATURE_ERROR');
    this.name = 'FeatureError';
  }
}

// api/features/route.ts
try {
  const result = await featureService.execute();
  return NextResponse.json({ success: true, data: result });
} catch (error) {
  if (error instanceof FeatureError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json(
    { success: false, error: 'Internal error' },
    { status: 500 }
  );
}
```

### Streaming Pattern

```typescript
// For streaming responses (terminal, AI chat)
const readableStream = new ReadableStream({
  async start(controller) {
    try {
      controller.enqueue(encoder.encode(formatSSEResponse({
        type: 'start'
      })));

      // Do work here
      for await (const chunk of operation) {
        controller.enqueue(encoder.encode(formatSSEResponse({
          type: 'data',
          data: chunk
        })));
      }

      controller.enqueue(encoder.encode(formatSSEResponse({
        type: 'complete'
      })));
      controller.close();
    } catch (error) {
      controller.enqueue(encoder.encode(formatSSEResponse({
        type: 'error',
        data: error.message
      })));
      controller.close();
    }
  }
});

return new NextResponse(readableStream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  },
});
```

### Component Pattern

```typescript
// Good: Focused, composable component
interface FileListProps {
  projectId: string;
  onFileSelect: (path: string) => void;
  selectedPath?: string;
}

export function FileList({
  projectId,
  onFileSelect,
  selectedPath,
}: FileListProps) {
  const { files, isLoading } = useFileTree(projectId);

  return (
    <div>
      {isLoading ? (
        <LoadingState />
      ) : files.length === 0 ? (
        <EmptyState />
      ) : (
        <ListView items={files} onSelect={onFileSelect} />
      )}
    </div>
  );
}
```

## Testing Strategy

### Unit Tests (for lib/)
```typescript
// lib/daytona/__tests__/operations.test.ts
describe('Daytona Operations', () => {
  describe('executeCommand', () => {
    it('should execute command successfully', async () => {
      // Mock Daytona client
      // Call operation
      // Assert result
    });

    it('should handle errors gracefully', async () => {
      // Mock error
      // Assert error handling
    });
  });
});
```

### Integration Tests (for api/)
```typescript
// app/api/__tests__/projects.test.ts
describe('Projects API', () => {
  it('POST /api/projects should create project', async () => {
    // Call endpoint
    // Assert response
  });
});
```

### E2E Tests (user workflows)
```typescript
// e2e/project-workflow.test.ts
describe('Project Workflow', () => {
  it('should create, edit, and run project', async () => {
    // Create project
    // Edit file
    // Run command
    // Verify result
  });
});
```

## Performance Optimization

### Code Splitting
```typescript
// components/ide/IDELayout.tsx
const ChatSidebar = dynamic(() => import('@/components/ai/ChatSidebar'), {
  loading: () => <div>Loading...</div>,
});
```

### Data Fetching
```typescript
// Use SWR for caching and automatic revalidation
const { data, mutate } = useSWR(
  `/api/projects/${id}`,
  fetcher,
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  }
);
```

### Component Memoization
```typescript
// Prevent unnecessary re-renders
const FileTree = React.memo(function FileTree({ files, onSelect }) {
  // Component logic
});
```

### State Management
```typescript
// Use Zustand for global state
import { create } from 'zustand';

export const useStore = create((set) => ({
  selectedFile: null,
  setSelectedFile: (file) => set({ selectedFile: file }),
}));
```

## Extending AI Capabilities

### Adding New Tools

```typescript
// lib/ai/client.ts
export const agentTools = {
  // Existing tools...
  
  myCustomTool: tool({
    description: 'Description of what tool does',
    parameters: z.object({
      param1: z.string().describe('Parameter description'),
      param2: z.number().optional(),
    }),
    execute: async ({ param1, param2 }) => {
      // Implement tool logic
      return result;
    },
  }),
};
```

### Using Different Models

```typescript
// Client-side: specify in hook
const { sendMessage } = useAIChat({ projectId });
await sendMessage(message, 'claude-3-opus'); // Use specific model

// Server-side: in API route
const model = getAIModel(modelId || 'gpt-4-turbo');
```

### Structured Output

```typescript
// Use AI SDK's structured output for parsed responses
const result = await generateText({
  model,
  prompt,
  schema: z.object({
    suggestedChanges: z.array(z.string()),
    reasoning: z.string(),
  }),
});
```

## Deployment

### To Vercel

```bash
# Connect GitHub repo to Vercel
# Set environment variables in Vercel dashboard
# Deploy with: git push

# Or deploy directly:
vercel --prod
```

### Environment Variables (Production)
```
DAYTONA_API_KEY=pk_...          # Daytona API key
DAYTONA_API_BASE_URL=https://api.daytona.io
VERCEL_AI_GATEWAY_KEY=...       # For AI Gateway
```

## Debugging

### Enable Debug Logging

```typescript
// Add debug logs for tracing
console.log('[v0] Operation started:', { projectId, command });

// Check logs in:
// - Terminal (dev server)
// - Browser DevTools (client-side)
// - Vercel Dashboard (production)
```

### Browser DevTools

- **Network**: Check API calls and SSE streams
- **Console**: Look for errors and warnings
- **Application**: Inspect stored data

### React DevTools

- **Components**: Inspect component hierarchy
- **Profiler**: Identify performance bottlenecks

## Common Patterns to Avoid

1. **Don't call Daytona from components**
   - Always use hooks or API routes
   
2. **Don't mix client and server logic**
   - 'use client' for client components
   - 'use server' for server functions

3. **Don't hardcode API endpoints**
   - Use relative URLs: `/api/projects`

4. **Don't ignore TypeScript errors**
   - Type safety prevents runtime bugs

5. **Don't render large lists without virtualization**
   - Use windowing for performance

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [AI SDK Docs](https://sdk.vercel.ai)
- [Daytona Docs](https://daytona.io/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## Support

Questions? Check:
1. Code comments in relevant files
2. Similar features for patterns
3. README.md for architecture overview
4. GitHub issues for known issues
5. Create new issue if stuck

Good luck developing!
