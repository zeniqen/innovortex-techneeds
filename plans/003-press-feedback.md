# 003 — Add press feedback to the dock and the primary CTAs

- **Status**: TODO
- **Commit**: fce42b7
- **Severity**: HIGH
- **Category**: Physicality & origin
- **Estimated scope**: 4 files, ~12 lines changed

## Problem

The elements a user presses most in this app have **no press feedback at all**.
A press produces zero visual acknowledgement — the button looks identical
before and after the click.

The floating dock is the single most-pressed element in the application: it is
how the user moves between *Home, Techboard, Team, Leaderboard, FAQs, Profile*.
It has a hover state and a tooltip, but no `:active` state.

`src/components/ui/floating-dock.tsx:204` — current (desktop dock icon):

```tsx
        className="relative flex aspect-square items-center justify-center rounded-full bg-[var(--color-night-white)] border border-[var(--color-spotted-dove)] text-[var(--color-iron-fixture)] transition-colors hover:border-[var(--color-caviar)] hover:text-[var(--color-caviar)]"
```

`src/components/ui/floating-dock.tsx:73` — current (mobile dock item):

```tsx
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-emptiness)] border border-[var(--color-spotted-dove)] shadow-md text-[var(--color-iron-fixture)] hover:text-[var(--color-caviar)] hover:border-[var(--color-caviar)] transition-colors"
```

`src/components/ui/floating-dock.tsx:85` — current (mobile menu toggle):

```tsx
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-caviar)] border border-[var(--color-caviar)] shadow-xl text-[var(--color-emptiness)] hover:scale-105 transition-all"
```

The landing page's two terminal conversion CTAs have the same gap — they scale
on hover but never acknowledge the press:

`src/components/hero.tsx:64` — current:

```tsx
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm text-[var(--color-emptiness)] bg-[var(--color-caviar)] hover:bg-[var(--color-iron-fixture)] shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0"
```

`src/components/hero.tsx:72` — current:

```tsx
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm text-[var(--color-caviar)] bg-[var(--color-night-white)] hover:bg-[var(--color-spotted-dove)]/40 border border-[var(--color-spotted-dove)] transition-all hover:-translate-y-0.5 active:translate-y-0"
```

Note the two hero buttons use `active:translate-y-0` — that is a *hover
cancellation*, not press feedback. On hover the button lifts `-translate-y-0.5`;
on press it returns to `translate-y-0`, so pressing makes the button *drop
back down* by 2px. That reads as "the button fell", not "the button was
pressed".

(The CTA banner that used to sit at the bottom of the home page — with its
own two buttons — has since been removed from the page, so it is no longer
part of this plan's scope. If it ever comes back, its two buttons have the
same gap: `transition-all` with `hover:scale-105` and no `:active` rule.)

Per the playbook: press feedback is `transform: scale(0.97)` on `:active` with
`transition: transform 160ms ease-out`, kept subtle (0.95–0.98).

## Where the dock's press feedback goes — read this first

The desktop dock icon is a `motion.div` whose `scale` is driven by Motion
(plan 001 turns the magnify into a Motion `scale`). **Motion writes that
transform as an inline style**, so a CSS class like `active:scale-[0.97]` on
that same element would be silently overridden and the press feedback would
never fire.

So the desktop dock's press feedback goes on the **`DockItemLink` wrapper**
instead — the `<a>` / `<button>` that wraps the circle. The two transforms are
on nested elements, so they compose instead of fighting:

```
<button class="inline-flex active:scale-[0.97]">   <- press, this plan
  <motion.div style="scale: 1.15">                  <- magnify, plan 001
```

`inline-flex` is required: `DockItemLink` renders a `<button>` for
non-navigating items and an `<a>` for navigating ones, and a bare `<a>` is
`display: inline` — transforms do not apply to non-replaced inline boxes.
`inline-flex` also keeps the wrapper sized to the circle, so the layout is
unchanged.

## Target

Every pressable primary control gets a scale-down press acknowledgement.

Exact target values, applied as utility classes:

```
active:scale-[0.97] transition-transform duration-150 ease-strong-out
```

Notes:
- `scale-[0.97]` — within the playbook's 0.95–0.98 band.
- `duration-150` — inside the 100–160ms press-feedback budget.
- `ease-strong-out` — the shared strong ease-out token, defined by **plan
  005** in `src/app/globals.css`. It resolves to
  `cubic-bezier(0.23, 1, 0.32, 1)`, the curve the codebase already uses for
  deliberate motion (`src/components/loading-screen.tsx:15`,
  `src/components/loading-screen.tsx:15`).
- `transition-transform` replaces `transition-all`, so only the transform is
  transitioned. The colour changes on hover keep their own `transition-colors`
  where one already exists.

**Dependency: run plan 005 before this plan**, or substitute
`ease-[cubic-bezier(0.23,1,0.32,1)]` (verified to compile) for `ease-strong-out`.

### Per-element targets

**`src/components/ui/floating-dock.tsx:198`** (desktop dock icon) — the
`DockItemLink` call currently has no `className`:

```tsx
    <DockItemLink item={{ title, icon, href, external }}>
```

Replace with:

```tsx
    <DockItemLink
      item={{ title, icon, href, external }}
      className="inline-flex transition-transform duration-150 ease-strong-out active:scale-[0.97]"
    >
```

**Do NOT add `active:scale-[0.97]` to the circle's `className` at
`src/components/ui/floating-dock.tsx:204`** — Motion's inline `scale` would
override it (see the section above). The circle keeps its `transition-colors`
hover styling exactly as it is.

**`src/components/ui/floating-dock.tsx:73`** (mobile dock item) — append the
three press utilities to the existing `transition-colors` class list:

```tsx
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-emptiness)] border border-[var(--color-spotted-dove)] shadow-md text-[var(--color-iron-fixture)] hover:text-[var(--color-caviar)] hover:border-[var(--color-caviar)] transition-colors transition-transform duration-150 ease-strong-out active:scale-[0.97]"
```

**`src/components/ui/floating-dock.tsx:85`** (mobile menu toggle) — replace
`transition-all` with `transition-transform` and add the press utilities:

```tsx
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-caviar)] border border-[var(--color-caviar)] shadow-xl text-[var(--color-emptiness)] hover:scale-105 transition-transform duration-150 ease-strong-out active:scale-[0.97]"
```

**`src/components/hero.tsx:64` and `:72`** — these already have
`active:translate-y-0`. Replace the hover-lift + active-drop pair with the
press scale. Keep the colour change:

```tsx
className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm text-[var(--color-emptiness)] bg-[var(--color-caviar)] hover:bg-[var(--color-iron-fixture)] shadow-md transition-colors transition-transform duration-150 ease-strong-out hover:-translate-y-0.5 active:scale-[0.97]"
```

Note both `transition-colors` and `transition-transform` are present — they
set different properties (`color`/`background-color` vs `transform`), so
Tailwind emits both and they do not conflict.

## Repo conventions to follow

- Palette is always referenced through `var(--color-*)` tokens — never raw hex.
  See `src/components/hero.tsx:64`.
- The shared easing token `ease-strong-out` is registered by plan 005 in
  `src/app/globals.css`. Verified against the installed Tailwind 4.3.5: it
  compiles to `transition-timing-function: var(--ease-strong-out)`.
- `active:scale-[0.97]` compiles correctly in this project — verified
  against the installed Tailwind 4.3.5.
- `cn()` from `@/lib/utils` is already imported in
  `src/components/ui/floating-dock.tsx:4` — but the `DockItemLink` `className`
  prop is applied directly, not merged, so no `cn()` call is needed here.

## Steps

1. `src/components/ui/floating-dock.tsx:198` — give the desktop `DockItemLink`
   a `className` of
   `inline-flex transition-transform duration-150 ease-strong-out active:scale-[0.97]`.

2. `src/components/ui/floating-dock.tsx:73` — add
   `transition-transform duration-150 ease-strong-out active:scale-[0.97]`
   to the mobile dock item's class list (keeping the existing
   `transition-colors`).

3. `src/components/ui/floating-dock.tsx:85` — replace `transition-all` with
   `transition-transform duration-150 ease-strong-out` and add
   `active:scale-[0.97]`.

4. `src/components/hero.tsx:64` and `:72` — replace `transition-all` with
   `transition-colors transition-transform duration-150 ease-strong-out`,
   keep `hover:-translate-y-0.5`, and replace `active:translate-y-0` with
   `active:scale-[0.97]`.

5. Confirm no `transition-all` remains on these two files:
   `grep -n "transition-all" src/components/ui/floating-dock.tsx src/components/hero.tsx`
   — expect no output.

   (`src/components/mission.tsx`, `src/components/stats.tsx`,
   `src/components/faq-page.tsx` and `src/components/ui/carousel.tsx` also have
   `transition-all`, but those are separate plans — 004 covers the card
   hovers, 006 covers the carousel.)

6. Confirm the desktop circle did **not** receive a CSS press class:
   `grep -n "active:scale" src/components/ui/floating-dock.tsx`
   — expect exactly **two** matches: the `DockItemLink` wrapper and the
   mobile dock item. The mobile menu toggle is a third, so expect **three**
   matches total, and none of them on the circle's `className`.

## Boundaries

- Do NOT change the dock's magnify spring (plan 001) or its tooltip
  animation (plan 002).
- Do NOT add `active:scale-*` to the desktop circle's `className` — Motion's
  inline `scale` would override it.
- Do NOT change button colours, padding, radii, or copy.
- Do NOT change any `hover:` behaviour other than removing the
  `active:translate-y-0` drop on the hero buttons.
- Do NOT touch `src/components/mission.tsx`, `src/components/stats.tsx`,
  `src/components/faq-page.tsx`, `src/components/ui/carousel.tsx`, or
  `src/components/ui/3d-marquee.tsx`.
- Do NOT re-add `src/components/cta-banner.tsx`. It was removed from the
  home page; this plan does not cover it.
- Do NOT add dependencies.
- If a step doesn't match the code you find (drift since the commit stamp),
  match on the **code**, not the line number; if the code itself differs
  from what is quoted here, STOP and report instead of improvising.

## Verification

- **Mechanical**:
  - `npx tsc --noEmit` — expect no errors.
  - `npx eslint src/components/ui/floating-dock.tsx src/components/hero.tsx`
    — expect no errors.
  - `npm run build` — expect "Compiled successfully".
  - `grep -n "transition-all" src/components/ui/floating-dock.tsx src/components/hero.tsx`
    — expect no output.

- **Feel check**: run `npm run dev` and open the site.
  - Press and hold each dock icon — it visibly shrinks ~3% and springs back on
    release. The shrink must be noticeable but subtle.
  - Hover a desktop dock icon and press it at the same time — the icon
    magnifies *and* the whole button shrinks; both motions must be visible
    and neither must cancel the other.
  - Press and hold "Explore Cohorts" and "Community Events" in the hero —
    same behaviour.
  - The hero buttons must no longer *drop back down* when pressed; they scale
    down instead.
  - Confirm the button's colour still changes on hover as before, and that
    no other property (shadow, border, padding) animates.
  - In DevTools, Animations panel: confirm the pressed button animates
    `transform` with a `150ms` duration.
  - Confirm the desktop dock row does **not** reflow when an icon is pressed —
    the wrapper scales without changing layout.
  - On a touch device or with DevTools device emulation set to touch, confirm
    the press feedback still fires (it is `:active`, not hover-gated) and no
    stuck hover state remains.

- **Done when**: all five controls shrink on press, no `transition-all`
  remains in the three files, the desktop circle carries no CSS transform
  class, and typecheck, lint, and build pass.

```
