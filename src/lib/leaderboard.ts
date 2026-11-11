/**
 * Data access for the mentee leaderboard.
 *
 * The original TechNeeds IGDTUW site reads its leaderboard from this
 * backend, so the clone reads from the same place and stays current.
 */

export interface LeaderboardEntry {
  rank: number;
  name: string;
  totalScore: number;
  streak: number;
}

/**
 * The backend that serves the leaderboard.
 *
 * It sends `access-control-allow-origin: *`, so it can be called straight
 * from the browser.
 */
export const LEADERBOARD_ENDPOINT =
  "https://tn-backend-1.onrender.com/api/m/leaderboard";

/**
 * Fetches the current leaderboard.
 *
 * The backend runs on a free tier, so a cold instance can take a while to
 * spin up. Callers should pass a signal that aborts after a reasonable
 * timeout rather than leaving the request hanging.
 */
export async function fetchLeaderboard(
  signal?: AbortSignal,
): Promise<LeaderboardEntry[]> {
  // The platform's own board comes first: it is where the marks are
  // actually given, so a mentee who has just been marked appears on the
  // board straight away. The live platform is the fallback for a site
  // that has not been set up yet.
  const local = await fetchLocalLeaderboard(signal);
  if (local && local.length > 0) return local;

  const res = await fetch(LEADERBOARD_ENDPOINT, {
    signal,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Leaderboard request failed (${res.status})`);
  }

  const payload: unknown = await res.json();

  if (!Array.isArray(payload)) {
    throw new Error("Leaderboard response was not a list");
  }

  return payload
    .map((row): LeaderboardEntry | null => {
      const entry = row as Partial<LeaderboardEntry>;

      if (typeof entry.rank !== "number" || typeof entry.name !== "string") {
        return null;
      }

      return {
        rank: entry.rank,
        name: entry.name.trim(),
        totalScore:
          typeof entry.totalScore === "number" ? entry.totalScore : 0,
        streak: typeof entry.streak === "number" ? entry.streak : 0,
      };
    })
    .filter((entry): entry is LeaderboardEntry => entry !== null)
    .sort((a, b) => a.rank - b.rank);
}

/**
 * The board from this project's own platform.
 *
 * Returns null when the platform is not set up, which is the signal to
 * fall back to the live one.
 */
async function fetchLocalLeaderboard(
  signal?: AbortSignal,
): Promise<LeaderboardEntry[] | null> {
  try {
    const res = await fetch("/api/platform/leaderboard", {
      signal,
      cache: "no-store",
    });

    if (!res.ok) return null;

    const payload: unknown = await res.json();
    if (typeof payload !== "object" || payload === null) return null;

    const entries = (payload as { entries?: unknown }).entries;
    if (!Array.isArray(entries)) return null;

    return entries
      .map((row): LeaderboardEntry | null => {
        const entry = row as Partial<LeaderboardEntry>;
        if (typeof entry.rank !== "number" || typeof entry.name !== "string") {
          return null;
        }
        return {
          rank: entry.rank,
          name: entry.name.trim(),
          totalScore:
            typeof entry.totalScore === "number" ? entry.totalScore : 0,
          streak: typeof entry.streak === "number" ? entry.streak : 0,
        };
      })
      .filter((entry): entry is LeaderboardEntry => entry !== null)
      .sort((a, b) => a.rank - b.rank);
  } catch {
    // The platform is not reachable, or the request was aborted. Either
    // way, the live board is a better answer than nothing.
    return null;
  }
}

/**
 * The ranks as they were the last time the board was opened.
 *
 * The backend does not expose rank history, so this lives in the browser.
 */
export interface RankSnapshotEntry {
  name: string;
  rank: number;
  totalScore: number;
  streak: number;
}

const SNAPSHOT_KEY = "techneeds:leaderboard-ranks";

/**
 * Reads the last snapshot, or `null` if there is not one yet.
 *
 * Browser only.
 */
export function readRankSnapshot(): RankSnapshotEntry[] | null {
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RankSnapshotEntry[]) : null;
  } catch {
    return null;
  }
}

/**
 * Stores the current ranks as the new snapshot.
 *
 * Browser only. Storage can be unavailable (private browsing, quota); that
 * is not worth failing over, so errors are swallowed.
 */
export function writeRankSnapshot(entries: LeaderboardEntry[]): void {
  try {
    const snapshot = entries.map(({ name, rank, totalScore, streak }) => ({
      name,
      rank,
      totalScore,
      streak,
    }));

    window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore - the change column simply stays empty.
  }
}

/**
 * Works out how far each mentee has moved since `previous` was captured.
 *
 * A positive number means they climbed, a negative one means they dropped,
 * and `null` means there is nothing to compare against.
 *
 * Names are not unique on this board - "Vidushi" appears five times - so an
 * entry is matched to the unused previous entry with the same name: an exact
 * score match first, otherwise the closest rank.
 */
export function computeRankChanges(
  entries: LeaderboardEntry[],
  previous: RankSnapshotEntry[] | null,
): (number | null)[] {
  if (!previous || previous.length === 0) {
    return entries.map(() => null);
  }

  const used = new Set<number>();

  return entries.map((entry) => {
    let bestIndex = -1;
    let bestExact = false;
    let bestDistance = Number.POSITIVE_INFINITY;

    previous.forEach((candidate, index) => {
      if (used.has(index) || candidate.name !== entry.name) return;

      const exact = candidate.totalScore === entry.totalScore;
      const distance = Math.abs(candidate.rank - entry.rank);

      const isBetter =
        bestIndex === -1 ||
        (exact && !bestExact) ||
        (exact === bestExact && distance < bestDistance);

      if (isBetter) {
        bestIndex = index;
        bestExact = exact;
        bestDistance = distance;
      }
    });

    if (bestIndex === -1) return null;

    used.add(bestIndex);

    // Climbing means the rank number got smaller, so the old rank minus the
    // new one is the distance moved up.
    return previous[bestIndex].rank - entry.rank;
  });
}
