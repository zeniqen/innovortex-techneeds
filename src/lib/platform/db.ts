import {
  createClient,
  type Client,
  type InStatement,
  type InValue,
  type Row,
} from "@libsql/client";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { migrate } from "./schema";

/**
 * The database connection.
 *
 * SQLite is used through `@libsql/client` rather than `better-sqlite3`
 * because the two are the same database but not the same deployment story:
 *
 *  - locally and on a plain Node server the URL is a `file:` path, so the
 *    database is a file on disk
 *  - on Vercel and other serverless platforms there is no writable disk, so
 *    `DATABASE_URL` points at a remote libSQL/Turso database
 *
 * Either way the SQL is the same, so nothing above this file has to know
 * which one it is talking to.
 */

/**
 * Where the database lives.
 *
 * `DATABASE_URL` wins when it is set. Otherwise the database is a file in
 * `.data/` next to the project, which is what development uses.
 */
export function databaseUrl(): string {
  const configured = process.env.DATABASE_URL?.trim();
  if (configured) return configured;
  return `file:${process.cwd()}/.data/techneeds.db`;
}

/**
 * True when the database is a local file rather than a remote server.
 */
export function isLocalDatabase(): boolean {
  return databaseUrl().startsWith("file:");
}

type GlobalWithDb = typeof globalThis & {
  __techneedsDb?: Client;
  __techneedsDbReady?: Promise<void>;
};

/**
 * The connection, created once per process.
 *
 * It is kept on `globalThis` rather than in a module variable because the
 * dev server re-evaluates modules on every hot reload, and a new client per
 * reload would open a new connection each time.
 */
function client(): Client {
  const scope = globalThis as GlobalWithDb;
  if (!scope.__techneedsDb) {
    const url = databaseUrl();
    if (url.startsWith("file:")) {
      const path = url.slice("file:".length);
      try {
        mkdirSync(dirname(path), { recursive: true });
      } catch {
        // The directory may already exist, or the filesystem may be read
        // only. If it is read only the connection below will say so.
      }
    }
    scope.__techneedsDb = createClient({ url });
  }
  return scope.__techneedsDb;
}

/**
 * Creates the tables if they are not there yet.
 *
 * Called once per process. Every caller waits on the same promise, so
 * concurrent requests during a cold start do not race each other.
 */
function ready(): Promise<void> {
  const scope = globalThis as GlobalWithDb;
  if (!scope.__techneedsDbReady) {
    scope.__techneedsDbReady = migrate(async (sql) => {
      await client().execute(sql);
    }).catch((error: unknown) => {
      // Let the next request try again rather than caching the failure.
      scope.__techneedsDbReady = undefined;
      throw error;
    });
  }
  return scope.__techneedsDbReady;
}

/**
 * Runs a statement and returns the rows.
 */
export async function query<T = Row>(
  sql: string,
  args: InValue[] = [],
): Promise<T[]> {
  await ready();
  const result = await client().execute({ sql, args });
  return result.rows as T[];
}

/**
 * Runs a statement and returns the first row, if there is one.
 */
export async function queryOne<T = Row>(
  sql: string,
  args: InValue[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, args);
  return rows[0] ?? null;
}

/**
 * Runs a statement that changes something.
 */
export async function execute(
  sql: string,
  args: InValue[] = [],
): Promise<void> {
  await ready();
  await client().execute({ sql, args });
}

/**
 * Runs a group of statements as one atomic batch.
 *
 * The statements are collected while `work` runs and then applied together,
 * so either all of them land or none of them do. `work` must not read back
 * anything it writes, because the statements have not run yet when it is
 * called.
 */
export async function writeBatch<T>(
  work: (run: (sql: string, args?: InValue[]) => void) => Promise<T> | T,
): Promise<T> {
  await ready();

  const statements: InStatement[] = [];
  const run = (sql: string, args: InValue[] = []) => {
    statements.push({ sql, args });
  };

  const result = await work(run);

  if (statements.length > 0) {
    await client().batch(statements, "write");
  }

  return result;
}

/**
 * A short description of where the database lives, for the admin panel.
 */
export function describeDatabase(): string {
  const url = databaseUrl();
  if (url.startsWith("file:")) {
    return `local file ${url.slice("file:".length)}`;
  }
  try {
    return `remote ${new URL(url).host}`;
  } catch {
    return "remote";
  }
}
