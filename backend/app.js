require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const app = express();

// Connect to MongoDB.
//
// The connection is kept open rather than made once at startup, because
// on a serverless runtime the process is started up for a request. The
// connection itself is cached on the global object, so a warm instance
// reuses it.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Connection error:', error.message);
    res.status(503).json({ error: 'The database could not be reached.' });
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// The platform's own records come first, so that /api/platform is not
// swallowed by the catch-all routes further down.
app.use('/api/platform', require('./routes/platformRoutes'));
app.use('/api', require('./routes/mentorRoutes')); // All routes under /api
app.use('/api/m', require('./routes/menteeRoutes'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

// The frontend reaches this server, so a wrong route should say so rather
// than fall through to the page.
app.use('/api', (req, res) => {
  res.status(404).json({ error: `No API route for ${req.method} ${req.path}` });
});

app.get('/', (req, res) => res.send('Mentorship API Running'));

module.exports = app;
