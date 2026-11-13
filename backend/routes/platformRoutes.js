const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const Admin = require('../models/Admin');
const Session = require('../models/Session');
const AuditLog = require('../models/AuditLog');
const { requireAdmin } = require('../middleware/authMentor');
const router = express.Router();

/**
 * The platform's own records.
 *
 * The programs, mentors, mentees and resources live in their own
 * collections. These three are different: they are the platform's
 * bookkeeping rather than its content.
 *
 *  - admins. The person who runs the platform. There is no admin role in
 *    the rest of the backend, so this is where one lives.
 *  - sessions. Who is signed in. The frontend keeps a cookie holding a
 *    token, and this collection is what that token points at.
 *  - the audit log. A record of what was done and by whom.
 *
 * They are here because the frontend needs them to survive a restart, and
 * because a deployed frontend has no database of its own.
 */

// --- admins ----------------------------------------------------------------

/**
 * Signs an admin in.
 *
 * The password is checked here rather than in the frontend, so the hash
 * never travels.
 */
router.post('/admins/login', async (req, res) => {
  const { email, password } = req.body || {};

  try {
    const admin = await Admin.findOne({
      email: String(email || '').trim().toLowerCase(),
    });

    if (!admin || !(await bcrypt.compare(String(password || ''), admin.password))) {
      // The same answer for a wrong password and for an account that is
      // not there, so the response does not say which one it was.
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt_sign({ id: admin._id.toString(), role: 'admin' });

    res.json({
      token,
      admin: { _id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Every admin.
 *
 * Without their password hashes.
 */
router.get('/admins', requireAdmin, async (req, res) => {
  try {
    const admins = await Admin.find().sort({ createdAt: -1 });
    res.json(
      admins.map((admin) => ({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        createdAt: admin.createdAt,
      })),
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Makes an admin.
 */
router.post('/admins', requireAdmin, async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: 'Name, email and password are required' });
  }

  try {
    const existing = await Admin.findOne({
      email: String(email).trim().toLowerCase(),
    });
    if (existing) {
      return res.status(409).json({ error: 'That email is already registered' });
    }

    const admin = await Admin.create({
      name,
      email: String(email).trim().toLowerCase(),
      password: await bcrypt.hash(String(password), 10),
    });

    res.status(201).json({
      admin: { _id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Removes every admin.
 *
 * Used when a setup fails part way through, so the next attempt can make
 * the first admin again instead of colliding with one that is already
 * there.
 */
router.delete('/admins', requireAdmin, async (req, res) => {
  try {
    await Admin.deleteMany({});
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- sessions --------------------------------------------------------------

/**
 * Starts a session.
 *
 * The token is the hash of what the browser holds, so the browser's
 * cookie cannot be used to read the session back out of the collection.
 */
router.post('/sessions', requireAdmin, async (req, res) => {
  const { id, role, userId, token, expiresAt } = req.body || {};

  if (!id || !role || !userId) {
    return res
      .status(400)
      .json({ error: 'A session needs an id, a role and a user' });
  }

  try {
    await Session.findOneAndUpdate(
      { id },
      {
        id,
        role,
        userId,
        token: token || null,
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 86400000),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * The session a token points at.
 */
router.get('/sessions/:id', requireAdmin, async (req, res) => {
  try {
    const session = await Session.findOne({ id: req.params.id });
    if (!session) return res.status(404).json({ error: 'No such session' });

    res.json({
      role: session.role,
      userId: session.userId,
      token: session.token,
      expiresAt: session.expiresAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Ends a session.
 */
router.delete('/sessions/:id', requireAdmin, async (req, res) => {
  try {
    await Session.deleteOne({ id: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- the audit log ---------------------------------------------------------

/**
 * Writes a line in the audit log.
 */
router.post('/audit', requireAdmin, async (req, res) => {
  const { id, actorId, actorRole, action, subject, detail } = req.body || {};

  if (!action) {
    return res.status(400).json({ error: 'An audit entry needs an action' });
  }

  try {
    await AuditLog.create({
      id: id || `audit_${crypto.randomUUID().replace(/-/g, '')}`,
      actorId: actorId || '',
      actorRole: actorRole || '',
      action,
      subject: subject || '',
      detail: detail || '',
    });

    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * The most recent entries in the audit log.
 */
router.get('/audit', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '25', 10), 200);

    const entries = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(
      entries.map((entry) => ({
        id: entry.id,
        actorId: entry.actorId,
        actorRole: entry.actorRole,
        action: entry.action,
        subject: entry.subject,
        detail: entry.detail,
        createdAt: entry.createdAt,
      })),
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * A token for an admin.
 *
 * The admin is not a mentor or a mentee, so it does not fit the sign-in
 * routes they use. The token is signed with the same secret, so it is
 * understood by the same middleware.
 */
function jwt_sign(payload) {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

module.exports = router;
