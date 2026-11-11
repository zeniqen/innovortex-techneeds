"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { SPLASH_DONE_EVENT } from "@/components/loading-screen";

function subscribe(onChange: () => void) {
  document.addEventListener(SPLASH_DONE_EVENT, onChange);
  return () => document.removeEventListener(SPLASH_DONE_EVENT, onChange);
}

function getSnapshot() {
  return document.documentElement.dataset.splashDone === "true";
}

/**
 * Holds back its children until the loading splash has finished, so an
 * entrance animation is not spent behind the overlay.
 *
 * Before the splash is done it renders `fallback` instead. The fallback
 * keeps the layout stable, so nothing shifts when the children take over.
 */
export function SplashGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const splashDone = useSyncExternalStore(subscribe, getSnapshot, () => false);

  return <>{splashDone ? children : fallback}</>;
}
