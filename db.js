/**
 * CATCH Online Card Game - Pure-JS Persistent Database Engine
 * Zero native C++ dependencies, 100% crash-proof in Linux/Docker/Railway environments.
 * Handles user authentication, persistent player balances, game stats, and admin controls.
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'catch.json');
console.log('📦 Loading database store from:', dbPath);

let dbData = {
  users: [],
  sessions: [],
  balance_logs: []
};

function nowStr() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

// Load existing database store
try {
  if (fs.existsSync(dbPath)) {
    const raw = fs.readFileSync(dbPath, 'utf-8');
    dbData = JSON.parse(raw);
    console.log(`📦 Database loaded successfully. Users: ${dbData.users ? dbData.users.length : 0}`);
  } else {
    console.log('📦 Database file not found, creating new persistent store at:', dbPath);
    saveDb();
  }
} catch (err) {
  console.error('⚠️ Error reading database store, initializing defaults:', err.message);
  saveDb();
}

// Ensure arrays exist
if (!Array.isArray(dbData.users)) dbData.users = [];
if (!Array.isArray(dbData.sessions)) dbData.sessions = [];
if (!Array.isArray(dbData.balance_logs)) dbData.balance_logs = [];

/**
 * Save database atomically to disk
 */
function saveDb() {
  try {
    const tmpPath = dbPath + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(dbData, null, 2), 'utf-8');
    fs.renameSync(tmpPath, dbPath);
  } catch (err) {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8');
    } catch (writeErr) {
      console.error('💥 Failed to save database file:', writeErr.message);
    }
  }
}

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

/**
 * Sanitize user object for client transmission
 */
function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  
  if (typeof safe.unlocked_avatars === 'string') {
    try {
      safe.unlocked_avatars = JSON.parse(safe.unlocked_avatars);
    } catch(e) {
      safe.unlocked_avatars = ['saeedi', 'batman', 'muallem'];
    }
  }
  if (!Array.isArray(safe.unlocked_avatars)) {
    safe.unlocked_avatars = ['saeedi', 'batman', 'muallem'];
  }

  if (typeof safe.unlocked_backs === 'string') {
    try {
      safe.unlocked_backs = JSON.parse(safe.unlocked_backs);
    } catch(e) {
      safe.unlocked_backs = ['classic'];
    }
  }
  if (!Array.isArray(safe.unlocked_backs)) {
    safe.unlocked_backs = ['classic'];
  }

  if (typeof safe.quest_data === 'string') {
    try {
      safe.quest_data = JSON.parse(safe.quest_data);
    } catch(e) {
      safe.quest_data = {};
    }
  }
  if (!safe.quest_data || typeof safe.quest_data !== 'object') {
    safe.quest_data = {};
  }

  return safe;
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

  const existing = dbData.users.find(
    u => u.username && u.username.toLowerCase() === cleanUsername.toLowerCase()
  );
  if (existing) {
    throw new Error('اسم المستخدم محجوز بالفعل! اختر اسماً آخر.');
  }

  const nextId = (dbData.users.reduce((max, u) => Math.max(max, u.id || 0), 0) || 0) + 1;
  const passwordHash = hashPassword(password);
  const now = nowStr();

  const newUser = {
    id: nextId,
    username: cleanUsername,
    password_hash: passwordHash,
    avatar: avatar || '😎',
    coins: 500,
    gems: 10,
    games_played: 0,
    games_won: 0,
    sets_completed: 0,
    vip_rank: 'مبتدئ برونزي',
    unlocked_avatars: JSON.stringify(['saeedi', 'batman', 'muallem']),
    unlocked_backs: JSON.stringify(['classic']),
    is_banned: 0,
    is_admin: 0,
    created_at: now,
    last_login: now,
    last_daily_claim: null,
    quest_data: '{}'
  };

  dbData.users.push(newUser);

  const token = generateToken();
  dbData.sessions.push({
    token,
    user_id: nextId,
    created_at: now
  });

  saveDb();

  return {
    token,
    user: getUserById(nextId)
  };
}

/**
 * Login existing player
 */
function loginUser(username, password) {
  const cleanUsername = (username || '').trim();
  const user = dbData.users.find(
    u => u.username && u.username.toLowerCase() === cleanUsername.toLowerCase()
  );

  if (!user) {
    throw new Error('اسم المستخدم غير مسجل!');
  }
  if (user.is_banned) {
    throw new Error('تم حظر هذا الحساب من اللعب! يرجى التواصل مع الإدارة.');
  }
  if (!verifyPassword(password, user.password_hash)) {
    throw new Error('كلمة المرور غير صحيحة!');
  }

  user.last_login = nowStr();

  const token = generateToken();
  dbData.sessions.push({
    token,
    user_id: user.id,
    created_at: user.last_login
  });

  saveDb();

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
  const session = dbData.sessions.find(s => s.token === token);
  if (!session) return null;

  const user = dbData.users.find(u => u.id === session.user_id);
  if (!user) return null;
  if (user.is_banned) return null;

  return sanitizeUser(user);
}

/**
 * Get user by ID
 */
function getUserById(id) {
  const user = dbData.users.find(u => u.id === Number(id));
  return user ? sanitizeUser(user) : null;
}

// --- BALANCE & GAME STATS UPDATES ---

/**
 * Update coins and gems for a player
 */
function updateUserBalance(userId, newCoins, newGems, source = 'system') {
  const user = dbData.users.find(u => u.id === Number(userId));
  if (!user) return null;

  const coins = Math.max(0, parseInt(newCoins, 10));
  const gems = Math.max(0, parseInt(newGems, 10));

  const logId = (dbData.balance_logs.reduce((max, l) => Math.max(max, l.id || 0), 0) || 0) + 1;
  dbData.balance_logs.push({
    id: logId,
    user_id: user.id,
    coins_before: user.coins,
    coins_after: coins,
    gems_before: user.gems,
    gems_after: gems,
    source,
    created_at: nowStr()
  });

  user.coins = coins;
  user.gems = gems;

  saveDb();

  return { coins, gems };
}

/**
 * Add / subtract coins
 */
function adjustUserBalance(userId, deltaCoins = 0, deltaGems = 0, source = 'reward') {
  const user = dbData.users.find(u => u.id === Number(userId));
  if (!user) return null;

  const nextCoins = Math.max(0, (user.coins || 0) + deltaCoins);
  const nextGems = Math.max(0, (user.gems || 0) + deltaGems);

  return updateUserBalance(userId, nextCoins, nextGems, source);
}

/**
 * Update stats after a match finishes
 */
function recordGameStats(userId, isWinner, setsWon = 0) {
  const user = dbData.users.find(u => u.id === Number(userId));
  if (!user) return null;

  const games = (user.games_played || 0) + 1;
  const wins = (user.games_won || 0) + (isWinner ? 1 : 0);
  const sets = (user.sets_completed || 0) + setsWon;

  // Calculate VIP Rank
  let rank = 'مبتدئ برونزي';
  if (wins >= 25) rank = 'أسطورة VIP';
  else if (wins >= 12) rank = 'دايموند VIP';
  else if (wins >= 6) rank = 'كابتن ذهبي';
  else if (wins >= 3) rank = 'صائد فضي';

  user.games_played = games;
  user.games_won = wins;
  user.sets_completed = sets;
  user.vip_rank = rank;

  saveDb();

  return { games, wins, sets, rank };
}

/**
 * Save player avatar and skins customizations
 */
function updateCustomization(userId, { avatar, unlockedAvatars, unlockedBacks, coins, gems }) {
  const user = dbData.users.find(u => u.id === Number(userId));
  if (!user) return null;

  if (avatar) {
    user.avatar = avatar;
  }
  if (unlockedAvatars) {
    user.unlocked_avatars = JSON.stringify(unlockedAvatars);
  }
  if (unlockedBacks) {
    user.unlocked_backs = JSON.stringify(unlockedBacks);
  }
  if (typeof coins === 'number') {
    user.coins = Math.max(0, parseInt(coins, 10));
  }
  if (typeof gems === 'number') {
    user.gems = Math.max(0, parseInt(gems, 10));
  }

  saveDb();

  return getUserById(userId);
}

/**
 * Permanently claim quest / daily gift and update balance in database
 */
function claimQuest(userId, questId, rewardType, rewardAmount) {
  const user = dbData.users.find(u => u.id === Number(userId));
  if (!user) throw new Error('اللاعب غير موجود');

  const today = new Date().toISOString().slice(0, 10);
  let questData = {};
  try {
    questData = typeof user.quest_data === 'string' ? JSON.parse(user.quest_data) : (user.quest_data || {});
  } catch(e) {
    questData = {};
  }

  if (questId === 'q3') {
    if (user.last_daily_claim === today) {
      throw new Error('لقد استلمت هديتك اليومية بالفعل اليوم! عد غداً للمزيد.');
    }
  } else {
    if (questData[questId] === today) {
      throw new Error('لقد استلمت جائزة هذه المهمة اليوم بالفعل!');
    }
  }

  const addCoins = rewardType === 'coins' ? parseInt(rewardAmount, 10) : 0;
  const addGems = rewardType === 'gems' ? parseInt(rewardAmount, 10) : 0;
  const newCoins = (user.coins || 0) + addCoins;
  const newGems = (user.gems || 0) + addGems;

  user.coins = newCoins;
  user.gems = newGems;

  if (questId === 'q3') {
    user.last_daily_claim = today;
  } else {
    questData[questId] = today;
    user.quest_data = JSON.stringify(questData);
  }

  saveDb();

  return {
    success: true,
    coins: newCoins,
    gems: newGems,
    last_daily_claim: today
  };
}

// --- ADMIN DASHBOARD OPERATIONS ---

/**
 * Get all players with formatted stats for the Admin Dashboard
 */
function getAllPlayersForAdmin(search = '') {
  let list = dbData.users || [];

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(u => u.username && u.username.toLowerCase().includes(q));
  }

  return list
    .slice()
    .sort((a, b) => b.id - a.id)
    .slice(0, 200)
    .map(u => ({
      id: u.id,
      username: u.username,
      avatar: u.avatar,
      coins: u.coins,
      gems: u.gems,
      games_played: u.games_played || 0,
      games_won: u.games_won || 0,
      sets_completed: u.sets_completed || 0,
      vip_rank: u.vip_rank || 'مبتدئ برونزي',
      is_banned: u.is_banned ? 1 : 0,
      is_admin: u.is_admin ? 1 : 0,
      created_at: u.created_at,
      last_login: u.last_login
    }));
}

/**
 * Set player ban status
 */
function setPlayerBan(userId, isBanned) {
  const user = dbData.users.find(u => u.id === Number(userId));
  if (!user) return false;

  user.is_banned = isBanned ? 1 : 0;
  if (isBanned) {
    dbData.sessions = dbData.sessions.filter(s => s.user_id !== Number(userId));
  }

  saveDb();
  return true;
}

/**
 * Reset player password directly from admin panel
 */
function adminResetPassword(userId, newPassword) {
  if (!newPassword || newPassword.length < 4) {
    throw new Error('كلمة المرور يجب أن لا تقل عن 4 أحرف');
  }

  const user = dbData.users.find(u => u.id === Number(userId));
  if (!user) return false;

  user.password_hash = hashPassword(newPassword);
  dbData.sessions = dbData.sessions.filter(s => s.user_id !== Number(userId));

  saveDb();
  return true;
}

/**
 * Get overall server statistics
 */
function getServerStats() {
  const users = dbData.users || [];
  const totalUsers = users.length;
  const totalCoins = users.reduce((sum, u) => sum + (u.coins || 0), 0);
  const totalGems = users.reduce((sum, u) => sum + (u.gems || 0), 0);
  const totalGames = users.reduce((sum, u) => sum + (u.games_played || 0), 0);

  return {
    totalUsers,
    totalCoins,
    totalGems,
    totalGames
  };
}

module.exports = {
  db: null,
  registerUser,
  loginUser,
  getUserByToken,
  getUserById,
  updateUserBalance,
  adjustUserBalance,
  recordGameStats,
  updateCustomization,
  claimQuest,
  getAllPlayersForAdmin,
  setPlayerBan,
  adminResetPassword,
  getServerStats
};
