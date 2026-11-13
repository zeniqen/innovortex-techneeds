import { cookies } from "next/headers";
import { connection } from "next/server";

import {
  createSession as storeCreateSession,
  destroySession as storeDestroySession,
  getAdmin,
  readSession as storeReadSession,
} from "./records";
import { SESSION_COOKIE } from "./session-cookie";
import { getMentee, getMentor } from "./store";
import type { Role, SessionUser } from "./types";

/**
 * Sessions.
 *
 * A session is a record somewhere that survives a restart, and a cookie
 * holding the token that finds it. Only the hash of the token is stored,
 * so a read of the sessions does not hand over a usable credential.
 *
 * When the platform data is being held by the tn backend, the session
 * also keeps the token that backend issued, because that is what the
 * backend wants to see on every later request.
 */

export { SESSION_COOKIE };

/**
 * How long a session lasts.
 */
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

/**
 * Creates a session and returns the token to put in the cookie.
 */
export async function createSession(
  role: Role,
  userId: string,
  upstreamToken?: string,
): Promise<string> {
  return storeCreateSession({
    role,
    userId,
    token: upstreamToken ?? null,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
}

/**
 * Ends a session.
 */
export async function destroySession(token: string): Promise<void> {
  await storeDestroySession(token);
}

/**
 * The cookie options shared by every place the cookie is written.
 */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

/**
 * Reads the session from the request cookies.
 *
 * Returns null when there is no session, when it has expired, or when the
 * user behind it has since been deleted.
 */
export async function readSession(
  token: string | undefined,
): Promise<SessionUser | null> {
  if (!token) return null;

  const row = await storeReadSession(token);
  if (!row) return null;

  return userForSession(row.role, row.userId);
}

/**
 * The signed-in user, read from the request cookies.
 *
 * This is the one every server component uses to decide what to render.
 *
 * `connection()` marks the render as one that has to happen at request
 * time. Without it the framework tries to prerender the panel, and the
 * clock read while checking whether the session has expired makes that
 * prerender impossible.
 */
export async function currentUser(): Promise<SessionUser | null> {
  await connection();
  const store = await cookies();
  return readSession(store.get(SESSION_COOKIE)?.value);
}

/**
 * Looks up the details behind a session.
 */
async function userForSession(
  role: Role,
  userId: string,
): Promise<SessionUser | null> {
  if (role === "mentee") {
    const mentee = await getMentee(userId);
    if (!mentee) return null;
    return {
      role,
      id: mentee.id,
      name: mentee.name,
      identifier: mentee.enrollmentNumber,
      programIds: mentee.programIds,
    };
  }

  if (role === "mentor") {
    const mentor = await getMentor(userId);
    if (!mentor) return null;
    return {
      role,
      id: mentor.id,
      name: mentor.name,
      identifier: mentor.email,
      programIds: mentor.programIds,
    };
  }

  // The admin is always ours, whichever backend holds the platform data.
  const admin = await getAdmin(userId);
  if (!admin) return null;

  return {
    role: "admin",
    id: admin.id,
    name: admin.name,
    identifier: admin.email,
    programIds: [],
  };
}

/**
 * The token the tn backend issued, if the session has one.
 */
export { upstreamToken } from "./upstream-token";
