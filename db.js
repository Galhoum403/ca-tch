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

  // Social: Friends & Requests
  if (typeof safe.friends === 'string') {
    try {
      safe.friends = JSON.parse(safe.friends);
    } catch(e) {
      safe.friends = [];
    }
  }
  if (!Array.isArray(safe.friends)) safe.friends = [];

  if (typeof safe.friend_requests === 'string') {
    try {
      safe.friend_requests = JSON.parse(safe.friend_requests);
    } catch(e) {
      safe.friend_requests = [];
    }
  }
  if (!Array.isArray(safe.friend_requests)) safe.friend_requests = [];

  safe.last_spin_date = safe.last_spin_date || null;
  safe.login_streak = typeof safe.login_streak === 'number' ? safe.login_streak : 1;
  safe.last_streak_claim_date = safe.last_streak_claim_date || null;

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
    last_spin_date: null,
    login_streak: 1,
    last_streak_claim_date: null,
    friends: JSON.stringify([]),
    friend_requests: JSON.stringify([]),
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

  // Invalidate any previous sessions for this user (single-device login enforcement)
  dbData.sessions = dbData.sessions.filter(s => s.user_id !== user.id);

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

// --- WHEEL, STREAK, FRIENDS & LEADERBOARD HELPERS ---

const WHEEL_SLICES = [
  { id: 0, label: '100 عملة', type: 'coins', amount: 100, icon: '⭐', color: '#f59e0b', weight: 25 },
  { id: 1, label: '300 عملة', type: 'coins', amount: 300, icon: '⭐', color: '#10b981', weight: 20 },
  { id: 2, label: '5 جواهر', type: 'gems', amount: 5, icon: '💎', color: '#0284c7', weight: 15 },
  { id: 3, label: '500 عملة', type: 'coins', amount: 500, icon: '⭐', color: '#8b5cf6', weight: 15 },
  { id: 4, label: '15 جوهرة', type: 'gems', amount: 15, icon: '💎', color: '#ec4899', weight: 10 },
  { id: 5, label: '1,000 عملة', type: 'coins', amount: 1000, icon: '⭐', color: '#ea580c', weight: 8 },
  { id: 6, label: '50 عملة', type: 'coins', amount: 50, icon: '⭐', color: '#475569', weight: 5 },
  { id: 7, label: '👑 2,500 عملة', type: 'coins', amount: 2500, icon: '👑', color: '#eab308', weight: 2 },
];

const STREAK_REWARDS = [
  { day: 1, text: '150 عملة', type: 'coins', amount: 150, icon: '⭐' },
  { day: 2, text: '300 عملة', type: 'coins', amount: 300, icon: '⭐' },
  { day: 3, text: '5 جواهر', type: 'gems', amount: 5, icon: '💎' },
  { day: 4, text: '750 عملة', type: 'coins', amount: 750, icon: '⭐' },
  { day: 5, text: '1,500 عملة', type: 'coins', amount: 1500, icon: '⭐' },
  { day: 6, text: '15 جوهرة', type: 'gems', amount: 15, icon: '💎' },
  { day: 7, text: '3,000 عملة + 25 💎', type: 'both', coins: 3000, gems: 25, icon: '👑' },
];

function spinLuckyWheel(userId) {
  const user = dbData.users.find(u => u.id === Number(userId));
  if (!user) throw new Error('اللاعب غير مسجل');
  const today = new Date().toISOString().slice(0, 10);
  if (user.last_spin_date === today) {
    throw new Error('لقد قمت بلف العجلة اليوم بالفعل! عد غداً للمزيد.');
  }

  const totalWeight = WHEEL_SLICES.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  let chosenIdx = 0;
  for (let i = 0; i < WHEEL_SLICES.length; i++) {
    if (random < WHEEL_SLICES[i].weight) {
      chosenIdx = i;
      break;
    }
    random -= WHEEL_SLICES[i].weight;
  }

  const prize = WHEEL_SLICES[chosenIdx];
  if (prize.type === 'coins') {
    user.coins = (user.coins || 0) + prize.amount;
  } else if (prize.type === 'gems') {
    user.gems = (user.gems || 0) + prize.amount;
  }
  user.last_spin_date = today;
  saveDb();

  return {
    success: true,
    sliceIndex: chosenIdx,
    reward: prize,
    coins: user.coins,
    gems: user.gems,
    last_spin_date: today
  };
}

function getStreakInfo(userId) {
  const user = dbData.users.find(u => u.id === Number(userId));
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let streak = typeof user.login_streak === 'number' ? user.login_streak : 1;
  const lastClaim = user.last_streak_claim_date || null;
  const canClaimToday = lastClaim !== today;

  if (lastClaim && lastClaim !== today && lastClaim !== yesterday) {
    streak = 1;
    user.login_streak = 1;
    saveDb();
  }

  return {
    streak: Math.min(7, Math.max(1, streak)),
    canClaimToday,
    lastClaimDate: lastClaim,
    rewards: STREAK_REWARDS
  };
}

function claimLoginStreak(userId) {
  const user = dbData.users.find(u => u.id === Number(userId));
  if (!user) throw new Error('اللاعب غير مسجل');

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (user.last_streak_claim_date === today) {
    throw new Error('لقد استلمت مكافأة الدخول اليوم بالفعل!');
  }

  let currentStreak = typeof user.login_streak === 'number' ? user.login_streak : 1;
  if (user.last_streak_claim_date === yesterday) {
    currentStreak = currentStreak >= 7 ? 1 : currentStreak + 1;
  } else if (user.last_streak_claim_date && user.last_streak_claim_date !== yesterday) {
    currentStreak = 1;
  }

  const reward = STREAK_REWARDS[currentStreak - 1];
  if (reward.type === 'coins') {
    user.coins = (user.coins || 0) + reward.amount;
  } else if (reward.type === 'gems') {
    user.gems = (user.gems || 0) + reward.amount;
  } else if (reward.type === 'both') {
    user.coins = (user.coins || 0) + (reward.coins || 0);
    user.gems = (user.gems || 0) + (reward.gems || 0);
  }

  user.login_streak = currentStreak;
  user.last_streak_claim_date = today;
  saveDb();

  return {
    success: true,
    streak: currentStreak,
    reward,
    coins: user.coins,
    gems: user.gems,
    last_streak_claim_date: today
  };
}

function sendFriendRequest(fromUserId, targetStr) {
  const fromUser = dbData.users.find(u => u.id === Number(fromUserId));
  if (!fromUser) throw new Error('حسابك غير موجود');

  const cleanTarget = (targetStr || '').trim().replace(/^#CATCH-?/i, '');
  if (!cleanTarget) throw new Error('يرجى كتابة اسم المستخدم أو رقم الحساب ID');

  let targetUser = null;
  if (/^\d+$/.test(cleanTarget)) {
    targetUser = dbData.users.find(u => u.id === Number(cleanTarget));
  }
  if (!targetUser) {
    targetUser = dbData.users.find(u => u.username && u.username.toLowerCase() === cleanTarget.toLowerCase());
  }

  if (!targetUser) throw new Error('لم يتم العثور على أي لاعب بهذا الاسم أو الـ ID!');
  if (targetUser.id === fromUser.id) throw new Error('لا يمكنك إضافة نفسك كصديق!');

  let fromFriends = [];
  try { fromFriends = typeof fromUser.friends === 'string' ? JSON.parse(fromUser.friends) : (fromUser.friends || []); } catch(e){}
  if (fromFriends.includes(targetUser.id)) throw new Error('هذا اللاعب مضاف بالفعل في قائمة أصدقائك!');

  let targetRequests = [];
  try { targetRequests = typeof targetUser.friend_requests === 'string' ? JSON.parse(targetUser.friend_requests) : (targetUser.friend_requests || []); } catch(e){}
  if (targetRequests.includes(fromUser.id)) throw new Error('لقد أرسلت طلباً لهذا الصديق بالفعل وهو قيد الانتظار!');

  targetRequests.push(fromUser.id);
  targetUser.friend_requests = JSON.stringify(targetRequests);
  saveDb();

  return {
    success: true,
    message: `تم إرسال طلب الصداقة بنجاح إلى ${targetUser.username}!`,
    targetId: targetUser.id,
    targetUsername: targetUser.username
  };
}

function respondFriendRequest(userId, requesterId, action) {
  const user = dbData.users.find(u => u.id === Number(userId));
  const requester = dbData.users.find(u => u.id === Number(requesterId));
  if (!user || !requester) throw new Error('اللاعب غير موجود');

  let userRequests = [];
  try { userRequests = typeof user.friend_requests === 'string' ? JSON.parse(user.friend_requests) : (user.friend_requests || []); } catch(e){}
  userRequests = userRequests.filter(id => id !== requester.id);
  user.friend_requests = JSON.stringify(userRequests);

  if (action === 'accept') {
    let userFriends = [];
    try { userFriends = typeof user.friends === 'string' ? JSON.parse(user.friends) : (user.friends || []); } catch(e){}
    if (!userFriends.includes(requester.id)) userFriends.push(requester.id);
    user.friends = JSON.stringify(userFriends);

    let requesterFriends = [];
    try { requesterFriends = typeof requester.friends === 'string' ? JSON.parse(requester.friends) : (requester.friends || []); } catch(e){}
    if (!requesterFriends.includes(user.id)) requesterFriends.push(user.id);
    requester.friends = JSON.stringify(requesterFriends);
  }

  saveDb();
  return { success: true, action, requesterId: requester.id };
}

function removeFriend(userId, friendId) {
  const user = dbData.users.find(u => u.id === Number(userId));
  const friend = dbData.users.find(u => u.id === Number(friendId));
  if (user) {
    let friends = [];
    try { friends = typeof user.friends === 'string' ? JSON.parse(user.friends) : (user.friends || []); } catch(e){}
    user.friends = JSON.stringify(friends.filter(id => id !== Number(friendId)));
  }
  if (friend) {
    let friends = [];
    try { friends = typeof friend.friends === 'string' ? JSON.parse(friend.friends) : (friend.friends || []); } catch(e){}
    friend.friends = JSON.stringify(friends.filter(id => id !== Number(userId)));
  }
  saveDb();
  return { success: true };
}

function getFriendsData(userId) {
  const user = dbData.users.find(u => u.id === Number(userId));
  if (!user) return { friends: [], requests: [] };

  let friendIds = [];
  try { friendIds = typeof user.friends === 'string' ? JSON.parse(user.friends) : (user.friends || []); } catch(e){}

  let requestIds = [];
  try { requestIds = typeof user.friend_requests === 'string' ? JSON.parse(user.friend_requests) : (user.friend_requests || []); } catch(e){}

  const friends = friendIds.map(fid => {
    const f = dbData.users.find(u => u.id === fid);
    if (!f) return null;
    return {
      id: f.id,
      username: f.username,
      avatar: f.avatar,
      vip_rank: f.vip_rank || 'مبتدئ برونزي',
      games_won: f.games_won || 0,
      coins: f.coins || 0
    };
  }).filter(Boolean);

  const requests = requestIds.map(rid => {
    const r = dbData.users.find(u => u.id === rid);
    if (!r) return null;
    return {
      id: r.id,
      username: r.username,
      avatar: r.avatar,
      vip_rank: r.vip_rank || 'مبتدئ برونزي',
      games_won: r.games_won || 0
    };
  }).filter(Boolean);

  return { friends, requests };
}

function getLeaderboard(sortBy = 'wins') {
  const users = dbData.users || [];
  return users
    .filter(u => !u.is_banned)
    .slice()
    .sort((a, b) => {
      if (sortBy === 'coins') return (b.coins || 0) - (a.coins || 0);
      return (b.games_won || 0) - (a.games_won || 0);
    })
    .slice(0, 30)
    .map((u, idx) => ({
      rank: idx + 1,
      id: u.id,
      username: u.username,
      avatar: u.avatar,
      vip_rank: u.vip_rank || 'مبتدئ برونزي',
      games_won: u.games_won || 0,
      games_played: u.games_played || 0,
      coins: u.coins || 0,
      gems: u.gems || 0
    }));
}

function awardTablePrize(userId, prizeCoins = 0, prizeGems = 0) {
  const user = dbData.users.find(u => u.id === Number(userId));
  if (!user) return null;
  user.coins = (user.coins || 0) + Math.max(0, parseInt(prizeCoins, 10) || 0);
  user.gems = (user.gems || 0) + Math.max(0, parseInt(prizeGems, 10) || 0);
  saveDb();
  return { coins: user.coins, gems: user.gems };
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
  getServerStats,
  WHEEL_SLICES,
  STREAK_REWARDS,
  spinLuckyWheel,
  getStreakInfo,
  claimLoginStreak,
  sendFriendRequest,
  respondFriendRequest,
  removeFriend,
  getFriendsData,
  getLeaderboard,
  awardTablePrize
};
