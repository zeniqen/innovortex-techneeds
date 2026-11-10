"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * How long the route fade takes.
 */
const FADE_DURATION = 0.5;

/**
 * A gradual ramp, deliberately not the codebase's aggressive ease-out.
 *
 * `cubic-bezier(0.23, 1, 0.32, 1)` reaches 90% opacity at 36% of the
 * duration, so a 350ms fade with it is visually over in about 125ms and the
 * new page reads as an instant cut. This curve reaches 90% at 63%, so the
 * page is visibly assembling for the whole transition.
 */
const EASE = [0.4, 0, 0.2, 1] as const;

/**
 * Wraps every route and remounts on each navigation (unlike `layout.tsx`,
 * which persists), so the page content fades in on every route change.
 */
export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: shouldReduceMotion ? 0 : FADE_DURATION,
        ease: EASE,
      }}
    >
      {children}
    </motion.div>
  );
}
