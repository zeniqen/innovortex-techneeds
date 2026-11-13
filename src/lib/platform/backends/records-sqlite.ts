import { createHash, randomBytes } from "node:crypto";

import { execute, query, queryOne } from "../db";
import { hashPassword, verifyPassword } from "../credentials";
import type {
  AdminRecord,
  AuditRecord,
  RecordsStore,
  SessionRecord,
} from "../records-types";
import type { Role } from "../types";

/**
 * The platform's own records, kept in this project's own database.
 *
 * This is the store for a development machine and for the SQLite mode,
 * where there is one database and it holds everything.
 */

/**
 * The hash of a session token.
 *
 * The hash is what the session is stored under, so a read of the sessions
 * table does not hand over a usable credential.
 */
function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * How long a session lasts.
 */
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export async function createSession(input: {
  role: Role;
  userId: string;
  token: string | null;
  expiresAt: Date;
}): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();

  await execute(
    `INSERT INTO sessions (id, role, user_id, token, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      tokenHash(token),
      input.role,
      input.userId,
      input.token,
      now.toISOString(),
      input.expiresAt.toISOString(),
    ],
  );

  return token;
}

export async function readSession(
  token: string,
): Promise<SessionRecord | null> {
  const row = await queryOne<{
    role: Role;
    user_id: string;
    token: string | null;
    expires_at: string;
  }>(
    `SELECT role, user_id, token, expires_at FROM sessions WHERE id = ?`,
    [tokenHash(token)],
  );

  if (!row) return null;

  const expiresAt = new Date(row.expires_at);
  if (expiresAt.getTime() < Date.now()) {
    await destroySession(token);
    return null;
  }

  return {
    role: row.role,
    userId: row.user_id,
    token: row.token,
    expiresAt,
  };
}

export async function destroySession(token: string): Promise<void> {
  await execute(`DELETE FROM sessions WHERE id = ?`, [tokenHash(token)]);
}

export async function adminCount(): Promise<number> {
  const row = await queryOne<{ count: number }>(
    `SELECT count(*) AS count FROM admins`,
  );
  return row?.count ?? 0;
}

export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<AdminRecord | null> {
  const row = await queryOne<{
    id: string;
    name: string;
    email: string;
    password_hash: string;
  }>(
    `SELECT id, name, email, password_hash
       FROM admins
      WHERE email = ?`,
    [email.trim().toLowerCase()],
  );

  if (!row) {
    // Spend the same time as a real check would.
    await verifyPassword(password, "scrypt$AAAAAAAAAAAAAAAAAAAAAA$AAAA");
    return null;
  }

  if (!(await verifyPassword(password, row.password_hash))) return null;

  return { id: row.id, name: row.name, email: row.email };
}

export async function getAdmin(id: string): Promise<AdminRecord | null> {
  const row = await queryOne<{ id: string; name: string; email: string }>(
    `SELECT id, name, email FROM admins WHERE id = ?`,
    [id],
  );
  return row ? { id: row.id, name: row.name, email: row.email } : null;
}

export async function createAdmin(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AdminRecord> {
  const id = `admin_${crypto.randomUUID().replace(/-/g, "")}`;
  const email = input.email.trim().toLowerCase();

  await execute(
    `INSERT INTO admins (id, name, email, password_hash, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      id,
      input.name.trim(),
      email,
      await hashPassword(input.password),
      new Date().toISOString(),
    ],
  );

  return { id, name: input.name.trim(), email };
}

export async function resetAdmins(): Promise<void> {
  await execute(`DELETE FROM admins`);
}

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

export async function recentAudit(limit = 25): Promise<AuditRecord[]> {
  const rows = await query<{
    id: string;
    actor_id: string;
    actor_role: string;
    action: string;
    subject: string;
    detail: string;
    created_at: string;
  }>(`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?`, [limit]);

  return rows.map((row) => ({
    id: row.id,
    actorId: row.actor_id,
    actorRole: row.actor_role,
    action: row.action,
    subject: row.subject,
    detail: row.detail,
    createdAt: new Date(row.created_at),
  }));
}

export const store: RecordsStore = {
  createSession,
  readSession,
  destroySession,
  adminCount,
  authenticateAdmin,
  getAdmin,
  createAdmin,
  resetAdmins,
  audit,
  recentAudit,
};

export { SESSION_TTL_MS };
