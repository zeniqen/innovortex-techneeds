# 007 — Make the loading screen report real progress and stop forcing a wait

- **Status**: TODO
- **Commit**: fce42b7
- **Severity**: MEDIUM
- **Category**: Purpose & frequency
- **Estimated scope**: 2 files, ~90 lines changed

## Problem

The loading overlay is the first thing every visitor sees, and every number it
shows is invented.

`src/components/loading-screen.tsx:25` — current:

```tsx
  const [assetsReady, setAssetsReady] = useState(false);
```

`src/components/loading-screen.tsx:126-142` — the counter:

```tsx
            {/* Percentage counter — the count only runs once assets are ready */}
            <div className="flex items-end gap-1">
              <Counter
                end={100}
                duration={COUNT_DURATION}
                active={assetsReady}
                fontSize={72}
                suffix={
                  <span className="text-2xl font-semibold text-[var(--color-stone-haze)]">
                    %
                  </span>
                }
                className="text-[var(--color-caviar)]"
                onComplete={handleComplete}
                onValueChange={handleValueChange}
              />
            </div>
```

`src/components/loading-screen.tsx:9-13` — the timings:

```tsx
const COUNT_DURATION = 1.2;
const EXIT_DURATION = 0.45;
const MAX_WAIT_MS = 6000;
```

Three distinct defects:

1. **The progress number is fictional.** The counter is gated on `assetsReady`
   (the `window.load` event) and then ramps 0 → 100 over a fixed
   `COUNT_DURATION = 1.2` seconds. Nothing about that ramp corresponds to
   anything that is happening. If the page loaded in 80ms, the overlay still
   shows `0%` for a second and a half — it reports *zero* progress while the
   page is in fact completely ready. If the page takes 4 seconds to load, the
   counter is still parked at `0%` for those 4 seconds, because the count has
   not started yet. It is wrong in both directions.

2. **The wait is not negotiable.** Because the count always takes exactly
   1.2s and the exit always takes 0.45s, *every* hard load costs at least
   **1.65 seconds**, no matter how fast the connection is. A visitor on
   fibre and a visitor on a congested phone network pay the same tax. The
   1.2s is pure padding.

3. **The status line is meaningless.** `src/components/loading-screen.tsx:158`:

   ```tsx
   {assetsReady ? "Loading community" : "Preparing your experience"}
   ```

   Neither string describes anything that is being loaded. There is no
   "community" being loaded, and "preparing your experience" is what every
   loading screen says.

There is also a smaller honesty problem in the ordering: `window.load` waits
for *every* resource, including images far below the fold, before the counter
so much as starts. The user's first impression is therefore a frozen `0%`.

## Target

The overlay should:

- Report **real** progress — a number that only reaches 100 when the page is
  genuinely ready, and that moves in step with actual loading milestones.
- **Not** impose a fixed delay — the overlay should dismiss as soon as the
  page is ready, with a short floor so it never flashes in and straight out.
- Describe what is actually happening in the status line.

### Real milestones

Three signals, each genuinely observable:

| Milestone | Signal | Share |
|---|---|---|
| `content` | The app shell has painted (one animation frame after mount) | 40 |
| `fonts` | `document.fonts.ready` has resolved | 25 |
| `assets` | `window.load` has fired | 35 |

The progress ceiling is the sum of the shares of the milestones that have
actually completed, so **100 is only ever displayed when the page is
genuinely ready**. The shares are a design choice, not a measurement — they
say "how much of the wait is probably over", which is what a progress bar
can honestly claim.

### Adaptive progress

The displayed number eases toward the ceiling. When a new milestone lands,
the bar tweens from where it is to the new ceiling over 350ms; it never
overshoots and never stalls below a ceiling that has already been reached.

The number shown is the *same* value that drives the thin progress track
underneath, so the two can never disagree.

### No forced wait

The overlay is dismissed as soon as the progress reaches 100 — with a
**600ms floor** on how long it stays up. The floor exists so a fast load
does not produce a jarring flash of overlay; it is the only fixed delay left,
and it is 600ms rather than 1650ms.

The 6-second failsafe is kept: if `window.load` somehow never fires, the
`assets` milestone is forced at 6s and the overlay lets the user in.

### `Counter` gains an externally-controlled mode

The existing `Counter` animates `start` → `end` itself and cannot express
"the target is whatever the app decides at any moment". Add an optional
`value` prop. When it is supplied, the counter renders that value directly
and the digits still roll. The prop is **additive** — `src/components/stats.tsx`
and `src/components/animated-counter-demo.tsx` keep their current behaviour
untouched.

### Honest status line

```tsx
{!done.content
  ? "Starting up"
  : !done.fonts
    ? "Loading fonts"
    : !done.assets
      ? "Loading assets"
      : "Ready"}
```

Each string names something that is genuinely in flight, and the final one is
only shown once it is true.

## Repo conventions to follow

- Motion is imported from `"motion/react"` — `src/components/loading-screen.tsx:5`.
- The strong ease-out curve is the codebase convention:
  `src/components/loading-screen.tsx:15` defines `EASE_OUT = [0.23, 1, 0.32, 1]`.
- Palette is referenced through `var(--color-*)` tokens only — never raw hex.
- `src/components/ui/animated-counter.tsx` exports `Counter` and takes props
  through an explicit `CounterProps` interface (`:65-90`); add the new prop
  there with a doc comment matching the file's style.
- State lives in the component; the file already uses `useRef` for values
  that must not trigger re-renders (`previousOverflow` at `:57`).
- The `Counter` digits already animate per-digit through a `useSpring`
  (`src/components/ui/animated-counter.tsx:231`), so an externally supplied
  value still produces a rolling number — no extra work needed.

## Steps

### Step 1 — `src/components/ui/animated-counter.tsx`: add the `value` prop

Add to the `CounterProps` interface, after `active` (`:78`):

```tsx
  /**
   * External control. When supplied, the counter renders this value instead
   * of animating `start` -> `end` itself. The digits still roll.
   */
  value?: number;
```

In the destructuring (`:91-105`), rename the incoming prop so it does not
collide with the local `value` variable:

```tsx
export const Counter = ({
  start = 0,
  end,
  duration = end,
  className,
  fontSize,
  active = true,
  delay = 0,
  separator,
  suffix,
  onComplete,
  onValueChange,
  value: controlledValue,
  style,
  ...rest
}: CounterProps) => {
```

Change the `animates` computation and the `value` resolution (`:121-126`):

```tsx
  // An externally supplied value takes over completely: there is no
  // internal animation to run.
  const isControlled = controlledValue !== undefined;

  const animates = !isControlled && active && end > start && !reducedMotion;

  // Only holds a value while the count is actually running.
  const [countValue, setCountValue] = useState<number | null>(null);

  const value = isControlled
    ? controlledValue
    : animates
      ? (countValue ?? start)
      : active
        ? end
        : start;
```

Nothing else in the file changes. The existing animation effect
(`:128-162`) returns early because `animates` is now `false` in controlled
mode, but it still sets `startedRef.current = true` (`:132`), which is what
the `onComplete` effect (`:169-173`) requires — so `onComplete` still fires
when the controlled value reaches `end`.

Verify: `src/components/stats.tsx:111` and
`src/components/animated-counter-demo.tsx:6` do not pass `value`, so their
behaviour is unchanged.

### Step 2 — `src/components/loading-screen.tsx`: replace the progress engine

Replace the constants block (`:8-15`) with:

```tsx
/** How long the overlay takes to fade out. */
const EXIT_DURATION = 0.3;
/** Never hold the page hostage longer than this. */
const MAX_WAIT_MS = 6000;
/**
 * Minimum time the overlay stays on screen. The page is usually ready well
 * before this; the floor exists so the overlay does not flash in and out.
 */
const MIN_VISIBLE_MS = 600;
/** How long the progress bar takes to ease to a new value. */
const TWEEN_MS = 350;

/**
 * Real loading milestones and the share of the progress bar each one
 * accounts for. The shares add up to 100, and the bar only reaches 100 once
 * every milestone has actually completed.
 */
const MILESTONE_WEIGHTS = {
  content: 40,
  fonts: 25,
  assets: 35,
} as const;

type Milestone = keyof typeof MILESTONE_WEIGHTS;

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
```

Replace the `assetsReady` / `progress` state (`:25-26`) with milestone
tracking and the eased progress value:

```tsx
  const [done, setDone] = useState<Record<Milestone, boolean>>({
    content: false,
    fonts: false,
    assets: false,
  });
  // The eased value shown by the counter and the progress track.
  const [progress, setProgress] = useState(0);

  // Guards against a milestone being counted twice.
  const doneRef = useRef<Set<Milestone>>(new Set());
  // The current eased value, so a new tween starts from where the last one
  // got to instead of jumping back to 0.
  const progressRef = useRef(0);
  // When the overlay mounted, for the minimum-visible floor.
  const mountedAtRef = useRef(0);
```

Add the milestone helper and the milestone effects, replacing the current
`assetsReady` effect (`:31-52`):

```tsx
  const markComplete = useCallback((name: Milestone) => {
    if (doneRef.current.has(name)) return;
    doneRef.current.add(name);
    setDone((current) => ({ ...current, [name]: true }));
  }, []);

  // The app shell has painted. One frame is enough — the point is to know
  // something is on screen, not that it is final.
  useEffect(() => {
    const frame = requestAnimationFrame(() => markComplete("content"));
    return () => cancelAnimationFrame(frame);
  }, [markComplete]);

  // The web fonts in use have loaded, so the page will not reflow later.
  useEffect(() => {
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) markComplete("fonts");
    });
    return () => {
      cancelled = true;
    };
  }, [markComplete]);

  // Every image and stylesheet is in.
  useEffect(() => {
    let cancelled = false;

    const markReady = () => {
      if (!cancelled) markComplete("assets");
    };

    if (document.readyState === "complete") {
      markReady();
    } else {
      window.addEventListener("load", markReady, { once: true });
    }

    // Safety valve: never trap the user behind the overlay.
    const failsafe = setTimeout(markReady, MAX_WAIT_MS);

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
      window.removeEventListener("load", markReady);
    };
  }, [markComplete]);
```

Compute the ceiling from the milestones, and add the tween that eases the
displayed progress toward it. Place this after the effects above:

```tsx
  // The real progress ceiling: the sum of the shares of the milestones that
  // have actually completed.
  const ceiling =
    (done.content ? MILESTONE_WEIGHTS.content : 0) +
    (done.fonts ? MILESTONE_WEIGHTS.fonts : 0) +
    (done.assets ? MILESTONE_WEIGHTS.assets : 0);

  // Ease the displayed progress toward the ceiling. Each new ceiling value
  // starts a fresh tween, so the bar always moves smoothly and never past
  // the truth.
  useEffect(() => {
    const from = progressRef.current;
    if (from >= ceiling) return;

    let frame = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - startedAt) / TWEEN_MS, 1);
      // Ease-out cubic.
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (ceiling - from) * eased;
      progressRef.current = next;
      setProgress(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ceiling]);
```

Add the mount timestamp for the floor, next to the scroll-lock effect
(after `:67`):

```tsx
  // Remember when the overlay appeared, so the minimum-visible floor is
  // measured from the right moment.
  useEffect(() => {
    mountedAtRef.current = performance.now();
  }, []);
```

Replace `handleComplete` (`:73-75`) with a version that honours the floor:

```tsx
  const handleComplete = useCallback(() => {
    // Hold the overlay briefly so it never flashes in and straight out.
    const elapsed = performance.now() - mountedAtRef.current;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

    if (remaining === 0) {
      setMounted(false);
      return;
    }

    const timer = setTimeout(() => setMounted(false), remaining);
    dismissTimerRef.current = timer;
  }, []);
```

Declare `dismissTimerRef` alongside the other refs:

```tsx
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

Clear it when the component unmounts — add to the scroll-lock effect's
cleanup, or as its own effect:

```tsx
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current !== null) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);
```

### Step 3 — wire the counter to the eased progress

Replace the `Counter` block (`:127-142`):

```tsx
            <div className="flex items-end gap-1">
              <Counter
                end={100}
                value={progress}
                fontSize={72}
                suffix={
                  <span className="text-2xl font-semibold text-[var(--color-stone-haze)]">
                    %
                  </span>
                }
                className="text-[var(--color-caviar)]"
                onComplete={handleComplete}
              />
            </div>
```

Note the changes: `duration` and `active` are gone (the counter no longer
runs its own animation), `value={progress}` drives it, and `onValueChange` is
removed because the parent already knows the value.

Remove the now-unused `handleValueChange` callback (`:77-79`).

### Step 4 — honest status line

Replace the status text (`:158`):

```tsx
              {!done.content
                ? "Starting up"
                : !done.fonts
                  ? "Loading fonts"
                  : !done.assets
                    ? "Loading assets"
                    : "Ready"}
```

### Step 5 — verify nothing is left over

```
grep -n "assetsReady\|handleValueChange\|COUNT_DURATION" src/components/loading-screen.tsx
```

Expect no output.

```
grep -n "duration=\|active=" src/components/loading-screen.tsx
```

Expect no output — the counter is externally driven now.

## Boundaries

- Do NOT change `src/components/ui/animated-counter.tsx` beyond the `value`
  prop. The `Counter`'s existing internal animation, its digit-roll spring,
  and its `start`/`end`/`duration`/`active`/`delay` behaviour must stay
  exactly as they are — `src/components/stats.tsx` depends on them.
- Do NOT change `src/app/layout.tsx`. The overlay belongs in the layout so
  it plays once per hard load and never on client-side navigation.
- Do NOT change the overlay's colours, the logo, the counter's font size
  (`fontSize={72}`), the suffix, or the layout of the overlay.
- Do NOT remove the `MAX_WAIT_MS` failsafe, and do NOT raise it.
- Do NOT add dependencies.
- Do NOT touch the scroll lock or the `AnimatePresence` exit — those work.
- If a step doesn't match the code you find (drift since the commit stamp),
  match on the **code**, not the line number; if the code itself differs
  from what is quoted here, STOP and report instead of improvising.

## Verification

- **Mechanical**:
  - `npx tsc --noEmit` — expect no errors.
  - `npx eslint src/components/loading-screen.tsx src/components/ui/animated-counter.tsx`
    — expect no errors.
  - `npm run build` — expect "Compiled successfully".
  - `grep -n "assetsReady\|handleValueChange\|COUNT_DURATION" src/components/loading-screen.tsx`
    — expect no output.

- **Feel check**: run `npm run dev` and hard-reload (`Cmd+Shift+R`).
  - The counter must **never** sit at `0%` for long. It should start moving
    within a frame or two and reach `100%` only when the page is genuinely
    ready.
  - On a fast local load the overlay should be gone in roughly **1 second**
    (600ms floor + 300ms fade) — noticeably quicker than the current
    1.65s+.
  - On a throttled connection (DevTools → Network → Slow 3G), the number
    should climb in visible steps as `content` → `fonts` → `assets` land, and
    should reach `100%` at the moment the page actually finishes loading —
    not before.
  - The status line should read "Starting up", then "Loading fonts", then
    "Loading assets", then "Ready" — never "Loading community".
  - The thin track under the number must agree with the number at all times.
  - Moving the mouse over the digits must still roll them (the per-digit
    spring), not snap.
  - Hard-reload to `/faq` — the overlay must play once and then never again
    when navigating back to `/` (the layout persists).
  - Toggle `prefers-reduced-motion: reduce`: the counter must still reach
    100% and the overlay must still dismiss. (Reduced motion does not remove
    the wait — it only removes the movement.)
  - Confirm the stats counters on the landing page are unaffected: they still
    count up on scroll-in with their existing stagger, and they are not
    externally controlled.

- **Done when**: the progress number reflects real milestones, the overlay
  no longer costs a fixed 1.65s, `grep` finds none of the removed
  identifiers, the stats counters still work, and typecheck, lint, and build
  pass.

```
