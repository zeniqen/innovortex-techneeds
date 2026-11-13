const mongoose = require('mongoose');

/**
 * A session.
 *
 * A session is what the frontend keeps a signed-in person in. The row is
 * found by the hash of the token, so a read of the sessions collection
 * does not hand over a usable credential.
 *
 * `token` is the token the platform backend itself issued, kept here so
 * that later requests can be made as that person.
 */
const SessionSchema = new mongoose.Schema({
  // The hash of the session token.
  id: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  userId: { type: String, required: true },
  // The token the platform backend issued for this person.
  token: { type: String, default: null },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', SessionSchema);
