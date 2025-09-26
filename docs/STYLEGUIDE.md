# Style Guide

This document outlines the design system and styling guidelines for the Yard Sale Tracker application.

## Color Tokens

### Brand Colors
- **brand-600** (`#0d9488`) - Primary brand color for buttons, links, and accents
- **brand-700** (`#0f766e`) - Darker brand for hover states
- **brand-500** (`#14b8a6`) - Lighter brand for subtle accents

### Accent Colors
- **accent-500** (`#f59e0b`) - Warm accent for highlights and CTAs
- **accent-600** (`#d97706`) - Darker accent for hover states

### Neutral Colors
- **neutral-50** (`#fafafa`) - Light backgrounds
- **neutral-100** (`#f5f5f5`) - Card backgrounds
- **neutral-600** (`#525252`) - Secondary text
- **neutral-900** (`#171717`) - Primary text

## Typography Scale

### Headings
- **Hero (Desktop)**: `text-hero` (4rem, line-height 1.1, letter-spacing -0.02em)
- **Hero (Mobile)**: `text-hero-mobile` (2.5rem, line-height 1.2, letter-spacing -0.01em)
- **H1**: `text-4xl` (2.25rem)
- **H2**: `text-3xl` (1.875rem)
- **H3**: `text-2xl` (1.5rem)

### Body Text
- **Large**: `text-xl` (1.25rem)
- **Base**: `text-base` (1rem)
- **Small**: `text-sm` (0.875rem)

## Spacing & Layout

### Spacing Scale
- Base unit: 4px (0.25rem)
- Common spacing: 4, 6, 8, 12, 16, 24, 32, 48, 64
- Custom: 18 (4.5rem), 88 (22rem), 128 (32rem)

### Border Radius
- **Small**: `rounded-lg` (0.5rem)
- **Medium**: `rounded-xl` (1rem) - Default for buttons and cards
- **Large**: `rounded-2xl` (1.5rem) - Hero CTAs and large cards
- **Extra Large**: `rounded-3xl` (2rem) - Special cases

## Component Styles

### Buttons
```css
.btn-primary {
  @apply bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800;
  @apply rounded-xl px-6 py-3 shadow-soft;
}

.btn-secondary {
  @apply bg-neutral-100 text-neutral-900 hover:bg-neutral-200;
  @apply border border-neutral-200 rounded-xl px-6 py-3;
}

.btn-ghost {
  @apply bg-transparent text-neutral-700 hover:bg-neutral-100;
  @apply rounded-xl px-6 py-3;
}
```

### Cards
```css
.card {
  @apply bg-white rounded-2xl shadow-soft border border-neutral-100;
  @apply transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5;
}
```

### Segmented Control
```css
.segmented-control {
  @apply inline-flex rounded-xl bg-neutral-100 p-1;
}

.segmented-control button[aria-pressed="true"] {
  @apply bg-white text-brand-700 shadow-soft;
}
```

## Hero Overlay Configuration

The hero section uses CSS custom properties for easy adjustment:

```css
:root {
  --hero-overlay-opacity: 0.4;
  --hero-blend-mode: overlay;
}

.dark {
  --hero-overlay-opacity: 0.6;
}
```

### Overlay Tuning
- **Opacity**: Adjust `--hero-overlay-opacity` (0.3-0.6 recommended)
- **Blend Mode**: Change `--hero-blend-mode` (overlay, multiply, soft-light)
- **Gradient**: Modify the `.hero-overlay` background gradient in `globals.css`

## Focus States

All interactive elements use consistent focus styling:

```css
.focus-visible {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px theme(colors.brand.600);
}
```

## Shadows

- **Soft**: `shadow-soft` - Default for cards and buttons
- **Elevated**: `shadow-elevated` - Hover states and modals

## Accessibility

### Contrast Requirements
- Text on hero background: ≥ 4.5:1 contrast ratio
- Interactive elements: ≥ 3:1 contrast ratio
- Focus indicators: 2px solid brand-600 with 2px offset

### Motion
- Respects `prefers-reduced-motion: reduce`
- Transitions are subtle and purposeful
- No heavy animations or layout shifts

## Dark Mode Support

The design system includes dark mode variants:

```css
.dark {
  --hero-overlay-opacity: 0.6;
}

.navbar-backdrop {
  @apply dark:bg-neutral-900/80;
}
```

## Usage Examples

### Hero Section
```tsx
<section className="relative min-h-screen flex items-center justify-center">
  <div className="absolute inset-0 w-full h-full">
    <Image src="/hero.jpg" alt="..." fill className="object-cover" />
  </div>
  <div className="absolute inset-0 w-full h-full hero-overlay" />
  <div className="relative z-10 max-w-6xl mx-auto px-4">
    <h1 className="text-hero-mobile sm:text-hero font-bold text-white">
      Find Amazing <span className="text-accent-300">Treasures</span>
    </h1>
  </div>
</section>
```

### Sale Card
```tsx
<div className="card p-6">
  <h3 className="text-xl font-semibold text-neutral-900">{title}</h3>
  <div className="flex items-center gap-2 text-sm text-neutral-700">
    <LocationIcon className="w-4 h-4" />
    <span>{address}</span>
  </div>
  <Link className="btn-secondary w-full justify-center" href={url}>
    View Details
  </Link>
</div>
```

## Performance Considerations

- Hero images use `priority` loading
- CSS transitions are hardware-accelerated
- No layout shifts on component hover
- Optimized font loading with `font-display: swap`
