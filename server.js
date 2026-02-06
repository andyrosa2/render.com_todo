const express = require('express');
const { Pool } = require('pg');
const app = express();

function getRedactedDbInfo(connectionString) {
  try {
    const url = new URL(connectionString);
    return {
      protocol: url.protocol,
      host: url.host || url.hostname,
      database: url.pathname?.replace(/^\//, ''),
      user: url.username || undefined,
    };
  } catch {
    return { present: Boolean(connectionString) };
  }
}

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL info:', getRedactedDbInfo(process.env.DATABASE_URL || ''));

if (!process.env.DATABASE_URL) {
  console.error('Missing required env var: DATABASE_URL');
  process.exit(1);
}

const isLocalDb = /localhost|127\.0\.0\.1/i.test(process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
});

let dbReady = false;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function initializeDatabaseWithRetry({ maxWaitMs = 60 * 1000 } = {}) {
  const start = Date.now();
  let attempt = 0;

  console.log('Initializing database...');
  while (true) {
    attempt += 1;
    try {
      await pool.query('SELECT 1');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS notes (
          id SERIAL PRIMARY KEY,
          content TEXT
        )
      `);
      dbReady = true;
      console.log('Database initialized');
      return;
    } catch (err) {
      const elapsed = Date.now() - start;
      const code = err && err.code;
      const retryableCodes = new Set(['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ETIMEDOUT']);
      const shouldRetry = retryableCodes.has(code) && elapsed < maxWaitMs;

      console.error(`DB init attempt ${attempt} failed`, {
        code,
        message: err && err.message,
        hostname: err && err.hostname,
      });

      if (!shouldRetry) {
        throw err;
      }

      const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 15000);
      console.log(`Retrying DB init in ${delayMs}ms...`);
      await sleep(delayMs);
    }
  }
}

app.use(express.json());
app.use(express.static('.'));

app.get('/notes', async (_, res) => {
  console.log('GET /notes');
  if (!dbReady) {
    res.status(503).json({ error: 'Database not ready yet. Try again in a moment.' });
    return;
  }
  res.json((await pool.query('SELECT * FROM notes')).rows);
});

app.post('/notes', async (req, res) => {
  console.log('POST /notes', req.body);
  if (!dbReady) {
    res.status(503).json({ error: 'Database not ready yet. Try again in a moment.' });
    return;
  }
  await pool.query('INSERT INTO notes (content) VALUES ($1)', [req.body.content]);
  res.end();
});

const PORT = process.env.PORT || 3000;

process.on('uncaughtException', err => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', err => {
  console.error('Unhandled rejection:', err);
});

process.on('exit', code => {
  console.log('Process exiting with code:', code);
});

console.log('Starting server...');

console.log('About to listen on port', PORT);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

initializeDatabaseWithRetry()
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
