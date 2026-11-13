"use client";

import { useEffect } from "react";

/**
 * Smoothly scrolls the element with this id into view when `when`
 * changes - used when a link opens a card further down the page.
 *
 * It is done here rather than with a #hash on the link, because the
 * browser jumps to a hash instantly. People who have asked for reduced
 * motion get the jump instead of the glide.
 */
export function ScrollIntoView({ id, when }: { id: string; when: string }) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [id, when]);

  return null;
}
