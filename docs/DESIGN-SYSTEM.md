# Jrello — Design System

This is the single source of truth for how Jrello looks and feels. It is deliberately
**opinionated and constraining**. If a UI choice is not defined here, do not invent a
new pattern — raise it, decide it, add it here, then use it.

The goal is a UI that a developer looks at and believes was built by someone who uses
developer tools: **technical, dense, fast, restrained, intentional.**

---

## Design principles

1. **Restraint over decoration.** Every visual element must earn its place. If removing
   it doesn't make the UI worse, it shouldn't be there. The default answer to "should I
   add a visual flourish?" is *no*.
2. **Information density, not clutter.** Pack meaningful information; never pack noise.
   A row that shows five useful fields is good; a card with a decorative gradient is
   bad.
3. **Hierarchy by typography and spacing, not color.** Color carries state and meaning
   (status, priority, errors). It is not the primary tool for visual hierarchy.
4. **Borders over shadows.** Use subtle borders to separate surfaces. Shadows are
   reserved for things that genuinely float (popovers, dialogs, dragged cards).
5. **Motion explains, it doesn't perform.** Animation is used to preserve context
   (where a panel came from, how a card moved) — never to entertain.
6. **Dark mode is primary, light mode is equal.** Both are designed first-class. We do
   not "invert" a light design to get dark.
7. **Consistency compounds.** Two buttons that do similar things must look identical.
   Apparent trivial inconsistencies erode trust fast in a tool used daily.

## Anti-slop rules (hard constraints)

These exist specifically to prevent generic, AI-generated-looking UI. They are
non-negotiable unless overridden by an explicit decision in `DECISIONS.md`.

- ❌ **No purple/blue SaaS gradients.** No `from-purple-500 to-blue-500` hero banners.
  No gradient buttons. No gradient text. Backgrounds are flat.
- ❌ **No glassmorphism.** No `backdrop-blur` over blurry photos. Surfaces are solid or
  subtly translucent for a specific functional reason (e.g., a sticky toolbar), never
  as a vibe.
- ❌ **No giant marketing dashboard cards.** The app is a tool, not a landing page.
  Cards are small, dense, and contain data — not illustrations and a single stat.
- ❌ **No Inter-everywhere.** See typography: a deliberate pairing, not the default.
- ❌ **No decorative SVG blobs, mesh gradients, aurora backgrounds, or "abstract"
  illustrations.**
- ❌ **No excessive rounded corners.** See radius scale. Cards are **not** pillowy.
- ❌ **No meaningless animation.** No fade-in-up on every section, no count-up numbers,
  no staggered card entrances, no auto-rotating carousels.
- ❌ **No emoji as UI iconography.** Icons are from a consistent icon set.
- ❌ **No "Trusted by" logo strips, no fake testimonials, no CTA banners inside the
  app.** This is a product, not a marketing site.
- ❌ **No lorem ipsum, no placeholder data that looks real but means nothing.** Empty
  states say they're empty.
- ✅ **Do** use subtle borders, a tight neutral palette, one disciplined accent,
  excellent type, and motion only where it preserves context.

## Typography

A deliberate two-family system: a neutral grotesque for UI, and a monospace for
identifiers, code, and numeric/metadata. This pairing signals "developer tool."

| Role            | Family                              | Why                                              |
| --------------- | ----------------------------------- | ------------------------------------------------ |
| UI / body       | **Inter** (with `cv01–cv11` enabled) | Workhorse sans; tuned by us, not the default look |
| Headings        | **Inter**, tighter tracking, heavier weight | Same family, controlled hierarchy        |
| Mono / code / ID | **JetBrains Mono**                  | Identifiers (`JREL-142`), code, timestamps, counts |

> Rationale: We *do* use Inter for UI, but we escape the "Inter-everywhere AI look" by
> (a) pairing it with JetBrains Mono for all identifiers and metadata, and (b) using
> tight, intentional type scale and tracking rather than default styles. The
> Inter+mono pairing is the signature; the mono is used liberally for anything
> identifier-shaped.

### Type scale

Built on a 4px base. Sizes in `px` / `rem` (1rem = 16px).

| Token       | Size   | Weight   | Line height | Use                          |
| ----------- | ------ | -------- | ----------- | ---------------------------- |
| `text-xs`   | 12 / 0.75 | 500    | 1.33 (16px) | Metadata, labels, badges     |
| `text-sm`   | 13 / 0.8125 | 400  | 1.45 (19px) | Secondary text, table rows   |
| `text-base` | 14 / 0.875 | 400  | 1.5 (21px)  | **Body default**             |
| `text-md`   | 15 / 0.9375 | 500  | 1.4 (21px)  | Emphasized body              |
| `text-lg`   | 17 / 1.0625 | 600 | 1.35 (23px) | Section titles               |
| `text-xl`   | 20 / 1.25 | 600    | 1.3 (26px)  | Page titles                  |
| `text-2xl`  | 24 / 1.5 | 600      | 1.25 (30px) | Route headers (rare)         |

**Body default is 14px**, not 16px. Developer tools read at 13–14px. Larger base sizes
read as "consumer app."

Tracking: headings `-0.01em`; identifiers in mono at `0`. Uppercase labels
(`text-xs` metadata) at `+0.04em`.

## Color system

A neutral-forward palette with a **single** disciplined accent. Semantic colors carry
state. All colors defined as CSS variables so dark/light themes are first-class.

### Neutral scale (the backbone)

Built on a perceptually-uniform gray with the faintest blue undertone (like zinc/slate,
not pure gray). 11 steps.

| Token        | Light   | Dark    | Use                            |
| ------------ | ------- | ------- | ------------------------------ |
| `bg-base`    | white   | `#0a0a0b` | App background               |
| `bg-raised`  | `#fafafa` | `#111113` | Cards, raised surfaces      |
| `bg-overlay` | `#f4f4f5` | `#17181a` | Hover, inset areas          |
| `border`     | `#e4e4e7` | `#26272a` | Default borders             |
| `border-strong` | `#d4d4d8` | `#34363a` | Emphasized separators     |
| `text`       | `#18181b` | `#ededee` | Primary text               |
| `text-muted` | `#52525b` | `#9b9ba3` | Secondary text             |
| `text-subtle`| `#71717a` | `#6b6c73` | Tertiary / placeholder     |

### Accent (the one color we spend deliberately)

The accent is a **calm teal-cyan**, chosen to read as technical (not the default SaaS
indigo/violet) and to perform well on both themes.

| Token            | Light   | Dark    | Use                           |
| ---------------- | ------- | ------- | ----------------------------- |
| `accent`         | `#0e7490` | `#22d3ee` | Primary actions, focus      |
| `accent-hover`   | `#0c6a82` | `#67e8f9` | Hover states               |
| `accent-fg`      | white     | `#04141a` | Text on accent fill       |
| `accent-soft`    | `#ecfeff` | `#082a33` | Accent tint backgrounds   |

Accent is used sparingly: primary buttons, focus rings, active/selected states, and
links. It is **never** used as a background fill for large areas.

### Semantic colors (state, not decoration)

| Token        | Light   | Dark    | Meaning                              |
| ------------ | ------- | ------- | ------------------------------------ |
| `success`    | `#16a34a` | `#4ade80` | Done status, merge success         |
| `warning`    | `#ca8a04` | `#facc15` | Blocked, attention                |
| `danger`     | `#dc2626` | `#f87171` | Error, destructive, overdue       |
| `info`       | `#2563eb` | `#60a5fa` | Info only (rare)                  |

Each has a `soft` variant (low-saturation tint) for badges and backgrounds.

### Priority & label colors

Status/priority/label colors come from a **fixed, balanced palette** of 8 hues, each
with a soft background + readable foreground. Labels never use arbitrary hex — they
pick from this palette so the board never looks like a confetti explosion.

## Spacing

4px base. Tokens: `1 = 4px`, `2 = 8px`, `3 = 12px`, `4 = 16px`, `5 = 20px`,
`6 = 24px`, `8 = 32px`, `10 = 40px`, `12 = 48px`.

Rules:

- Component internal padding: `2–3` (8–12px).
- Gaps between related items: `2` (8px).
- Gaps between sections: `6–8` (24–32px).
- Page edge padding: `4–6` (16–24px), tighter on dense surfaces like the board.
- **Avoid `1` (4px) for major gaps** — it reads as cramped. Use it only for tight
  inline groupings (icon + label).

## Borders

- Default border: `1px solid var(--border)`.
- Hairline separators inside dense lists: `1px solid var(--border)` at reduced opacity.
- Emphasized boundaries (focusable containers, active drop zones): `border-strong`.
- **Borders, not shadows, separate surfaces** in the resting state.

## Radius

Deliberately restrained. Nothing pillowy.

| Token        | Value     | Use                              |
| ------------ | --------- | -------------------------------- |
| `radius-sm`  | `4px`     | Badges, inputs, small chips      |
| `radius-md`  | `6px`     | Buttons, cards (default)         |
| `radius-lg`  | `8px`     | Panels, dialogs                  |
| `radius-full`| `9999px`  | Avatars, toggles, pills only     |

No `rounded-2xl/3xl`. No `rounded-[20px]` arbitrary values.

## Shadows

Reserved for floating elements only.

| Token        | Value (dark-first, subtle)                 | Use                        |
| ------------ | ------------------------------------------ | -------------------------- |
| `shadow-sm`  | `0 1px 2px rgba(0,0,0,.06)`                | Resting raised surfaces (rare) |
| `shadow-md`  | `0 4px 12px rgba(0,0,0,.10)`               | Popovers, menus            |
| `shadow-lg`  | `0 12px 32px rgba(0,0,0,.16)`              | Dialogs, dragged cards     |

In dark mode, shadows are largely replaced by stronger borders + a faint top-highlight
to avoid muddy black-on-black.

## Icons

- **Library:** Lucide (consistent stroke, pairs well with Inter).
- **Stroke width:** `1.5` for UI chrome (16–18px icons), `2` only for 14px-and-below
  where thin strokes disappear.
- **Size:** 14/16/18/20px. Never arbitrary.
- Icons are always paired with an `aria-label` or adjacent text when meaning isn't
  obvious.
- **Never** mix icon libraries. Never use emoji as icons.

## Motion

Motion is for context preservation and feedback, not delight.

| Token            | Duration | Easing                         | Use                                  |
| ---------------- | -------- | ------------------------------ | ------------------------------------ |
| `instant`        | 0ms      | —                              | State swaps the eye shouldn't notice |
| `fast`           | 90ms     | `cubic-bezier(.4,0,.2,1)`      | Hover, focus, toggle                 |
| `normal`         | 160ms    | `cubic-bezier(.4,0,.2,1)`      | Panels, popovers, card move settle   |
| `slow`           | 240ms    | `cubic-bezier(.16,1,.3,1)`     | Dialog/modal entry (rare)            |

Rules:

- **No entrance animations on routine content.** Lists don't fade in. Cards don't
  stagger. Pages don't slide.
- **Drag movement** tracks the pointer 1:1 (0ms) and settles to its new home with
  `normal`.
- **Optimistic state changes** (status change) animate the fill/color over `fast`.
- **Respect `prefers-reduced-motion`.** All non-essential motion is disabled under it;
  state changes still happen, just instantly.

## Component conventions

- **Buttons:** three variants only — `primary` (accent), `secondary` (border + raised
  bg), `ghost` (transparent, hover bg). Sizes `sm`/`md`. No gradient, no shadow at rest.
- **Inputs:** 32–36px tall, `radius-sm`, border + raised bg, clear focus ring (accent).
- **Cards (issue cards):** compact, `radius-md`, 1px border, subtle raised bg, no
  shadow at rest; shadow appears only while dragging.
- **Badges/chips:** `radius-sm`, soft semantic background, 12px text, single-line.
- **Tables/lists:** dense rows (32–36px), subtle row separators, hover highlight.
- **Dialogs:** `radius-lg`, `shadow-lg`, max-width constrained, scroll body only.
- **Toasts:** bottom-right (desktop), non-blocking, auto-dismiss with manual close.

## Density guidelines

- **Default density:** compact. 32–36px row height, 8–12px internal padding.
- **Comfortable density** (future setting): 40–44px rows, 16px padding. Not in MVP.
- Information per screen is high; visual noise is low. If a screen feels "busy," the
  fix is **better hierarchy**, not removing information.

## Theming

- CSS variables defined at `:root` (light) and `.dark` (dark). Tailwind reads them via
  semantic tokens (e.g., `bg-background`, `text-muted`).
- Theme toggle is user-controlled and persisted; default follows `prefers-color-scheme`.
- No third theme. No "midnight pro" variants.

## Implementation notes

- Tokens live in `tailwind.config.ts` and `app/globals.css` (CSS variables).
- shadcn/ui is the component base; **every** shadcn primitive is restyled to match this
  system before use — default shadcn is a starting point, not the finished look.
- Storybook is **not** in the MVP, but a single `/dev` route renders component samples
  for quick visual checks.
