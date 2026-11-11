import { redirect } from "next/navigation";

import { currentUser } from "./session";
import type { Role, SessionUser } from "./types";

/**
 * The panels are guarded by the session.
 *
 * A page asks for the role it belongs to. If the visitor is signed in as
 * somebody else, they are sent to the panel they do belong to rather than
 * being shown a page they cannot use.
 */

/**
 * The page for a role.
 */
export function panelPath(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "mentor") return "/mentor";
  return "/mentee";
}

/**
 * The signed-in user, or a redirect to the sign-in page.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * The signed-in user, and only that user.
 *
 * A visitor who is signed in with a different role is sent to their own
 * panel.
 */
export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== role) redirect(panelPath(user.role));
  return user;
}

/**
 * The signed-in user, when there is one.
 */
export async function optionalUser(): Promise<SessionUser | null> {
  return currentUser();
}

/**
 * The signed-in user, for a route handler.
 *
 * A route handler answers with a status code rather than a redirect, so
 * this returns null instead of throwing.
 */
export async function apiUser(role: Role): Promise<SessionUser | null> {
  const user = await currentUser();
  if (!user) return null;
  if (user.role !== role) return null;
  return user;
}

/**
 * The signed-in mentor, when the caller is one.
 */
export async function apiMentor(): Promise<SessionUser | null> {
  return apiUser("mentor");
}

/**
 * The signed-in mentee, when the caller is one.
 */
export async function apiMentee(): Promise<SessionUser | null> {
  return apiUser("mentee");
}
