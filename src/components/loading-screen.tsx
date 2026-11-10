"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Counter } from "@/components/ui/animated-counter";

/** How long the count itself runs, in seconds. */
const COUNT_DURATION = 1.2;
/** How long the overlay takes to fade out. */
const EXIT_DURATION = 0.45;
/** Never hold the page hostage longer than this. */
const MAX_WAIT_MS = 6000;

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function LoadingScreen() {
  // `mounted` drives AnimatePresence: flipping it to false removes the child,
  // which is what actually triggers the exit animation.
  //
  // This component is mounted in the root layout, which persists across
  // client-side navigations, so the overlay plays once per hard page load and
  // never replays when moving between pages.
  const [mounted, setMounted] = useState(true);
  const [assetsReady, setAssetsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const reducedMotion = useReducedMotion();

  // Wait for the browser's load event so we only start counting once the
  // page's assets are actually in.
  useEffect(() => {
    let cancelled = false;

    const markReady = () => {
      if (!cancelled) setAssetsReady(true);
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
  }, []);

  // Lock scrolling while the overlay is up. The lock is released by
  // `handleExitComplete`, not by `mounted` flipping, so the page stays
  // locked for the whole fade-out instead of unlocking mid-animation.
  const previousOverflow = useRef<string | null>(null);

  useEffect(() => {
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      if (previousOverflow.current !== null) {
        document.body.style.overflow = previousOverflow.current;
      }
    };
  }, []);

  const handleExitComplete = useCallback(() => {
    document.body.style.overflow = previousOverflow.current ?? "";
  }, []);

  const handleComplete = useCallback(() => {
    setMounted(false);
  }, []);

  const handleValueChange = useCallback((value: number) => {
    setProgress(value);
  }, []);

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {mounted && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: {
              duration: reducedMotion ? 0 : EXIT_DURATION,
              ease: EASE_OUT,
            },
          }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-[var(--color-emptiness)]"
          role="status"
          aria-live="polite"
          aria-label="Loading TechNeeds IGDTUW"
        >
          {/* Brand mark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="relative h-16 w-16 overflow-hidden rounded-2xl border border-[var(--color-spotted-dove)] bg-[var(--color-night-white)] p-1.5"
          >
            <Image
              src="/assets/logo.png"
              alt="TechNeeds IGDTUW"
              fill
              className="object-contain p-0.5"
              priority
            />
          </motion.div>

          <div className="flex flex-col items-center gap-4">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="text-sm font-semibold tracking-[0.2em] uppercase text-[var(--color-iron-fixture)]"
            >
              TechNeeds IGDTUW
            </motion.p>

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

            {/* Progress track */}
            <div className="h-px w-48 overflow-hidden bg-[var(--color-night-white)]">
              <motion.div
                className="h-full bg-[var(--color-caviar)]"
                style={{ width: `${progress}%` }}
              />
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="text-xs text-[var(--color-stone-haze)]"
            >
              {assetsReady ? "Loading community" : "Preparing your experience"}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
