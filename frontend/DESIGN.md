# Design System — Placement Platform

> **⚠️ CONTRACT**: Before building ANY UI component, read this file and follow it exactly.
> Do NOT use default shadcn/ui theme values. Override with the tokens below.

## How to Use This File

1. Paste your design tokens from `getdesign.md` into the sections below
2. Update `globals.css` CSS custom properties to match
3. Update `tailwind.config.ts` extended values if needed
4. Every component must reference these tokens — no hardcoded colors/spacing

---

## Colors

> Paste your color palette here. Format: HSL values for CSS custom properties.

```css
/* Example — replace with your actual tokens from getdesign.md */

/* Primary */
--primary: 220 90% 56%;
--primary-foreground: 0 0% 100%;

/* Secondary */
--secondary: 215 20% 95%;
--secondary-foreground: 220 20% 10%;

/* Accent */
--accent: 262 80% 60%;
--accent-foreground: 0 0% 100%;

/* Semantic */
--success: 142 76% 36%;
--success-foreground: 0 0% 100%;
--warning: 38 92% 50%;
--warning-foreground: 0 0% 100%;
--destructive: 0 84% 60%;
--destructive-foreground: 0 0% 100%;
```

---

## Typography

> Paste font stack, sizes, weights, and line heights here.

### Font Stack
- **Primary**: Inter (Google Fonts)
- **Monospace**: JetBrains Mono

### Scale
| Token    | Size   | Weight | Line Height | Usage                    |
|----------|--------|--------|-------------|--------------------------|
| `h1`     | 36px   | 700    | 1.2         | Page titles              |
| `h2`     | 28px   | 600    | 1.3         | Section headings         |
| `h3`     | 22px   | 600    | 1.4         | Card titles              |
| `body`   | 16px   | 400    | 1.6         | Body text                |
| `small`  | 14px   | 400    | 1.5         | Secondary text, labels   |
| `caption`| 12px   | 500    | 1.4         | Badges, metadata         |

---

## Spacing

> Paste spacing scale here.

| Token | Value | Usage                     |
|-------|-------|---------------------------|
| `xs`  | 4px   | Icon padding              |
| `sm`  | 8px   | Input padding, tight gaps |
| `md`  | 16px  | Card padding, section gaps|
| `lg`  | 24px  | Section spacing           |
| `xl`  | 32px  | Page margins              |
| `2xl` | 48px  | Hero spacing              |
| `3xl` | 64px  | Section separators        |

---

## Border Radius

| Token    | Value | Usage           |
|----------|-------|-----------------|
| `sm`     | 4px   | Badges, chips   |
| `md`     | 8px   | Buttons, inputs |
| `lg`     | 12px  | Cards, modals   |
| `full`   | 9999px| Avatars, pills  |

---

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
```

---

## Component Patterns

### Buttons
- Primary: filled background, primary color
- Secondary: outlined, border only
- Ghost: no border, hover background
- All buttons: `md` border radius, `sm` horizontal padding, `xs` vertical padding
- Disabled state: 50% opacity, no pointer events

### Cards
- Background: `card` color
- Border: 1px `border` color
- Padding: `md`
- Border radius: `lg`
- Hover: subtle shadow transition (200ms ease)

### Forms
- Input height: 40px
- Label: `small` typography, `muted-foreground` color
- Error text: `destructive` color, `caption` typography
- Focus ring: 2px `ring` color

### Status Badges
| Status       | Color         |
|-------------|---------------|
| Applied     | `primary`     |
| Shortlisted | `accent`      |
| Selected    | `success`     |
| Rejected    | `destructive` |
| Withdrawn   | `muted`       |

---

## Animations

- **Duration**: 150ms (micro), 200ms (standard), 300ms (enter), 200ms (exit)
- **Easing**: `ease-out` for enters, `ease-in` for exits
- **Hover effects**: Scale 1.02 on cards, color shift on buttons
- **Page transitions**: Fade-in with 8px upward translate

---

## Dark Mode

> Paste dark mode overrides here. All CSS custom properties should have `:root` (light) and `.dark` variants in `globals.css`.

---

## Notes

_Replace all sections above with your actual design tokens from getdesign.md. The examples shown are starting defaults._
