import * as sqlite from "./backends/records-sqlite";
import * as tn from "./backends/records-tn";
import type { RecordsStore } from "./records-types";

/**
 * Where the platform's own records live.
 *
 * They follow the platform data: by default they are in the backend that
 * came with the platform, running on this machine at
 * http://localhost:8000, which is what the brief asks for. Set
 * `PLATFORM_BACKEND=sqlite` to keep them in this project's own database
 * instead, which needs no MongoDB and nothing else set up.
 *
 * They are a store of their own rather than part of the platform data
 * because they have to be somewhere that survives a restart wherever the
 * platform is running. A deployed frontend has no database of its own, so
 * there they live in the backend.
 */
const records: RecordsStore =
  process.env.PLATFORM_BACKEND === "sqlite" ? sqlite.store : tn.store;

export const createSession = records.createSession;
export const readSession = records.readSession;
export const destroySession = records.destroySession;

export const adminCount = records.adminCount;
export const authenticateAdmin = records.authenticateAdmin;
export const getAdmin = records.getAdmin;
export const createAdmin = records.createAdmin;
export const resetAdmins = records.resetAdmins;

export const audit = records.audit;
export const recentAudit = records.recentAudit;
