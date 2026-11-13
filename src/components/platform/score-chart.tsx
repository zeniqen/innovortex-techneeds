"use client";

import { useState } from "react";

import { formatDate } from "@/lib/platform/dates";

/**
 * The running total of points, as an area chart.
 *
 * Drawn by hand in SVG: it is one line, and a charting library would be
 * most of the page's JavaScript for it. Hovering anywhere over the plot
 * picks the nearest mark and shows its date and total.
 */
export function ScoreChart({
  points,
}: {
  points: { at: string; total: number }[];
}) {
  const [hover, setHover] = useState<number | null>(null);

  const width = 320;
  const height = 120;
  const pad = { top: 10, right: 6, bottom: 4, left: 6 };

  // One mark is drawn as a flat line from the start, so there is
  // something to see.
  const series =
    points.length === 1 ? [{ ...points[0], total: 0 }, points[0]] : points;

  const max = Math.max(1, ...series.map((p) => p.total));
  const min = Math.min(0, ...series.map((p) => p.total));
  const x = (i: number) =>
    pad.left + (i / Math.max(1, series.length - 1)) * (width - pad.left - pad.right);
  const y = (v: number) =>
    pad.top + (1 - (v - min) / (max - min)) * (height - pad.top - pad.bottom);

  const line = series.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.total)}`).join(" ");
  const area = `${line} L${x(series.length - 1)},${y(min)} L${x(0)},${y(min)} Z`;

  const active = hover === null ? null : series[hover];

  return (
    <figure>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-xs text-[var(--color-iron-fixture)]">
        <span>
          {active ? formatDate(active.at) : `${points.length} marks`}
        </span>
        <span className="text-sm font-bold tabular-nums text-[var(--color-caviar)]">
          {active ? active.total : series[series.length - 1].total} points
        </span>
      </div>

      <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        // Stretched to the card's width rather than letterboxed in it. The
        // strokes keep their width with non-scaling-stroke, and the hover
        // dot is drawn outside the SVG so it stays round.
        preserveAspectRatio="none"
        // tn-chart-reveal (globals.css) draws the line in left to right.
        className="tn-chart-reveal block h-32 w-full overflow-visible"
        role="img"
        aria-label={`Points over time, from ${series[0].total} to ${series[series.length - 1].total}`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const at = ((event.clientX - box.left) / box.width) * width;
          let nearest = 0;
          for (let i = 1; i < series.length; i++) {
            if (Math.abs(x(i) - at) < Math.abs(x(nearest) - at)) nearest = i;
          }
          setHover(nearest);
        }}
      >
        <line
          x1={pad.left}
          x2={width - pad.right}
          y1={y(min)}
          y2={y(min)}
          stroke="var(--color-night-white)"
        />
        <path d={area} fill="var(--color-gain)" fillOpacity={0.12} />
        <path
          d={line}
          fill="none"
          stroke="var(--color-gain)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {active && hover !== null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={pad.top}
            y2={y(min)}
            stroke="var(--color-spotted-dove)"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {active && hover !== null && (
        <span
          aria-hidden
          className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-gain)] ring-2 ring-[var(--color-emptiness)]"
          style={{
            left: `${(x(hover) / width) * 100}%`,
            top: `${(y(active.total) / height) * 100}%`,
          }}
        />
      )}
      </div>

      <figcaption className="mt-1 flex justify-between text-[0.65rem] text-[var(--color-stone-haze)]">
        <span>{formatDate(series[0].at)}</span>
        <span>{formatDate(series[series.length - 1].at)}</span>
      </figcaption>
    </figure>
  );
}
