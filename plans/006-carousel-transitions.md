# 006 — Fix the carousel's dead transitions and over-long crossfades

- **Status**: TODO
- **Commit**: fce42b7
- **Severity**: MEDIUM
- **Category**: Easing & duration
- **Estimated scope**: 1 file, ~14 lines changed

## Problem

The carousel (the "Our Mentorship Cohorts" 3D section) contains five
transition declarations that do not work as written, and four that exceed
the UI duration budget.

`src/components/ui/carousel.tsx:71` — current:

```tsx
        className="flex flex-1 flex-col items-center justify-center relative text-center text-white opacity-100 transition-all duration-300 ease-in-out w-[70vmin] h-[70vmin] mx-[4vmin] z-10 "
```

`src/components/ui/carousel.tsx:76-82` — current:

```tsx
        style={{
          transform:
            current !== index
              ? "scale(0.98) rotateX(8deg)"
              : "scale(1) rotateX(0deg)",
          transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          transformOrigin: "bottom",
        }}
```

`src/components/ui/carousel.tsx:104-106` — current:

```tsx
          {current === index && (
            <div className="absolute inset-0 bg-black/30 transition-all duration-1000" />
          )}
```

Five distinct defects:

1. **Line 71's transition is dead.** The inline `style` at line 80 sets
   `transition`, and an inline style overrides a class-based `transition-all`
   entirely. The declared `duration-300 ease-in-out` never applies. The
   effective duration is **500ms** for a click-driven slide change — over the
   300ms UI ceiling — on the weak built-in curve
   `cubic-bezier(0.4, 0, 0.2, 1)`, while the codebase's own strong curve
   `cubic-bezier(0.23, 1, 0.32, 1)` is used everywhere else. The two are not
   even internally consistent.

2. **Line 105's transition is dead.** The overlay is *conditionally
   mounted* — `{current === index && ...}` — so it is born at its final state
   and never transitions. The author clearly wanted the dark scrim to fade in
   over the outgoing slide; instead it appears instantly.

3. **Line 105's `duration-1000` is 1000ms**, longer than every row in the
   playbook's duration table except "Marketing / explanatory", applied to a
   carousel scrim on a UI element.

4. **Line 183's row slide is 1000ms.** The `<ul>` that carries the whole row
   translates horizontally when the current slide changes:

   ```tsx
        className="absolute flex mx-[-4vmin] transition-transform duration-1000 ease-in-out"
   ```

   This is a click-driven selection change, and it is meant to feel like one
   continuous move with the per-slide transform at line 80. At 1000ms it
   instead glides for a full second while the slide itself has already
   settled at 500ms — the row and the slide visibly desynchronise.

5. **Line 94's image fade is 600ms**, and it uses the weak `ease-in-out`
   while the slide above it uses a different curve at a different duration.
   Three properties of the same slide change on three different timelines.

The `transition-all` on lines 71 and 85 also arm every property, including
layout ones, on an element that repaints on every pointer move.

## Target

- One source of truth for the slide transition: the inline `style`, with the
  dead class removed.
- The row slide, the slide transform, and the image fade all run on **the
  same 250ms timeline with the same curve**, so the whole slide change reads
  as one move.
- The dark scrim always mounted and actually crossfaded.
- Durations inside the 300ms UI budget.
- The strong ease-out curve, matching the rest of the codebase.

Exact target values.

### The slide transform — `src/components/ui/carousel.tsx:76-82`

```tsx
        style={{
          transform:
            current !== index
              ? "scale(0.98) rotateX(8deg)"
              : "scale(1) rotateX(0deg)",
          transition: "transform 250ms cubic-bezier(0.23, 1, 0.32, 1)",
          transformOrigin: "bottom",
        }}
```

250ms is inside the 150–250ms band the playbook gives dropdowns/selects and
just under the 300ms UI ceiling, for a click-driven selection change.

### The dead class — `src/components/ui/carousel.tsx:71`

Remove the dead transition utilities, keeping the layout utilities:

```tsx
        className="flex flex-1 flex-col items-center justify-center relative text-center text-white opacity-100 w-[70vmin] h-[70vmin] mx-[4vmin] z-10 "
```

(`transition-all duration-300 ease-in-out` removed entirely — the inline
`style` above owns the transition.)

### The image wrapper — `src/components/ui/carousel.tsx:85`

```tsx
          className="absolute top-0 left-0 w-full h-full bg-[#1D1F2F] rounded-[1%] overflow-hidden transition-transform duration-150 ease-strong-out"
```

`transition-all` becomes `transition-transform` — it animates the mouse
parallax `translate3d` transform, so only the transform needs to transition.
Its `duration-150` is fine; its `ease-out` is the built-in
`cubic-bezier(0, 0, 0.2, 1)`, changed to the strong curve for consistency.

### The slide image opacity — `src/components/ui/carousel.tsx:94`

```tsx
            className="absolute inset-0 w-[120%] h-[120%] object-cover opacity-100 transition-opacity duration-250 ease-strong-out"
```

600ms → 250ms, and onto the same curve and timeline as the slide transform
above it. The image now fades in step with the slide instead of trailing it.

### The dark scrim — `src/components/ui/carousel.tsx:104-106`

Always mount it and crossfade it:

```tsx
          <div
            className="absolute inset-0 bg-black/30 transition-opacity duration-250 ease-strong-out"
            style={{ opacity: current === index ? 1 : 0 }}
          />
```

`opacity` is a compositor-friendly property, so this crossfade is cheap.
250ms keeps it in step with the slide rather than trailing it by a second.

### The slide title block — `src/components/ui/carousel.tsx:109-112`

```tsx
        <article
          className={`relative p-[4vmin] transition-opacity duration-250 ease-strong-out ${
            current === index ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        >
```

The `visible`/`invisible` classes toggle `visibility` instantly, which is
what keeps the inactive slide's button from being focusable — **keep them**.

### The row slide — `src/components/ui/carousel.tsx:183`

```tsx
        className="absolute flex mx-[-4vmin] transition-transform duration-250 ease-strong-out"
```

1000ms → 250ms, and onto the same curve. This is the single most important
fix in the plan: it is what makes the row and the slides move together.

### The slide button — `src/components/ui/carousel.tsx:118`

```tsx
            <button className="mt-6  px-4 py-2 w-fit mx-auto sm:text-sm text-black bg-white h-12 border border-transparent text-xs flex justify-center items-center rounded-2xl hover:shadow-lg transition-shadow duration-200 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]">
```

The bare `transition` class is `transition-property: all`. Only the shadow
changes on hover, so it becomes `transition-shadow`.

### The carousel arrows — `src/components/ui/carousel.tsx:141`

```tsx
        className={`w-10 h-10 flex items-center mx-2 justify-center bg-neutral-200 dark:bg-neutral-800 border-3 border-transparent rounded-full focus:border-[#6D64F7] focus:outline-none hover:-translate-y-0.5 active:translate-y-0.5 transition-transform duration-200 ${
```

The bare `transition` becomes `transition-transform`. Note the
`active:translate-y-0.5` here is **correct** press feedback — it moves the
button *down* by 2px while held, which is the opposite of the hero buttons'
`active:translate-y-0` problem (plan 003). Leave it alone.

## Repo conventions to follow

- The strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)` is the codebase's
  convention for deliberate motion:
  - `src/components/loading-screen.tsx:15` — `const EASE_OUT = [0.23, 1, 0.32, 1] as const;`
  - `src/components/loading-screen.tsx:15` — `const EASE_OUT = [0.23, 1, 0.32, 1] as const;`
- `transition-transform` is already used elsewhere in the codebase —
  `src/components/mission.tsx:99` uses `transition-transform`.
- The shared easing token `ease-strong-out` is registered by **plan 005** in
  `src/app/globals.css`. Verified against the installed Tailwind 4.3.5: it
  compiles to `transition-timing-function: var(--ease-strong-out)`, and
  `transition-shadow` emits a real `transition-property: box-shadow` rule.
- **Dependency: run plan 005 before this plan**, or substitute
  `ease-[cubic-bezier(0.23,1,0.32,1)]` (also verified to compile) for
  `ease-strong-out`.

## Steps

1. `src/components/ui/carousel.tsx:71` — remove
   `transition-all duration-300 ease-in-out ` from the class list, leaving
   the layout utilities intact.

2. `src/components/ui/carousel.tsx:80` — change the inline transition string
   from
   `"transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"`
   to
   `"transform 250ms cubic-bezier(0.23, 1, 0.32, 1)"`.

3. `src/components/ui/carousel.tsx:85` — replace
   `transition-all duration-150 ease-out`
   with
   `transition-transform duration-150 ease-strong-out`.

4. `src/components/ui/carousel.tsx:94` — change
   `transition-opacity duration-600 ease-in-out`
   to
   `transition-opacity duration-250 ease-strong-out`.

5. `src/components/ui/carousel.tsx:104-106` — replace the conditionally
   mounted scrim with an always-mounted, crossfaded one:

   ```tsx
          <div
            className="absolute inset-0 bg-black/30 transition-opacity duration-250 ease-strong-out"
            style={{ opacity: current === index ? 1 : 0 }}
          />
   ```

6. `src/components/ui/carousel.tsx:110` — change
   `transition-opacity duration-1000 ease-in-out`
   to
   `transition-opacity duration-250 ease-strong-out`.

7. `src/components/ui/carousel.tsx:118` — change `transition duration-200`
   to `transition-shadow duration-200`.

8. `src/components/ui/carousel.tsx:141` — change `transition duration-200`
   to `transition-transform duration-200`.

9. `src/components/ui/carousel.tsx:183` — change
   `transition-transform duration-1000 ease-in-out`
   to
   `transition-transform duration-250 ease-strong-out`.

10. Confirm no over-long or over-broad transition remains:

    ```
    grep -n "transition-all\|duration-1000\|duration-600\|transition duration" src/components/ui/carousel.tsx
    ```

    Expect no output.

## Boundaries

- Do NOT change the carousel's 3D geometry — `rotateX(55deg) rotateY(0deg)
  rotateZ(-45deg)`, `origin-top-left`, `top-96 right-[50%]`, `size-[1720px]`
  all stay exactly as they are.
- Do NOT change the mouse-parallax maths (`--x` / `--y` custom properties at
  lines 32-33 and the `translate3d(... / 30)` at line 89).
- Do NOT change the `whileHover` lift on the slide image, if there is one.
- Do NOT change `loading="eager"` / `decoding="sync"` on the slide image
  (lines 101-102).
- Do NOT change the arrow's `active:translate-y-0.5` — it is correct press
  feedback.
- Do NOT touch `src/components/ui/floating-dock.tsx`,
  `src/components/ui/animated-counter.tsx`, or `src/components/ui/3d-marquee.tsx`.
- Do NOT add dependencies.
- If a step doesn't match the code you find (drift since the commit stamp),
  match on the **code**, not the line number; if the code itself differs
  from what is quoted here, STOP and report instead of improvising.

## Verification

- **Mechanical**:
  - `npx tsc --noEmit` — expect no errors.
  - `npx eslint src/components/ui/carousel.tsx` — expect no errors.
  - `npm run build` — expect "Compiled successfully".
  - `grep -n "transition-all\|duration-1000\|duration-600\|transition duration" src/components/ui/carousel.tsx`
    — expect no output.

- **Feel check**: run `npm run dev` and scroll to "Our Mentorship Cohorts".
  - Click a different cohort card — the row slides and the card scales and
    rotates in **one continuous move of about a quarter of a second**. The
    row must not keep gliding after the card has settled.
  - The dark scrim over the outgoing slide must now visibly fade rather
    than appearing instantly, and it must be gone within ~250ms of the click.
  - The slide title and its button must fade with the slide, not trail
    behind it by a second.
  - The slide image's opacity change must land with the slide, not 350ms
    later.
  - Move the pointer over a slide — the mouse parallax still tracks, but
    only `transform` transitions; the image must not flicker or resize.
  - Hover the slide button and the carousel arrows — the shadow eases in
    over 200ms, and the arrows move only by transform.
  - In DevTools, Animations panel: confirm the row slide, the card transform,
    the image fade, and the scrim all report `250ms` with
    `cubic-bezier(0.23, 1, 0.32, 1)`.
  - Toggle `prefers-reduced-motion: reduce` and confirm the slides still
    change state correctly (the transform still applies instantly).

- **Done when**: all four parts of a slide change share one 250ms timeline,
  the scrim genuinely crossfades, `grep` finds no over-long or over-broad
  transition in the file, and typecheck, lint, and build pass.

```
