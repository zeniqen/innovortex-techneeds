import {
  adminCount,
  audit,
  createAdmin,
  getAdmin,
  recentAudit,
  resetAdmins,
} from "./records";

/**
 * The admins and the audit log.
 *
 * An admin is the person who runs the platform rather than a person in
 * it, and the audit log is a record of what was done.
 *
 * They live with the sessions, in whichever store is holding the
 * platform's own records. An admin is not a mentor or a mentee, so the
 * tn backend has no other place to keep one.
 */

export { adminCount, audit, createAdmin, getAdmin, recentAudit, resetAdmins };
