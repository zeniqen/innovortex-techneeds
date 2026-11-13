import { cookies } from "next/headers";

import { readSession } from "./records";
import { SESSION_COOKIE } from "./session-cookie";

/**
 * The token the platform backend issued for whoever is signed in.
 *
 * The backend wants to see the same token on every later request, so it
 * is kept with the session and read back out of it here.
 *
 * It lives on its own rather than in the session module because the
 * backend adapter needs it, and the backend adapter is reached from the
 * store, which the session module itself reaches. Keeping it separate
 * means neither has to know about the other.
 */
export async function upstreamToken(): Promise<string | null> {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE)?.value;
  if (!session) return null;

  const row = await readSession(session);
  return row?.token ?? null;
}
