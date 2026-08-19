# All Installed Components Reference

## Shadcn UI Components (20 total)

### Layout & Structure
- `accordion.tsx` - Collapsible content sections
- `aspect-ratio.tsx` - Maintain consistent aspect ratios
- `breadcrumb.tsx` - Navigation path display
- `card.tsx` - Content container with styling

### Forms & Input
- `button.tsx` - Interactive button element
- `input.tsx` - Text input field
- `textarea.tsx` - Multi-line text input
- `input-group.tsx` - Grouped form controls
- `select.tsx` - Dropdown selection
- `command.tsx` - Command palette functionality
- `dropdown-menu.tsx` - Dropdown menu options

### Feedback & Status
- `alert.tsx` - Alert messages and notifications
- `badge.tsx` - Status badges and labels
- `avatar.tsx` - User avatars with initials/images
- `bubble.tsx` - Chat bubble container

### Overlays & Popovers
- `dialog.tsx` - Modal dialog component
- `hover-card.tsx` - Content preview on hover
- `tooltip.tsx` - Hover tooltips (requires TooltipProvider)

### Utilities
- `spinner.tsx` - Loading spinner indicator

## AI Elements Components (2 installed)

### Core AI Components
- `prompt-input.tsx` - Enhanced prompt input with:
  - Multi-line support
  - Attachment button
  - Submit on Ctrl/Cmd+Enter
  - Placeholder text
  - Auto-focus handling
  - Customizable styling

- `message.tsx` - AI message component with:
  - Markdown rendering
  - Code syntax highlighting
  - Copy to clipboard
  - Message metadata (role, timestamp)
  - Responsive layout

## Usage Examples

### Prompt Input
```tsx
import { PromptInput } from '@/components/ai-elements/prompt-input';

export function ChatInput() {
  return (
    <PromptInput 
      onSubmit={(value) => console.log(value)}
      placeholder="Ask me anything..."
    />
  );
}
```

### Message Component
```tsx
import { Message } from '@/components/ai-elements/message';

export function ChatMessage() {
  return (
    <Message
      role="assistant"
      content="This is a response from the AI"
      timestamp={new Date()}
    />
  );
}
```

### Button Examples
```tsx
import { Button } from '@/components/ui/button';

// Primary button
<Button>Click me</Button>

// Secondary variant
<Button variant="secondary">Secondary</Button>

// Outline variant
<Button variant="outline">Outline</Button>

// Ghost variant
<Button variant="ghost">Ghost</Button>

// Destructive variant
<Button variant="destructive">Delete</Button>

// Size variants
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Dialog/Modal
```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export function MyDialog() {
  return (
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
```

### Accordion
```tsx
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

export function MyAccordion() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

### Alert
```tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export function MyAlert() {
  return (
    <Alert>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the code below.
      </AlertDescription>
    </Alert>
  );
}
```

### Tooltip
```tsx
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export function MyTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger>Hover me</TooltipTrigger>
      <TooltipContent>Tooltip text</TooltipContent>
    </Tooltip>
  );
}
```

## Recommended Usage in Platform

### Dashboard
- Use `PromptInput` for the main "What do you want to create?" input
- Use `Button` variants for quick actions
- Use `Card` for project grid items
- Use `Badge` for project status/tags

### IDE
- Use `PromptInput` for terminal/chat input at bottom
- Use `Message` component for AI responses
- Use `Dialog` for creating new files/projects
- Use `Tabs` for file editor tabs (install separately if needed)
- Use `Tooltip` for icon explanations

### Forms
- Use `Input` and `Textarea` for form fields
- Use `Select` for dropdown selections
- Use `Dialog` for modal forms
- Use `Alert` for form validation messages

### Navigation
- Use `Breadcrumb` for IDE file path navigation
- Use `Dropdown-menu` for context menus

## Next Steps

1. ✓ All shadcn components installed
2. ✓ AI Elements PromptInput & Message installed
3. ✓ TooltipProvider configured in root layout
4. Ready to use in components!

To add more shadcn components later:
```bash
npx shadcn@latest add [component-name]
```

To add more AI Elements:
```bash
npx shadcn@latest add https://elements.ai-sdk.dev/api/registry/[component-name].json
```

Available AI Elements:
- prompt-input ✓
- message ✓
- More available at elements.ai-sdk.dev
