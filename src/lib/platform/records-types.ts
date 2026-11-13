import type { Role } from "./types";

/**
 * The platform's own records.
 *
 * These are the things the platform keeps about itself rather than about
 * its content: who is signed in, who runs the platform, and what has
 * been done.
 *
 * They live in a store of their own, with the same two implementations as
 * the platform data itself. One keeps them in this project's own SQLite
 * database; the other keeps them in the backend that came with the
 * platform.
 *
 * They are separate from the platform data because they have to be
 * somewhere that survives a restart wherever the platform is running. A
 * deployed frontend has no database of its own, so in that case they live
 * in the backend, which has one.
 */

/**
 * A session.
 */
export interface SessionRecord {
  role: Role;
  userId: string;
  /**
   * The token the platform backend issued, if there is one.
   *
   * The backend wants to see the same token on every later request, so it
   * is kept with the session.
   */
  token: string | null;
  /** When the session stops being any use, as a date. */
  expiresAt: Date;
}

/**
 * An admin.
 */
export interface AdminRecord {
  id: string;
  name: string;
  email: string;
}

/**
 * A line in the audit log.
 */
export interface AuditRecord {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  subject: string;
  detail: string;
  createdAt: Date;
}

/**
 * What the platform can do with its own records, whoever holds them.
 */
export interface RecordsStore {
  // --- sessions ---
  /** Starts a session and returns the token that finds it again. */
  createSession(input: {
    role: Role;
    userId: string;
    token: string | null;
    expiresAt: Date;
  }): Promise<string>;
  /** The session a token points at, if it is still good. */
  readSession(token: string): Promise<SessionRecord | null>;
  /** Ends a session. */
  destroySession(token: string): Promise<void>;

  // --- admins ---
  /** How many admins there are. */
  adminCount(): Promise<number>;
  /** Signs an admin in, if the password is right. */
  authenticateAdmin(
    email: string,
    password: string,
  ): Promise<AdminRecord | null>;
  /** The admin behind an id. */
  getAdmin(id: string): Promise<AdminRecord | null>;
  /** Makes an admin. */
  createAdmin(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<AdminRecord>;
  /** Removes every admin. */
  resetAdmins(): Promise<void>;

  // --- the audit log ---
  /** Writes a line in the audit log. */
  audit(input: {
    actorId?: string;
    actorRole?: Role;
    action: string;
    subject?: string;
    detail?: string;
  }): Promise<void>;
  /** The most recent entries in the audit log. */
  recentAudit(limit?: number): Promise<AuditRecord[]>;
}
