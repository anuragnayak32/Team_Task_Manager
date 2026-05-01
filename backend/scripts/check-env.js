/**
 * Smoke-test .env and Mongo — run: node scripts/check-env.js
 * Does not print secrets.
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const envPath = path.join(__dirname, '..', '.env');

function mask(s) {
  if (!s || s.length < 8) return s ? '***' : '(empty)';
  return `${s.slice(0, 4)}…${s.slice(-4)} (len ${s.length})`;
}

function needsUrlEncode(pw) {
  return /[@:/#?[\] ]/.test(pw);
}

console.log('--- Backend env checks ---\n');

// 1) file on disk
if (!fs.existsSync(envPath)) {
  console.error('FAIL: .env missing at', envPath);
  process.exit(1);
}
const stat = fs.statSync(envPath);
console.log('OK: .env exists, size', stat.size, 'bytes');
if (stat.size === 0) {
  console.error('FAIL: .env is empty — save the file in your editor (Ctrl+S)');
  process.exit(1);
}

// 2) required vars
const mongo = process.env.MONGODB_URI;
const jwt = process.env.JWT_SECRET;
if (!mongo) {
  console.error('FAIL: MONGODB_URI not loaded (wrong path or key typo?)');
  process.exit(1);
}
if (!jwt) {
  console.error('FAIL: JWT_SECRET not loaded');
  process.exit(1);
}
console.log('OK: MONGODB_URI loaded,', mask(mongo));
console.log('OK: JWT_SECRET loaded,', mask(jwt));

// 3) parse URI
let url;
try {
  url = new URL(mongo);
} catch (e) {
  console.error('FAIL: MONGODB_URI is not a valid URL:', e.message);
  process.exit(1);
}
if (url.protocol !== 'mongodb+srv:' && url.protocol !== 'mongodb:') {
  console.warn('WARN: protocol is', url.protocol, '(expected mongodb+srv: or mongodb:)');
} else {
  console.log('OK: protocol', url.protocol);
}
console.log('OK: host', url.hostname);
if (!url.hostname.includes('mongodb.net')) {
  console.warn('WARN: hostname does not look like Atlas (expected *.mongodb.net)');
}

const user = decodeURIComponent(url.username || '');
const pass = decodeURIComponent(url.password || '');
if (!user) console.warn('WARN: no username in URI');
if (!pass) console.warn('WARN: no password in URI');
if (pass && needsUrlEncode(pass)) {
  console.warn('WARN: password contains @ : / # ? [ ] or space — must be URL-encoded in the URI');
}

// 4) try connect
console.log('\nTrying MongoDB connection…');
const mongoose = require('mongoose');
mongoose
  .connect(mongo, { serverSelectionTimeoutMS: 15000 })
  .then(async () => {
    const admin = mongoose.connection.db.admin();
    const ping = await admin.ping();
    console.log('OK: connected. ping:', ping);
    await mongoose.disconnect();
    console.log('\nAll checks passed.');
    process.exit(0);
  })
  .catch((err) => {
    const msg = err.message || String(err);
    console.error('FAIL: connection error:', msg);
    if (/bad auth|authentication failed/i.test(msg)) {
      console.error('→ Fix: Atlas → Database Access → reset DB user password, paste into URI (encode special chars).');
    } else if (/ENOTFOUND|getaddrinfo/i.test(msg)) {
      console.error('→ Fix: check hostname / internet / VPN.');
    } else if (/IP|whitelist|not allowed|network/i.test(msg)) {
      console.error('→ Fix: Atlas → Network Access → allow your IP or 0.0.0.0/0 for dev.');
    } else if (/Server selection timed out/i.test(msg)) {
      console.error('→ Fix: Network Access, firewall, or cluster paused.');
    }
    process.exit(1);
  });
