# 002 — Make the dock tooltip instant after the first open, and symmetric

- **Status**: TODO
- **Commit**: fce42b7
- **Severity**: HIGH
- **Category**: Purpose & frequency
- **Estimated scope**: 1 file, ~25 lines changed

## Problem

The floating dock is the site's primary navigation and the most-hovered
element in the app. Its tooltip currently re-animates from scratch on every
single hover, with no delay and no "first time only" behaviour.

`src/components/ui/floating-dock.tsx:206-216` — current:

```tsx
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="absolute -top-9 left-1/2 w-fit rounded-lg border border-[var(--color-spotted-dove)] bg-[var(--color-caviar)] px-2.5 py-1 text-xs font-medium whitespace-pre text-[var(--color-emptiness)] shadow-md"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
```

Four problems:

1. **It replays on every hover.** The tooltip unmounts on mouse-leave and
   remounts on mouse-enter, so the enter animation plays again each time.
   Sweeping the cursor across the six dock icons fires six full enter/exit
   cycles in about a second. The dock is used many times a day, so this is
   the "tens of times/day" tier, where the playbook's guidance is to remove or
   drastically reduce the motion. The specific remedy named in the playbook is:
   *after the first tooltip, they should be instant.*

2. **No delay, and the exit is not symmetric.** The tooltip enters from
   `y: 10` but exits to `y: 2` — it retreats 2px instead of returning to
   the 10px it came from. The motion is not reversible: the same interaction
   produces two different paths depending on direction.

3. **No `transition` prop, so Motion's defaults apply.** From
   `node_modules/motion-dom/dist/es/animation/utils/default-transitions.mjs`,
   `opacity` falls back to a 0.3s keyframes tween while `y` falls back to an
   under-damped spring (`stiffness: 500, damping: 25`). The two properties
   therefore finish at different times — the tooltip is fully opaque before it
   has stopped moving.

4. **The tooltip is the only thing that identifies each icon**, and it is
   also the thing making the dock feel laggy.

## Target

- **First** open of the session: the tooltip animates in (200ms, strong
  ease-out).
- **Every** subsequent open: the tooltip appears instantly, no enter
  animation.
- Exit: symmetric with enter — the tooltip returns to the same offset it
  came from, and does so fast (100ms).

Exact target values:

```tsx
  const [hovered, setHovered] = useState(false);
  // The tooltip animates in once per session; after that it appears
  // instantly, because the dock is hovered constantly.
  const [hasAnimatedTooltip, setHasAnimatedTooltip] = useState(false);
```

Enter:

```tsx
              initial={hasAnimatedTooltip ? false : { opacity: 0, y: 8, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 8, x: "-50%" }}
              transition={{ duration: hasAnimatedTooltip ? 0 : 0.2, ease: [0.23, 1, 0.32, 1] }}
```

Notes on the exact numbers:
- `y: 8` on enter and exit — symmetric, and a smaller travel distance than
  the current `10` in / `2` out mismatch.
- `duration: 0.2` (200ms) for the animated open — inside the playbook's
  125–200ms tooltip budget.
- `duration: 0` for subsequent opens — the tooltip is simply present.
- `ease: [0.23, 1, 0.32, 1]` — the strong ease-out already used in this
  codebase (`src/components/loading-screen.tsx:15` defines it as
  `EASE_OUT`). Prefer
  importing the shared constant if one is reachable; otherwise inline the same
  array.

## Repo conventions to follow

- The strong ease-out curve `cubic-bezier(0.23, 1, 0.32, 1)` is already the
  codebase's convention for deliberate motion:
  - `src/components/loading-screen.tsx:15` — `const EASE_OUT = [0.23, 1, 0.32, 1] as const;`
  - `src/components/loading-screen.tsx:15` — `const EASE_OUT = [0.23, 1, 0.32, 1] as const;`
- Motion imports come from `"motion/react"` — `src/components/ui/floating-dock.tsx:4-12`.
- Motion state (`useState`) is already imported in this file — `src/components/ui/floating-dock.tsx:14`.

## Steps

1. In `src/components/ui/floating-dock.tsx`, inside `IconContainer` (starts at
   line 169), add a second piece of state next to the existing `hovered` state
   (`:195`):

```tsx
  const [hovered, setHovered] = useState(false);
  // The tooltip animates in once per session; after that it appears
  // instantly, because the dock is hovered constantly.
  const [hasAnimatedTooltip, setHasAnimatedTooltip] = useState(false);
```

2. In the `onMouseEnter` handler on the outer `motion.div` (`:202`), flip the
   flag after the first hover so only the first open animates:

```tsx
        onMouseEnter={() => {
          setHovered(true);
          setHasAnimatedTooltip(true);
        }}
```

   Because `hasAnimatedTooltip` is set on the same event that sets `hovered`,
   the very first open still animates: the tooltip mounts with
   `initial={{ opacity: 0, y: 8, x: "-50%" }}` on the first render, and the
   flag only affects renders *after* that.

3. Replace the tooltip's `motion.div` props (`:208-211`) with the symmetric,
   instant-after-first versions:

```tsx
            <motion.div
              initial={hasAnimatedTooltip ? false : { opacity: 0, y: 8, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 8, x: "-50%" }}
              transition={{
                duration: hasAnimatedTooltip ? 0 : 0.2,
                ease: [0.23, 1, 0.32, 1],
              }}
              className="absolute -top-9 left-1/2 w-fit rounded-lg border border-[var(--color-spotted-dove)] bg-[var(--color-caviar)] px-2.5 py-1 text-xs font-medium whitespace-pre text-[var(--color-emptiness)] shadow-md"
            >
```

   `initial={false}` means "do not animate on mount, start at the `animate`
   values" — which is exactly the instant behaviour we want after the first
   open.

4. Confirm the `AnimatePresence` wrapper (`:206`) and the `hovered` condition
   are unchanged. The exit still needs the `AnimatePresence` to fire, and
   with `duration: 0` on later closes it disappears immediately.

   Note: because the same `transition` object governs both enter and exit,
   the exit after the first open also uses `duration: 0` — the tooltip
   vanishes instantly on close. That is correct for a high-frequency
   control: the user already knows what the icon says.

   If you prefer the exit to always be a short fade, give the exit its own
   transition by moving the tooltip into its own `motion.div` wrapper with a
   dedicated `transition` prop — but the simpler form above is the target.

## Boundaries

- Do NOT change the dock's magnify spring. That is plan 001.
- Do NOT add a hover delay. The tooltip should appear immediately on hover;
  the fix is to remove the *replay*, not to add latency.
- Do NOT change the tooltip's colours, position (`-top-9 left-1/2`), or text.
- Do NOT touch `src/components/floating-dock-demo.tsx`.
- Do NOT add dependencies.
- If a step doesn't match the code you find (drift since the commit stamp),
  match on the **code**, not the line number; if the code itself differs
  from what is quoted here, STOP and report instead of improvising.

## Verification

- **Mechanical**:
  - `npx tsc --noEmit` — expect no errors.
  - `npx eslint src/components/ui/floating-dock.tsx` — expect no errors.
  - `npm run build` — expect "Compiled successfully".

- **Feel check**: run `npm run dev`, open the site, hover the bottom dock.
  - The **first** tooltip fades and rises into place over ~200ms.
  - Every **subsequent** tooltip appears instantly — no fade, no slide, on any
    of the six icons.
  - Sweeping the cursor across all six icons produces no cascade of
    animations; only one tooltip is ever visible, and it appears at once.
  - The tooltip leaves by the same route it arrived on (same 8px offset), and
    after the first open it leaves instantly.
  - In DevTools, Animations panel: confirm the tooltip's animation duration
    reads `200ms` on first open and `0ms` afterwards.
  - Toggle `prefers-reduced-motion: reduce` (Rendering panel) and confirm the
    tooltip still appears and remains legible (opacity feedback retained).

- **Done when**: first hover animates, all later hovers are instant, the
  enter/exit offsets match, and typecheck, lint, and build pass.

```
