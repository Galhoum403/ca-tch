/**
 * CATCH Online Card Game - SQLite Database Engine
 * Handles user authentication, persistent player balances, game stats, and admin controls.
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'catch.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

// Initialize Database Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE COLLATE NOCASE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar TEXT DEFAULT '😎',
    coins INTEGER DEFAULT 500,
    gems INTEGER DEFAULT 10,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    sets_completed INTEGER DEFAULT 0,
    vip_rank TEXT DEFAULT 'مبتدئ برونزي',
    unlocked_avatars TEXT DEFAULT '["saeedi","batman","muallem"]',
    unlocked_backs TEXT DEFAULT '["classic"]',
    is_banned INTEGER DEFAULT 0,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS balance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    coins_before INTEGER,
    coins_after INTEGER,
    gems_before INTEGER,
    gems_after INTEGER,
    source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('📦 SQLite Database initialized successfully at:', dbPath);

// --- AUTHENTICATION HELPERS ---

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function generateToken() {
  return 'tok_' + crypto.randomBytes(32).toString('hex');
}

// --- USER OPERATIONS ---

/**
 * Register a new player
 */
function registerUser(username, password, avatar = '😎') {
  const cleanUsername = (username || '').trim();
  if (cleanUsername.length < 3 || cleanUsername.length > 20) {
    throw new Error('اسم المستخدم يجب أن يكون بين 3 و 20 حرفاً');
  }
  if (!password || password.length < 4) {
    throw new Error('كلمة المرور يجب أن لا تقل عن 4 أحرف');
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
  if (existing) {
    throw new Error('اسم المستخدم محجوز بالفعل! اختر اسماً آخر.');
  }

  const passwordHash = hashPassword(password);
  const info = db.prepare(`
    INSERT INTO users (username, password_hash, avatar, coins, gems)
    VALUES (?, ?, ?, 500, 10)
  `).run(cleanUsername, passwordHash, avatar || '😎');

  const userId = info.lastInsertRowid;
  const token = generateToken();
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);

  return {
    token,
    user: getUserById(userId)
  };
}

/**
 * Login existing player
 */
function loginUser(username, password) {
  const cleanUsername = (username || '').trim();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(cleanUsername);
  if (!user) {
    throw new Error('اسم المستخدم غير مسجل!');
  }
  if (user.is_banned) {
    throw new Error('تم حظر هذا الحساب من اللعب! يرجى التواصل مع الإدارة.');
  }
  if (!verifyPassword(password, user.password_hash)) {
    throw new Error('كلمة المرور غير صحيحة!');
  }

  // Update last login
  db.prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?").run(user.id);

  const token = generateToken();
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, user.id);

  return {
    token,
    user: sanitizeUser(user)
  };
}

/**
 * Get user by session token
 */
function getUserByToken(token) {
  if (!token) return null;
  const session = db.prepare(`
    SELECT u.* FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ?
  `).get(token);

  if (!session) return null;
  if (session.is_banned) return null;
  return sanitizeUser(session);
}

/**
 * Get user by ID
 */
function getUserById(id) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return user ? sanitizeUser(user) : null;
}

/**
 * Sanitize user object for client transmission
 */
function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  try {
    safe.unlocked_avatars = JSON.parse(safe.unlocked_avatars || '[]');
  } catch(e) {
    safe.unlocked_avatars = ['saeedi', 'batman', 'muallem'];
  }
  try {
    safe.unlocked_backs = JSON.parse(safe.unlocked_backs || '[]');
  } catch(e) {
    safe.unlocked_backs = ['classic'];
  }
  return safe;
}

// --- BALANCE & GAME STATS UPDATES ---

/**
 * Update coins and gems for a player (used by game economy and admin)
 */
function updateUserBalance(userId, newCoins, newGems, source = 'system') {
  const current = db.prepare('SELECT coins, gems FROM users WHERE id = ?').get(userId);
  if (!current) return null;

  const coins = Math.max(0, parseInt(newCoins, 10));
  const gems = Math.max(0, parseInt(newGems, 10));

  db.prepare(`
    UPDATE users SET coins = ?, gems = ? WHERE id = ?
  `).run(coins, gems, userId);

  db.prepare(`
    INSERT INTO balance_logs (user_id, coins_before, coins_after, gems_before, gems_after, source)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, current.coins, coins, current.gems, gems, source);

  return { coins, gems };
}

/**
 * Add / subtract coins
 */
function adjustUserBalance(userId, deltaCoins = 0, deltaGems = 0, source = 'reward') {
  const current = db.prepare('SELECT coins, gems FROM users WHERE id = ?').get(userId);
  if (!current) return null;

  const nextCoins = Math.max(0, current.coins + deltaCoins);
  const nextGems = Math.max(0, current.gems + deltaGems);

  return updateUserBalance(userId, nextCoins, nextGems, source);
}

/**
 * Update stats after a match finishes
 */
function recordGameStats(userId, isWinner, setsWon = 0) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return null;

  const games = user.games_played + 1;
  const wins = user.games_won + (isWinner ? 1 : 0);
  const sets = user.sets_completed + setsWon;

  // Calculate VIP Rank
  let rank = 'مبتدئ برونزي';
  if (wins >= 25) rank = 'أسطورة VIP';
  else if (wins >= 12) rank = 'دايموند VIP';
  else if (wins >= 6) rank = 'كابتن ذهبي';
  else if (wins >= 3) rank = 'صائد فضي';

  db.prepare(`
    UPDATE users SET
      games_played = ?,
      games_won = ?,
      sets_completed = ?,
      vip_rank = ?
    WHERE id = ?
  `).run(games, wins, sets, rank, userId);

  return { games, wins, sets, rank };
}

/**
 * Save player avatar and skins customizations
 */
function updateCustomization(userId, { avatar, unlockedAvatars, unlockedBacks }) {
  const updates = [];
  const params = [];

  if (avatar) {
    updates.push('avatar = ?');
    params.push(avatar);
  }
  if (unlockedAvatars) {
    updates.push('unlocked_avatars = ?');
    params.push(JSON.stringify(unlockedAvatars));
  }
  if (unlockedBacks) {
    updates.push('unlocked_backs = ?');
    params.push(JSON.stringify(unlockedBacks));
  }

  if (updates.length > 0) {
    params.push(userId);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  return getUserById(userId);
}

// --- ADMIN DASHBOARD OPERATIONS ---

/**
 * Get all players with formatted stats for the Admin Dashboard
 */
function getAllPlayersForAdmin(search = '') {
  let query = 'SELECT id, username, avatar, coins, gems, games_played, games_won, sets_completed, vip_rank, is_banned, is_admin, created_at, last_login FROM users';
  const params = [];

  if (search && search.trim()) {
    query += ' WHERE username LIKE ?';
    params.push(`%${search.trim()}%`);
  }

  query += ' ORDER BY id DESC LIMIT 200';
  return db.prepare(query).all(...params);
}

/**
 * Set player ban status
 */
function setPlayerBan(userId, isBanned) {
  db.prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(isBanned ? 1 : 0, userId);
  if (isBanned) {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  }
  return true;
}

/**
 * Reset player password directly from admin panel
 */
function adminResetPassword(userId, newPassword) {
  if (!newPassword || newPassword.length < 4) {
    throw new Error('كلمة المرور يجب أن لا تقل عن 4 أحرف');
  }
  const hash = hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId);
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  return true;
}

/**
 * Get overall server statistics
 */
function getServerStats() {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalCoins = db.prepare('SELECT SUM(coins) as total FROM users').get().total || 0;
  const totalGems = db.prepare('SELECT SUM(gems) as total FROM users').get().total || 0;
  const totalGames = db.prepare('SELECT SUM(games_played) as total FROM users').get().total || 0;

  return {
    totalUsers,
    totalCoins,
    totalGems,
    totalGames
  };
}

module.exports = {
  db,
  registerUser,
  loginUser,
  getUserByToken,
  getUserById,
  updateUserBalance,
  adjustUserBalance,
  recordGameStats,
  updateCustomization,
  getAllPlayersForAdmin,
  setPlayerBan,
  adminResetPassword,
  getServerStats
};
