const path = require('path');
// load .env from backend/ even if you run node from another cwd
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

// cors — FRONTEND_URL is comma-separated; in non-production we always allow common local dev ports too
const fromEnv = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const devOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];
const isProd = process.env.NODE_ENV === 'production';
const allowed = isProd
  ? fromEnv.length
    ? fromEnv
    : devOrigins
  : [...new Set([...fromEnv, ...devOrigins])];
app.use(
  cors({
    origin: allowed.length === 1 ? allowed[0] : allowed,
    credentials: true,
  })
);
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// generic error handler (last resort)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('MONGODB_URI is missing — add it to .env');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing');
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('connected to mongo');
    const server = app.listen(PORT, () => console.log(`api listening on ${PORT}`));
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `Port ${PORT} is already in use. Stop the other process or set PORT in .env to another value.`
        );
      } else {
        console.error(err);
      }
      process.exit(1);
    });
  })
  .catch((e) => {
    console.error('mongo connection failed', e);
    process.exit(1);
  });
