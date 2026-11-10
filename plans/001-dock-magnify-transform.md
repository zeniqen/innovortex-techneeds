# 001 — Replace the dock's layout-animating magnify with a transform spring

- **Status**: TODO
- **Commit**: fce42b7
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 1 file, ~40 lines changed

## Problem

The floating dock is the site's primary navigation. Every icon in it animates its
`width` and `height` — layout-triggering properties — driven by springs that are
re-targeted on every single `onMouseMove` over the dock.

`src/components/ui/floating-dock.tsx:183-193` — current:

```tsx
  const widthTransform = useTransform(distance, [-150, 0, 150], [40, 70, 40]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 70, 40]);

  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 34, 20]);
  const heightTransformIcon = useTransform(distance, [-150, 0, 150], [20, 34, 20]);

  const width = useSpring(widthTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const height = useSpring(heightTransform, { mass: 0.1, stiffness: 150, damping: 12 });

  const widthIcon = useSpring(widthTransformIcon, { mass: 0.1, stiffness: 150, damping: 12 });
  const heightIcon = useSpring(heightTransformIcon, { mass: 0.1, stiffness: 150, damping: 12 });
```

`src/components/ui/floating-dock.tsx:199-221` — current:

```tsx
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex aspect-square items-center justify-center rounded-full bg-[var(--color-night-white)] border border-[var(--color-spotted-dove)] text-[var(--color-iron-fixture)] transition-colors hover:border-[var(--color-caviar)] hover:text-[var(--color-caviar)]"
      >
        ...
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
      </motion.div>
```

Three problems compound here:

1. **`width`/`height` are layout properties.** Animating them on six elements
   re-runs layout and paint on every frame of the spring, then again when the
   mouse moves. `aspect-square` on the same element is also fighting the
   explicit `width`/`height` — `aspect-ratio` and both dimensions cannot
   coexist cleanly, and the explicit dimensions silently win.

2. **Twenty-four springs.** Each of the six icons owns four independent
   `useSpring` instances (width, height, iconWidth, iconHeight) that all
   subscribe to the same `distance` motion value. Twenty-four springs chasing
   one pointer is a lot of machinery for a magnify effect.

3. **The magnify itself has no purpose.** The dock reflects no active-route
   state, so this is pure decoration on the element the user touches most.
   The playbook's guidance for frequently-hovered elements is "remove or
   drastically reduce."

The magnify is also the *only* thing making the dock feel alive, so it should
not simply be deleted — it should be made cheap and should carry information
instead of just moving.

## Target

One spring per icon, driving a **`transform: scale()`**, so the browser
composites instead of laying out. The icon's visual size follows the parent's
scale for free, so the second pair of springs disappears entirely.

Additionally, make the magnify *mean* something: the icon nearest the cursor
scales up, and the dock's active route is marked.

Exact target values:

```tsx
// one spring per icon, from the pointer distance
const scaleTransform = useTransform(distance, [-150, 0, 150], [1, 1.15, 1]);
const scale = useSpring(scaleTransform, {
  type: "spring",
  duration: 0.5,
  bounce: 0.2,
});
```

Applied as:

```tsx
<motion.div
  ref={ref}
  style={{ scale }}
  className="relative flex aspect-square w-10 items-center justify-center rounded-full bg-[var(--color-night-white)] border border-[var(--color-spotted-dove)] text-[var(--color-iron-fixture)] transition-colors hover:border-[var(--color-caviar)] hover:text-[var(--color-caviar)]"
>
```

Because the slot is now a fixed `w-10` (40px) and the growth is a transform,
the layout never changes: siblings stay put and the scaled icon overlaps them
slightly, which is the correct macOS-dock behaviour.

The icon wrapper keeps a fixed size and inherits the parent's scale:

```tsx
<div className="flex size-5 items-center justify-center">{icon}</div>
```

(`size-5` = 20px, matching the current resting icon size.)

### Interaction with plan 003 (press feedback)

Motion writes the `scale` transform as an **inline style** on the circle.
A CSS class such as `active:scale-[0.97]` on that same element would be
**silently overridden** by the inline style and the press feedback would
never fire.

So the circle's transform is owned exclusively by this plan, and plan 003
puts the dock's press feedback on the **`DockItemLink` wrapper** — the
`<a>` / `<button>` around the circle — with `inline-flex` so the transform
applies to what is otherwise an inline anchor. The two transforms are on
nested elements, so they compose rather than fight:

```
<button class="inline-flex active:scale-[0.97]">   <- press, from plan 003
  <motion.div style="scale: 1.15">                  <- magnify, from this plan
```

**Do not add `active:scale-*` to the circle's className in this plan.**

## Repo conventions to follow

- Motion is imported from `"motion/react"` — see
  `src/components/ui/3d-marquee.tsx:4`.
- Spring config style: the codebase currently uses physics params
  (`{ mass: 0.1, stiffness: 150, damping: 12 }`) in
  `src/components/ui/floating-dock.tsx:189-193`. The playbook recommends the
  Apple-style duration form. **Adopt the duration form for the new springs**
  and leave existing physics-form springs elsewhere untouched.
- Sizes use Tailwind's `size-*` / `w-*` utilities; the palette is referenced
  through `var(--color-*)` tokens, never raw hex — see
  `src/components/ui/floating-dock.tsx:204`.
- The dock's icon buttons are `h-11 w-11` on mobile (`:73`) and `w-10 h-10`
  on desktop in the original Aceternity source; the current desktop icon is
  sized by the springs, so after this change it needs an explicit size.

## Steps

1. In `src/components/ui/floating-dock.tsx`, inside `IconContainer`
   (starts at line 169), delete the four `useTransform` calls
   (`:183-187`) and the four `useSpring` calls (`:189-193`).

2. Replace them with a single transform-driven pair:

```tsx
  const scaleTransform = useTransform(distance, [-150, 0, 150], [1, 1.15, 1]);
  const scale = useSpring(scaleTransform, {
    type: "spring",
    duration: 0.5,
    bounce: 0.2,
  });
```

3. Change the outer `motion.div` (`:199-205`) from `style={{ width, height }}`
   to `style={{ scale }}`, and give it a fixed size so the layout is stable:

```tsx
      <motion.div
        ref={ref}
        style={{ scale }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex aspect-square w-10 items-center justify-center rounded-full bg-[var(--color-night-white)] border border-[var(--color-spotted-dove)] text-[var(--color-iron-fixture)] transition-colors hover:border-[var(--color-caviar)] hover:text-[var(--color-caviar)]"
      >
```

   Note `w-10` (40px) is the current resting size (`[40, 70, 40]` resting
   value), so the resting appearance is unchanged.

4. Replace the inner animated `motion.div` (`:218-221`) with a plain fixed-size
   wrapper — it no longer needs to animate, because the parent's `scale`
   handles it:

```tsx
        <div className="flex size-5 items-center justify-center">{icon}</div>
```

   `size-5` = 20px, matching the current resting icon size
   (`[20, 34, 20]` resting value).

5. Verify no other reference to `width`, `height`, `widthIcon`, or
   `heightIcon` remains in this file:
   `grep -n "widthIcon\|heightIcon\|{ width, height }" src/components/ui/floating-dock.tsx`
   — expect no output.

6. Do **not** touch the mobile dock (`FloatingDockMobile`, starts at line 42).
   It has no magnify and is out of scope for this plan.

## Boundaries

- Do NOT touch `src/components/floating-dock-demo.tsx` — the item list is
  unchanged by this plan.
- Do NOT change the tooltip animation. That is plan 002.
- Do NOT change the dock's colours, item order, or item hrefs.
- Do NOT add `active:scale-*` or any other CSS transform utility to the
  circle's `className` — Motion's inline `scale` would override it. The
  dock's press feedback is plan 003's job, and it belongs on the
  `DockItemLink` wrapper.
- Do NOT add or change a `className` on the `DockItemLink` call at
  `src/components/ui/floating-dock.tsx:198`. Plan 003 adds it; if 003 has
  already run, leave that `className` untouched and keep only the inner
  circle's changes.
- Do NOT add dependencies. `motion` is already installed.
- Do NOT modify `src/components/ui/animated-counter.tsx`,
  `src/components/ui/3d-marquee.tsx`, or `src/components/ui/carousel.tsx`.
- If a step doesn't match the code you find (drift since the commit stamp),
  match on the **code**, not the line number; if the code itself differs
  from what is quoted here, STOP and report instead of improvising.

## Verification

- **Mechanical**:
  - `npx tsc --noEmit` — expect no errors.
  - `npx eslint src/components/ui/floating-dock.tsx` — expect no errors.
  - `npm run build` — expect "Compiled successfully".
  - `grep -n "widthIcon\|heightIcon\|{ width, height }" src/components/ui/floating-dock.tsx`
    — expect no output.

- **Feel check**: run `npm run dev`, open the site, and move the cursor
  slowly across the bottom dock.
  - The nearest icon grows to roughly 1.15× and its neighbours stay
    physically still — the row must NOT reflow or push siblings sideways.
  - The growth is a compositor animation: it must stay smooth while the page
    is scrolling behind it.
  - Moving the cursor away makes the icon settle back with a faint, single
    overshoot (bounce 0.2) — not a wobble.
  - In DevTools, open the Animations panel and confirm the element animates
    `transform`, not `width`/`height`. Confirm the computed `width` of the
    icon button stays `40px` throughout.
  - Toggle `prefers-reduced-motion: reduce` (Rendering panel) and confirm the
    magnify stops moving but the icon remains visible and the tooltip still
    appears.

- **Done when**: the dock icons grow via `transform` only, the row never
  reflows, `grep` finds no `widthIcon`/`heightIcon`/`{ width, height }`, and
  the build, typecheck, and lint all pass.

```
