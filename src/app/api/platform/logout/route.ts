import { cookies } from "next/headers";

import {
  destroySession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/platform/session";

/**
 * Signing out.
 *
 * The session row is removed as well as the cookie, so a copy of the
 * cookie that was taken before the sign-out does not work.
 */
export async function POST() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    await destroySession(token);
  }

  store.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });

  return Response.json({ ok: true });
}
