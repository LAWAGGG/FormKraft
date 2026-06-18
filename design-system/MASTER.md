# formKraft Master Design System

## 1. Vision & Strategy
formKraft is a professional yet accessible form and quiz builder. The design should feel **reliable**, **efficient**, and **modern**.

## 2. Core Tokens

### Colors (Based on Indigo/Violet)
- **Primary**: `#6366f1` (Indigo 500)
- **Primary Dark**: `#4f46e5` (Indigo 600)
- **Secondary**: `#8b5cf6` (Violet 500)
- **Surface**: `#ffffff`
- **Background**: `#f8fafc` (Slate 50)
- **Border**: `#e2e8f0` (Slate 200)
- **Text**: `#0f172a` (Slate 900)
- **Text Secondary**: `#475569` (Slate 600)

### Typography
- **Primary Font**: `Inter`, sans-serif
- **Scale**: 12px, 14px, 16px (Base), 20px, 24px, 30px, 36px
- **Line Height**: 1.5 (Body), 1.3 (Headings)

### Spacing & Grid
- **Base Unit**: 4px
- **Scale**: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
- **Container**: Narrow (720px), Wide (1200px)

### Radius
- **SM**: 6px
- **MD**: 8px
- **LG**: 12px
- **XL**: 16px

## 3. Interaction & UX Rules

### Accessibility (Priority 1)
- Contrast ratio min 4.5:1.
- All interactive elements must have visible focus rings.
- Icon-only buttons must have `aria-label`.
- Sequential heading hierarchy (h1 -> h2 -> h3).

### Touch & Interaction (Priority 2)
- Minimum touch target: 44x44px.
- Use `hitSlop` pattern if visual icon is smaller.
- Visual feedback on press (opacity/scale/shadow).
- Loading states for all async actions.

### Performance (Priority 3)
- Use CSS transforms/opacity for animations.
- Skeleton screens for initial page loads.
- Virtualize long lists (if > 50 sections).

## 4. Component Patterns

### Buttons
- **Primary**: Gradient (Indigo to Violet), Shadow on hover.
- **Secondary**: Outlined/Ghost, subtle background on hover.
- **Danger**: Solid red, white text.

### Cards
- Interactive hover states.
- Subtle shadows (`--shadow-sm` by default).
- Rounded corners (`--radius-lg`).

### Forms
- Floating labels or clear visible labels.
- Inline validation (on blur).
- Dirty checking for unsaved changes (implemented).

## 5. Anti-Patterns to Avoid
- **No Emoji as Structural Icons**: Use vector icons (Lucide).
- **No Hover-Only Navigation**: Ensure all actions are accessible via click/tap.
- **No Instant State Changes**: Use transitions (150ms-250ms).
- **No Fixed Widths**: Use responsive containers and flex/grid.
