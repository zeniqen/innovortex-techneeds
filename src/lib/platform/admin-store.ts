/**
 * The admins and the audit log.
 *
 * These stay in this project's own database whichever backend is holding
 * the platform data. An admin is the person who runs the platform rather
 * than a person in it, and the audit log is a record of what was done.
 */

import { execute, query, queryOne } from "./db";
import { hashPassword } from "./credentials";
import type { Role } from "./types";

/**
 * Creates an admin.
 *
 * There is only ever meant to be one way in: the first admin is created
 * during setup, before anyone can sign in. After that an admin can add
 * more from the admin panel.
 */
export async function createAdmin(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ id: string; email: string }> {
  const id = `admin_${crypto.randomUUID().replace(/-/g, "")}`;
  await execute(
    `INSERT INTO admins (id, name, email, password_hash, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      id,
      input.name.trim(),
      input.email.trim().toLowerCase(),
      await hashPassword(input.password),
      new Date().toISOString(),
    ],
  );
  return { id, email: input.email.trim().toLowerCase() };
}

/**
 * How many admins there are.
 */
export async function adminCount(): Promise<number> {
  const row = await queryOne<{ count: number }>(
    `SELECT count(*) AS count FROM admins`,
  );
  return row?.count ?? 0;
}

/**
 * Removes every admin.
 *
 * Used when a setup fails part way through, so the next attempt can make
 * the first admin again instead of colliding with one that already exists.
 */
export async function resetAdmins(): Promise<void> {
  await execute(`DELETE FROM admins`);
}

/**
 * Writes a line to the audit log.
 */
export async function audit(input: {
  actorId?: string;
  actorRole?: Role;
  action: string;
  subject?: string;
  detail?: string;
}): Promise<void> {
  await execute(
    `INSERT INTO audit_log (id, actor_id, actor_role, action, subject, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      `audit_${crypto.randomUUID().replace(/-/g, "")}`,
      input.actorId ?? "",
      input.actorRole ?? "",
      input.action,
      input.subject ?? "",
      input.detail ?? "",
      new Date().toISOString(),
    ],
  );
}

/**
 * The most recent entries in the audit log.
 */
export async function recentAudit(limit = 25): Promise<
  {
    id: string;
    actorRole: string;
    action: string;
    subject: string;
    detail: string;
    createdAt: string;
  }[]
> {
  const rows = await query<{
    id: string;
    actor_role: string;
    action: string;
    subject: string;
    detail: string;
    created_at: string;
  }>(`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?`, [limit]);

  return rows.map((row) => ({
    id: row.id,
    actorRole: row.actor_role,
    action: row.action,
    subject: row.subject,
    detail: row.detail,
    createdAt: row.created_at,
  }));
}
