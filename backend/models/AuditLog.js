const mongoose = require('mongoose');

/**
 * The audit log.
 *
 * A record of what was done and by whom. It is what the admin panel
 * shows as the recent activity.
 */
const AuditLogSchema = new mongoose.Schema({
  id: { type: String, required: true },
  actorId: { type: String, default: '' },
  actorRole: { type: String, default: '' },
  action: { type: String, required: true },
  subject: { type: String, default: '' },
  detail: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
