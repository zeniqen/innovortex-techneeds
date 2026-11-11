import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";

import { execute, queryOne } from "./db";
import type { Role, SessionUser } from "./types";

/**
 * Sessions.
 *
 * A session is a row in the database and a cookie holding the session
 * token. Only the hash of the token is stored, so a read of the sessions
 * table does not hand over a usable credential.
 *
 * The cookie is httpOnly, so a script on the page cannot read it, and
 * sameSite lax, so a link from another site cannot ride it.
 */

export const SESSION_COOKIE = "tn_session";

/**
 * How long a session lasts.
 */
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

/**
 * The hash of a session token.
 */
function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a session and returns the token to put in the cookie.
 */
export async function createSession(
  role: Role,
  userId: string,
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();

  await execute(
    `INSERT INTO sessions (id, role, user_id, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      tokenHash(token),
      role,
      userId,
      new Date(now).toISOString(),
      new Date(now + SESSION_TTL_MS).toISOString(),
    ],
  );

  return token;
}

/**
 * Ends a session.
 */
export async function destroySession(token: string): Promise<void> {
  await execute(`DELETE FROM sessions WHERE id = ?`, [tokenHash(token)]);
}

/**
 * Removes the sessions that have expired.
 */
export async function pruneSessions(): Promise<void> {
  await execute(`DELETE FROM sessions WHERE expires_at < ?`, [
    new Date().toISOString(),
  ]);
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

  const row = await queryOne<{
    id: string;
    role: Role;
    user_id: string;
    expires_at: string;
  }>(
    `SELECT id, role, user_id, expires_at FROM sessions WHERE id = ?`,
    [tokenHash(token)],
  );

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await destroySession(token);
    return null;
  }

  return userForSession(row.role, row.user_id);
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
    const mentee = await queryOne<{
      id: string;
      name: string;
      enrollment_number: string;
    }>(
      `SELECT id, name, enrollment_number FROM mentees WHERE id = ?`,
      [userId],
    );
    if (!mentee) return null;
    return {
      role,
      id: mentee.id,
      name: mentee.name,
      identifier: mentee.enrollment_number,
      programIds: await programIdsFor("mentee", mentee.id),
    };
  }

  if (role === "mentor") {
    const mentor = await queryOne<{
      id: string;
      name: string;
      email: string;
    }>(`SELECT id, name, email FROM mentors WHERE id = ?`, [userId]);
    if (!mentor) return null;
    return {
      role,
      id: mentor.id,
      name: mentor.name,
      identifier: mentor.email,
      programIds: await programIdsFor("mentor", mentor.id),
    };
  }

  const admin = await queryOne<{
    id: string;
    name: string;
    email: string;
  }>(`SELECT id, name, email FROM admins WHERE id = ?`, [userId]);
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
 * The programs a user is attached to.
 */
async function programIdsFor(
  role: "mentor" | "mentee",
  userId: string,
): Promise<string[]> {
  const table = role === "mentor" ? "mentor_programs" : "mentee_programs";
  const column = role === "mentor" ? "mentor_id" : "mentee_id";
  const rows = await queryOne<{ ids: string }>(
    `SELECT group_concat(program_id) AS ids FROM ${table} WHERE ${column} = ?`,
    [userId],
  );
  if (!rows?.ids) return [];
  return rows.ids.split(",").filter(Boolean);
}
