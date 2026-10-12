import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const DEFAULT_CONFIG = {
  initialLives: 3,
  coinPoints: 200,
  goombaStompPoints: 100,
  timeLimitSec: 300,
  playerSpeed: 4.2,
  jumpVelocity: 13.5,
  gravity: 0.72,
  goombaSpeed: 1.4,
};

// ---------------------------------------------------------------------------
// Tiny JSON-file storage
// ---------------------------------------------------------------------------
let db = null;
let saveTimer = null;

function loadDb() {
  fs.mkdirSync(DATA_DIR, {recursive: true});
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch {
      db = null;
    }
  }
  if (!db || !Array.isArray(db.users)) {
    db = {users: [], sessions: [], runs: [], config: {...DEFAULT_CONFIG}};
  }
  db.config = {...DEFAULT_CONFIG, ...(db.config || {})};
  db.users.forEach((u) => {
    u.stats = {highScore: 0, totalScore: 0, coins: 0, levelsUnlocked: 1, gamesPlayed: 0, lastPlayedAt: null, ...(u.stats || {})};
  });
  if (!db.users.some((u) => u.role === 'admin')) {
    const admin = {
      id: crypto.randomUUID(),
      name: 'Arcade Admin',
      email: 'admin@bitquest.game',
      role: 'admin',
      blocked: false,
      createdAt: new Date().toISOString(),
      stats: {highScore: 0, totalScore: 0, coins: 0, levelsUnlocked: 1, gamesPlayed: 0, lastPlayedAt: null},
    };
    Object.assign(admin, hashPassword('admin123'));
    db.users.push(admin);
    persist();
  }
}

function persist() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  }, 50);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return {salt, passwordHash};
}

function verifyPassword(user, password) {
  if (!user.salt || !user.passwordHash) return false;
  const candidate = crypto.scryptSync(password, user.salt, 64);
  const stored = Buffer.from(user.passwordHash, 'hex');
  return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    blocked: !!user.blocked,
    createdAt: user.createdAt,
    stats: user.stats,
  };
}

function authUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  return db.users.find((u) => u.id === session.userId) || null;
}

function requireAuth(req, res, next) {
  const user = authUser(req);
  if (!user) return res.status(401).json({error: 'Not authenticated'});
  if (user.blocked) return res.status(403).json({error: 'Account blocked'});
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({error: 'Admin access required'});
    next();
  });
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions.push({token, userId, createdAt: new Date().toISOString()});
  // Keep sessions bounded.
  if (db.sessions.length > 500) db.sessions = db.sessions.slice(-500);
  persist();
  return token;
}

// ---------------------------------------------------------------------------
// App + routes
// ---------------------------------------------------------------------------
const app = express();
app.use(express.json());

app.post('/api/auth/signup', (req, res) => {
  const {name, email, password} = req.body || {};
  if (!name || !email || !password) return res.status(400).json({error: 'Name, email and password are required'});
  if (typeof password !== 'string' || password.length < 6) return res.status(400).json({error: 'Password must be at least 6 characters'});
  const normalizedEmail = String(email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({error: 'Invalid email address'});
  if (db.users.some((u) => u.email === normalizedEmail)) return res.status(409).json({error: 'An account with this email already exists'});
  const user = {
    id: crypto.randomUUID(),
    name: String(name).trim().slice(0, 40) || 'Player',
    email: normalizedEmail,
    role: 'user',
    blocked: false,
    createdAt: new Date().toISOString(),
    stats: {highScore: 0, totalScore: 0, coins: 0, levelsUnlocked: 1, gamesPlayed: 0, lastPlayedAt: null},
    ...hashPassword(password),
  };
  db.users.push(user);
  persist();
  const token = createSession(user.id);
  res.status(201).json({token, user: publicUser(user)});
});

app.post('/api/auth/login', (req, res) => {
  const {email, password} = req.body || {};
  const user = db.users.find((u) => u.email === String(email || '').trim().toLowerCase());
  if (!user || !verifyPassword(user, String(password || ''))) {
    return res.status(401).json({error: 'Invalid email or password'});
  }
  if (user.blocked) return res.status(403).json({error: 'This account has been blocked'});
  const token = createSession(user.id);
  res.json({token, user: publicUser(user)});
});

app.post('/api/auth/logout', (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  db.sessions = db.sessions.filter((s) => s.token !== token);
  persist();
  res.json({ok: true});
});

app.get('/api/auth/me', (req, res) => {
  const user = authUser(req);
  if (!user) return res.status(401).json({error: 'Not authenticated'});
  if (user.blocked) return res.status(403).json({error: 'Account blocked'});
  res.json({user: publicUser(user)});
});

// Simple reset flow: verifies the email exists, then sets a new password.
// (No mail provider is wired up in this sandbox; the client presents this as a
// "reset with email + new password" form.)
app.post('/api/auth/reset-password', (req, res) => {
  const {email, newPassword} = req.body || {};
  const user = db.users.find((u) => u.email === String(email || '').trim().toLowerCase());
  if (!user) return res.status(404).json({error: 'No account found with that email'});
  if (typeof newPassword !== 'string' || newPassword.length < 6) return res.status(400).json({error: 'Password must be at least 6 characters'});
  Object.assign(user, hashPassword(newPassword));
  db.sessions = db.sessions.filter((s) => s.userId !== user.id);
  persist();
  res.json({ok: true});
});

app.get('/api/leaderboard', (req, res) => {
  const top = db.users
    .filter((u) => !u.blocked)
    .map((u) => ({id: u.id, name: u.name, highScore: u.stats.highScore, coins: u.stats.coins, gamesPlayed: u.stats.gamesPlayed}))
    .sort((a, b) => b.highScore - a.highScore || a.name.localeCompare(b.name))
    .slice(0, 10);
  res.json({leaderboard: top});
});

app.get('/api/config', (req, res) => {
  res.json({config: db.config});
});

// Submit a finished run: updates the player's persistent stats.
app.post('/api/runs', requireAuth, (req, res) => {
  const {score, coins, level, levelsUnlocked, durationSec, outcome} = req.body || {};
  const num = (v, fallback) => (Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : fallback);
  const run = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    score: num(score, 0),
    coins: num(coins, 0),
    level: num(level, 1),
    levelsUnlocked: num(levelsUnlocked, 1),
    durationSec: num(durationSec, 0),
    outcome: outcome === 'won' || outcome === 'game-over' ? outcome : 'game-over',
    playedAt: new Date().toISOString(),
  };
  db.runs.push(run);
  if (db.runs.length > 2000) db.runs = db.runs.slice(-2000);

  const s = req.user.stats;
  s.totalScore += run.score;
  s.coins += run.coins;
  s.gamesPlayed += 1;
  s.highScore = Math.max(s.highScore, run.score);
  s.levelsUnlocked = Math.max(s.levelsUnlocked, run.levelsUnlocked);
  s.lastPlayedAt = run.playedAt;
  persist();
  res.status(201).json({run, user: publicUser(req.user)});
});

app.get('/api/me/runs', requireAuth, (req, res) => {
  const runs = db.runs
    .filter((r) => r.userId === req.user.id)
    .sort((a, b) => b.playedAt.localeCompare(a.playedAt))
    .slice(0, 10);
  res.json({runs});
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
app.get('/api/admin/metrics', requireAdmin, (req, res) => {
  const players = db.users.filter((u) => u.role === 'user');
  const leaderboard = db.users
    .map((u) => ({id: u.id, name: u.name, highScore: u.stats.highScore}))
    .sort((a, b) => b.highScore - a.highScore)
    .slice(0, 5);
  const last24h = db.runs.filter((r) => Date.now() - new Date(r.playedAt).getTime() < 24 * 3600 * 1000);
  res.json({
    metrics: {
      totalPlayers: db.users.length,
      activePlayers: players.filter((u) => u.lastPlayedAt && Date.now() - new Date(u.lastPlayedAt).getTime() < 7 * 24 * 3600 * 1000).length,
      blockedUsers: db.users.filter((u) => u.blocked).length,
      totalRuns: db.runs.length,
      runsLast24h: last24h.length,
      globalHighScore: db.users.reduce((m, u) => Math.max(m, u.stats.highScore), 0),
      coinsCollected: db.users.reduce((m, u) => m + u.stats.coins, 0),
      topScores: leaderboard,
      recentRuns: db.runs.slice(-8).reverse().map((r) => ({...r, userName: db.users.find((u) => u.id === r.userId)?.name || 'Unknown'})),
    },
  });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  res.json({users: db.users.map(publicUser)});
});

app.patch('/api/admin/users/:id', requireAdmin, (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({error: 'User not found'});
  const {blocked, role} = req.body || {};
  if (typeof blocked === 'boolean') {
    if (blocked && user.id === req.user.id) {
      return res.status(400).json({error: 'You cannot block your own account'});
    }
    user.blocked = blocked;
  }
  if (role === 'admin' || role === 'user') {
    if (user.id === req.user.id && role === 'user') {
      return res.status(400).json({error: 'You cannot demote your own admin account'});
    }
    user.role = role;
  }
  persist();
  res.json({user: publicUser(user)});
});

app.post('/api/admin/users/:id/reset-scores', requireAdmin, (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({error: 'User not found'});
  user.stats = {highScore: 0, totalScore: 0, coins: 0, levelsUnlocked: 1, gamesPlayed: 0, lastPlayedAt: user.stats.lastPlayedAt};
  db.runs = db.runs.filter((r) => r.userId !== user.id);
  persist();
  res.json({user: publicUser(user)});
});

app.patch('/api/admin/config', requireAdmin, (req, res) => {
  const allowed = ['initialLives', 'coinPoints', 'goombaStompPoints', 'timeLimitSec', 'playerSpeed', 'jumpVelocity', 'gravity', 'goombaSpeed'];
  for (const key of allowed) {
    const v = Number(req.body?.[key]);
    if (Number.isFinite(v) && v > 0) {
      if (key === 'initialLives' || key === 'coinPoints' || key === 'goombaStompPoints' || key === 'timeLimitSec') {
        db.config[key] = Math.max(1, Math.floor(v));
      } else {
        db.config[key] = Math.min(v, 60);
      }
    }
  }
  persist();
  res.json({config: db.config});
});

// ---------------------------------------------------------------------------
// Static hosting (production)
// ---------------------------------------------------------------------------
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

loadDb();
app.listen(PORT, () => console.log(`BitQuest API listening on http://localhost:${PORT}`));
