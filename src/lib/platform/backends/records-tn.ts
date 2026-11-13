import { createHash, randomBytes } from "node:crypto";

import { tnCall } from "./tn-call";
import type {
  AdminRecord,
  AuditRecord,
  RecordsStore,
  SessionRecord,
} from "../records-types";
import type { Role } from "../types";

/**
 * The platform's own records, kept in the backend.
 *
 * This is the store for a deployed frontend, which has no database of its
 * own. The backend already holds the platform, so the sessions, the admins
 * and the audit log go there too.
 *
 * The admin key is sent with every write and every read that is not a
 * sign-in, because these are the platform's private records. The key
 * never reaches the browser: the frontend's own API routes add it on the
 * server side.
 */

/**
 * How long a session lasts.
 */
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

interface TnAdmin {
  _id: string;
  name: string;
  email: string;
}

interface TnSession {
  role: Role;
  userId: string;
  token: string | null;
  expiresAt: string;
}

interface TnAudit {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  subject: string;
  detail: string;
  createdAt: string;
}

function toAdmin(document: TnAdmin): AdminRecord {
  return {
    id: document._id,
    name: document.name,
    email: document.email,
  };
}

export async function createSession(input: {
  role: Role;
  userId: string;
  token: string | null;
  expiresAt: Date;
}): Promise<string> {
  const token = randomBytes(32).toString("base64url");

  await tnCall("/api/platform/sessions", {
    method: "POST",
    admin: true,
    body: {
      id: hashToken(token),
      role: input.role,
      userId: input.userId,
      token: input.token,
      expiresAt: input.expiresAt.toISOString(),
    },
  });

  return token;
}

export async function readSession(
  token: string,
): Promise<SessionRecord | null> {
  try {
    const row = await tnCall<TnSession>(`/api/platform/sessions/${hashToken(token)}`, {
      admin: true,
    });

    if (!row) return null;

    const expiresAt = new Date(row.expiresAt);
    if (expiresAt.getTime() < Date.now()) {
      await destroySession(token);
      return null;
    }

    return {
      role: row.role,
      userId: row.userId,
      token: row.token ?? null,
      expiresAt,
    };
  } catch {
    // A session that cannot be read is a session nobody is signed in as.
    return null;
  }
}

export async function destroySession(token: string): Promise<void> {
  try {
    await tnCall(`/api/platform/sessions/${hashToken(token)}`, {
      method: "DELETE",
      admin: true,
    });
  } catch {
    // The session is being thrown away, so a failure to reach the backend
    // does not matter: the cookie is cleared either way.
  }
}

export async function adminCount(): Promise<number> {
  try {
    const admins = await tnCall<TnAdmin[]>("/api/platform/admins", {
      admin: true,
    });
    return admins.length;
  } catch {
    return 0;
  }
}

export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<AdminRecord | null> {
  try {
    const result = await tnCall<{ admin: TnAdmin }>("/api/platform/admins/login", {
      method: "POST",
      body: { email: email.trim().toLowerCase(), password },
    });

    return result.admin ? toAdmin(result.admin) : null;
  } catch {
    return null;
  }
}

export async function getAdmin(id: string): Promise<AdminRecord | null> {
  try {
    const admins = await tnCall<TnAdmin[]>("/api/platform/admins", {
      admin: true,
    });
    const found = admins.find((admin) => admin._id === id);
    return found ? toAdmin(found) : null;
  } catch {
    return null;
  }
}

export async function createAdmin(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AdminRecord> {
  const result = await tnCall<{ admin: TnAdmin }>("/api/platform/admins", {
    method: "POST",
    admin: true,
    body: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
    },
  });

  return toAdmin(result.admin);
}

export async function resetAdmins(): Promise<void> {
  await tnCall("/api/platform/admins", { method: "DELETE", admin: true });
}

export async function audit(input: {
  actorId?: string;
  actorRole?: Role;
  action: string;
  subject?: string;
  detail?: string;
}): Promise<void> {
  await tnCall("/api/platform/audit", {
    method: "POST",
    admin: true,
    body: {
      id: `audit_${randomBytes(16).toString("hex")}`,
      actorId: input.actorId ?? "",
      actorRole: input.actorRole ?? "",
      action: input.action,
      subject: input.subject ?? "",
      detail: input.detail ?? "",
    },
  });
}

export async function recentAudit(limit = 25): Promise<AuditRecord[]> {
  try {
    const entries = await tnCall<TnAudit[]>(
      `/api/platform/audit?limit=${limit}`,
      { admin: true },
    );

    return entries.map((entry) => ({
      id: entry.id,
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      action: entry.action,
      subject: entry.subject,
      detail: entry.detail,
      createdAt: new Date(entry.createdAt),
    }));
  } catch {
    return [];
  }
}

/**
 * The hash of a session token.
 *
 * The hash is what the session is stored under, so a read of the sessions
 * does not hand over a usable credential.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
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
