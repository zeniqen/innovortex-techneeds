import { connection } from "next/server";

import { leaderboard } from "@/lib/platform/store";

/**
 * The leaderboard.
 *
 * Public on purpose: the site already shows a leaderboard to visitors,
 * and the panel polls this for the live version.
 */
export async function GET() {
  // The board changes as people hand work in, so it has to be answered at
  // request time rather than baked into the build.
  await connection();

  return Response.json({ entries: await leaderboard(50) });
}
