# Animation Audit — Implementation Plans

Seven self-contained plans produced from a motion audit of the TechNeeds
IGDTUW landing page.

- **Base commit:** `fce42b7`
- **Scope:** `src/app/globals.css`, `src/app/template.tsx`,
  `src/app/layout.tsx`, `src/components/**`
- **Status of the codebase at the base commit:** all work in this repo is
  currently **uncommitted**. The plans are written against the working tree
  as it stands at `fce42b7` plus the uncommitted landing-page work.

Each plan is written to be executed by a fresh agent with no other context.
Every plan contains the problem, the target with exact values, the exact
steps, the boundaries (what *not* to touch), and a verification section split
into mechanical checks and a manual feel check.

---

## The plans

| # | Title | Severity | Category | Files | Status |
|---|---|---|---|---|---|
| [001](001-dock-magnify-transform.md) | Replace the dock's layout-animating magnify with a transform spring | HIGH | Performance | 1 | TODO |
| [002](002-dock-tooltip-instant.md) | Make the dock tooltip instant after the first open, and symmetric | HIGH | Purpose & frequency | 1 | TODO |
| [003](003-press-feedback.md) | Add press feedback to the dock and the primary CTAs | HIGH | Physicality | 4 | TODO |
| [004](004-non-interactive-cards.md) | Stop the non-interactive cards from faking clickability | MEDIUM | Purpose & frequency | 2 | TODO |
| [005](005-motion-tokens-and-a11y-gates.md) | Add motion tokens and a reduced-motion reset | MEDIUM | Accessibility | 1 | TODO |
| [006](006-carousel-transitions.md) | Fix the carousel's dead transitions and over-long crossfades | MEDIUM | Easing & duration | 1 | TODO |
| [007](007-loading-screen-real-progress.md) | Make the loading screen report real progress and stop forcing a wait | MEDIUM | Purpose & frequency | 2 | TODO |

**Totals:** 7 plans, 12 files touched (some files are touched by more than
one plan), ~2,100 lines of plan text.

---

## Recommended execution order

```
005  ──┬──► 001 ──► 002 ──┐
       │                   ├──► 003
       ├──► 004            │
       ├──► 006            │
       └──► 007  (independent)
```

### Phase 1 — foundation (run first)

**005 — motion tokens and a reduced-motion reset.**

This plan is purely additive to `src/app/globals.css`. It introduces the
`ease-strong-out` token that plans 003, 004, and 006 use, and the
reduced-motion reset that neutralises every CSS transition in the app.

Running it first means plans 003/004/006 can write `ease-strong-out` rather
than repeating a raw `cubic-bezier(...)` in four more places — which is the
entire point of the token. Running it last would mean re-editing every class
list that 003/004/006 had already touched.

**No plan depends on 005's reduced-motion block for correctness**, so if you
prefer to ship the visible fixes first, 005 can be deferred to the end — just
substitute `ease-[cubic-bezier(0.23,1,0.32,1)]` for `ease-strong-out` in
plans 003, 004, and 006.

### Phase 2 — the dock cluster (run these together, in order)

**001 → 002 → 003.**

All three edit `src/components/ui/floating-dock.tsx`, and 001 and 002 both
edit the same `IconContainer` function.

- **001 first** — it restructures the circle (four springs and two animated
  dimensions collapse to one `scale` spring).
- **002 second** — it adjusts the tooltip inside that circle. Run after 001
  so the tooltip's surrounding markup is final.
- **003 third** — it adds the press feedback, including the new `className`
  on the `DockItemLink` wrapper that 001 explicitly leaves alone.

The one ordering rule inside this cluster: **001 owns the circle's transform
(Motion), 003 owns the wrapper's transform (CSS).** They are on nested
elements and compose. If 003 puts `active:scale-[0.97]` on the circle
instead, Motion's inline `scale` would silently override it and the press
feedback would never fire. Both plans state this boundary explicitly.

### Phase 3 — everything else (any order)

**004** (stats + mission cards), **006** (carousel), **007** (loading
screen). These three touch disjoint files and have no dependencies on each
other. Run them in parallel if you have the capacity.

---

## Dependencies

| Plan | Depends on | Blocks | Shared files with |
|---|---|---|---|
| 001 | — | 002 | 002, 003 (`floating-dock.tsx`) |
| 002 | 001 | — | 001, 003 (`floating-dock.tsx`) |
| 003 | 001, 002 | — | 001, 002 (`floating-dock.tsx`) |
| 004 | 005 (token only) | — | 006 (`stats.tsx` counter only) |
| 005 | — | 003, 004, 006 | — |
| 006 | 005 (token only) | — | 004 (`stats.tsx` counter only) |
| 007 | — | — | — |

### Hard dependencies

- **005 → 003 / 004 / 006.** These three use the `ease-strong-out` utility
  that 005 registers. Without 005 they will silently emit no
  `transition-timing-function` and fall back to Tailwind's default curve.
  The fallback (`ease-[cubic-bezier(0.23,1,0.32,1)]`) is verified to compile
  if you would rather not wait.
- **001 → 002 → 003.** Sequencing, not correctness — but 003 in particular
  depends on 001's structural decision (the `DockItemLink` wrapper class).

### Soft dependencies

None. Every plan can be landed and verified on its own.

---

## A note on line numbers

Every plan quotes exact line numbers as *anchors* into the base commit, and
every plan contains the exact code it expects to find. Several plans will
have shifted those anchors by the time they run, because earlier plans add
and remove lines in the same files.

**Match on the code, not the line number.** Each plan's Boundaries section
says this explicitly. If the quoted *code* differs from what is on disk, that
is real drift — stop and report it rather than improvising.

---

## Verification tooling

All plans assume these commands, which are already configured in the repo:

```bash
npx tsc --noEmit        # types
npx eslint <files>      # lint
npm run build           # production build
npm run dev             # dev server
```

Two Tailwind facts were verified against the installed Tailwind 4.3.5 before
these plans were written, and the plans depend on both:

1. `transition-shadow`, `ease-[cubic-bezier(0.23,1,0.32,1)]`,
   `active:scale-[0.97]`, and `motion-reduce:` all compile to real CSS.
2. **Tailwind v4 already wraps every plain `hover:` utility in
   `@media (hover: hover)`.** So plain `hover:` states do **not** stick on
   touch devices — no pointer-gating work is needed for them. The only
   variant that escapes this is `group-hover:`, which compiles to plain
   `:hover` CSS; there are exactly three instances and plan 004 removes all
   of them.

This second point corrects the original audit finding, which claimed a
stuck-hover bug across eleven hover transforms. It is why plan 005 no longer
touches any component file.

---

## What these plans deliberately do not touch

Motion that exists to establish identity or that the user does not interact
with repeatedly:

- **The 3D marquee's continuous rotation** (`src/components/ui/3d-marquee.tsx`)
  — it is the section's whole character. The testimonial cards ride it; the
  marquee itself is not "extra" motion.
- **The carousel's 3D geometry** — `rotateX(55deg) rotateY(0deg)
  rotateZ(-45deg)`, `origin-top-left`, `top-96 right-[50%]`,
  `size-[1720px]`. Plan 006 fixes the *timings*, not the geometry.
- **The route fade** (`src/app/template.tsx`) — 350ms, opacity only, already
  on the strong ease-out, already respects `useReducedMotion()`. It is the
  correct implementation of what it does.
- **The stats counters** (`src/components/ui/animated-counter.tsx`) — already
  gated on an `IntersectionObserver`, already staggered, already
  reduced-motion aware. Plan 007 adds a `value` prop alongside the existing
  behaviour without changing it.
- **The dock's mobile menu spring-in** (`src/components/ui/floating-dock.tsx`)
  — it plays once per open, is short, and is not a high-frequency control.

---

## Traceability — audit finding to plan

| Audit finding | Plan |
|---|---|
| Dock icons animate `width`/`height` on every pointer move — 24 springs, layout thrash | [001](001-dock-magnify-transform.md) |
| Tooltip replays its enter animation on every hover; enter and exit offsets are asymmetric | [002](002-dock-tooltip-instant.md) |
| The most-pressed controls in the app have no `:active` state; the hero buttons *drop* on press | [003](003-press-feedback.md) |
| Eight cards lift, shadow, and scale their icons on hover while being plain `<div>`s; one promises "Learn more →" and goes nowhere | [004](004-non-interactive-cards.md) |
| No `prefers-reduced-motion` block and three near-identical hand-typed easing curves | [005](005-motion-tokens-and-a11y-gates.md) |
| Carousel has two dead transitions (overridden by an inline style; a conditionally-mounted scrim that can never fade) and three over-long durations | [006](006-carousel-transitions.md) |
| The loading screen's progress number is fictional and every hard load costs a fixed 1.65s | [007](007-loading-screen-real-progress.md) |

---

## After the plans land

Re-run the audit against the new base commit and check the same four
mechanical properties the plans were written against:

```bash
# No layout-animating springs left in the dock
grep -n "widthIcon\|heightIcon\|{ width, height }" src/components/ui/floating-dock.tsx

# No over-broad transitions in the touched components
grep -n "transition-all" src/components/ui/floating-dock.tsx src/components/hero.tsx \
  src/components/stats.tsx src/components/mission.tsx src/components/ui/carousel.tsx

# Every hover transform is pointer-gated (Tailwind v4 does this for `hover:`;
# `group-hover:` is the only escape hatch and there should be none left)
grep -rn "group-hover:" src/

# The easing token exists and is registered
grep -c "ease-strong-out" src/app/globals.css

# The reduced-motion reset is in place
grep -c "prefers-reduced-motion" src/app/globals.css
```

Then re-run the manual feel checks listed in each plan — the mechanical
checks cannot tell you whether the motion *feels* right, and half of what
these plans are fixing is that the motion was technically present but
wrong.
