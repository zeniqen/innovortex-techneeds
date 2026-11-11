# 005 — Add motion tokens and a reduced-motion reset

- **Status**: TODO
- **Commit**: fce42b7
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 file, ~25 lines changed

## Problem

`src/app/globals.css` contains **no** `@media (prefers-reduced-motion: reduce)`
block and **no** shared easing tokens. The codebase's motion is split across
two systems, and only one of them respects reduced motion.

- **Four Motion components** handle it correctly — `useReducedMotion()` is
  wired in `src/app/template.tsx:29`, `src/components/loading-screen.tsx:27`,
  `src/components/ui/animated-counter.tsx:106`, and
  `src/components/ui/3d-marquee.tsx:28`.
- **~40 CSS-driven motions** handle it not at all. The transforms that matter
  most are the nine hover lifts and scales:

  - `src/components/hero.tsx:64` — `hover:-translate-y-0.5`
  - `src/components/hero.tsx:72` — `hover:-translate-y-0.5`
  - `src/components/ui/floating-dock.tsx:85` — `hover:scale-105`
  - `src/components/stats.tsx:98` — `hover:-translate-y-1` (removed by plan 004)
  - `src/components/mission.tsx:95` — `hover:-translate-y-1` (removed by plan 004)
  - `src/components/mission.tsx:99` — `group-hover:scale-105` (removed by plan 004)
  - `src/components/stats.tsx:101` — `group-hover:scale-105` (removed by plan 004)
  - `src/components/ui/3d-marquee.tsx:83` — `hover:shadow-2xl`
  - `src/components/ui/3d-marquee.tsx:96` — `hover:shadow-2xl`

  A user who has asked their OS for less motion still gets all of these.

The second problem is **cohesion**. The strong ease-out curve
`cubic-bezier(0.23, 1, 0.32, 1)` appears as a bare array in two unrelated
files, and the weak built-in `cubic-bezier(0.4, 0, 0.2, 1)` is inlined in a
third:

- `src/components/loading-screen.tsx:15` — `const EASE_OUT = [0.23, 1, 0.32, 1] as const;`
- `src/components/loading-screen.tsx:15` — `const EASE_OUT = [0.23, 1, 0.32, 1] as const;`
- `src/components/ui/carousel.tsx:80` — `transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",`

Three hand-typed curves that almost match is exactly the consolidation case
the playbook describes.

## A correction to the original audit finding

The original audit also claimed that `hover:` states fire on tap and stay
stuck on touch devices. **That is not true for plain `hover:` utilities in
this project.** Tailwind v4's `hover` variant is already wrapped in a
pointer-capability media query — verified against the installed Tailwind
4.3.5, every `hover:` rule in the compiled stylesheet is emitted inside
`@media (hover: hover)`:

```css
@media (hover: hover) {
  .hover\:scale-105:hover { ... }
  .hover\:-translate-y-0\.5:hover { ... }
}
```

On a phone the primary pointer cannot hover, so `(hover: hover)` is false and
the rule never applies. There is **no stuck-hover bug** for plain `hover:`
utilities, and no pointer-gating work is needed for them.

The one exception is `group-hover:`, which compiles to plain `:hover` CSS
rather than to the variant — so it is *not* pointer-gated. There are exactly
three instances:

- `src/components/stats.tsx:101` — `group-hover:scale-105` on the icon wrapper
- `src/components/mission.tsx:99` — `group-hover:scale-105` on the icon wrapper
- `src/components/mission.tsx:118` — `group-hover:translate-x-1` on the "Learn more →" arrow

and **plan 004 removes all three**. After plan 004 there is no ungated hover
motion left in the codebase.

**Consequence: this plan does not touch any component file.** It is purely
additive to `src/app/globals.css`, which means it does not conflict with
plans 003, 004, or 006 — those may use the `ease-strong-out` utility this
plan introduces.

## Target

### 1. Shared easing tokens

Add to the `:root` block, after the existing `--accent-muted` declaration
(`src/app/globals.css:17`):

```css
  /* Motion easing — strong curves for deliberate UI motion. */
  --ease-strong-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-strong-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

Then register them with Tailwind. Add to the existing `@theme inline` block
(`src/app/globals.css:36-60`):

```css
  --ease-strong-out: var(--ease-strong-out);
  --ease-strong-in-out: var(--ease-strong-in-out);
  --ease-drawer: var(--ease-drawer);
```

**The names are deliberately not `ease-out` / `ease-in-out`.** Tailwind v4's
default theme already defines `--ease-out: cubic-bezier(0, 0, 0.2, 1)` and
`--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)` (verified in
`node_modules/tailwindcss/theme.css:435-436`). Overriding those would
silently change the meaning of every existing `ease-out` / `ease-in-out`
utility in the codebase. Distinct names fix the "three near-identical
hand-typed curves" problem without a behaviour-changing rename.

Verified against the installed Tailwind 4.3.5: with the token defined in
`:root` and registered in `@theme inline`, the `ease-strong-out` utility
compiles to

```css
.ease-strong-out {
  --tw-ease: var(--ease-strong-out);
  transition-timing-function: var(--ease-strong-out);
}
```

### 2. Reduced-motion reset

Append to `src/app/globals.css`, at the end of the file (after the
leaderboard rules, which end at line 188):

```css
/* Respect users who ask for less motion: keep colour and opacity feedback,
   drop movement. */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This is the standard reduced-motion reset. It neutralises every CSS
transition and animation in the codebase, including the ones added by plans
003, 004, and 006. It does **not** remove the elements themselves, so opacity
and colour states still resolve instantly rather than disappearing — the user
keeps the feedback, they just do not get the movement.

It does **not** affect the four Motion components, which already branch on
`useReducedMotion()`.

### 3. Leave the Motion components' easings alone

`src/components/loading-screen.tsx:15` keeps its local array.

Motion's `ease` option wants a cubic-bezier **array**, not a CSS variable
string, and `var(--ease-strong-out)` is not a form Motion's easing parser is
designed for. The array is already exactly the curve from the playbook and
it is readable in place. The tokens in `globals.css` exist for the CSS
utilities; the Motion components keep their local constant. Note this in the
PR description so the duplication is a conscious choice, not an oversight.

`src/app/template.tsx:18` is a **deliberate exception** — it uses
`cubic-bezier(0.4, 0, 0.2, 1)`, not the strong ease-out. The strong curve
reaches 90% opacity at 36% of the duration, which made the route fade read
as an instant cut; the gentler ramp is what makes the page visibly assemble.
Do not "fix" it to match the tokens.

The new `src/components/ui/page-reveal.tsx` also uses
`cubic-bezier(0.4, 0, 0.2, 1)` for the same reason.

## Repo conventions to follow

- The palette is defined as CSS custom properties on `:root` in
  `src/app/globals.css:3-34`, and mirrored into Tailwind via the
  `@theme inline` block at `src/app/globals.css:36-60`. Motion tokens belong
  in the same two places, in that order.
- Component-scoped CSS in this codebase lives at the bottom of
  `src/app/globals.css` (see `.bg-subtle-grid` at lines 86-91).
- Motion components read `useReducedMotion()` from `"motion/react"` —
  `src/app/template.tsx:3`.
- The codebase convention for the strong ease-out is
  `cubic-bezier(0.23, 1, 0.32, 1)` — `src/components/loading-screen.tsx:15`
  and `src/components/loading-screen.tsx:15`.

## Steps

1. In `src/app/globals.css`, add the three easing tokens to the `:root`
   block, after `--accent-muted` (line 17):

```css
  /* Motion easing — strong curves for deliberate UI motion. */
  --ease-strong-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-strong-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

2. In the `@theme inline` block (`src/app/globals.css:36-60`), add:

```css
  --ease-strong-out: var(--ease-strong-out);
  --ease-strong-in-out: var(--ease-strong-in-out);
  --ease-drawer: var(--ease-drawer);
```

3. Append the reduced-motion reset at the end of
   `src/app/globals.css` (after line 188):

```css
/* Respect users who ask for less motion: keep colour and opacity feedback,
   drop movement. */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

4. Verify the token utility compiles. Write a temporary file
   `src/__probe/p.html` containing:

```html
<div class="ease-strong-out transition-transform duration-200"></div>
```

   then run:

   ```
   npx @tailwindcss/cli -i src/app/globals.css -o /tmp/probe.css
   grep -n -A2 "\.ease-strong-out" /tmp/probe.css
   ```

   Expect:

   ```
   .ease-strong-out {
     --tw-ease: var(--ease-strong-out);
     transition-timing-function: var(--ease-strong-out);
   }
   ```

   **Delete `src/__probe/` and `/tmp/probe.css` when done.**

5. Do **not** add any pointer-gating utilities. `hover:` is already gated by
   Tailwind v4's `@media (hover: hover)` wrapper, and `group-hover:` is
   removed by plan 004. Do not add `hover:pointer-fine:` — it would be
   redundant.

## Boundaries

- Do NOT touch any component file. This plan is additive to
  `src/app/globals.css` only.
- Do NOT change `src/components/ui/carousel.tsx`'s inline transition. That is
  plan 006.
- Do NOT change the `:root` palette values or the existing `@theme inline`
  colour mappings.
- Do NOT add or remove dependencies.
- Do NOT use the names `ease-out` / `ease-in-out` for the new tokens — they
  collide with Tailwind v4's defaults and would silently change every
  existing usage.
- Do NOT add `hover:pointer-fine:` utilities — see the correction section.
- If a step doesn't match the code you find (drift since the commit stamp),
  match on the **code**, not the line number; if the code itself differs
  from what is quoted here, STOP and report instead of improvising.

## Verification

- **Mechanical**:
  - `npx tsc --noEmit` — expect no errors.
  - `npx eslint src/` — expect no new errors.
  - `npm run build` — expect "Compiled successfully".
  - `grep -c "prefers-reduced-motion" src/app/globals.css` — expect ≥ 1.
  - `grep -c "ease-strong-out" src/app/globals.css` — expect ≥ 2 (the
    `:root` declaration and the `@theme inline` registration).
  - Confirm `src/__probe/` no longer exists.

- **Feel check**: run `npm run dev`.
  - Emulate `prefers-reduced-motion: reduce` in DevTools (Rendering panel).
    Hover a hero button and a dock icon — they must **not** lift or scale,
    but their colour must still change on hover (feedback is preserved,
    movement is dropped).
  - Confirm the page still scrolls smoothly with `scroll-behavior: smooth`
    when reduced motion is off, and jumps instantly when it is on.
  - Confirm `scroll-behavior: auto` inside the reduced-motion block wins over
    the `body` rule.
  - In DevTools, confirm the `@media (prefers-reduced-motion: reduce)` block
    is present in the compiled stylesheet and that
    `.ease-strong-out { transition-timing-function: var(--ease-strong-out) }`
    is emitted.
  - Verify on a touch device emulation (DevTools device toolbar) that
    tapping a button does not leave it visibly lifted.

- **Done when**: reduced-motion users get colour feedback without movement,
  three easing tokens exist and are registered with Tailwind, no component
  file was touched, and typecheck, lint, and build pass.

```
