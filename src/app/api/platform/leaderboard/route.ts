import { leaderboard } from "@/lib/platform/store";

/**
 * The leaderboard.
 *
 * Public on purpose: the site already shows a leaderboard to visitors,
 * and the panel polls this for the live version.
 */
export async function GET() {
  return Response.json({ entries: await leaderboard(50) });
}
