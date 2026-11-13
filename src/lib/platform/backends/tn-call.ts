import { createHash } from "node:crypto";

/**
 * Talking to the tn backend.
 *
 * The backend that came with the platform is an Express and MongoDB
 * server, reached over HTTP. This is the one place that knows how to
 * speak to it, so that the rest of the platform does not have to.
 *
 * It is kept separate from the rest of the tn backend because the
 * session store needs to ask the backend for a session, and the backend
 * adapter needs to ask the session store for a token. Splitting the
 * conversation off here keeps that from being a circle.
 */

import { SESSION_COOKIE } from "../session-cookie";

/**
 * Where the tn backend is.
 */
export const BASE = (
  process.env.TN_BACKEND_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

/**
 * The key the admin writes need. It never reaches the browser: the
 * frontend's own API routes add it on the server side.
 */
export const ADMIN_KEY = process.env.TN_ADMIN_KEY ?? process.env.ADMIN_KEY ?? "";

/**
 * A request to the tn backend.
 */
export async function tnCall<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string;
    admin?: boolean;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.token) headers["x-auth-token"] = options.token;
  if (options.admin && ADMIN_KEY) headers["x-admin-key"] = ADMIN_KEY;

  const request = () =>
    fetch(`${BASE}${path}`, {
      method: options.method ?? "GET",
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
    });

  let response: Response;
  try {
    response = await request();
  } catch (error) {
    // A dropped connection should not take a whole panel down with it, so
    // it is tried once more before giving up.
    await new Promise((resolve) => setTimeout(resolve, 250));
    try {
      response = await request();
    } catch {
      throw new Error(
        `Could not reach the platform backend at ${BASE}: ${
          error instanceof Error ? error.message : "the connection failed"
        }`,
      );
    }
  }

  const text = await response.text();

  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `The platform backend answered ${response.status} with something that is not JSON`,
    );
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `The platform backend answered ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

/**
 * The hash of a session token.
 *
 * The hash is what the session is stored under, so a read of the sessions
 * does not hand over a usable credential.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export { SESSION_COOKIE };
