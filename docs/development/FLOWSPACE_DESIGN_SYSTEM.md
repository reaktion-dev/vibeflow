# Flowspace - Design System & UI/UX Overhaul

## ✨ System Identity

**Name:** Flowspace  
**Tagline:** AI-Powered Development Sandbox  
**Theme:** Dark bluish/slate with sky blue accents  
**Aesthetic:** Dense, compact, developer-focused  

## Color Palette

All colors use OKLch color space for perceptual uniformity and better accessibility.

### Primary Colors
- **Background:** `oklch(0.095 0.03 260)` - Deep slate blue
- **Card:** `oklch(0.135 0.025 260)` - Slightly lighter slate
- **Foreground:** `oklch(0.94 0.01 270)` - Off-white/cool white
- **Primary:** `oklch(0.65 0.22 235)` - Sky blue (main accent)
- **Accent:** `oklch(0.72 0.2 200)` - Cyan/turquoise (complementary)

### Semantic Colors
- **Muted:** `oklch(0.22 0.02 260)` - Dark slate for inactive elements
- **Muted Foreground:** `oklch(0.6 0.05 270)` - Medium gray text
- **Secondary:** `oklch(0.18 0.02 260)` - Darker slate for hover states
- **Border:** `oklch(1 0 0 / 6%)` - Subtle white overlay
- **Input:** `oklch(1 0 0 / 10%)` - Interactive elements
- **Destructive:** `oklch(0.63 0.21 25)` - Red for warnings

## Design Principles

### 1. Dense Information Architecture
- Compact spacing (0.5rem - 0.75rem padding)
- Smaller text sizes (12px base, 10px labels)
- High information density without clutter
- Visual hierarchy through weight, not size

### 2. Spatial Efficiency
```
Sidebar Width: ~250px (compact floating)
Card Padding: 12px (p-3)
Gap Between Elements: 8px (gap-2)
Button Height: 28px (h-7)
Input Height: 28px (h-7)
Label Size: 12px text-xs
```

### 3. Muted, Sophisticated Aesthetic
- No harsh colors or gradients
- Subtle backgrounds with 30% opacity
- Borders use 40% opacity for integration
- Focus states use ring overlays instead of bright colors

### 4. AI-First Workflows
- PromptInput always visible and accessible
- Chat-forward interaction patterns
- Context awareness in all operations
- Tool-calling for agent operations

## Component Specifications

### Sidebar (Floating Variant)
```
Width: 240px
Position: Floating overlay
Background: oklch(0.105 0.025 260)
Sections:
  - Brand (compact logo + name)
  - Action button (New Project)
  - Search input
  - Navigation groups (WORKSPACE, PINNED)
  - Settings footer
```

**Styling Details:**
- All menu items: height 24px (h-6), text-xs
- Group labels: uppercase, text-xs, semibold
- Icons: 14px (w-3.5 h-3.5)
- Hover: bg-secondary/50 (subtle highlight)
- No rounded borders on menu items (sharp edges)

### Header
```
Height: 56px (py-3)
Background: card/20 with backdrop blur
Content:
  - Dashboard title (text-sm font-semibold)
  - Subtitle (text-xs text-muted-foreground)
  - Import button (variant outline, size sm)
```

### Quick Action Cards
```
Grid: 2 cols (mobile) | 4 cols (desktop)
Gap: 8px (gap-2)
Height: Auto (p-3)
Background: card/30 → card/60 (on hover)
Border: border/40 → primary/40 (on hover)
Content:
  - Icon (16px, primary color)
  - Title (12px font-semibold)
  - Description (11px text-muted-foreground)
```

### Project Cards
```
Grid: 1 col (mobile) | 2 col (tablet) | 3 col (desktop)
Gap: 8px (gap-2)
Height: Auto (p-3)
Background: card/30 → card/60 (on hover)
Border: border/40 → primary/40 (on hover)
Content:
  - Icon + title + chevron
  - Description (optional, 2 lines max)
  - Status badge (color-coded dots)
```

### Prompt Input (Bottom Fixed)
```
Position: Fixed bottom
Height: Auto (p-3)
Background: card/20 with backdrop blur
Max-width: 48rem (max-w-3xl)
Margin: auto (centered)
Uses: AI Elements PromptInput component
```

## Typography

### Font Sizes
- Hero H2: 20px font-bold (text-xl)
- Section H3: 12px font-semibold uppercase (text-xs)
- Menu Items: 12px (text-xs)
- Card Titles: 12px font-semibold (text-xs)
- Labels: 11px (text-xs)
- Descriptions: 12px text-muted-foreground (text-xs)

### Font Weights
- Hero: bold (font-bold)
- Headers: semibold (font-semibold)
- Labels: semibold (font-semibold)
- Body: regular (default)

### Line Heights
- Compact: 1.25 (labels)
- Default: 1.5 (body)
- Relaxed: 1.75 (descriptions)

## Spacing System

All spacing uses 4px base unit (Tailwind default).

```
Gap between sections: 24px (gap-6)
Padding in cards: 12px (p-3)
Padding in sidebar: 8px (px-2)
Gap between items: 8px (gap-2)
Gap in grid: 8px (gap-2)
Header padding: 12px (py-3, px-6)
Main padding: 24px (py-6, px-6)
Button height: 28px (h-7)
Input height: 28px (h-7)
Icon size: 14px (w-3.5 h-3.5)
Small icon: 12px (w-3 h-3)
```

## Interaction States

### Hover States
```css
/* Cards */
bg-card/30 → bg-card/60
border-border/40 → border-primary/40

/* Menu Items */
bg-transparent → bg-secondary/50

/* Buttons */
bg-primary → bg-primary/90
border-border → border-primary/40
```

### Focus States
```css
input:focus {
  outline: none;
  ring: 1px;
  ring-color: primary/50;
  background: secondary/70;
}
```

### Disabled States
```css
opacity: 50%;
cursor: not-allowed;
```

## Status Indicators

**Active Project:**
- Color: `bg-green-500/70`
- Size: `w-1.5 h-1.5` (2px dot)

**Idle Project:**
- Color: `bg-muted/50`
- Size: `w-1.5 h-1.5`

**Error Project:**
- Color: `bg-destructive/70`
- Size: `w-1.5 h-1.5`

## Animation & Transitions

### Hover Effects
- Icon scale: `group-hover:scale-110` (110% on hover)
- Transition duration: 200ms (default Tailwind)
- Easing: ease-in-out

### Micro-interactions
- Smooth color transitions on borders
- Scale transforms on icons
- Opacity changes on hover

## Accessibility

### WCAG AA Compliance
- Contrast ratios: 4.5:1 for text on backgrounds
- Focus indicators: Visible ring outlines
- Color not sole indicator: Always use text labels or icons
- Touch targets: Minimum 44px height for interactive elements

### Keyboard Navigation
- Sidebar: Tab through all items
- Buttons: Space or Enter to activate
- Search: Esc to clear
- All controls: Full keyboard support

## Component Usage

### Using the Sidebar
```tsx
<Sidebar variant="floating">
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>SECTION</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton className="h-6 text-xs">
            <Icon className="w-3.5 h-3.5" />
            <span>Label</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  </SidebarContent>
</Sidebar>
```

### Using PromptInput
```tsx
<PromptInput
  onSubmit={(value) => handleSubmit(value)}
  placeholder="Your prompt here..."
  className="text-sm"
/>
```

### Quick Card Pattern
```tsx
<button className="group p-3 rounded-lg border border-border/40 bg-card/30 hover:bg-card/60 hover:border-primary/40 transition-all">
  <Icon className="text-primary group-hover:scale-110 transition-transform" />
  <div className="font-semibold text-xs">Title</div>
  <div className="text-muted-foreground text-xs">Description</div>
</button>
```

## Design Variants

### Light Mode (Future)
When light mode is added, use:
- Background: `oklch(0.98 0.01 270)` (off-white)
- Card: `oklch(0.95 0.01 270)` (light gray)
- Foreground: `oklch(0.15 0.02 260)` (dark slate)
- Primary: `oklch(0.55 0.25 235)` (darker sky blue)

### High Contrast Mode
- Increase border opacity to 15%
- Increase card background opacity to 50%
- Use full-saturation primary color
- Larger focus rings (2px instead of 1px)

## Performance Considerations

### CSS Optimization
- Use Tailwind classes (pre-optimized)
- Minimal custom CSS
- Backdrop blur only on fixed elements
- No box shadows (use borders instead)

### Component Loading
- Sidebar renders first (sidebar-critical)
- Prompt input lazy-loads
- Project list uses virtualization for 100+ items
- Images lazy-load with blur-up

### Bundle Size
- Tree-shake unused components
- Dynamic imports for modals
- Code split at route boundaries
- Minimal third-party dependencies

## Migration Checklist

- [x] Update theme colors in globals.css
- [x] Rename system to "Flowspace"
- [x] Redesign homepage with floating sidebar
- [x] Implement dense design aesthetic
- [x] Add PromptInput integration
- [x] Update all quick action cards
- [x] Add project card component
- [x] Polish animations and transitions
- [ ] Add light mode support
- [ ] Create design tokens documentation
- [ ] Build component storybook
- [ ] Add dark mode toggle

## Resources

- Color Space: [OKLch Reference](https://oklab.org/)
- Design System: [Shadcn Design](https://ui.shadcn.com/)
- Icons: [Lucide Icons](https://lucide.dev/)
- Component Library: [AI Elements](https://elements.ai-sdk.dev/)

---

**Last Updated:** 2026-07-25  
**Design System Version:** 1.0  
**Status:** Complete MVP ✓
