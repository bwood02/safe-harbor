# Safe Harbor Frontend Design Guide

This guide is the canonical styling reference for future frontend pages in this project.

## Design Intent

- Warm, editorial, nonprofit aesthetic
- High readability, soft contrast, gentle depth
- Serif headlines + sans-serif body copy
- Rounded cards and controls with subtle shadows

## Typography

### Font Families

- **Sans (body/UI):** `DM Sans`
- **Serif (headings/brand):** `Cormorant Garamond`
- **Mono (code/diagnostics):** `Menlo`

Defined in `src/index.css`:
- `--app-font-sans`
- `--app-font-serif`
- `--app-font-mono`

### Type Rules

- Headings: use `font-serif`
- Body/UI labels/buttons: use `font-sans`
- Keep body line-height generous (`~1.7`)
- Prefer fluid text with `clamp()` for responsive sections

Recommended scale:
- Hero H1/H2: `text-[clamp(2rem,5vw,4.5rem)]`
- Section heading: `text-[clamp(1.75rem,3.4vw,3rem)]`
- Body lead: `text-[clamp(1rem,1.4vw,1.25rem)]`
- Body default: `text-sm` to `text-base`

## Color System

Use semantic tokens, not hardcoded hex, for all production page UI.

### Core Light Theme Tokens

- `--background`: `hsl(36 25% 98%)` (soft cream)
- `--foreground`: `hsl(340 33% 18%)` (deep plum)
- `--primary`: `hsl(33 50% 52%)` (earthy amber)
- `--secondary`: `hsl(340 25% 85%)` (dusty rose)
- `--muted`: `hsl(36 20% 93%)`
- `--muted-foreground`: `hsl(340 15% 45%)`
- `--accent`: `hsl(12 40% 85%)` (soft terracotta)
- `--border`: `hsl(36 20% 88%)`
- `--card`: `hsl(0 0% 100%)`
- `--destructive`: `hsl(0 50% 50%)`

Tailwind semantic classes already mapped in `src/index.css`:
- `bg-background`, `text-foreground`, `text-muted-foreground`
- `bg-primary`, `text-primary`, `border-border`
- `bg-white` (cards only), `bg-secondary`, `bg-accent`

### Usage Guidelines

- Page surface: `bg-background`
- Primary text: `text-foreground`
- Supporting text: `text-muted-foreground`
- Main CTA/focus accent: `primary`
- Borders/dividers: `border-border`
- Cards/panels: mostly `bg-white` with subtle border
- Reserve `destructive` for warnings/errors only

## Spacing & Layout

- Main content container: `max-w-6xl mx-auto px-4 sm:px-6`
- Page sections: generally viewport-aware (`min-h-[calc(100svh-72px)]`)
- Section vertical rhythm: `py-6 md:py-8` to `py-10`
- Card padding: `p-5` to `p-8` depending on density
- Grid gaps:
  - compact: `gap-3` / `gap-4`
  - standard: `gap-5` / `gap-6`
  - wide desktop: `gap-8+`

## Shape, Borders, Depth

- Base radius token: `--radius: 1rem`
- Common radii:
  - chip/button: `rounded-full`
  - card: `rounded-2xl` / `rounded-3xl`
  - feature blocks: `rounded-[2rem]+`
- Borders: soft (`border-border`, usually 40%-60% opacity in utilities)
- Shadows: subtle, warm shadows from root shadow tokens

## Component Styling Patterns

### Header/Nav

- Sticky translucent header with blur:
  - `sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/60`
- Active nav item uses `text-primary` and underline accent

### Cards

- `rounded-2xl/3xl border border-border bg-white shadow-sm`
- Hover: slight lift only (`hover:shadow-md`), avoid dramatic transforms

### Buttons

- Primary CTA:
  - `rounded-full bg-primary text-white hover:bg-primary/90`
- Secondary CTA:
  - `rounded-full border border-foreground/20 text-foreground hover:bg-foreground/5`

### Data Visualization

- Progress bars: muted track + primary fill
- Labels in muted foreground, values in foreground/primary

## Responsive Behavior Rules

- Mobile first
- Prefer fluid typography (`clamp`) over many breakpoint-specific font classes
- Keep sections readable within laptop viewport where practical
- For dense card groups, prefer carousel/horizontal scroll on mobile before shrinking text too far
- Maintain touch target size (`>=40px` height for buttons/interactive controls)

## Accessibility Rules

- Maintain meaningful semantic structure (`section`, heading hierarchy)
- Preserve contrast between foreground and background tokens
- Include descriptive `aria-label` on interactive controls and chart-like visuals
- Never encode meaning using color alone; pair with text/labels

## Implementation Checklist for New Pages

- Use `bg-background text-foreground` at page root
- Use `font-serif` for page headings and `font-sans` for body text
- Use semantic color classes (`primary`, `muted`, `border`) instead of new hex values
- Reuse card/button patterns from existing pages
- Ensure layout is responsive from mobile to desktop with no clipped content

## Source of Truth

- Theme tokens: `src/index.css`
- Shared structure/components: `src/components/shared/`
- Example pages to mirror:
  - `src/pages/ImpactDashboard.tsx`
  - `src/pages/AdminDashboard.tsx`
  - `src/pages/CaseloadInventory.tsx`

