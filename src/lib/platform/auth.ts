import { verifyPassword } from "./credentials";
import { queryOne } from "./db";
import { authenticateAdmin } from "./records";
import { tnCall } from "./backends/tn-call";
import { usesTnBackend } from "./store";
import type { Role, SessionUser } from "./types";

/**
 * Signing in.
 *
 * A mentee signs in with the enrollment number their mentor gave them. A
 * mentor or an admin signs in with an email address.
 *
 * When the platform data is being held by the tn backend, the credentials
 * are checked against that backend, which is where the accounts live. The
 * token it issues is kept with the session, because that is what it wants
 * to see on every later request.
 *
 * The admin is checked against the platform's own records, whichever store
 * is holding them. The tn backend has no admin role of its own, and an
 * admin is the person who runs the platform rather than a person in it.
 */

/**
 * The result of a sign-in attempt.
 */
export type AuthResult =
  | { ok: true; user: SessionUser; token?: string }
  | { ok: false; reason: "invalid" | "role" };

/**
 * Checks a set of credentials.
 */
export async function authenticate(
  role: Role,
  identifier: string,
  password: string,
): Promise<AuthResult> {
  if (role === "admin") {
    return authenticateAdminAccount(identifier, password);
  }

  if (usesTnBackend) {
    return authenticateUpstream(role, identifier, password);
  }
  return authenticateLocal(role, identifier, password);
}

/**
 * Checks the credentials against this project's own database.
 */
async function authenticateLocal(
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

  const row = await queryOne<{
    id: string;
    name: string;
    email: string;
    password_hash: string;
  }>(`SELECT id, name, email, password_hash FROM mentors WHERE email = ?`, [
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
      role,
      id: row.id,
      name: row.name,
      identifier: row.email,
      programIds: [],
    },
  };
}

/**
 * Checks the credentials against the tn backend.
 */
async function authenticateUpstream(
  role: Role,
  identifier: string,
  password: string,
): Promise<AuthResult> {
  const path = role === "mentor" ? "/api/mentors/login" : "/api/m/login";
  const body =
    role === "mentor"
      ? { email: identifier.trim().toLowerCase(), password }
      : { enrollmentNumber: identifier.trim().toUpperCase(), password };

  try {
    const result = await tnCall<{
      token: string;
      mentor?: { _id: string; name: string; email: string };
      user?: { id: string; name: string; enrollmentNumber: string };
    }>(path, { method: "POST", body });

    if (role === "mentor") {
      const mentor = result.mentor;
      if (!mentor) return { ok: false, reason: "invalid" };
      return {
        ok: true,
        token: result.token,
        user: {
          role,
          id: mentor._id,
          name: mentor.name,
          identifier: mentor.email,
          programIds: [],
        },
      };
    }

    const user = result.user;
    if (!user) return { ok: false, reason: "invalid" };
    return {
      ok: true,
      token: result.token,
      user: {
        role,
        id: user.id,
        name: user.name,
        identifier: user.enrollmentNumber,
        programIds: [],
      },
    };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

/**
 * Checks an admin's credentials.
 *
 * The password is checked wherever the admins are kept, so the hash
 * never travels between the frontend and the backend.
 */
async function authenticateAdminAccount(
  identifier: string,
  password: string,
): Promise<AuthResult> {
  const admin = await authenticateAdmin(
    identifier.trim().toLowerCase(),
    password,
  );
  if (!admin) return { ok: false, reason: "invalid" };

  return {
    ok: true,
    user: {
      role: "admin",
      id: admin.id,
      name: admin.name,
      identifier: admin.email,
      programIds: [],
    },
  };
}

/**
 * The roles a person can sign in as.
 */
export const SIGN_IN_ROLES: Role[] = ["mentee", "mentor", "admin"];
