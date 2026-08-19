# UI Wireframes & Visual Guide

## 1. Dashboard Page - Main View

```
┌──────────────────────────────────────────────────────────────────────┐
│ Logo | New Project | Search... | Settings | Help | Refer | 5.00    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Welcome back                                                        │
│  What do you want to create today?                                   │
│                                                                      │
│                         What do you want to create?                  │
│                  Start building with AI-powered development          │
│                           sandboxes                                  │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Describe what you want to build...                      [+] [=] │
│  │ e.g., 'React dashboard with charts and analytics'            │   │
│  │                                                               │   │
│  │                                           [Create Project →]  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Upgrade to unlock all features and more creation credits           │
│                                                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐      │
│  │ Clone from Git  │ │ Upload Project  │ │ Use Template    │      │
│  │ GitHub, GitLab  │ │ ZIP or folder   │ │ React, Node...  │      │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘      │
│                                                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐      │
│  │ Use Template    │ │ Use Template    │ │ Use Template    │      │
│  │ React, Node...  │ │ React, Node...  │ │ React, Node...  │      │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘      │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  Supported Integrations                                             │
│  [GitHub] [GitLab] [DevOps] [Web]                                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

Sidebar Layout:
┌──────────────────┐
│ [Z] DevBox       │
├──────────────────┤
│ + New Project    │ ← Highlighted button
├──────────────────┤
│ 🔍 Search...     │
├──────────────────┤
│ 📁 Projects      │
│ 🕐 Recent        │
│ ⚡ Templates     │
├──────────────────┤
│ ❤️ Favorites   › │
│ 💬 Recent Chats › │
├──────────────────┤
│ Daytona AI Dev   │
│ Powered by       │
│ AI SDK v7        │
└──────────────────┘
```

## 2. Project Creation Modal

```
Step 1: Project Type
┌────────────────────────────────────┐
│ Create a New Project          [X]  │
├────────────────────────────────────┤
│                                    │
│ ┌──────────────────────────────┐  │
│ │ 🌳 Clone from Git            │  │
│ │ Clone from GitHub, GitLab,   │  │
│ │ or any Git repository        │  │
│ └──────────────────────────────┘  │
│                                    │
│ ┌──────────────────────────────┐  │
│ │ ⬆️ Upload Files               │  │
│ │ Upload a ZIP file or folder  │  │
│ └──────────────────────────────┘  │
│                                    │
│ ┌──────────────────────────────┐  │
│ │ 📚 Use Template               │  │
│ │ Start with a pre-configured  │  │
│ │ template                     │  │
│ └──────────────────────────────┘  │
│                                    │
├────────────────────────────────────┤
│ [Cancel]                 [Next →]  │
└────────────────────────────────────┘

Step 2: Project Details
┌────────────────────────────────────┐
│ Project Details               [X]  │
├────────────────────────────────────┤
│                                    │
│ Project Name                       │
│ [My awesome project          ]    │
│                                    │
│ Git Repository URL                 │
│ [https://github.com/user/repo.git]│
│                                    │
│ Supports HTTPS, SSH, GitHub URLs   │
│                                    │
├────────────────────────────────────┤
│ [← Back]          [Create Project] │
└────────────────────────────────────┘
```

## 3. IDE - Main Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│ My Project / Daytona Sandbox                    [Run] [Deploy]            │
├──────────┬──────────────────────────────────────┬─────────────────────────┤
│ Files    │ Editor Pane                          │ AI Chat                 │
│          │                                      │                         │
│ 📁 src/  │ File: components/Button.tsx          │ What should I build?    │
│  ├─ App  │ ─────────────────────────────────────│ [                    ]  │
│  │ ├─tsx │ export function Button() {           │                         │
│  │ └─css │   return <button>Click me</button>   │ [        Chat Area     ] │
│  ├─ util │ }                                    │ [                       ] │
│  └─ test │                                      │ [                       ] │
│          │                                      │ [                       ] │
│ 📁 pkg   │                                      │ Suggested Actions:      │
│  ├─json  │                                      │ • Add loading state     │
│  └─lock  │                                      │ • Add error boundary    │
│          │ Editor Toolbar:                      │ • Add tests             │
│          │ [Save] [Format] [Preview]            │                         │
├──────────┼──────────────────────────────────────┤                         │
│          │ Terminal Output:                      │                         │
│          │ $ npm run dev                         │                         │
│          │ > listening on :3000                 │                         │
│          │                                      │                         │
│          │ $ git status                          │                         │
│          │ On branch main                       │ [Input area...]         │
│          │ nothing to commit                    │ [Chat buttons]          │
│          │                                      │                         │
├──────────┼──────────────────────────────────────┴─────────────────────────┤
│ ◀ Files   | ◀ AI Assistant                                   Ready       │
└────────────────────────────────────────────────────────────────────────────┘
```

## 4. Component Interactions

### Button States
```
Default:      [Create Project]        (bg-primary, text-white)
Hover:        [Create Project]        (bg-primary/90, slightly darker)
Disabled:     [Create Project]        (opacity-50, no pointer)
Loading:      [⏳ Creating...]         (spinner + text)
```

### Input Field States
```
Empty:        [Describe what...]      (placeholder gray)
Focused:      [Typing here......]     (ring-2 ring-primary/50)
Error:        [Invalid URL]           (ring-2 ring-destructive/50)
Filled:       [https://github.com...] (normal state)
```

### Panel Collapse/Expand
```
File Tree Visible:    [◀ Files]
File Tree Hidden:     [▶ Files]

AI Chat Visible:      [◀ AI Assistant]
AI Chat Hidden:       [▶ AI Assistant]
```

### Status Badges
```
Active:       [●] Active      (green bg-green-500/20)
Building:     [●] Building    (blue bg-blue-500/20)
Failed:       [●] Failed      (red bg-red-500/20)
```

## 5. Responsive Breakpoints

### Desktop (1200px+)
- Full 3-panel layout (Files | Editor+Terminal | Chat)
- Sidebar always visible
- Normal header height

### Tablet (768px - 1199px)
- 2-panel layout (Files | Editor+Terminal, Chat hidden)
- Sidebar collapsible to icons
- Compact header

### Mobile (< 768px)
- Single column layout
- Files in overlay drawer
- Chat in overlay drawer
- Full-width editor

## 6. Animation & Transitions

```css
/* Panel collapse/expand */
transition: all 300ms ease-in-out;
transform: translateX(-300px); /* hidden */
transform: translateX(0);      /* visible */

/* Button interactions */
transition: all 150ms ease-out;

/* File tree expand/collapse */
transform: rotate(90deg);
transition: transform 200ms ease-in-out;

/* Loading spinner */
animation: spin 1s linear infinite;

/* Hover effects */
opacity: 0.8;
transition: opacity 150ms ease-in-out;
```

## 7. Dark Theme Color Application

```
Header:
Background: card/50 (very dark with transparency)
Border: border (1px subtle)
Text: foreground (white)

Sidebar:
Background: card (dark gray)
Hover: muted (darker)
Selected: primary
Text: foreground

Main Content:
Background: background (almost black)
Cards: card (dark gray)
Inputs: muted (darker gray)
Text: foreground (light)
Placeholder: muted-foreground (medium gray)

Borders:
All borders: 1px border (8% opacity)
Hover borders: border-primary/50

Focus States:
Ring: ring-2 ring-primary/30

Success/Error/Warning:
Success: green-500/20 bg, green-400 text
Error: red-500/20 bg, red-400 text
Warning: yellow-500/20 bg, yellow-400 text
Info: blue-500/20 bg, blue-400 text
```

## 8. Accessibility Features

```
Navigation:
- Tab order follows visual flow
- Skip navigation link at top
- ARIA labels on icon-only buttons
- Keyboard shortcuts for common actions

Focus Indicators:
- Clear focus rings on all interactive elements
- Sufficient color contrast (WCAG AA minimum)

Text:
- Readable font sizes (14px minimum)
- Good line height (1.5+)
- Color contrast: foreground/background
- SR-only content for screen readers

Interactions:
- At least 44x44px touch targets
- No keyboard traps
- Meaningful alt text for images
```

## 9. Micro-interactions

### File Selection
```
Click file → Highlight with bg-primary → Load content in editor
```

### Chat Message Submit
```
User types → [Submit] enabled → Click/Enter → Message sent
→ Loading spinner → Response streams in → Spinner removed
```

### Project Creation
```
Click "New Project" → Modal slides in → Select type
→ Fade to step 2 → Fill fields → Button enables
→ Click "Create" → Loading spinner → Success toast
→ Navigate to IDE
```

### Terminal Command
```
Type command → Enter → Command appears in output
→ Loading indicator → Response streams → Command done
```

This visual guide provides designers and developers with a clear understanding of the layout, interactions, and styling of the redesigned AI Dev Platform.
