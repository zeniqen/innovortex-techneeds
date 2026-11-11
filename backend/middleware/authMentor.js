const jwt = require('jsonwebtoken');
const Mentor = require('../models/Mentor');
const Mentee = require('../models/Mentee');

/**
 * The token the frontend sends.
 *
 * It is the same JWT the login routes issue, in the `x-auth-token` header.
 */
function readToken(req) {
  return req.header('x-auth-token');
}

/**
 * Signs a mentor in.
 *
 * The mentor is attached to the request without its password.
 */
exports.authenticate = async (req, res, next) => {
  const token = readToken(req);
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const mentor = await Mentor.findById(decoded.id).select('-password');
    if (!mentor) return res.status(401).json({ error: 'Mentor not found' });

    req.mentor = mentor; // Attach mentor to request
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Signs a mentee in.
 */
exports.authenticateMentee = async (req, res, next) => {
  const token = readToken(req);
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const mentee = await Mentee.findById(decoded.id).select('-password');
    if (!mentee) return res.status(401).json({ error: 'Mentee not found' });

    req.mentee = mentee;
    next();
  } catch (err) {
    console.error('Mentee token error:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Signs anybody in.
 *
 * A mentor looking at a mentee's profile and a mentee looking at their own
 * both need to read the same things, and neither has the other's token.
 */
exports.authenticateAny = async (req, res, next) => {
  const token = readToken(req);
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const mentor = await Mentor.findById(decoded.id).select('-password');
    if (mentor) {
      req.mentor = mentor;
      req.user = { role: 'mentor', id: mentor._id, name: mentor.name };
      return next();
    }

    const mentee = await Mentee.findById(decoded.id).select('-password');
    if (mentee) {
      req.mentee = mentee;
      req.user = { role: 'mentee', id: mentee._id, name: mentee.name };
      return next();
    }

    res.status(401).json({ error: 'Account not found' });
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Signs an administrator in.
 *
 * The admin key is a shared secret rather than an account: the admin of
 * the platform is whoever holds it, and it never travels to the browser.
 */
exports.requireAdmin = async (req, res, next) => {
  const key = req.header('x-admin-key');
  const expected = process.env.ADMIN_KEY;

  if (!expected) {
    return res.status(501).json({
      error: 'This backend has no ADMIN_KEY set, so it cannot accept admin writes.'
    });
  }
  if (!key || key !== expected) {
    return res.status(403).json({ error: 'Admin key required' });
  }

  next();
};
