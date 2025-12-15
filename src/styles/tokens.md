# What-Manga Design System Tokens

This document defines the design tokens used throughout the What-Manga application.

## Color Palette

### Semantic Colors
| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--background` | `hsl(220 20% 97%)` | `hsl(224 71% 4%)` | Page background |
| `--foreground` | `hsl(222.2 84% 4.9%)` | `hsl(213 31% 91%)` | Primary text |
| `--card` | `hsl(0 0% 100%)` | `hsl(224 71% 4%)` | Card backgrounds |
| `--muted` | `hsl(220 14.3% 95.9%)` | `hsl(223 47% 11%)` | Muted backgrounds |
| `--primary` | `hsl(262 83% 58%)` | `hsl(263 70% 60%)` | Primary actions (violet) |
| `--destructive` | `hsl(0 84.2% 60.2%)` | `hsl(0 62.8% 30.6%)` | Destructive actions |

### Status Colors
| Status | Color | CSS Class |
|--------|-------|-----------|
| In Progress | Blue (`hsl(200 80% 50%)`) | `.status-in-progress` |
| Completed | Emerald (`hsl(142 76% 36%)`) | `.status-completed` |
| Incomplete | Amber (`hsl(38 92% 50%)`) | `.status-incomplete` |
| Uncertain | Purple (`hsl(262 83% 58%)`) | `.status-uncertain` |
| Dropped | Rose (`hsl(0 84% 60%)`) | `.status-dropped` |

## Spacing Scale

Based on a 4px base unit:

| Token | Value | Tailwind |
|-------|-------|----------|
| `--space-1` | 4px | `p-1` |
| `--space-2` | 8px | `p-2` |
| `--space-3` | 12px | `p-3` |
| `--space-4` | 16px | `p-4` |
| `--space-5` | 20px | `p-5` |
| `--space-6` | 24px | `p-6` |
| `--space-8` | 32px | `p-8` |
| `--space-10` | 40px | `p-10` |
| `--space-12` | 48px | `p-12` |

## Typography Scale

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `text-xs` | 12px | 16px | Captions, metadata |
| `text-sm` | 14px | 20px | Labels, secondary text |
| `text-base` | 16px | 24px | Body text |
| `text-lg` | 18px | 28px | Subheadings |
| `text-xl` | 20px | 28px | Section titles |
| `text-2xl` | 24px | 32px | Page titles |
| `text-3xl` | 30px | 36px | Large headings |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | 10px | Default (buttons, inputs) |
| `rounded-sm` | 6px | Small elements |
| `rounded-md` | 8px | Medium elements |
| `rounded-lg` | 10px | Cards, dialogs |
| `rounded-xl` | 12px | Large cards |
| `rounded-2xl` | 16px | Feature cards |
| `rounded-full` | 9999px | Pills, avatars |

## Shadows

| Token | Usage |
|-------|-------|
| `shadow-sm` | Subtle elevation (hover states) |
| `shadow-md` | Cards, dropdowns |
| `shadow-lg` | Dialogs, popovers |
| `shadow-xl` | Modals, prominent elements |
| `glow-sm` | Primary color glow effect |
| `glow-primary` | Strong primary glow |

## Animation Timing

| Token | Value | Usage |
|-------|-------|-------|
| `duration-150` | 150ms | Micro-interactions |
| `duration-200` | 200ms | Hover states, focus |
| `duration-300` | 300ms | Transitions, dialogs |
| `duration-500` | 500ms | Page transitions |

### Spring Presets (Framer Motion)

```typescript
// Snappy (buttons, toggles)
{ type: "spring", damping: 25, stiffness: 400 }

// Smooth (dialogs, sheets)
{ type: "spring", damping: 30, stiffness: 300 }

// Bouncy (celebrations, emphasis)
{ type: "spring", damping: 15, stiffness: 400 }
```

## Blur Levels

| Token | Value | Usage |
|-------|-------|-------|
| `blur-sm` | 4px | Subtle glass effect |
| `blur-md` | 8px | Medium glass |
| `blur-lg` | 12px | Strong glass |
| `blur-xl` | 16px | Headers, overlays |
| `blur-2xl` | 24px | Modal backdrops |

## Glassmorphism Utilities

| Class | Usage |
|-------|-------|
| `.glass` | Basic glass effect |
| `.glass-card` | Elevated glass card with gradient |
| `.glass-button` | Interactive glass button |

## Accessibility

### Reduced Motion
All animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Focus States
- All interactive elements have visible focus rings
- Focus ring uses `--ring` color token
- Focus rings are 2px offset from element

### Touch Targets
- Minimum touch target size: 44px × 44px
- Mobile buttons use `h-11` (44px) minimum

---

*Last Updated: 15/12/2024*
