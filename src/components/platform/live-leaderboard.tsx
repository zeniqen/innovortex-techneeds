"use client";

import { useEffect, useState } from "react";
import { IconCrown, IconFlame, IconRefresh } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/platform/dates";
import type { LeaderboardRow } from "@/lib/platform/types";

/**
 * The live leaderboard.
 *
 * It polls every few seconds, so a mentee sees their rank move as other
 * people hand work in. The poll is paused while the tab is hidden, because
 * there is no point asking for a ranking nobody is looking at.
 */
export function LiveLeaderboard({
  currentId,
  fallback,
}: {
  /** The signed-in mentee, so their row can be picked out. */
  currentId: string;
  /** The server-rendered list, shown until the first poll lands. */
  fallback: LeaderboardRow[];
}) {
  const [rows, setRows] = useState<LeaderboardRow[]>(fallback);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      if (document.hidden) return;

      try {
        const response = await fetch("/api/platform/leaderboard", {
          cache: "no-store",
        });
        if (!response.ok) return;

        const payload = (await response.json()) as { entries: LeaderboardRow[] };
        if (cancelled) return;

        setRows(payload.entries);
        setUpdatedAt(formatDateTime(new Date()).split(", ")[1] ?? "");
      } catch {
        // The list on screen is still the last good one.
      }
    };

    const timer = setInterval(poll, 5000);
    void poll();

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const mine = rows.find((row) => row.id === currentId);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--color-iron-fixture)]">
          {updatedAt ? `Updated ${updatedAt}` : "Updating…"}
        </p>
        <IconRefresh className="h-3.5 w-3.5 text-[var(--color-stone-haze)]" />
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-iron-fixture)]">
          Nobody has scored yet.
        </p>
      ) : (
        <ol className="mt-3 space-y-1">
          {rows.slice(0, 10).map((row) => (
            <li
              key={row.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-sm",
                row.id === currentId
                  ? "bg-[var(--color-night-white)] font-bold"
                  : "",
              )}
            >
              <span className="flex items-center gap-2">
                <span className="w-5 text-xs tabular-nums text-[var(--color-iron-fixture)]">
                  {row.rank === 1 ? (
                    <IconCrown className="h-4 w-4 text-[var(--color-amber)]" />
                  ) : (
                    row.rank
                  )}
                </span>
                {row.name}
              </span>
              <span className="flex items-center gap-2 text-xs tabular-nums text-[var(--color-iron-fixture)]">
                {row.streak > 0 && (
                  <span className="inline-flex items-center gap-0.5">
                    <IconFlame className="h-3.5 w-3.5 text-[var(--color-amber)]" />
                    {row.streak}
                  </span>
                )}
                {row.totalScore}
              </span>
            </li>
          ))}
        </ol>
      )}

      {mine && mine.rank > 10 && (
        <p className="mt-3 border-t border-[var(--color-night-white)] pt-3 text-xs text-[var(--color-iron-fixture)]">
          You are <span className="font-bold">#{mine.rank}</span> with{" "}
          {mine.totalScore} points.
        </p>
      )}
    </div>
  );
}
