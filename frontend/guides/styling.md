# Styling & Theming Guide

This guide covers the project's visual design system: colors, dark mode, hover effects, component classes, and patterns to follow when styling UI.

---

## 1. Technology Stack

- **Tailwind CSS v4** with `@theme` and `@custom-variant` directives
- **next-themes** for dark mode toggling (class-based, default: `dark`)
- **CSS-in-class** approach — all styling lives in Tailwind utility classes, no separate CSS modules
- Custom theme defined in `frontend/app/globals.css`

---

## 2. Color Palette

### Primary (Deep Red)

The brand color used for CTAs, active states, badges, and accents.

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | `#fdf3f1` | Lightest background tints |
| `primary-100` | `#fce4df` | Badge backgrounds (light mode) |
| `primary-400` | `#ec7054` | Dark mode accent text |
| `primary-500` | `#d9432a` | Primary buttons, CTA backgrounds |
| `primary-600` | `#b83420` | Hover state for primary buttons |
| `primary-700` | `#96291a` | Badge text (light mode) |
| `primary-900` | `#6d1d10` | **Row/card hover background** (maroon) |
| `primary-950` | `#3e0d07` | Dark mode badge backgrounds (`/30` opacity) |

### Secondary (Warm Amber)

Reserved for warnings, secondary accents. Rarely used in current UI.

### Neutral Scale (Dark Mode)

Dark mode uses Tailwind's `neutral` scale exclusively:

| Token | Usage |
|-------|-------|
| `neutral-100` | Body text, input text |
| `neutral-200` | Filter labels, secondary text |
| `neutral-300` | Labels, descriptions |
| `neutral-400` | Muted text, placeholders |
| `neutral-500` | Icons, disabled text |
| `neutral-600` | Borders (subtle), separators |
| `neutral-700` | Input/card borders |
| `neutral-800` | Input/card backgrounds, table headers |
| `neutral-900` | Card/section backgrounds |
| `neutral-950` | Page background |

### Gray Scale (Light Mode)

Light mode uses Tailwind's `gray` scale:

| Token | Usage |
|-------|-------|
| `gray-50` | Page background |
| `gray-100` | Card/badge backgrounds, subtle fills |
| `gray-200` | Input borders, dividers |
| `gray-400` | Placeholder text, muted icons |
| `gray-500` | Secondary text |
| `gray-600` | Body text (secondary) |
| `gray-700` | Labels, descriptions |
| `gray-900` | Headings, primary text |

---

## 3. Dark Mode

### How It Works

- Theme toggling via `next-themes` with `attribute="class"` on `<html>`
- Default theme is `dark`
- Custom variant: `@custom-variant dark (&:where(.dark, .dark *));`
- Toggle component: `<ThemeToggle />` from `@/components/ui`

### Pattern: Always Pair Light and Dark

Every color class **must** have a `dark:` counterpart:

```tsx
// CORRECT
<p className="text-gray-700 dark:text-neutral-300">Label</p>
<div className="bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700">

// WRONG — missing dark mode
<p className="text-gray-700">Label</p>
<div className="bg-white border-gray-200">
```

### Common Dark Mode Pairs

| Light | Dark | Element |
|-------|------|---------|
| `text-gray-900` | `dark:text-white` | Headings, primary text |
| `text-gray-700` | `dark:text-neutral-200` | Labels |
| `text-gray-600` | `dark:text-neutral-300` | Body text |
| `text-gray-500` | `dark:text-neutral-400` | Secondary/muted text |
| `text-gray-400` | `dark:text-neutral-500` | Placeholders, icons |
| `bg-white` | `dark:bg-neutral-900` | Cards, sections, dropdowns |
| `bg-gray-50` | `dark:bg-neutral-950` | Page backgrounds |
| `bg-gray-100` | `dark:bg-neutral-800` | Input backgrounds, table headers |
| `border-gray-200` | `dark:border-neutral-700` | Input/card borders |
| `border-gray-100` | `dark:border-neutral-800` | Subtle dividers |
| `hover:bg-gray-50` | `dark:hover:bg-neutral-800` | Subtle hover backgrounds |
| `hover:bg-gray-100` | `dark:hover:bg-neutral-700` | Stronger hover backgrounds |

### Hero Mode Pattern

For components displayed on the dark hero image (landing page), use the `heroMode` prop:

```tsx
// Header, LanguageToggle accept heroMode prop
<Header heroMode />
<LanguageToggle heroMode />

// Inside the component:
const textColor = heroMode ? 'text-white' : 'text-gray-900 dark:text-white'
```

When `heroMode` is active:
- All text becomes white variants
- ThemeToggle is hidden (hero is always dark)
- Hover backgrounds use `bg-white/10`

---

## 4. Global Component Classes

Defined in `globals.css` under `@layer components`:

### `.input-field`
Standard text input styling. Use on `<input>`, `<textarea>`, `<select>`.
- Rounded-xl, border, focus ring
- Full dark mode support built-in

### `.btn-primary`
Primary action button (gradient red).
- `hover:scale-[1.04]`, `hover:shadow-xl hover:shadow-primary-500/30`
- `active:scale-[0.98]`
- `duration-200 ease-out`

### `.btn-secondary`
Secondary button (gray background).
- `hover:scale-[1.02]`, `hover:shadow-md`
- Dark mode: `dark:bg-neutral-800 dark:text-neutral-200`

### `.card`
Container card with shadow.
- `bg-white rounded-2xl shadow-lg p-8`
- Dark: `dark:bg-neutral-900 dark:shadow-black/20`

### `.link`
Inline text link in primary color.
- `text-primary-600 hover:text-primary-700`
- Dark: `dark:text-primary-400 dark:hover:text-primary-300`

---

## 5. Hover Effects

### Row/Card Hover (Maroon Pattern)

Used on: admin DataTable rows, orders page, driver deliveries, menu items modal.

The pattern uses Tailwind's `group` class to change all children on hover:

```tsx
// Card/row container
<div className="hover:bg-primary-900 hover:border-primary-900 transition-colors group">
  {/* Primary text → white */}
  <p className="text-gray-900 dark:text-white group-hover:text-white">Title</p>

  {/* Secondary text → semi-transparent white */}
  <p className="text-gray-500 dark:text-neutral-400 group-hover:text-white/70">Description</p>

  {/* Muted text → more transparent */}
  <p className="text-gray-400 dark:text-neutral-500 group-hover:text-white/50">Meta info</p>

  {/* Status badges → transparent bg, white text */}
  <span className="bg-primary-100 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400 rounded-full group-hover:bg-transparent group-hover:text-white/80">
    Status
  </span>

  {/* Price/accent → white */}
  <span className="text-primary-600 dark:text-primary-400 group-hover:text-white">$12.99</span>

  {/* Action buttons → white with subtle hover */}
  <button className="text-gray-400 group-hover:text-white/70 group-hover:hover:text-white group-hover:hover:bg-white/10">
    Edit
  </button>

  {/* CTA buttons (e.g. Track Driver) → invert to white bg */}
  <button className="bg-primary-500 text-white group-hover:bg-white group-hover:text-primary-900">
    Track
  </button>
</div>
```

### Hover Opacity Levels

| Opacity | Usage |
|---------|-------|
| `group-hover:text-white` | Primary text, names, prices |
| `group-hover:text-white/80` | Status badge text |
| `group-hover:text-white/70` | Descriptions, item lists, labels |
| `group-hover:text-white/60` | Dates, timestamps |
| `group-hover:text-white/50` | Addresses, meta info, muted text |

### DataTable Hover (Arbitrary Selectors)

For tables where you can't easily add `group-hover:` to every cell's content, use arbitrary variant selectors:

```tsx
<tr className="hover:bg-primary-900 [&:hover_td]:!text-white [&:hover_td_*]:!text-white [&:hover_td_.rounded-full]:!bg-transparent">
```

This forces all `<td>` text white, all nested elements white, and strips badge backgrounds on hover.

### Admin Sidebar Hover

Inactive nav items use a fill hover (not maroon):

```tsx
// Inactive
'hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600 dark:hover:text-white'

// Active (no hover change)
'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400'
```

---

## 6. Status Badges

### Unified Color System

All status badges use a **single primary color** regardless of status value. Do NOT use per-status colors (green for delivered, yellow for pending, etc.).

```tsx
// CORRECT — unified primary color
const STATUS_COLOR = 'bg-primary-100 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400'

// WRONG — per-status colors
const colors = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  DELIVERED: 'bg-green-100 text-green-700',
}
```

This applies to:
- Order statuses (PENDING, CONFIRMED, PREPARING, etc.)
- Payment statuses (PENDING, COMPLETED, FAILED, REFUNDED)
- User role badges (ADMIN, CUSTOMER, RESTAURANT_OWNER, DRIVER)
- Availability badges (Available/Unavailable)

Defined in:
- `components/admin/StatusSelect.tsx` — `ORDER_STATUS_COLORS`, `PAYMENT_STATUS_COLORS`
- `components/profile/utils.ts` — `getStatusColor()`

---

## 7. Form Inputs & Filters

### Standard Input

Use the `.input-field` class or match its dark mode classes:

```tsx
<input className="input-field" />

// Or manually for selects/custom inputs:
<select className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm
  focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
  bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100" />
```

### Filter Labels

```tsx
<label className="block text-sm font-medium text-gray-700 dark:text-neutral-200 mb-2">
```

### Filter Sections (Admin Panel)

```tsx
<div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800 p-4 mb-6">
```

---

## 8. Responsive Design

### Admin Panel Sidebar

The sidebar is responsive with a mobile drawer pattern:

- **Desktop (`lg+`)**: static 256px sidebar in document flow
- **Mobile (`< lg`)**: hidden by default, slides in as a fixed overlay with backdrop
- Hamburger button visible only on mobile (`lg:hidden`)
- Nav links close the sidebar on click (`onClick={onClose}`)

Key classes on sidebar `<aside>`:
```
fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out
lg:relative lg:translate-x-0 lg:z-auto
// Open: translate-x-0
// Closed: -translate-x-full
```

### Main Content

```tsx
<main className="flex-1 min-w-0 p-4 lg:p-8">
```

`min-w-0` prevents flex children from overflowing.

---

## 9. Images

### Hero Background (Landing Page)

```tsx
<Image
  src={heroImg}
  alt=""
  fill
  priority
  sizes="100vw"
  quality={90}
  className="object-cover"
/>
```

- `sizes="100vw"` prevents blurriness on resize
- `quality={90}` for sharp rendering
- Dark gradient overlay: `bg-gradient-to-r from-black/70 via-black/50 to-transparent`

### Logo

Standard logo size is **150x150** across all pages.

---

## 10. Animations

Defined in `globals.css` `@theme` block:

| Animation | Duration | Usage |
|-----------|----------|-------|
| `animate-fade-in` | 0.15s | General fade entrances |
| `animate-slide-up` | 0.15s | Cards, content appearing |
| `animate-slide-in-right` | 0.15s | Side panels |
| `animate-modal-in` | 0.1s | Modal opening |
| `animate-bounce-subtle` | 2s infinite | Attention indicators |
| `animate-pulse-subtle` | 2s infinite | Loading states |

Global transition duration is `0.1s` by default (set on `*`). Buttons and interactive elements override to `duration-200`.

---

## 11. Scrollbar

Custom scrollbar styling in `globals.css`:
- Light mode: gray track/thumb (`#f1f1f1` / `#c1c1c1`)
- Dark mode: neutral track/thumb (`#262626` / `#525252`)
- 8px width, 4px border-radius

---

## 12. Checklist for New Components

When creating or modifying a component, verify:

- [ ] All text colors have `dark:` counterparts
- [ ] All backgrounds have `dark:` counterparts
- [ ] All borders have `dark:` counterparts
- [ ] Status badges use unified primary color
- [ ] Hover effects follow the maroon `group` pattern where applicable
- [ ] Inputs use `.input-field` or match its dark mode classes
- [ ] Labels use `text-gray-700 dark:text-neutral-200`
- [ ] Filter sections use the standard container pattern
- [ ] Interactive rows/cards have `transition-colors`
- [ ] No hardcoded colors — use the theme tokens
