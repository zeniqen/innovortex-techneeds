"use client";

import { Children, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Delay between consecutive blocks as they appear.
 */
const STAGGER = 0.08;
/**
 * How long a single block takes to fade in.
 */
const DURATION = 0.55;
/**
 * How far a block travels as it fades in.
 */
const RISE = 20;
/**
 * Pause before the first block starts, so the route change registers as a
 * change rather than a flicker.
 */
const DELAY = 0.06;

/**
 * A gradual ramp, deliberately not the codebase's aggressive ease-out.
 *
 * `cubic-bezier(0.23, 1, 0.32, 1)` reaches 90% opacity at 36% of the
 * duration, so a short fade with it is visually over in a few frames and
 * reads as an instant cut. This curve reaches 90% at 63%, which keeps the
 * content visibly assembling for the whole transition.
 */
const EASE = [0.4, 0, 0.2, 1] as const;

/**
 * Reveals a list of content blocks one after another, top to bottom.
 *
 * Used for the sections of a route so that navigating between pages feels
 * like the new page is being built in front of you rather than swapped in
 * all at once. The blocks keep their own layout - this only animates
 * opacity and a small vertical offset.
 *
 * Every route change remounts the tree below `src/app/template.tsx`, so the
 * reveal replays on each navigation.
 */
export function PageReveal({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  // With reduced motion the blocks appear immediately: no fade, no travel,
  // and no stagger between them.
  //
  // Only the *transition* varies. The `hidden` state below is deliberately
  // identical for every user, because the server cannot know the visitor's
  // motion preference and a differing initial render is a hydration
  // mismatch. The blocks are therefore always rendered hidden first and
  // then snapped into place, which for a reduced-motion user happens within
  // a single frame.
  const duration = reduceMotion ? 0 : DURATION;
  const stagger = reduceMotion ? 0 : STAGGER;
  const delay = reduceMotion ? 0 : DELAY;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
    >
      {Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: RISE },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration, ease: EASE },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
