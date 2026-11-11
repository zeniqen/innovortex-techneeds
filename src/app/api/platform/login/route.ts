import { cookies } from "next/headers";

import { authenticate, SIGN_IN_ROLES, type AuthResult } from "@/lib/platform/auth";
import {
  createSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/platform/session";
import type { Role } from "@/lib/platform/types";

/**
 * Signing in.
 *
 * The body is `{ role, identifier, password }`. The role decides which
 * table is checked: a mentee is found by enrollment number, a mentor and
 * an admin by email.
 */
export async function POST(request: Request) {
  let body: { role?: unknown; identifier?: unknown; password?: unknown };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const role = body.role;
  const identifier = typeof body.identifier === "string" ? body.identifier : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (typeof role !== "string" || !SIGN_IN_ROLES.includes(role as Role)) {
    return Response.json({ error: "Unknown role" }, { status: 400 });
  }
  if (!identifier.trim() || !password) {
    return Response.json(
      { error: "Enter your identifier and password" },
      { status: 400 },
    );
  }

  const result: AuthResult = await authenticate(
    role as Role,
    identifier,
    password,
  );

  if (!result.ok) {
    // The same message for a wrong password and an account that does not
    // exist, so the response does not say which one it was.
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSession(
    result.user.role,
    result.user.id,
    result.token,
  );
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions());

  return Response.json({
    ok: true,
    user: {
      role: result.user.role,
      id: result.user.id,
      name: result.user.name,
      identifier: result.user.identifier,
    },
  });
}
