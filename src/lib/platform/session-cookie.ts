/**
 * The name of the session cookie.
 *
 * It lives on its own because both the session store and the tn backend
 * need it, and the session store imports the store, which imports the tn
 * backend. A shared constant keeps that from being a cycle.
 */
export const SESSION_COOKIE = "tn_session";
