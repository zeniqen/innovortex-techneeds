"use client";

import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

/**
 * The colour palette picker.
 *
 * The site is drawn from six neutral tokens in globals.css. A palette
 * re-tints those six and nothing else, so every page changes together
 * and the minimal look stays the same - only its temperature moves.
 *
 * The choice is kept in this browser. The script in the root layout puts
 * it on <html> before the page paints, so a reload does not flash the
 * default first.
 */

export const PALETTES = [
  { id: "graphite", label: "Graphite", swatch: "#2A2D31" },
  { id: "plum", label: "Plum", swatch: "#2A1F45" },
  { id: "ocean", label: "Ocean", swatch: "#1D2D3A" },
  { id: "forest", label: "Forest", swatch: "#1F2E24" },
] as const;

export const PALETTE_KEY = "tn-palette";

type PaletteId = (typeof PALETTES)[number]["id"];

/**
 * The palette lives on <html>, not in React, because the layout script
 * sets it before React starts. The picker reads it from there and is told
 * when it changes.
 */
const CHANGED = "tn-palette-change";

function readPalette(): PaletteId {
  const value = document.documentElement.dataset.palette;
  return PALETTES.some((p) => p.id === value) ? (value as PaletteId) : "graphite";
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGED, onChange);
  return () => window.removeEventListener(CHANGED, onChange);
}

function applyPalette(id: PaletteId) {
  const root = document.documentElement;
  if (id === "graphite") delete root.dataset.palette;
  else root.dataset.palette = id;
  try {
    localStorage.setItem(PALETTE_KEY, id);
  } catch {
    // Storage can be blocked. The palette still applies for this visit.
  }
  window.dispatchEvent(new Event(CHANGED));
}

export function PalettePicker({ className }: { className?: string }) {
  // On the server there is no stored choice, so it renders the default
  // and corrects itself once the browser takes over.
  const current = useSyncExternalStore(subscribe, readPalette, () => "graphite");
  const choose = applyPalette;

  return (
    <div
      role="radiogroup"
      aria-label="Colour palette"
      className={cn("flex items-center gap-1.5", className)}
    >
      {PALETTES.map((palette) => (
        <button
          key={palette.id}
          type="button"
          role="radio"
          aria-checked={current === palette.id}
          aria-label={palette.label}
          title={palette.label}
          onClick={() => choose(palette.id)}
          className={cn(
            "h-4 w-4 rounded-full ring-offset-2 ring-offset-[var(--color-emptiness)] transition-shadow duration-150",
            current === palette.id
              ? "ring-2 ring-[var(--color-caviar)]"
              : "hover:ring-1 hover:ring-[var(--color-spotted-dove)]",
          )}
          style={{ background: palette.swatch }}
        />
      ))}
    </div>
  );
}
