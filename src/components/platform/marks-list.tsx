"use client";

import { useState } from "react";

/** How many marks show before "Show all". */
const FIRST = 12;

/**
 * The mentee's marks, most recent first.
 *
 * The first twelve show; when there are more, a button says how many there
 * are in all and shows the rest, so the count on the Marks tab always
 * matches something the mentee can see.
 */
export function MarksList({
  events,
}: {
  events: { id: string; reason: string; delta: number }[];
}) {
  const [all, setAll] = useState(false);
  const shown = all ? events : events.slice(0, FIRST);
  const hidden = events.length - shown.length;

  return (
    <>
      <ul className="space-y-2">
        {shown.map((event, index) => (
          <li
            key={event.id}
            // The rows revealed by "Show all" ease in; the first twelve
            // were there from the start and do not.
            className={`${index >= FIRST ? "tn-enter " : ""}flex items-center justify-between gap-3 border-b border-[var(--color-night-white)] py-2 text-sm last:border-b-0`}
          >
            <span className="min-w-0 truncate">{event.reason}</span>
            <span className="shrink-0 font-bold tabular-nums">
              {event.delta > 0 ? "+" : ""}
              {event.delta}
            </span>
          </li>
        ))}
      </ul>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setAll(true)}
          className="tn-press mt-3 inline-flex items-center rounded-lg border border-[var(--color-spotted-dove)] px-3 py-1.5 text-xs font-bold text-[var(--color-caviar)] hover:bg-[var(--color-night-white)]"
        >
          Show all {events.length}
        </button>
      )}
    </>
  );
}
