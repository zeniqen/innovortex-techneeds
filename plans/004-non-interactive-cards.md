# 004 — Stop the non-interactive cards from faking clickability

- **Status**: TODO
- **Commit**: fce42b7
- **Severity**: MEDIUM
- **Category**: Purpose & frequency
- **Estimated scope**: 2 files, ~8 lines changed

## Problem

Eight cards across two sections perform a full hover routine — lift, border
change, shadow, icon scale — but they are **plain `<div>`s with no `href`, no
`onClick`, no `role`, and no `tabIndex`**. They do nothing when clicked.

`src/components/stats.tsx:96-99` — current:

```tsx
            <div
              key={idx}
              className="relative group rounded-2xl p-6 bg-[var(--color-emptiness)] border border-[var(--color-spotted-dove)] hover:border-[var(--color-caviar)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
```

`src/components/stats.tsx:101` — the icon inside it also scales:

```tsx
                <div className="w-12 h-12 rounded-xl bg-[var(--color-night-white)] border border-[var(--color-spotted-dove)] flex items-center justify-center transition-transform group-hover:scale-105">
```

`src/components/mission.tsx:93-96` — current:

```tsx
              <div
                key={idx}
                className="group relative rounded-2xl p-6 bg-[var(--color-emptiness)] border border-[var(--color-spotted-dove)] hover:border-[var(--color-caviar)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between"
              >
```

`src/components/mission.tsx:99` — same icon scale:

```tsx
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-night-white)] border border-[var(--color-spotted-dove)] flex items-center justify-center transition-transform group-hover:scale-105">
```

And the worst offender — the mission card ends with a link-styled affordance
that goes nowhere:

`src/components/mission.tsx:116-120` — current:

```tsx
                <div className="pt-4 mt-4 border-t border-[var(--color-night-white)] flex items-center text-xs font-semibold text-[var(--color-caviar)]">
                  <span>Learn more</span>
                  <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </div>
```

"Learn more →" with an arrow that slides right on hover is the clearest
possible promise of a destination. There is none.

The motion itself is also not free: `transition-all` at `duration-300` on
eight cards arms every property, and the 300ms lift is at the very top of the
UI budget for a hover effect the user sees dozens of times per page view.

## Target

Two acceptable end states. **Prefer the first.**

### Option A (preferred) — make the affordance honest

The stats cards are genuinely informational, so they should read as static
information panels. The mission cards describe services the user can
participate in, so they should link somewhere real.

- **Stats cards** (`src/components/stats.tsx`): remove the hover lift, the
  shadow, the border change and the icon scale. A stat card is a fact, not a
  button.

  Target class list for the card (`:98`):

  ```
  relative group rounded-2xl p-6 bg-[var(--color-emptiness)] border border-[var(--color-spotted-dove)]
  ```

  Target class list for the icon wrapper (`:101`):

  ```
  w-12 h-12 rounded-xl bg-[var(--color-night-white)] border border-[var(--color-spotted-dove)] flex items-center justify-center
  ```

- **Mission cards** (`src/components/mission.tsx`): keep them interactive by
  making the whole card a link to the cohort/WhatsApp destination, and keep a
  restrained hover. If a destination is not yet decided, use the WhatsApp
  invite link already present elsewhere in the codebase
  (`https://chat.whatsapp.com/invite/techneeds`, see
  `src/components/floating-dock-demo.tsx` and `src/components/footer.tsx`).

  Target: wrap the card's inner content in an `<a>` with the destination, and
  keep the hover lift but scoped to `transform` only:

  ```
  transition-transform duration-200 ease-strong-out hover:-translate-y-1
  ```

  and replace the `transition-all` on the card. Keep `hover:shadow-md` only if
  a `transition-shadow duration-200` is added alongside, so the shadow does
  not snap.

  **The "Learn more →" arrow loses its hover slide.** `src/components/mission.tsx:118`
  is currently:

  ```tsx
                  <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
  ```

  `group-hover:` is the one Tailwind variant that is **not** pointer-gated —
  it compiles to plain `:hover` CSS rather than to the `hover` variant, which
  Tailwind v4 wraps in `@media (hover: hover)`. On a touch device the arrow
  would slide on tap and stay slid until the next tap.

  So under Option A, change it to:

  ```tsx
                  <span className="ml-1 transition-transform">→</span>
  ```

  The card's 4px lift and border change are the hover feedback; the arrow
  stays a static affordance. This is the only way to leave **zero**
  `group-hover:` utilities in the codebase.

  (If the arrow slide is genuinely wanted on pointer devices, the correct
  way is a custom `@custom-variant group-hover` in `src/app/globals.css`
  that wraps the rule in `@media (hover: hover)` — that is out of scope
  here and would put an edit in plan 005's file.)

### Option B (fallback) — keep them static but stop the false promise

If the mission cards genuinely have no destination yet, remove the "Learn more
→" row entirely (`:116-120`) and strip the lift from both card types, leaving
only the border-colour change:

```
transition-colors duration-200 hover:border-[var(--color-caviar)]
```

and remove the icon scale from both files.

Option B is strictly less work and removes the false affordance outright.
Either option satisfies the plan; do not do neither.

Exact motion values used above:
- `duration-200` — inside the playbook's UI budget for a hover.
- `ease-strong-out` — the shared strong ease-out token, registered by
  **plan 005** in `src/app/globals.css`. It resolves to
  `cubic-bezier(0.23, 1, 0.32, 1)`, the curve the codebase already uses for
  deliberate motion (`src/components/loading-screen.tsx:15`,
  `src/components/loading-screen.tsx:15`).
- `hover:-translate-y-1` — a 4px lift, unchanged from today, but now
  transitioning `transform` only instead of `all`.

**Dependency: run plan 005 before this plan**, or substitute
`ease-[cubic-bezier(0.23,1,0.32,1)]` (verified to compile) for
`ease-strong-out`.

## Repo conventions to follow

- Palette via `var(--color-*)` tokens only.
- Strong ease-out: `cubic-bezier(0.23, 1, 0.32, 1)` —
  `src/components/loading-screen.tsx:15` defines it as `EASE_OUT`;
  `src/components/loading-screen.tsx:15` defines the same array.
- The shared easing token `ease-strong-out` is registered by plan 005 in
  `src/app/globals.css`. Verified against the installed Tailwind 4.3.5: it
  compiles to `transition-timing-function: var(--ease-strong-out)`.
- Existing hover-colour conventions live in `src/components/footer.tsx`
  (`transition-colors` on every link).
- `group-hover:` is the one Tailwind variant that is **not** pointer-gated
  (it compiles to plain `:hover` CSS, not to the `hover` variant, which
  Tailwind v4 wraps in `@media (hover: hover)`). This plan removes **all
  three** `group-hover:` instances in the codebase, which is what closes that
  gap.

## Steps

1. Decide Option A or Option B and state which one you took in the PR
   description.

2. **Stats cards** — `src/components/stats.tsx`:
   - Replace the card class list at `:98` with the target list above
     (dropping `transition-all`, `duration-300`, `hover:-translate-y-1`,
     `hover:shadow-md`, and `hover:border-[var(--color-caviar)]`).
   - Replace the icon wrapper class list at `:101` with the target list above
     (dropping `transition-transform group-hover:scale-105`).

3. **Mission cards** — `src/components/mission.tsx`:
   - Replace the card class list at `:95` with the Option A or Option B list.
   - Replace the icon wrapper class list at `:99` the same way as the stats
     icon.
   - Under Option A, wrap the card body in an `<a>` pointing at
     `https://chat.whatsapp.com/invite/techneeds` with
     `target="_blank" rel="noreferrer noopener"` (matching
     `src/components/footer.tsx:70-76`), and add `focus-visible:` styles so
     keyboard users can see the focus ring.
   - Under Option A, replace the arrow at `:118` with
     `<span className="ml-1 transition-transform">→</span>` — dropping
     `group-hover:translate-x-1` so no ungated hover motion is left.
   - Under Option B, delete the "Learn more →" row at `:116-120` entirely,
     including its `border-t` divider.

4. Confirm the hover motion no longer animates unintended properties, and that
   no ungated hover motion is left anywhere in the app:
   `grep -n "transition-all\|group-hover:" src/components/stats.tsx src/components/mission.tsx`
   — expect no output.
   `grep -rn "group-hover:" src/`
   — expect no output anywhere in `src/`.

## Boundaries

- Do NOT change card copy, the number values, the icon choices, or the grid
  layout.
- Do NOT change `src/components/faq-page.tsx`, `src/components/ui/carousel.tsx`,
  or `src/components/ui/3d-marquee.tsx`.
- Do NOT add dependencies.
- Do NOT introduce new colour values — stick to the existing palette tokens.
- If a step doesn't match the code you find (drift since the commit stamp),
  match on the **code**, not the line number; if the code itself differs
  from what is quoted here, STOP and report instead of improvising.

## Verification

- **Mechanical**:
  - `npx tsc --noEmit` — expect no errors.
  - `npx eslint src/components/stats.tsx src/components/mission.tsx` — expect
    no errors.
  - `npm run build` — expect "Compiled successfully".

- **Feel check**: run `npm run dev` and scroll to both sections.
  - The four stat cards and four "What We Offer" cards must **not** lift,
    gain a shadow, or scale their icons on hover. They should read as static
    information panels.
  - Under Option A: hovering a mission card lifts it by 4px with a smooth
    200ms ease-out, and **clicking the card actually opens the WhatsApp
    link** — click and confirm the destination. The "→" arrow is a static
    glyph and does not move on hover.
  - Under Option B: the mission cards show no "Learn more →" row at all.
  - Tab through the page: under Option A, focus a mission card and confirm a
    visible focus ring appears.
  - In DevTools, Animations panel: confirm only `transform` (and `box-shadow`
    if retained) animates on hover, and the duration is 200ms.

- **Done when**: no card on the page promises a destination it does not have,
  `grep` finds no `transition-all` or `group-hover:scale-105` in the two
  files, and typecheck, lint, and build pass.

```
