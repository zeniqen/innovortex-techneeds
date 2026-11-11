import { queryOne } from "./db";
import { verifyPassword } from "./credentials";
import type { Role, SessionUser } from "./types";

/**
 * Signing in.
 *
 * A mentee signs in with the enrollment number their mentor gave them, a
 * mentor or an admin with an email address. All three look the same from
 * the outside: an identifier, a password, and a role.
 */

/**
 * The result of a sign-in attempt.
 */
export type AuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: "invalid" | "role" };

/**
 * Checks a set of credentials.
 *
 * The password is always verified, even when the identifier does not
 * exist, so the time taken does not say whether an account is real.
 */
export async function authenticate(
  role: Role,
  identifier: string,
  password: string,
): Promise<AuthResult> {
  const key = identifier.trim();

  if (role === "mentee") {
    const row = await queryOne<{
      id: string;
      name: string;
      enrollment_number: string;
      password_hash: string;
    }>(
      `SELECT id, name, enrollment_number, password_hash
         FROM mentees
        WHERE enrollment_number = ?`,
      [key.toUpperCase()],
    );

    if (!row) {
      // Spend the same time as a real check would.
      await verifyPassword(password, "scrypt$AAAAAAAAAAAAAAAAAAAAAA$AAAA");
      return { ok: false, reason: "invalid" };
    }

    if (!(await verifyPassword(password, row.password_hash))) {
      return { ok: false, reason: "invalid" };
    }

    return {
      ok: true,
      user: {
        role,
        id: row.id,
        name: row.name,
        identifier: row.enrollment_number,
        programIds: [],
      },
    };
  }

  if (role === "mentor") {
    const row = await queryOne<{
      id: string;
      name: string;
      email: string;
      password_hash: string;
    }>(
      `SELECT id, name, email, password_hash FROM mentors WHERE email = ?`,
      [key.toLowerCase()],
    );

    if (!row) {
      await verifyPassword(password, "scrypt$AAAAAAAAAAAAAAAAAAAAAA$AAAA");
      return { ok: false, reason: "invalid" };
    }

    if (!(await verifyPassword(password, row.password_hash))) {
      return { ok: false, reason: "invalid" };
    }

    return {
      ok: true,
      user: {
        role,
        id: row.id,
        name: row.name,
        identifier: row.email,
        programIds: [],
      },
    };
  }

  const row = await queryOne<{
    id: string;
    name: string;
    email: string;
    password_hash: string;
  }>(`SELECT id, name, email, password_hash FROM admins WHERE email = ?`, [
    key.toLowerCase(),
  ]);

  if (!row) {
    await verifyPassword(password, "scrypt$AAAAAAAAAAAAAAAAAAAAAA$AAAA");
    return { ok: false, reason: "invalid" };
  }

  if (!(await verifyPassword(password, row.password_hash))) {
    return { ok: false, reason: "invalid" };
  }

  return {
    ok: true,
    user: {
      role: "admin",
      id: row.id,
      name: row.name,
      identifier: row.email,
      programIds: [],
    },
  };
}

/**
 * The roles a person can sign in as.
 */
export const SIGN_IN_ROLES: Role[] = ["mentee", "mentor", "admin"];
