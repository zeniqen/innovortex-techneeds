const mongoose = require('mongoose');

/**
 * An admin of the platform.
 *
 * The admin is the person who runs the platform rather than a person in
 * it: they make the programs, put the mentors on them and give the marks.
 *
 * The password is a bcrypt hash, like every other account on the
 * backend. It is never sent back out, not even to the admin themselves.
 */
const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Admin', AdminSchema);
