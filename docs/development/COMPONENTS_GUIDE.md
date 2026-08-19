# Complete Components Guide - Daytona AI Dev Platform

## All Installed Components

You now have access to **20+ Shadcn UI components** and **2 AI Elements components** ready to use throughout the platform.

### Shadcn UI Components (20)

#### Layout & Structure
1. **accordion.tsx** - Collapsible content sections
   ```tsx
   import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
   ```

2. **aspect-ratio.tsx** - Maintain aspect ratio for media
   ```tsx
   import { AspectRatio } from '@/components/ui/aspect-ratio';
   <AspectRatio ratio={16/9}><img src="..." /></AspectRatio>
   ```

3. **breadcrumb.tsx** - Navigation breadcrumbs
   ```tsx
   import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb';
   ```

4. **card.tsx** - Content container
   ```tsx
   import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
   <Card>
     <CardHeader><CardTitle>Title</CardTitle></CardHeader>
     <CardContent>Content</CardContent>
   </Card>
   ```

5. **separator.tsx** - Visual divider
   ```tsx
   import { Separator } from '@/components/ui/separator';
   ```

6. **sidebar.tsx** - Navigation sidebar (floating variant)
   ```tsx
   import { Sidebar, SidebarProvider, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
   <SidebarProvider>
     <Sidebar variant="floating">
       <SidebarHeader />
       <SidebarContent />
     </Sidebar>
   </SidebarProvider>
   ```

#### Forms & Input
7. **button.tsx** - Interactive buttons
   ```tsx
   import { Button } from '@/components/ui/button';
   <Button variant="primary">Click</Button>
   <Button variant="outline">Outline</Button>
   <Button variant="ghost">Ghost</Button>
   <Button variant="destructive">Delete</Button>
   ```

8. **input.tsx** - Text input field
   ```tsx
   import { Input } from '@/components/ui/input';
   <Input placeholder="Enter text..." />
   ```

9. **textarea.tsx** - Multi-line text input
   ```tsx
   import { Textarea } from '@/components/ui/textarea';
   <Textarea placeholder="Enter description..." />
   ```

10. **input-group.tsx** - Grouped form controls
    ```tsx
    import { InputGroup, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group';
    ```

11. **select.tsx** - Dropdown selection
    ```tsx
    import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
      </SelectContent>
    </Select>
    ```

12. **command.tsx** - Command palette
    ```tsx
    import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/command';
    ```

13. **dropdown-menu.tsx** - Dropdown menu
    ```tsx
    import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
    ```

#### Feedback & Status
14. **alert.tsx** - Alert messages
    ```tsx
    import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
    ```

15. **badge.tsx** - Status badges
    ```tsx
    import { Badge } from '@/components/ui/badge';
    <Badge variant="default">New</Badge>
    <Badge variant="secondary">Secondary</Badge>
    <Badge variant="destructive">Urgent</Badge>
    ```

16. **avatar.tsx** - User avatars
    ```tsx
    import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
    ```

17. **spinner.tsx** - Loading indicator
    ```tsx
    import { Spinner } from '@/components/ui/spinner';
    <Spinner />
    ```

18. **bubble.tsx** - Chat bubble
    ```tsx
    import { Bubble } from '@/components/ui/bubble';
    ```

#### Overlays & Popovers
19. **dialog.tsx** - Modal dialogs
    ```tsx
    import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
    ```

20. **hover-card.tsx** - Hover preview
    ```tsx
    import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
    ```

21. **tooltip.tsx** - Hover tooltips (requires TooltipProvider in layout)
    ```tsx
    import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
    <Tooltip>
      <TooltipTrigger>Hover me</TooltipTrigger>
      <TooltipContent>Tooltip text</TooltipContent>
    </Tooltip>
    ```

### AI Elements Components (2)

#### Core AI Components

22. **prompt-input.tsx** - AI prompt input with file attachments
    ```tsx
    import { PromptInput } from '@/components/ai-elements/prompt-input';
    
    <PromptInput
      onSubmit={(message) => {
        console.log('Text:', message.text);
        console.log('Files:', message.files);
      }}
    >
      <textarea placeholder="What do you want to build?" />
      <SubmitButton />
    </PromptInput>
    ```

23. **message.tsx** - AI message display with markdown and code highlighting
    ```tsx
    import { Message } from '@/components/ai-elements/message';
    
    <Message
      role="assistant"
      content="# Hello\nThis is a **markdown** message"
      timestamp={new Date()}
    />
    ```

## Current Usage in Platform

### Dashboard (app/page.tsx)

The main dashboard demonstrates:
- **Floating Sidebar** with SidebarProvider
- **Responsive Layout** with sidebar + main content
- **Header** with breadcrumb and import button
- **Hero Section** with centered title
- **PromptInput Integration** for main project creation input
- **Quick Action Cards** for different creation methods
- **Integration Badges** showing supported services

Key features:
- Dark theme with primary accent colors
- Hover effects on buttons and cards
- Responsive grid layout
- Search functionality in sidebar
- Navigation menu with icons

## Component Variants & Props

### Button Variants
- `default` - Primary button
- `secondary` - Secondary button
- `outline` - Outlined button
- `ghost` - Ghost button (transparent background)
- `destructive` - Red danger button
- `link` - Link-styled button

### Button Sizes
- `default` - Normal size
- `sm` - Small
- `lg` - Large
- `icon` - Icon-only button

### Badge Variants
- `default` - Primary badge
- `secondary` - Secondary badge
- `destructive` - Danger badge

### Sidebar Variants
- `default` - Standard sidebar
- `floating` - Detached, floating sidebar with rounded corners and shadow

## Common Patterns

### Form with Input and Button
```tsx
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SearchForm() {
  return (
    <div className="flex gap-2">
      <Input placeholder="Search..." />
      <Button>Search</Button>
    </div>
  );
}
```

### Modal Dialog
```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function ConfirmDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Delete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
        </DialogHeader>
        <div className="flex gap-4">
          <Button variant="destructive">Delete</Button>
          <Button variant="outline">Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Card with Header and Footer
```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ProjectCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Name</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Project description here</p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button>Open</Button>
        <Button variant="outline">Edit</Button>
      </CardFooter>
    </Card>
  );
}
```

### Sidebar Navigation
```tsx
import { Sidebar, SidebarProvider, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Home, Settings } from 'lucide-react';

export function AppSidebar() {
  return (
    <SidebarProvider>
      <Sidebar variant="floating">
        <SidebarHeader>
          <h1>App</h1>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/">
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/settings">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <main className="flex-1">
        {/* Main content */}
      </main>
    </SidebarProvider>
  );
}
```

### AI Chat Integration
```tsx
import { PromptInput } from '@/components/ai-elements/prompt-input';
import { Message } from '@/components/ai-elements/message';
import { useState } from 'react';

export function ChatInterface() {
  const [messages, setMessages] = useState([]);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <Message
            key={i}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
          />
        ))}
      </div>
      <PromptInput
        onSubmit={(message) => {
          setMessages(prev => [...prev, {
            role: 'user',
            content: message.text,
            timestamp: new Date()
          }]);
        }}
      >
        <textarea placeholder="Type your message..." />
      </PromptInput>
    </div>
  );
}
```

## Installation Notes

All components are installed via shadcn/ui CLI. To install additional components later:

```bash
npx shadcn@latest add [component-name]
```

To install more AI Elements components:

```bash
npx shadcn@latest add https://elements.ai-sdk.dev/api/registry/[component-name].json
```

## Available Component Registries

- **Shadcn**: https://registry.shadcn.com
- **AI Elements**: https://elements.ai-sdk.dev

## Styling

All components use:
- **Tailwind CSS v4** for utility classes
- **CSS Variables** for theming (defined in globals.css)
- **Dark mode** enabled by default
- **Responsive design** with mobile-first approach

## Next Steps

Ready to build with these components! Key places to enhance:

1. **IDE Page** (`app/projects/[id]/page.tsx`) - Add Message and chat UI
2. **Terminal Component** - Use Bubble for output
3. **File Editor** - Use Dialog for new file creation
4. **Forms** - Use Input, Textarea, Select, Button
5. **Navigation** - Use Sidebar with floating variant
6. **Alerts** - Use Alert component for notifications
7. **Loading States** - Use Spinner component
8. **User Avatars** - Use Avatar component

All components are production-ready and fully accessible!
