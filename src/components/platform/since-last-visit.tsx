"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { IconConfetti, IconX } from "@tabler/icons-react";

import { ACCENTS, points } from "./primitives";

/** One mark, as much of it as this line needs. */
export interface MarkSummary {
  id: string;
  createdAt: string;
  delta: number;
}

type Fresh = { count: number; total: number };

/**
 * What each mentee's visit turned up, worked out once per page load. Kept
 * outside React so that a second run of the effect (Strict Mode, or the
 * board mounting again on a client-side navigation) gives the same answer
 * instead of finding the last visit already moved on to now.
 */
const visits = new Map<string, Fresh | null>();

function visit(userId: string, events: MarkSummary[]): Fresh | null {
  const known = visits.get(userId);
  if (known !== undefined) return known;

  const key = `tn:mentee-last-visit:${userId}`;

  let last: number | null = null;
  try {
    const stored = window.localStorage.getItem(key);
    const parsed = stored ? Date.parse(stored) : NaN;
    if (Number.isFinite(parsed)) last = parsed;
  } catch {
    // No storage: behave as if this were the first visit.
  }

  const newer =
    last === null
      ? []
      : events.filter((event) => Date.parse(event.createdAt) > (last as number));

  // Move the last visit on. The newest mark's own time is used when it is
  // later than this browser's clock, so a clock running behind the server
  // cannot make the same marks show up as new again next time.
  const newest = events.reduce(
    (latest, event) => Math.max(latest, Date.parse(event.createdAt) || 0),
    0,
  );
  try {
    window.localStorage.setItem(
      key,
      new Date(Math.max(Date.now(), newest)).toISOString(),
    );
  } catch {
    // Nothing to do: the line just will not show next time.
  }

  const result =
    newer.length === 0
      ? null
      : {
          count: newer.length,
          total: newer.reduce((sum, event) => sum + event.delta, 0),
        };
  visits.set(userId, result);
  return result;
}

/**
 * "2 new marks since your last visit · +45 points".
 *
 * A small celebration at the top of the mentee's board when a mentor has
 * marked something since they last looked. The time of the last visit is
 * kept in this browser's localStorage, one key per mentee, and moved on to
 * now every time the board is opened. Nothing shows on the very first
 * visit (there is no "last" to compare with) or when nothing is new.
 *
 * Storage can be missing or throw (a private window, blocked site data), so
 * every read and write is guarded; without it the line simply never shows.
 */
export function SinceLastVisit({
  userId,
  events,
}: {
  userId: string;
  events: MarkSummary[];
}) {
  const reduceMotion = useReducedMotion();
  const [fresh, setFresh] = useState<Fresh | null>(null);

  useEffect(() => {
    const result = visit(userId, events);
    if (!result) return;
    // Storage only exists in the browser, so the line is set after the
    // first render; on the next frame, so the entrance gets its own paint.
    const frame = requestAnimationFrame(() => setFresh(result));
    return () => cancelAnimationFrame(frame);
    // Once per mentee: a refresh of the page's data (a new events array)
    // must not count the same visit twice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!fresh) return null;

  const { count, total } = fresh;
  const sign = total > 0 ? "+" : total < 0 ? "−" : "";

  return (
    <div
      role="status"
      style={{ "--accent": ACCENTS.green } as CSSProperties}
      className="tn-enter-pop mb-4 flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--accent)_35%,var(--color-spotted-dove))] bg-[color-mix(in_srgb,var(--accent)_9%,var(--color-emptiness))] px-4 py-3 text-sm text-[var(--color-caviar)]"
    >
      <IconConfetti
        aria-hidden
        className="h-5 w-5 shrink-0"
        style={{ color: "var(--accent)" }}
      />
      <p className="min-w-0 flex-1 font-semibold">
        {count} new {count === 1 ? "mark" : "marks"} since your last visit
        {total !== 0 && (
          <>
            <span aria-hidden className="mx-1.5 text-[var(--color-iron-fixture)]">
              ·
            </span>
            {/* The points spring in a beat after the line, so the eye goes
                to the number. Reduced motion: it is simply there. */}
            <motion.span
              className="inline-block font-extrabold tabular-nums"
              style={{ color: "var(--accent)" }}
              initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                duration: 0.45,
                bounce: 0.35,
                delay: 0.15,
              }}
            >
              {sign}
              {points(Math.abs(total))}
            </motion.span>
          </>
        )}
      </p>
      <button
        type="button"
        onClick={() => {
          visits.set(userId, null);
          setFresh(null);
        }}
        aria-label="Dismiss"
        className="tn-press -mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-iron-fixture)] hover:bg-[color-mix(in_srgb,var(--accent)_14%,var(--color-emptiness))] hover:text-[var(--color-caviar)]"
      >
        <IconX className="h-4 w-4" />
      </button>
    </div>
  );
}
