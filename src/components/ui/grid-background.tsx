import { cn } from "@/lib/utils";
import React from "react";

/**
 * A faint square grid that fades out towards the edges of its container.
 *
 * Aceternity's "Grid Background" builds this from two stacked layers: the
 * grid lines, and a page-coloured sheet over them carrying a radial mask.
 * Here the mask sits on the grid itself instead, which produces the same
 * faded look without having to know the colour of whatever the grid is
 * sitting on.
 */
export function GridBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0",
        "[background-size:40px_40px]",
        "[background-image:linear-gradient(to_right,var(--color-spotted-dove)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-spotted-dove)_1px,transparent_1px)]",
        "[mask-image:radial-gradient(ellipse_at_center,black_20%,transparent)]",
        className,
      )}
    />
  );
}
