"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  IconRefresh,
  IconMoodEmpty,
  IconFlame,
  IconBolt,
  IconCrown,
  IconArrowUp,
  IconArrowDown,
  IconRocket,
  IconBrandWhatsapp,
} from "@tabler/icons-react";
import {
  computeRankChanges,
  fetchLeaderboard,
  readRankSnapshot,
  writeRankSnapshot,
  type LeaderboardEntry,
} from "@/lib/leaderboard";
import { PageReveal } from "@/components/ui/page-reveal";
import { cn } from "@/lib/utils";

/**
 * The backend runs on a free tier, so a cold instance can take a while to
 * come up. Give up after this long and offer a retry.
 */
const REQUEST_TIMEOUT_MS = 8000;

const EASE = [0.4, 0, 0.2, 1] as const;

/**
 * The podium badges, one treatment per place.
 */
const PODIUM_BADGE: Record<number, string> = {
  1: "bg-badge-gold",
  2: "bg-badge-platinum",
  3: "bg-badge-bronze",
};

export default function Leaderboard() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [changes, setChanges] = useState<(number | null)[]>([]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    fetchLeaderboard(controller.signal)
      .then((data) => {
        if (cancelled) return;

        // Compare against the ranks from the last visit before overwriting
        // them, so the change column reflects real movement.
        setChanges(computeRankChanges(data, readRankSnapshot()));
        writeRankSnapshot(data);

        setEntries(data);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }, []);

  return (
    <section id="leaderboard" className="relative bg-[var(--color-emptiness)]">
      {/* ---- Purple band: heading and podium ---- */}
      <div className="bg-plum-band relative overflow-hidden pt-20 pb-36">

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageReveal>
            {/* Page Header */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                Leaderboard
              </h1>
              <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                Every point here is a mark earned on cohort work: the videos,
                quizzes and projects a mentee has handed in and had marked.
              </p>
            </div>

            {/* Podium */}
            <div className="mt-14">
              {status === "ready" && entries.length > 0 ? (
                <Podium entries={entries} />
              ) : (
                <PodiumSkeleton />
              )}
            </div>
          </PageReveal>
        </div>
      </div>

      {/* ---- Banner and table, overlapping the band ---- */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 pb-24">
        <PageReveal>
          {/* Card holding the banner and the table */}
          <div className="relative z-10 -mt-10 sm:-mt-12 rounded-2xl border border-[var(--color-spotted-dove)] bg-[var(--color-emptiness)] shadow-xl overflow-hidden">
            {/* Climb the leaderboard */}
            <div className="p-3 sm:p-4 pb-0">
              <div className="bg-plum-banner rounded-xl px-6 py-7 sm:px-9 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    Climb the leaderboard!
                  </h2>
                  <p className="text-sm text-white/80">
                    Join a cohort, hand in the work, and every mark you earn
                    counts towards your rank.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/#cohorts"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--color-plum-deep)] bg-white hover:bg-white/90 transition-colors"
                  >
                    <IconRocket className="w-4 h-4" />
                    <span>Explore Cohorts</span>
                  </Link>
                  <a
                    href="https://chat.whatsapp.com/invite/techneeds"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[var(--color-plum-deep)]/40 border border-white/25 hover:bg-[var(--color-plum-deep)]/60 transition-colors"
                  >
                    <IconBrandWhatsapp className="w-4 h-4" />
                    <span>Join the Group</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Leaderboard table */}
            <div className="mt-3 sm:mt-4">
              <AnimatePresence mode="wait" initial={false}>
              {status === "loading" && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                >
                  <TableSkeleton />
                </motion.div>
              )}

              {status === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="px-6 py-14 text-center space-y-4"
                >
                  <IconMoodEmpty className="w-8 h-8 mx-auto text-[var(--color-stone-haze)]" />
                  <p className="text-sm font-semibold text-[var(--color-caviar)]">
                    We couldn&apos;t load the leaderboard.
                  </p>
                  <p className="text-xs text-[var(--color-iron-fixture)]">
                    The standings service may be briefly unavailable.
                  </p>
                  <button
                    onClick={retry}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--color-plum-bright)] hover:bg-[var(--color-plum)] transition-colors"
                  >
                    <IconRefresh className="w-4 h-4" />
                    <span>Try again</span>
                  </button>
                </motion.div>
              )}

              {status === "ready" && entries.length === 0 && (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="px-6 py-14 text-center text-sm text-[var(--color-iron-fixture)]"
                >
                  No mentees have scored yet. Be the first.
                </motion.p>
              )}

              {status === "ready" && entries.length > 0 && (
                <motion.div
                  key="table"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left">
                      <thead className="bg-[var(--color-night-white)]/60">
                        <tr>
                          <th
                            scope="col"
                            className="px-4 sm:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-iron-fixture)]"
                          >
                            Rank
                          </th>
                          <th
                            scope="col"
                            className="hidden sm:table-cell px-4 sm:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-iron-fixture)]"
                          >
                            Change
                          </th>
                          <th
                            scope="col"
                            className="px-4 sm:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-iron-fixture)]"
                          >
                            Name
                          </th>
                          <th
                            scope="col"
                            className="px-4 sm:px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[var(--color-iron-fixture)]"
                          >
                            Total Score
                          </th>
                          <th
                            scope="col"
                            className="px-4 sm:px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[var(--color-iron-fixture)]"
                          >
                            Streak
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((entry, index) => (
                          <tr
                            key={entry.rank}
                            className="border-t border-[var(--color-night-white)] transition-colors hover:bg-[var(--color-night-white)]/40"
                          >
                            <td className="px-4 sm:px-6 py-4">
                              <RankBadge rank={entry.rank} />
                            </td>
                            <td className="hidden sm:table-cell px-4 sm:px-6 py-4">
                              <ChangeIndicator change={changes[index] ?? null} />
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar name={entry.name} />
                                <span className="font-semibold text-[var(--color-caviar)]">
                                  {entry.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-right">
                              <span className="inline-flex items-center gap-1.5 font-bold tabular-nums text-[var(--color-caviar)]">
                                <IconBolt className="w-4 h-4 text-[var(--color-amber)]" />
                                {entry.totalScore}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-right">
                              <span className="inline-flex items-center gap-1.5 text-sm text-[var(--color-iron-fixture)] whitespace-nowrap">
                                <IconFlame className="w-4 h-4 text-[var(--color-amber)]" />
                                {entry.streak} {entry.streak === 1 ? "day" : "days"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-[var(--color-stone-haze)]">
            Change compares today&apos;s ranks with the last time you opened
            this page.
          </p>
        </PageReveal>
      </div>
    </section>
  );
}

/**
 * The top three, with the winner in the middle and raised above the rest.
 */
function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const byRank = (rank: number) => entries.find((entry) => entry.rank === rank);

  // Rendered as second, first, third so the winner sits in the middle.
  const places = [2, 1, 3]
    .map((rank) => byRank(rank))
    .filter((entry): entry is LeaderboardEntry => entry !== undefined);

  if (places.length === 0) return null;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="flex items-end justify-center gap-3 sm:gap-10"
    >
      {places.map((entry) => {
        const isWinner = entry.rank === 1;

        return (
          <motion.div
            key={entry.rank}
            variants={{
              hidden: { opacity: 0, y: 28 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: EASE },
              },
            }}
            className={cn(
              "flex flex-col items-center text-center",
              isWinner && "-mt-8 sm:-mt-12",
            )}
          >
            {/* Avatar with the rank badge sitting on its edge */}
            <div className="relative">
              <div
                className={cn(
                  "flex items-center justify-center rounded-full font-bold tracking-tight border-2 border-white/70 shadow-xl",
                  isWinner
                    ? "size-24 text-3xl sm:size-28 sm:text-4xl bg-[var(--color-emptiness)] text-[var(--color-plum-deep)]"
                    : "size-20 text-2xl bg-[var(--color-emptiness)] text-[var(--color-plum-deep)]",
                )}
              >
                {initialsOf(entry.name)}
              </div>

              <span
                className={cn(
                  "absolute -bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums text-[var(--color-plum-deep)] shadow-md",
                  PODIUM_BADGE[entry.rank],
                )}
              >
                {isWinner && <IconCrown className="w-3 h-3" />}
                {entry.rank}
              </span>
            </div>

            {/* Name and score */}
            <div className="mt-6 space-y-1.5 px-1">
              <p
                className={cn(
                  "font-bold text-white truncate",
                  isWinner ? "text-base sm:text-lg" : "text-sm",
                )}
              >
                {entry.name}
              </p>
              <p className="inline-flex items-center gap-1.5 font-bold tabular-nums text-white">
                <IconBolt className="w-4 h-4 text-[var(--color-amber)]" />
                {entry.totalScore}
              </p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/**
 * The top three get a coloured badge; everyone else is a plain number.
 */
function RankBadge({ rank }: { rank: number }) {
  const badge = PODIUM_BADGE[rank];

  if (!badge) {
    return (
      <span className="inline-flex h-8 min-w-8 items-center justify-center px-1 text-sm font-bold tabular-nums text-[var(--color-caviar)]">
        {rank}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-full px-2 text-xs font-bold tabular-nums text-[var(--color-plum-deep)]",
        badge,
      )}
    >
      {rank === 1 && <IconCrown className="w-3 h-3" />}
      {rank}
    </span>
  );
}

/**
 * How far a mentee has moved since the last visit.
 */
function ChangeIndicator({ change }: { change: number | null }) {
  if (change === null || change === 0) {
    return (
      <span className="text-sm tabular-nums text-[var(--color-spotted-dove)]">
        —
      </span>
    );
  }

  const climbed = change > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-bold tabular-nums",
        climbed ? "text-[var(--color-gain)]" : "text-[var(--color-loss)]",
      )}
    >
      {climbed ? (
        <IconArrowUp className="w-3.5 h-3.5" />
      ) : (
        <IconArrowDown className="w-3.5 h-3.5" />
      )}
      {Math.abs(change)}
    </span>
  );
}

/**
 * A stand-in for a profile photo - the board does not carry avatars.
 */
function Avatar({ name }: { name: string }) {
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-night-white)] border border-[var(--color-spotted-dove)] text-xs font-bold text-[var(--color-iron-fixture)]">
      {initialsOf(name)}
    </span>
  );
}

/**
 * Initials for an avatar: first letter of the first and last word, or the
 * first two letters of a single word.
 */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Placeholder podium shown while the standings are being fetched.
 */
function PodiumSkeleton() {
  return (
    <div className="flex items-end justify-center gap-3 sm:gap-10">
      {[80, 112, 80].map((size, index) => (
        <div
          key={index}
          className="flex flex-col items-center gap-4"
          style={{ marginTop: index === 1 ? -48 : 0 }}
        >
          <div
            className="rounded-full bg-white/15 animate-pulse motion-reduce:animate-none"
            style={{ width: size, height: size }}
          />
          <div className="h-4 w-24 rounded bg-white/15 animate-pulse motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  );
}

/**
 * Placeholder rows shown while the standings are being fetched.
 */
function TableSkeleton() {
  return (
    <div>
      <div className="h-[53px] bg-[var(--color-night-white)]/60" />
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-t border-[var(--color-night-white)] px-4 sm:px-6 py-4"
        >
          <div className="h-8 w-8 rounded-full bg-[var(--color-night-white)] animate-pulse motion-reduce:animate-none" />
          <div className="h-4 w-10 rounded bg-[var(--color-night-white)] animate-pulse motion-reduce:animate-none" />
          <div className="h-9 w-9 rounded-full bg-[var(--color-night-white)] animate-pulse motion-reduce:animate-none" />
          <div className="h-4 flex-1 max-w-[200px] rounded bg-[var(--color-night-white)] animate-pulse motion-reduce:animate-none" />
          <div className="h-4 w-12 ml-auto rounded bg-[var(--color-night-white)] animate-pulse motion-reduce:animate-none" />
          <div className="h-4 w-16 rounded bg-[var(--color-night-white)] animate-pulse motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  );
}
