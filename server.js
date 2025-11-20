require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const ADMIN_ID = 'admin';
const MIN_PASSWORD_LENGTH = 14;
const SETTINGS_KEY_PASSWORD = 'admin_password';
const ERROR_UNAUTHORIZED = 'Unauthorized';
const ERROR_PASSWORD_ALREADY_SET = 'Password already set';
const ERROR_SETUP_REQUIRED = 'Setup required';
const ERROR_INVALID_CREDENTIALS = 'Invalid credentials';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Init DB
pool.query(`
  CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    todo TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`).catch(err => console.error('Error creating table', err));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '.'))); // Serve static files from root
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' } // Secure cookies in prod
}));

// Middleware to check if logged in
const ensureAuth = (req, res, next) => {
  if (req.session.authenticated) {
    return next();
  }
  res.status(401).json({ error: ERROR_UNAUTHORIZED });
};

// Auth Routes
app.get('/setup-required', async (req, res) => {
  try {
    const result = await pool.query('SELECT value FROM settings WHERE key = $1', [SETTINGS_KEY_PASSWORD]);
    res.json({ setupRequired: result.rows.length === 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/setup', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }
    const result = await pool.query('SELECT value FROM settings WHERE key = $1', [SETTINGS_KEY_PASSWORD]);
    if (result.rows.length > 0) {
      return res.status(403).json({ error: ERROR_PASSWORD_ALREADY_SET });
    }
    await pool.query('INSERT INTO settings (key, value) VALUES ($1, $2)', [SETTINGS_KEY_PASSWORD, password]);
    req.session.authenticated = true;
    req.session.user = { id: ADMIN_ID, displayName: ADMIN_ID };
    res.json({ success: true, user: req.session.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT value FROM settings WHERE key = $1', [SETTINGS_KEY_PASSWORD]);
    if (result.rows.length === 0) {
      return res.status(403).json({ error: ERROR_SETUP_REQUIRED });
    }
    if (username === ADMIN_ID && password === result.rows[0].value) {
      req.session.authenticated = true;
      req.session.user = { id: ADMIN_ID, displayName: ADMIN_ID };
      res.json({ success: true, user: req.session.user });
    } else {
      res.status(401).json({ error: ERROR_INVALID_CREDENTIALS });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/me', (req, res) => {
  if (req.session.authenticated) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ user: null });
  }
});

// API Routes
app.get('/todos', ensureAuth, async (req, res) => {
  try {
    // All authenticated users share the 'admin' list
    const result = await pool.query('SELECT * FROM todos WHERE user_id = $1 ORDER BY id ASC', [ADMIN_ID]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/todos', ensureAuth, async (req, res) => {
  try {
    const { todo } = req.body;
    const result = await pool.query('INSERT INTO todos (user_id, todo) VALUES ($1, $2) RETURNING *', [ADMIN_ID, todo]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/todos/:id', ensureAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM todos WHERE id = $1 AND user_id = $2', [req.params.id, ADMIN_ID]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
