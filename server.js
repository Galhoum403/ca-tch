const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;
const WebSocket = require('ws');
const WS_PORT = process.env.WS_PORT || 3001;
const wsSockets = new Map();
const wsRooms = new Map();

function emitToRoom(roomCode, event, data) {
  io.to(roomCode).emit(event, data);
  if (wsRooms.has(roomCode)) {
    for (const wsSock of wsRooms.get(roomCode)) {
      wsSock.emit(event, data);
    }
  }
}

function emitToPlayer(playerId, event, data) {
  if (typeof playerId === 'string' && playerId.startsWith('ws_')) {
    const wsSock = wsSockets.get(playerId);
    if (wsSock) wsSock.emit(event, data);
  } else {
    io.to(playerId).emit(event, data);
  }
}

// Serve static frontend files
app.use((req, res, next) => {
  if (req.path === '/' || req.path.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use('/cards', express.static(path.join(__dirname, 'public', 'cards')));

// ====== CARD DEFINITIONS & DECK (85 CARDS TOTAL) ======
const ACTION_CARDS_META = {
  magnatees:   { name: 'مغناطيس',   count: 3, desc: 'اطلب رقم معاك يجيلك من كل اللاعبين' },
  special:     { name: 'اسبيشيال', count: 3, desc: 'اطلب أي رقم حتى لو مش معاك' },
  el3ab_tani:  { name: 'العب تاني',count: 3, desc: 'العب دور إضافي فوراً' },
  od_le7afak:  { name: 'قد لحافك', count: 2, desc: 'اسرق لِمّة برقم عدد كروت إيدك' },
  badl_edain:  { name: 'بدل إيدي', count: 2, desc: 'بدل إيدك مع لاعب أو بدل اتنين ببعض' },
  bos_bosa:    { name: 'بص بصة',    count: 2, desc: 'بص على كارت سري عند حد' },
  sayad:       { name: 'صياد',      count: 2, desc: 'اسحب كارت عشوائي من لاعب' },
  hat_enta:    { name: 'هات انت',  count: 2, desc: 'اعكس الطلب - انت اللي تاخد' },
  kefaya_3leik:{ name: 'كفاية عليك',count: 2, desc: 'وقف لاعب بعد أول طلب ناجح' },
  joker:       { name: 'جوكر',      count: 2, desc: '3 كروت بنفس الرقم + جوكر = سيت' },
  msh_shaifak: { name: 'مش شايفك', count: 2, desc: 'لاعب ميلعبش دوره الجاي' },
  kdab:        { name: 'كداب',      count: 2, desc: 'مسموحلك تكذب وتقول معيش' },
  mana3a:      { name: 'مناعة',     count: 2, desc: 'حماية راوند كامل من الطلبات (إلا المغناطيس)' },
  lef_w_erga3: { name: 'لف وارجع',count: 2, desc: 'اعكس اتجاه اللعب' },
  herbaiya:    { name: 'الحرباية',  count: 2, desc: 'قلد أي كارت أكشن نزل على الأرض' }
};

function buildDeck() {
  let id = 0;
  const cards = [];
  // Number cards: 0 to 10 (4 copies each = 44 cards)
  for (let n = 0; n <= 10; n++) {
    for (let c = 0; c < 4; c++) {
      cards.push({ id: `c_${id++}`, type: 'number', value: n });
    }
  }
  // Card "CA" (كا = 11, 4 copies)
  for (let c = 0; c < 4; c++) {
    cards.push({ id: `c_${id++}`, type: 'number', value: 11, label: 'كا' });
  }
  // Card "TCH" (تش = 12, 4 copies)
  for (let c = 0; c < 4; c++) {
    cards.push({ id: `c_${id++}`, type: 'number', value: 12, label: 'تش' });
  }
  // Action cards (33 cards)
  for (const [t, meta] of Object.entries(ACTION_CARDS_META)) {
    for (let c = 0; c < meta.count; c++) {
      cards.push({ id: `c_${id++}`, type: t, value: null });
    }
  }
  return cards;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ====== SET DETECTION ======
function detectSets(hand) {
  const map = {};
  hand.filter(c => c.type === 'number').forEach(c => {
    (map[c.value] = map[c.value] || []).push(c);
  });
  return Object.entries(map)
    .filter(([, cs]) => cs.length >= 4)
    .map(([val, cs]) => ({ value: Number(val), cards: cs.slice(0, 4) }));
}

function detectJokerSets(hand) {
  const jokers = hand.filter(c => c.type === 'joker');
  if (!jokers.length) return [];
  const map = {};
  hand.filter(c => c.type === 'number').forEach(c => {
    (map[c.value] = map[c.value] || []).push(c);
  });
  return Object.entries(map)
    .filter(([, cs]) => cs.length >= 3)
    .map(([val, cs]) => ({ value: Number(val), cards: cs.slice(0, 3), joker: jokers[0] }));
}

function getPlayerSetsScore(player) {
  if (!player || !player.sets) return 0;
  const hasCA = player.sets.includes(11);
  const hasTCH = player.sets.includes(12);
  const bonus = (hasCA && hasTCH) ? 1 : 0; // Official Rule: CA + TCH sets = 3 sets instead of 2!
  return player.sets.length + bonus;
}

function applySetCheck(room, targetPlayer = null) {
  let changed = true;
  let targetCompletedSet = false;
  while (changed) {
    changed = false;
    for (const player of room.players) {
      // Automatic Set Collection is enabled for BOTS ONLY!
      // Human players choose when to drop/claim their sets manually!
      if (player.isBot) {
        // 4-of-a-kind (Natural Set)
        const normalSets = detectSets(player.hand);
        if (normalSets.length > 0) {
          const s = normalSets[0];
          const removeIds = new Set(s.cards.map(c => c.id));
          player.hand = player.hand.filter(c => !removeIds.has(c.id));
          player.sets.push(s.value);
          room.logs.push(`🏅 ${player.name} قفل لِمة سرية جديدة بنجاح! ⭐`);

          const pIdx = room.players.indexOf(player);
          emitToRoom(room.code, 'set_completed_anim', {
            pIdx,
            pName: player.name,
            pAvatar: player.avatar,
            isJoker: false
          });

          // Clear this completed number from all bots memory
          for (const bot of room.players) {
            if (bot.isBot && bot.botMemory?.knownPlayerCards) {
              for (const pid of Object.keys(bot.botMemory.knownPlayerCards)) {
                bot.botMemory.knownPlayerCards[pid].delete(s.value);
              }
            }
          }

          if (targetPlayer && player.id === targetPlayer.id) targetCompletedSet = true;
          changed = true;
          break;
        }

        // Joker sets (3 + Joker) for BOTS
        const jokerSets = detectJokerSets(player.hand);
        if (jokerSets.length > 0) {
          const s = jokerSets[0];
          const removeIds = new Set([...s.cards.map(c => c.id), s.joker.id]);
          player.hand = player.hand.filter(c => !removeIds.has(c.id));
          player.sets.push(s.value);
          room.jokerUsers = room.jokerUsers || [];
          room.jokerUsers.push({
            playerId: player.id,
            playerName: player.name,
            playerAvatar: player.avatar,
            value: s.value,
            busted: false
          });
          room.logs.push(`🃏 ${player.name} قفل لِمة سرية بالجوكر! ⭐`);
          room.lastEvent = { type: 'joker_set', player: player.name };

          const pIdx = room.players.indexOf(player);
          emitToRoom(room.code, 'set_completed_anim', {
            pIdx,
            pName: player.name,
            pAvatar: player.avatar,
            isJoker: true
          });

          for (const bot of room.players) {
            if (bot.isBot && bot.botMemory?.knownPlayerCards) {
              for (const pid of Object.keys(bot.botMemory.knownPlayerCards)) {
                bot.botMemory.knownPlayerCards[pid].delete(s.value);
              }
            }
          }

          if (targetPlayer && player.id === targetPlayer.id) targetCompletedSet = true;
          changed = true;
          break;
        }
      }
    }
  }
  return targetCompletedSet;
}

// Bot AI Card-Counting Memory Helpers
function updateBotMemoryOnSuccess(room, askerIdx, targetIdx, requestedNumber) {
  const asker = room.players[askerIdx];
  const target = room.players[targetIdx];
  if (!asker || !target) return;

  for (const p of room.players) {
    if (p.isBot) {
      if (!p.botMemory) p.botMemory = { knownPlayerCards: {} };
      if (!p.botMemory.knownPlayerCards) p.botMemory.knownPlayerCards = {};
      
      // Target no longer has this number
      if (p.botMemory.knownPlayerCards[target.id]) {
        p.botMemory.knownPlayerCards[target.id].delete(requestedNumber);
      }
      // Asker definitely has this number now
      if (!p.botMemory.knownPlayerCards[asker.id]) {
        p.botMemory.knownPlayerCards[asker.id] = new Set();
      }
      p.botMemory.knownPlayerCards[asker.id].add(requestedNumber);
    }
  }
}

function updateBotMemoryOnCatch(room, askerIdx, targetIdx, requestedNumber) {
  const target = room.players[targetIdx];
  if (!target) return;

  for (const p of room.players) {
    if (p.isBot) {
      if (!p.botMemory) p.botMemory = { knownPlayerCards: {} };
      if (!p.botMemory.knownPlayerCards) p.botMemory.knownPlayerCards = {};
      // Target definitely does not have this number
      if (p.botMemory.knownPlayerCards[target.id]) {
        p.botMemory.knownPlayerCards[target.id].delete(requestedNumber);
      }
    }
  }
}

// ====== ROOMS STATE ======
const rooms = new Map(); // roomCode -> Room Object

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

const BOT_NAMES = ['الداهية 🤖', 'الصياد 🤖', 'البرنس 🤖', 'الصاروخ 🤖', 'الشبح 🤖', 'القناص 🤖', 'المايسترو 🤖'];
const BOT_AVATARS = ['🤖', '🦾', '👾', '🕹️', '🕶️', '⚡', '🔥'];

function createRoom(hostSocketId, hostName, hostAvatar, userId = null, sessionToken = null) {
  const code = generateRoomCode();
  const room = {
    code,
    hostId: hostSocketId,
    status: 'lobby', // 'lobby' | 'playing' | 'gameover'
    minPlayers: 4,
    maxPlayers: 8,
    turnSpeed: 'normal', // 'fast' (15s) | 'normal' (30s) | 'relaxed' (45s)
    winTarget: 'full_deck', // 'full_deck' | 'first_to_3'
    players: [
      {
        id: hostSocketId,
        userId: userId || null,
        sessionToken: sessionToken || null,
        name: hostName || 'المضيف',
        avatar: hostAvatar || '👑',
        isHost: true,
        isBot: false,
        connected: true,
        hand: [],
        sets: [],
        immune: false,
        skipNext: false,
        extraTurns: 0,
        botMemory: {}
      }
    ],
    deck: [],
    discardPile: [],
    lastPlayedCard: null,
    currentIdx: 0,
    direction: 1, // 1 for clockwise, -1 for counter-clockwise
    turnDeadline: 0,
    turnTimerInterval: null,
    logs: ['🏠 تم إنشاء الغرفة بنجاح. في انتظار اللاعبين...'],
    lastEvent: null,
    pendingAction: null,
    kefayaTarget: null,
    successCount: 0,
    winner: null
  };
  rooms.set(code, room);
  return room;
}

function nextTurnIndex(currentIdx, direction, total) {
  return ((currentIdx + direction) % total + total) % total;
}

function startTurnTimer(room) {
  if (room.turnTimerInterval) clearInterval(room.turnTimerInterval);
  const seconds = room.turnSpeed === 'fast' ? 20 : room.turnSpeed === 'relaxed' ? 60 : 45;
  room.turnDeadline = Date.now() + (seconds * 1000);

  room.turnTimerInterval = setInterval(() => {
    if (room.status !== 'playing') {
      clearInterval(room.turnTimerInterval);
      return;
    }
    const remaining = Math.max(0, Math.ceil((room.turnDeadline - Date.now()) / 1000));
    emitToRoom(room.code, 'timer_tick', { remaining, total: seconds });

    if (remaining <= 0) {
      clearInterval(room.turnTimerInterval);
      handleTurnTimeout(room);
    }
  }, 1000);
}

function handleTurnTimeout(room) {
  const curP = room.players[room.currentIdx];
  if (!curP) return;
  room.logs.push(`⏰ انتهى وقت دور ${curP.name}! تم السحب وتمرير الدور.`);

  // Auto-draw penalty
  if (room.deck.length > 0) {
    curP.hand.push(room.deck.shift());
    applySetCheck(room);
  }
  advanceTurn(room);
}

function advanceTurn(room) {
  // Check if current player has extra turns (from el3ab_tani)
  const curP = room.players[room.currentIdx];
  if (curP && curP.extraTurns > 0) {
    curP.extraTurns--;
    room.logs.push(`🔄 دور إضافي لـ ${curP.name} بموجب كارت "العب تاني"!`);
    room.pendingAction = null;
    curP.successCount = 0;
    if (room.kefayaTarget === room.currentIdx) {
      room.kefayaTarget = null;
    }
    checkGameOver(room);
    broadcastRoomState(room);
    if (room.status === 'playing') startTurnTimer(room);
    if (room.status === 'playing' && curP.isBot) scheduleBotTurn(room);
    return;
  }

  const n = room.players.length;
  let nextIdx = nextTurnIndex(room.currentIdx, room.direction, n);

  // Check skipNext (from msh_shaifak)
  if (room.players[nextIdx].skipNext) {
    const skippedPlayer = room.players[nextIdx];
    room.logs.push(`🙈 ${skippedPlayer.name} تخطى دوره (مش شايفك)!`);
    skippedPlayer.skipNext = false;
    broadcastActionAnnouncement(room, {
      cardType: 'msh_shaifak',
      title: '🙈 تـخـطـي الـدور!',
      actorName: 'مش شايفك',
      actorAvatar: '🙈',
      targetName: skippedPlayer.name,
      targetAvatar: skippedPlayer.avatar,
      desc: `تم تخطي دور ${skippedPlayer.name} بموجب كارت مش شايفك! الدور بينتقل للي بعده.`,
      sound: 'impact',
      duration: 2200
    });
    nextIdx = nextTurnIndex(nextIdx, room.direction, n);
  }

  room.currentIdx = nextIdx;
  const currentP = room.players[nextIdx];
  currentP.immune = false;
  room.pendingAction = null;
  room.successCount = 0;

  // Official rule: If player previously lied using Kdab, when their turn arrives the Kdab card is discarded!
  if (currentP.mustDiscardKdab) {
    const kIdx = currentP.hand.findIndex(c => c.type === 'kdab');
    if (kIdx !== -1) {
      const discardedKdab = currentP.hand.splice(kIdx, 1)[0];
      room.discardPile.push(discardedKdab);
      room.lastPlayedCard = discardedKdab;
      currentP.mustDiscardKdab = false;
      room.logs.push(`🤥 سقط كارت الكداب من يد ${currentP.name} على الأرض في الديسكارد!`);
      broadcastActionAnnouncement(room, {
        cardType: 'kdab',
        title: '🤥 سـقـــــوط كـــــارت الـكـــــدّاب!',
        actorName: currentP.name,
        actorAvatar: currentP.avatar,
        desc: `لما جه دور ${currentP.name}، نزل كارت الكداب على الأرض طبقاً لقوانين اللعبة!`,
        sound: 'impact',
        duration: 2200
      });
    }
  }

  room.logs.push(`👉 دور: ${currentP.name}`);
  if (checkGameOver(room)) {
    broadcastRoomState(room);
    return;
  }

  // Official Rule: If player has NO number cards AND no playable action cards in hand, they draw 1 card and their turn ends!
  const hasNumbers = currentP.hand.some(c => c.type === 'number');
  const hasPlayableActions = currentP.hand.some(c => c.type !== 'number' && c.type !== 'hat_enta');
  if (!hasNumbers && !hasPlayableActions && room.deck.length > 0) {
    const drawn = room.deck.shift();
    currentP.hand.push(drawn);
    room.logs.push(`📥 ${currentP.name} معندوش أي كروت لعب في إيده! سحب كارت تلقائياً وانتهى دوره.`);
    broadcastActionAnnouncement(room, {
      cardType: 'deck',
      title: '📥 سـحـــــب كـــــارت!',
      actorName: currentP.name,
      actorAvatar: currentP.avatar,
      desc: `${currentP.name} معندوش أي كروت في إيده! سحب كارت تلقائياً وتمرر الدور.`,
      sound: 'card',
      duration: 2000
    });
    applySetCheck(room, currentP);
    broadcastRoomState(room);
    setTimeout(() => {
      advanceTurn(room);
    }, 2000);
    return;
  }

  broadcastRoomState(room);

  // Restart timer
  if (room.status === 'playing') {
    startTurnTimer(room);
  }

  // If next player is bot, trigger bot turn
  if (room.status === 'playing' && currentP.isBot) {
    scheduleBotTurn(room);
  }
}

function broadcastActionAnnouncement(room, announcement) {
  emitToRoom(room.code, 'action_announcement', {
    cardType: announcement.cardType || 'action',
    cardValue: announcement.cardValue,
    title: announcement.title || 'أكشن!',
    actorName: announcement.actorName || '',
    actorAvatar: announcement.actorAvatar || '👤',
    targetName: announcement.targetName || null,
    targetAvatar: announcement.targetAvatar || null,
    desc: announcement.desc || '',
    sound: announcement.sound || 'impact',
    duration: announcement.duration || 5000
  });
}

function findPendingJokerChallenges(room) {
  if (!room.jokerUsers || room.jokerUsers.length === 0) return [];
  const challenges = [];
  for (const jEntry of room.jokerUsers) {
    if (jEntry.busted || jEntry.resolvedChallenge) continue;
    // Find if any player (other than the joker user) holds the orphan card of this number
    for (let i = 0; i < room.players.length; i++) {
      const p = room.players[i];
      if (p.id !== jEntry.playerId) {
        const hasOrphan = p.hand.some(c => c.type === 'number' && c.value === jEntry.value);
        if (hasOrphan) {
          challenges.push({
            jokerEntry: jEntry,
            holder: p,
            holderIdx: i,
            orphanValue: jEntry.value
          });
          break; // one challenger per joker set
        }
      }
    }
  }
  return challenges;
}

function checkGameOver(room) {
  if (room.status === 'gameover' || room.status === 'joker_showdown') return true;

  if (room.winTarget === 'first_to_3') {
    const leader = room.players.find(p => getPlayerSetsScore(p) >= 3);
    if (leader) {
      const challenges = findPendingJokerChallenges(room);
      if (challenges.length > 0) {
        startJokerShowdown(room, challenges);
        return true;
      }
      finalizeGameOver(room);
      return true;
    }
  }

  const remainingNumbers = room.players.flatMap(p => p.hand.filter(c => c.type === 'number'));

  if (room.deck.length === 0) {
    const challenges = findPendingJokerChallenges(room);
    const allRemainingAreOrphans = remainingNumbers.length > 0 && remainingNumbers.every(c => 
      room.jokerUsers?.some(j => j.value === c.value)
    );
    const emptyDeckPasses = (room.emptyDeckPassCount || 0) >= room.players.length;

    if (remainingNumbers.length === 0 || allRemainingAreOrphans || emptyDeckPasses) {
      if (challenges.length > 0) {
        startJokerShowdown(room, challenges);
        return true;
      }
      finalizeGameOver(room);
      return true;
    }
  }

  return false;
}

function startJokerShowdown(room, challenges) {
  if (room.turnTimerInterval) clearInterval(room.turnTimerInterval);
  room.status = 'joker_showdown';
  room.pendingJokerChallenges = challenges || findPendingJokerChallenges(room);

  if (!room.pendingJokerChallenges || room.pendingJokerChallenges.length === 0) {
    finalizeGameOver(room);
    return;
  }

  const active = room.pendingJokerChallenges.shift();
  room.activeJokerChallenge = active;
  const { holder, orphanValue } = active;
  const valLabel = orphanValue === 11 ? 'كا' : orphanValue === 12 ? 'تش' : `${orphanValue}`;

  room.logs.push(`🕵️ مواجهة الجوكر الأخيرة! ${holder.name} معاه الكارت اليتيم رقم [${valLabel}] وبيخمن مين اللي قفل اللِمّة بالجوكر!`);
  broadcastActionAnnouncement(room, {
    cardType: 'joker',
    title: `🕵️ مـواجـهـة الـجـوكـر الأخـيـرة!`,
    actorName: holder.name,
    actorAvatar: holder.avatar,
    desc: `${holder.name} معاه كارت يتيم رقم [${valLabel}]! اللِمّة اتقفلت بالسرقة بالجوكر.. أمامه فرصة لتخمين صاحب الجوكر وسرقة اللِمّة منه أو خسارة لِمّة!`,
    sound: 'impact',
    duration: 5000
  });

  broadcastRoomState(room);

  if (holder.isBot) {
    setTimeout(() => {
      if (room.status !== 'joker_showdown' || !room.activeJokerChallenge) return;
      const otherPlayers = room.players.filter(p => p.id !== holder.id);
      if (otherPlayers.length === 0) {
        resolveJokerChallenge(room, null);
        return;
      }
      const actualUser = room.players.find(p => p.id === active.jokerEntry.playerId);
      let pickedTargetId;
      if (actualUser && Math.random() < 0.60) {
        pickedTargetId = actualUser.id;
      } else {
        const others = otherPlayers.filter(p => p.id !== active.jokerEntry.playerId);
        const randomVictim = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : otherPlayers[0];
        pickedTargetId = randomVictim.id;
      }
      resolveJokerChallenge(room, pickedTargetId);
    }, 3200);
  }
}

function resolveJokerChallenge(room, targetPlayerId) {
  if (!room.activeJokerChallenge) return;
  const { holder, orphanValue, jokerEntry } = room.activeJokerChallenge;
  const challenger = holder;
  const actualJokerUserId = jokerEntry.playerId;
  const valLabel = orphanValue === 11 ? 'كا' : orphanValue === 12 ? 'تش' : `${orphanValue}`;
  jokerEntry.resolvedChallenge = true;

  if (!targetPlayerId) {
    room.logs.push(`🏳️ ${challenger.name} فضّل عدم المخاطرة وتخطى تخمين لِمّة الجوكر رقم [${valLabel}].`);
    broadcastActionAnnouncement(room, {
      cardType: 'joker',
      title: `🏳️ تَـخَـطِّـي تَـخـمـيـن الـجـوكـر`,
      actorName: challenger.name,
      actorAvatar: challenger.avatar,
      desc: `${challenger.name} معاه كارت يتيم رقم [${valLabel}] لكن فضّل عدم المخاطرة بتخمين صاحب الجوكر.`,
      sound: 'impact',
      duration: 3500
    });
    emitToRoom(room.code, 'joker_showdown_result', {
      success: false,
      skipped: true,
      challengerName: challenger.name,
      valLabel
    });
  } else if (targetPlayerId === actualJokerUserId) {
    const actualPlayer = room.players.find(p => p.id === actualJokerUserId);
    jokerEntry.busted = true;
    jokerEntry.bustedBy = challenger.name;

    if (actualPlayer) {
      const sIdx = actualPlayer.sets.indexOf(orphanValue);
      if (sIdx !== -1) {
        actualPlayer.sets.splice(sIdx, 1);
      }
    }
    challenger.sets.push(orphanValue);

    room.logs.push(`🎯 قَفْشَة الجوكر! ${challenger.name} قفش ${actualPlayer ? actualPlayer.name : 'صاحب الجوكر'} متلبس بلِمّة الجوكر رقم [${valLabel}]! اللِمّة اتسحبت منه وراحت لـ ${challenger.name} 👏`);
    broadcastActionAnnouncement(room, {
      cardType: 'joker',
      title: `🎯 اتقفش متلبس! قَفْشَة الجوكر!`,
      actorName: challenger.name,
      actorAvatar: challenger.avatar,
      targetName: actualPlayer ? actualPlayer.name : '',
      targetAvatar: actualPlayer ? actualPlayer.avatar : '🃏',
      desc: `تخمين عبقري! ${actualPlayer ? actualPlayer.name : ''} كان مقفّل لِمّة رقم [${valLabel}] بالجوكر! اللِمّة اتسحبت منه وراحت لـ ${challenger.name}! 🔥`,
      sound: 'celebration',
      duration: 5000
    });
    emitToRoom(room.code, 'joker_showdown_result', {
      success: true,
      challengerName: challenger.name,
      accusedName: actualPlayer ? actualPlayer.name : '',
      valLabel
    });
  } else {
    const accusedPlayer = room.players.find(p => p.id === targetPlayerId);
    const actualPlayer = room.players.find(p => p.id === actualJokerUserId);
    let penaltyVal = null;
    if (challenger.sets.length > 0) {
      penaltyVal = challenger.sets.pop();
      if (actualPlayer) {
        actualPlayer.sets.push(penaltyVal);
      }
    }
    const penLabel = penaltyVal !== null ? (penaltyVal === 11 ? 'كا' : penaltyVal === 12 ? 'تش' : `${penaltyVal}`) : '';
    room.logs.push(`❌ تخمين غلط! ${challenger.name} اتهم ${accusedPlayer ? accusedPlayer.name : 'لاعب آخر'} بالباطل! صاحب الجوكر الحقيقي هو ${actualPlayer ? actualPlayer.name : ''} ونفد بخدعته.. ${penaltyVal !== null ? `والمخمن خسر لِمّة رقم [${penLabel}] لصالح صاحب الجوكر ${actualPlayer ? actualPlayer.name : ''} مكافأة له على نجاح تمويهه!` : ''}`);
    broadcastActionAnnouncement(room, {
      cardType: 'joker',
      title: `🎭 نـفَـد بـالـجـوكـر! عـقـوبـة الـتـخـمـيـن!`,
      actorName: actualPlayer ? actualPlayer.name : 'صاحب الجوكر',
      actorAvatar: actualPlayer ? actualPlayer.avatar : '🃏',
      targetName: challenger.name,
      targetAvatar: challenger.avatar,
      desc: `تخمين غلط! ${accusedPlayer ? accusedPlayer.name : ''} بريء! صاحب الجوكر الحقيقي ${actualPlayer ? actualPlayer.name : ''} نجح في خداع الكل ونفد باللِمّة! ${penaltyVal !== null ? `${challenger.name} اتعاقب وخسر لِمّة رقم [${penLabel}] وراحت لصاحب الجوكر ${actualPlayer ? actualPlayer.name : ''}!` : ''}`,
      sound: 'catch',
      duration: 5000
    });
    emitToRoom(room.code, 'joker_showdown_result', {
      success: false,
      challengerName: challenger.name,
      accusedName: accusedPlayer ? accusedPlayer.name : '',
      actualName: actualPlayer ? actualPlayer.name : '',
      penaltyGiven: penaltyVal !== null,
      valLabel
    });
  }

  room.activeJokerChallenge = null;
  broadcastRoomState(room);

  setTimeout(() => {
    if (room.pendingJokerChallenges && room.pendingJokerChallenges.length > 0) {
      startJokerShowdown(room, room.pendingJokerChallenges);
    } else {
      finalizeGameOver(room);
    }
  }, 4500);
}

function finalizeGameOver(room) {
  if (room.turnTimerInterval) clearInterval(room.turnTimerInterval);
  room.status = 'gameover';
  const maxScore = Math.max(...room.players.map(p => getPlayerSetsScore(p)));
  const winners = room.players.filter(p => getPlayerSetsScore(p) === maxScore);
  room.winner = winners.map(w => `${w.name} (${getPlayerSetsScore(w)} لِمّة)`).join(' و ');
  room.logs.push(`🏆 انتهت اللعبة رسمياً! الفائز: ${room.winner}!`);
  room.lastEvent = { type: 'gameover', winner: room.winner };
  broadcastRoomState(room);
  return true;
}

// Sanitized State for each player
function getPlayerView(room, socketId) {
  return {
    code: room.code,
    status: room.status,
    minPlayers: room.minPlayers,
    maxPlayers: room.maxPlayers,
    turnSpeed: room.turnSpeed || 'normal',
    winTarget: room.winTarget || 'full_deck',
    deckCount: room.deck.length,
    discardCount: room.discardPile.length,
    discardPile: room.discardPile.slice(-40),
    lastPlayedCard: room.lastPlayedCard,
    currentIdx: room.currentIdx,
    direction: room.direction,
    turnTimeRemaining: Math.max(0, Math.ceil((room.turnDeadline - Date.now()) / 1000)),
    logs: room.logs.slice(-30),
    lastEvent: room.lastEvent,
    pendingAction: room.pendingAction,
    winner: room.winner,
    jokerUsers: room.status === 'gameover' ? (room.jokerUsers || []) : [],
    jokerChallenge: room.status === 'joker_showdown' && room.activeJokerChallenge ? {
      challengerId: room.activeJokerChallenge.holder.id,
      challengerName: room.activeJokerChallenge.holder.name,
      challengerAvatar: room.activeJokerChallenge.holder.avatar,
      orphanValue: room.activeJokerChallenge.orphanValue,
      isChallengerMe: room.activeJokerChallenge.holder.id === socketId,
      possibleTargets: room.players
        .filter(p => p.id !== room.activeJokerChallenge.holder.id)
        .map(p => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          setsCount: p.sets.length
        }))
    } : null,
    isMyTurn: room.status === 'playing' && room.players[room.currentIdx]?.id === socketId,
    myPlayerIndex: room.players.findIndex(p => p.id === socketId),
    players: room.players.map((p, idx) => {
      const isSelf = p.id === socketId;
      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isHost: p.isHost,
        isBot: p.isBot,
        connected: p.connected,
        cardCount: p.hand.length,
        sets: (isSelf || room.status === 'gameover') ? p.sets : p.sets.map(() => '?'),
        score: getPlayerSetsScore(p),
        immune: p.immune,
        skipNext: p.skipNext,
        hand: isSelf ? p.hand : undefined // Opponents' cards are STRICTLY hidden!
      };
    })
  };
}

function broadcastRoomState(room) {
  for (const p of room.players) {
    if (!p.isBot && p.connected) {
      emitToPlayer(p.id, 'room_state', getPlayerView(room, p.id));
    }
  }
}

// ====== BOT AI LOGIC (SMART CARD-COUNTING & MEMORY) ======
function scheduleBotTurn(room) {
  const botIdx = room.currentIdx;
  const bot = room.players[botIdx];
  if (!bot || !bot.isBot || room.status !== 'playing') return;

  const delayMs = room.turnSpeed === 'fast' ? 1500 : room.turnSpeed === 'relaxed' ? 4000 : 2600;

  setTimeout(() => {
    if (room.currentIdx !== botIdx || room.status !== 'playing') return;

    const actionCards = bot.hand.filter(c => c.type !== 'number');
    const numberCards = bot.hand.filter(c => c.type === 'number');

    // 1. High priority: Defend against opponents who are about to win
    const leaderOpponent = room.players
      .map((p, idx) => ({ player: p, idx }))
      .filter(t => t.idx !== botIdx && !t.player.immune && t.player.hand.length > 0)
      .sort((a, b) => getPlayerSetsScore(b.player) - getPlayerSetsScore(a.player))[0];

    if (leaderOpponent && getPlayerSetsScore(leaderOpponent.player) >= (room.winTarget === 'first_to_3' ? 2 : 3)) {
      const stopCard = actionCards.find(c => ['msh_shaifak', 'kefaya_3leik', 'sayad'].includes(c.type));
      if (stopCard) {
        emitToRoom(room.code, 'chat_bubble', {
          pIdx: botIdx,
          name: bot.name,
          text: `مش هسيبك تفوز يا ${leaderOpponent.player.name}! 😈`,
          emoji: '😈'
        });
        handlePlayAction(room, bot, stopCard, { targetIdx: leaderOpponent.idx });
        return;
      }
    }

    // 2. Play beneficial self-actions
    const selfAction = actionCards.find(c => ['el3ab_tani', 'mana3a', 'magnatees'].includes(c.type));
    if (selfAction && Math.random() < 0.7) {
      if (selfAction.type === 'magnatees' && numberCards.length > 0) {
        const freq = {};
        numberCards.forEach(c => freq[c.value] = (freq[c.value] || 0) + 1);
        const bestVal = Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
        handlePlayAction(room, bot, selfAction, { value: bestVal });
        return;
      } else if (selfAction.type !== 'magnatees') {
        handlePlayAction(room, bot, selfAction);
        return;
      }
    }

    // 3. Smart Card-Counting Ask using Bot Memory
    if (numberCards.length > 0) {
      const myNumbers = new Set(numberCards.map(c => c.value));
      const known = bot.botMemory?.knownPlayerCards || {};

      let smartTarget = null;
      let smartNum = null;

      // Scan memory for known opponent cards matching bot's numbers
      for (const [pId, numSet] of Object.entries(known)) {
        const oppIdx = room.players.findIndex(p => p.id === pId);
        if (oppIdx !== -1 && oppIdx !== botIdx && !room.players[oppIdx].immune && room.players[oppIdx].hand.length > 0) {
          for (const val of numSet) {
            if (myNumbers.has(val)) {
              smartTarget = oppIdx;
              smartNum = val;
              break;
            }
          }
        }
        if (smartTarget !== null) break;
      }

      if (smartTarget !== null && smartNum !== null) {
        if (Math.random() < 0.45) {
          const banterLines = [
            `فاكر كويس إنك خدت الرقم ده يا ${room.players[smartTarget].name}! 👀`,
            `عيني عليك ومش ناسي كروتك 😉`,
            `هات الرقم اللي معاك بالذوق بقى! 🔥`
          ];
          emitToRoom(room.code, 'chat_bubble', {
            pIdx: botIdx,
            name: bot.name,
            text: banterLines[Math.floor(Math.random() * banterLines.length)],
            emoji: '🎯'
          });
        }
        handleAsk(room, botIdx, smartTarget, smartNum);
        return;
      }

      // Fallback: Ask for most frequent number from player with most cards
      const freq = {};
      numberCards.forEach(c => freq[c.value] = (freq[c.value] || 0) + 1);
      const chosenNum = Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);

      const validTargets = room.players
        .map((p, idx) => ({ player: p, idx }))
        .filter(t => t.idx !== botIdx && !t.player.immune && t.player.hand.length > 0);

      if (validTargets.length > 0) {
        validTargets.sort((a, b) => b.player.hand.length - a.player.hand.length);
        const target = validTargets[0];
        handleAsk(room, botIdx, target.idx, chosenNum);
        return;
      }
    }

    // 4. Play remaining action if no number cards
    if (actionCards.length > 0) {
      handlePlayAction(room, bot, actionCards[0]);
      return;
    }

    advanceTurn(room);
  }, delayMs);
}

// ====== GAMEPLAY ACTIONS ======
function handleAsk(room, askerIdx, targetIdx, requestedNumber) {
  const asker = room.players[askerIdx];
  const target = room.players[targetIdx];
  if (!asker || !target) return;

  // Set last played card on table
  room.lastPlayedCard = { type: 'number', value: requestedNumber };

  // Immunity check (magnet bypasses this separately)
  if (target.immune) {
    room.logs.push(`🛡️ ${target.name} محمي بالمناعة! الطلب فشل.`);
    room.lastEvent = { type: 'immune_blocked', asker: asker.name, target: target.name };
    broadcastActionAnnouncement(room, {
      cardType: 'mana3a',
      title: '🛡️ صـــد بالمـنـــاعـــة!',
      actorName: asker.name,
      actorAvatar: asker.avatar,
      targetName: target.name,
      targetAvatar: target.avatar,
      desc: `${target.name} محمي بالدرع! طلب ${asker.name} تم صده وفشل.`,
      sound: 'impact',
      duration: 2200
    });
    broadcastRoomState(room);
    advanceTurn(room);
    return;
  }

  // Official Rule: Check if target holds the counter card "hat_enta"!
  const hatCard = target.hand.find(c => c.type === 'hat_enta');
  if (hatCard) {
    if (target.isBot) {
      if (Math.random() < 0.5) {
        executeHatEntaCounter(room, targetIdx, askerIdx, requestedNumber);
        return;
      }
    } else {
      // Human target holds "hat_enta": give them a 4.5-second reaction window
      target.pendingHatEntaPrompt = { askerIdx, requestedNumber };
      emitToPlayer(target.id, 'hat_enta_counter_prompt', {
        askerName: asker.name,
        requestedNumber
      });
      const lbl = requestedNumber === 11 ? 'كا' : requestedNumber === 12 ? 'تش' : `${requestedNumber}`;
      room.logs.push(`🛑 ${asker.name} طلب [${lbl}] من ${target.name}... معاه كارت « هات انت » ومتاح له يعكس الطلب!`);
      broadcastRoomState(room);
      if (room.hatEntaTimer) clearTimeout(room.hatEntaTimer);
      room.hatEntaTimer = setTimeout(() => {
        if (target.pendingHatEntaPrompt && room.status === 'playing') {
          target.pendingHatEntaPrompt = null;
          continueNormalAskAfterHatEnta(room, askerIdx, targetIdx, requestedNumber);
        }
      }, 4500);
      return;
    }
  }

  continueNormalAskAfterHatEnta(room, askerIdx, targetIdx, requestedNumber);
}

function continueNormalAskAfterHatEnta(room, askerIdx, targetIdx, requestedNumber) {
  const asker = room.players[askerIdx];
  const target = room.players[targetIdx];
  if (!asker || !target) return;

  const matchingCards = target.hand.filter(c => c.type === 'number' && c.value === requestedNumber);

  if (matchingCards.length > 0) {
    // Official Rule: Check if target holds the "kdab" card!
    const kdabCard = target.hand.find(c => c.type === 'kdab');
    if (kdabCard) {
      if (target.isBot) {
        // Bot lies 65% of the time if it has the liar card!
        if (Math.random() < 0.65) {
          executeLiarLie(room, askerIdx, targetIdx, requestedNumber);
          return;
        }
      } else {
        // Human player: Send decision prompt (Give or Lie)
        target.pendingLiarPrompt = { askerIdx, requestedNumber, count: matchingCards.length };
        emitToPlayer(target.id, 'liar_decision_prompt', {
          askerName: asker.name,
          requestedNumber,
          count: matchingCards.length
        });
        const lbl = requestedNumber === 11 ? 'كا' : requestedNumber === 12 ? 'تش' : `${requestedNumber}`;
        room.logs.push(`🤔 ${asker.name} طلب [${lbl}] من ${target.name}... معاه كارت كداب وبيقرر يكدب ولا يقول الحقيقة!`);
        broadcastRoomState(room);
        return;
      }
    }
    executeTruthfulTransfer(room, askerIdx, targetIdx, requestedNumber);
  } else {
    executeCatchDraw(room, askerIdx, targetIdx, requestedNumber);
  }
}

function executeTruthfulTransfer(room, askerIdx, targetIdx, requestedNumber) {
  const asker = room.players[askerIdx];
  const target = room.players[targetIdx];
  const matchingCards = target.hand.filter(c => c.type === 'number' && c.value === requestedNumber);
  const matchIds = new Set(matchingCards.map(c => c.id));
  target.hand = target.hand.filter(c => !matchIds.has(c.id));
  asker.hand.push(...matchingCards);
  asker.successCount = (asker.successCount || 0) + 1;
  room.emptyDeckPassCount = 0;

  const lbl = requestedNumber === 11 ? 'كا' : requestedNumber === 12 ? 'تش' : `${requestedNumber}`;
  room.logs.push(`✅ ${asker.name} طلب [${lbl}] من ${target.name} ونجح! أخذ ${matchingCards.length} كارت 👏`);
  room.lastEvent = {
    type: 'ask_success',
    asker: asker.name,
    target: target.name,
    value: requestedNumber,
    count: matchingCards.length
  };

  broadcastActionAnnouncement(room, {
    cardType: 'number',
    cardValue: requestedNumber,
    title: `✅ طـلـب نـاجـــــح! [ ${lbl} ]`,
    actorName: asker.name,
    actorAvatar: asker.avatar,
    targetName: target.name,
    targetAvatar: target.avatar,
    desc: `${asker.name} طلب رقم [ ${lbl} ] من ${target.name} وأخذ منه ${matchingCards.length} ${matchingCards.length === 1 ? 'كارت' : 'كروت'}! ويستمر دوره.`,
    sound: 'impact',
    duration: 5000
  });

  emitToRoom(room.code, 'card_transfer_anim', {
    fromIdx: targetIdx,
    toIdx: askerIdx,
    fromName: target.name,
    toName: asker.name,
    cardValue: requestedNumber,
    count: matchingCards.length
  });

  emitToRoom(room.code, 'ask_showdown_anim', {
    askerIdx,
    targetIdx,
    askerName: asker.name,
    targetName: target.name,
    askerAvatar: asker.avatar,
    targetAvatar: target.avatar,
    askerId: asker.id,
    targetId: target.id,
    cardValue: requestedNumber,
    success: true,
    count: matchingCards.length
  });
  updateBotMemoryOnSuccess(room, askerIdx, targetIdx, requestedNumber);

  applySetCheck(room, asker);

  if (room.kefayaTarget === askerIdx && asker.successCount >= 1) {
    room.logs.push(`🖐️ كفاية عليك! انتهى دور ${asker.name} بعد أول نجاح.`);
    room.kefayaTarget = null;
    advanceTurn(room);
    return;
  }

  if (checkGameOver(room)) {
    broadcastRoomState(room);
    return;
  }

  // Bot reactive interrupt: "Hat Enta"
  const botInterruptors = room.players.filter((p, i) => p.isBot && i !== askerIdx && p.hand.some(c => c.type === 'hat_enta'));
  if (botInterruptors.length > 0) {
    // 50% chance a bot decides to stop a streak, especially if the player is doing well
    if (Math.random() < 0.5) {
      const interrupter = botInterruptors[Math.floor(Math.random() * botInterruptors.length)];
      const hatCard = interrupter.hand.find(c => c.type === 'hat_enta');
      
      setTimeout(() => {
        if (room.status === 'playing' && room.currentIdx === askerIdx && room.players[askerIdx].successCount > 0) {
           handlePlayAction(room, interrupter, hatCard);
        }
      }, 1200); // 1.2s delay for realism
    }
  }

  startTurnTimer(room);
  broadcastRoomState(room);
  if (asker.isBot) scheduleBotTurn(room);
}

function executeHatEntaCounter(room, targetIdx, askerIdx, requestedNumber) {
  const target = room.players[targetIdx];
  const asker = room.players[askerIdx];
  if (!target || !asker) return;

  const hIdx = target.hand.findIndex(c => c.type === 'hat_enta');
  if (hIdx === -1) return;

  if (room.hatEntaTimer) {
    clearTimeout(room.hatEntaTimer);
    room.hatEntaTimer = null;
  }
  target.pendingHatEntaPrompt = null;
  const card = target.hand.splice(hIdx, 1)[0];
  room.discardPile.push(card);
  room.lastPlayedCard = card;

  const lbl = requestedNumber === 11 ? 'كا' : requestedNumber === 12 ? 'تش' : `${requestedNumber}`;
  room.logs.push(`✋ هات انت! ${target.name} رفع كارت هات انت في وش ${asker.name} وعكس الطلب ليأخذ هو رقم [${lbl}]!`);

  const matchingInAsker = asker.hand.filter(c => c.type === 'number' && c.value === requestedNumber);
  if (matchingInAsker.length > 0) {
    const matchIds = new Set(matchingInAsker.map(c => c.id));
    asker.hand = asker.hand.filter(c => !matchIds.has(c.id));
    target.hand.push(...matchingInAsker);
    room.logs.push(`👏 ${target.name} نجح في أخذ ${matchingInAsker.length} كارت من ${asker.name} بكارت هات انت!`);
  } else {
    room.logs.push(`🔍 ${target.name} عكس الطلب لكن ${asker.name} مكنش معاه رقم [${lbl}]!`);
  }

  broadcastActionAnnouncement(room, {
    cardType: 'hat_enta',
    title: '✋ هـــــات انـــــت!',
    actorName: target.name,
    actorAvatar: target.avatar,
    targetName: asker.name,
    targetAvatar: asker.avatar,
    desc: `${target.name} رفع كارت "هات انت"! عكس الطلب على ${asker.name} واستولى على الدور!`,
    sound: 'impact',
    duration: 3500
  });

  emitToRoom(room.code, 'ask_showdown_anim', {
    askerIdx: targetIdx,
    targetIdx: askerIdx,
    askerName: target.name,
    targetName: asker.name,
    askerAvatar: target.avatar,
    targetAvatar: asker.avatar,
    askerId: target.id,
    targetId: asker.id,
    cardValue: requestedNumber,
    success: matchingInAsker.length > 0,
    count: matchingInAsker.length
  });

  room.currentIdx = targetIdx;
  target.successCount = 1;
  applySetCheck(room, target);
  checkGameOver(room);
  startTurnTimer(room);
  broadcastRoomState(room);
  if (target.isBot) scheduleBotTurn(room);
}

function executeLiarLie(room, askerIdx, targetIdx, requestedNumber) {
  const asker = room.players[askerIdx];
  const target = room.players[targetIdx];
  target.pendingLiarPrompt = null;
  target.mustDiscardKdab = true; // flag to discard kdab when turn circles back to target

  const lbl = requestedNumber === 11 ? 'كا' : requestedNumber === 12 ? 'تش' : `${requestedNumber}`;
  room.logs.push(`🤥 ${target.name} استغل كارت الكداب وقال معيش [${lbl}]! احتسبت CATCH على ${asker.name}!`);
  broadcastActionAnnouncement(room, {
    cardType: 'kdab',
    title: '🤥 كـــــدّاب فـي الـسِـــــر!',
    actorName: target.name,
    actorAvatar: target.avatar,
    desc: `${target.name} كذب وقال معيش [${lbl}] مستخدماً كارت الكداب! واحتسبت CATCH على ${asker.name}!`,
    sound: 'impact',
    duration: 5000
  });

  executeCatchDraw(room, askerIdx, targetIdx, requestedNumber);
}

function executeCatchDraw(room, askerIdx, targetIdx, requestedNumber) {
  const asker = room.players[askerIdx];
  const target = room.players[targetIdx];
  const lbl = requestedNumber === 11 ? 'كا' : requestedNumber === 12 ? 'تش' : `${requestedNumber}`;

  room.logs.push(`🚫 CATCH! ${asker.name} طلب [${lbl}] من ${target.name} لكن متوفقش!`);
  room.lastEvent = {
    type: 'catch',
    asker: asker.name,
    target: target.name,
    value: requestedNumber
  };

  emitToRoom(room.code, 'catch_stamp_anim', {
    askerIdx,
    targetIdx,
    askerName: asker.name,
    targetName: target.name,
    value: requestedNumber
  });

  emitToRoom(room.code, 'ask_showdown_anim', {
    askerIdx,
    targetIdx,
    askerName: asker.name,
    targetName: target.name,
    askerAvatar: asker.avatar,
    targetAvatar: target.avatar,
    askerId: asker.id,
    targetId: target.id,
    cardValue: requestedNumber,
    success: false,
    count: 0
  });
  updateBotMemoryOnCatch(room, askerIdx, targetIdx, requestedNumber);

  broadcastActionAnnouncement(room, {
    cardType: 'catch',
    title: '🚫 C A T C H !',
    actorName: asker.name,
    actorAvatar: asker.avatar,
    targetName: target.name,
    targetAvatar: target.avatar,
    desc: `${asker.name} طلب [${lbl}] من ${target.name} ومعندوش! CATCH وغرامة كارت سحب.`,
    sound: 'catch',
    duration: 5000
  });

  // Draw card on CATCH
  if (room.deck.length > 0) {
    const drawn = room.deck.shift();
    asker.hand.push(drawn);
    room.logs.push(`📥 سحب ${asker.name} كارت من الديك بعد الـ CATCH.`);

    // Condition 1: If drawn card is the exact number requested -> KEEP TURN!
    if (drawn.type === 'number' && drawn.value === requestedNumber) {
      const drawnLbl = drawn.value === 11 ? 'كا' : drawn.value === 12 ? 'تش' : `${drawn.value}`;
      room.logs.push(`🎯 برافو! ${asker.name} سحب نفس الرقم اللي كان طالبه [${drawnLbl}] من الديك! يستمر دوره.`);
      broadcastActionAnnouncement(room, {
        cardType: 'special',
        title: `🎯 سحب نفس الكارت المطلوب [${drawnLbl}]!`,
        actorName: asker.name,
        actorAvatar: asker.avatar,
        desc: `${asker.name} سحب من الديك نفس الكارت اللي كان طالبه [ ${drawnLbl} ]! يستمر دوره فوراً ويطلب من جديد!`,
        sound: 'impact',
        duration: 3500
      });
      applySetCheck(room, asker);
      broadcastRoomState(room);
      setTimeout(() => {
        if (room.status === 'playing') {
          startTurnTimer(room);
          if (asker.isBot) scheduleBotTurn(room);
        }
      }, 3500);
      return;
    }

    // Condition 2: If drawn card completed a set (لمة) -> KEEP TURN!
    const setCompleted = applySetCheck(room, asker);
    if (setCompleted) {
      room.logs.push(`⭐ مبروك! الكارت المسحوب قفل لِمّة لـ ${asker.name}! يستمر دوره.`);
      broadcastActionAnnouncement(room, {
        cardType: 'joker',
        title: `⭐ لِــمّــة مـكـتـمـلـة!`,
        actorName: asker.name,
        actorAvatar: asker.avatar,
        desc: `${asker.name} الكارت المسحوب قفل معاه لِمّة كاملة! يستمر دوره ويطلب من جديد!`,
        sound: 'impact',
        duration: 3500
      });
      broadcastRoomState(room);
      setTimeout(() => {
        if (room.status === 'playing') {
          startTurnTimer(room);
          if (asker.isBot) scheduleBotTurn(room);
        }
      }, 3500);
      return;
    }

    // Condition 3: If drawn card is "el3ab_tani" -> Extra turn!
    if (drawn.type === 'el3ab_tani') {
      room.logs.push(`🔄 سحب ${asker.name} كارت "العب تاني"! دور إضافي!`);
      asker.hand = asker.hand.filter(c => c.id !== drawn.id);
      room.discardPile.push(drawn);
      room.lastPlayedCard = drawn;
      asker.extraTurns = 0;
      broadcastActionAnnouncement(room, {
        cardType: 'el3ab_tani',
        title: '🔄 الـعـــــب تــانـــــي!',
        actorName: asker.name,
        actorAvatar: asker.avatar,
        desc: `${asker.name} سحب كارت "العب تاني" من الديك! دور إضافي فوراً!`,
        sound: 'impact',
        duration: 3500
      });
      broadcastRoomState(room);
      setTimeout(() => {
        if (room.status === 'playing') {
          startTurnTimer(room);
          if (asker.isBot) scheduleBotTurn(room);
        }
      }, 3500);
      return;
    }
  } else {
    room.emptyDeckPassCount = (room.emptyDeckPassCount || 0) + 1;
    room.logs.push(`⚠️ الديك خلص! مفيش كروت سحب.`);
  }

  broadcastRoomState(room);
  // Give players ample time (3.5s) to view the dramatic CATCH animation before the next turn begins
  setTimeout(() => {
    if (room.status === 'playing') {
      advanceTurn(room);
    }
  }, 3500);
}

function handlePlayAction(room, player, card, extraData = {}, isChameleonSub = false) {
  const pIdx = room.players.findIndex(p => p.id === player.id);
  if (!isChameleonSub) {
    // Remove card from hand and place in discard pile
    player.hand = player.hand.filter(c => c.id !== card.id);
    room.discardPile.push(card);
    room.lastPlayedCard = card;
    room.logs.push(`✨ ${player.name} لعب كارت أكشن: [${ACTION_CARDS_META[card.type]?.name || card.type}]`);
  }

  switch (card.type) {
    case 'el3ab_tani': {
      // Playing el3ab_tani grants this 1 immediate extra turn. Do NOT stack extraTurns for later!
      player.extraTurns = 0;
      player.successCount = 0;
      if (room.kefayaTarget === pIdx) {
        room.kefayaTarget = null;
      }
      room.lastEvent = { type: 'action_el3ab_tani', player: player.name };
      room.logs.push(`🔄 دور إضافي لـ ${player.name}!`);
      broadcastActionAnnouncement(room, {
        cardType: 'el3ab_tani',
        title: '🔄 الـعـــــب تــانـــــي!',
        actorName: player.name,
        actorAvatar: player.avatar,
        desc: `${player.name} نزل كارت العب تاني وخد دور إضافي فوراً!`,
        sound: 'impact',
        duration: 2500
      });
      startTurnTimer(room);
      broadcastRoomState(room);
      if (player.isBot) scheduleBotTurn(room);
      return;
    }

    case 'mana3a': {
      player.immune = true;
      room.lastEvent = { type: 'action_mana3a', player: player.name };
      room.logs.push(`🛡️ ${player.name} حصل على مناعة كاملة لراوند كامل!`);
      broadcastActionAnnouncement(room, {
        cardType: 'mana3a',
        title: '🛡️ مـنـــــاعـــــة مـطـلـقـــــة!',
        actorName: player.name,
        actorAvatar: player.avatar,
        desc: `${player.name} فعّل الدرع! محدش يقدر يطلب منه أو يستخدم أكشن عليه لراوند كامل (إلا المغناطيس).`,
        sound: 'impact',
        duration: 3000
      });
      if (pIdx === room.currentIdx) {
        startTurnTimer(room);
        broadcastRoomState(room);
        if (player.isBot) scheduleBotTurn(room);
        return;
      } else {
        broadcastRoomState(room);
        return;
      }
    }

    case 'lef_w_erga3': {
      room.direction *= -1;
      room.lastEvent = { type: 'action_lef_w_erga3', player: player.name, dir: room.direction };
      room.logs.push(`🔙 تم عكس اتجاه اللعب!`);
      broadcastActionAnnouncement(room, {
        cardType: 'lef_w_erga3',
        title: '🔙 لِـــــف وارجـــــع!',
        actorName: player.name,
        actorAvatar: player.avatar,
        desc: `${player.name} قلب اتجاه اللعبة تماماً! الأدوار لفت بالعكس!`,
        sound: 'impact',
        duration: 3000
      });
      if (pIdx === room.currentIdx) {
        startTurnTimer(room);
        broadcastRoomState(room);
        if (player.isBot) scheduleBotTurn(room);
        return;
      } else {
        broadcastRoomState(room);
        return;
      }
    }

    case 'msh_shaifak': {
      let targetIdx = extraData.targetIdx;
      if (targetIdx === undefined || targetIdx === pIdx) {
        targetIdx = nextTurnIndex(pIdx, room.direction, room.players.length);
      }
      const target = room.players[targetIdx];
      if (target) {
        if (target.immune) {
          room.logs.push(`🛡️ ${target.name} محمي بالمناعة! فشل كارت مش شايفك.`);
        } else {
          target.skipNext = true;
          room.logs.push(`🙈 ${player.name} استعمل "مش شايفك" على ${target.name}! دوره الجاي هيتخطى.`);
          room.lastEvent = { type: 'action_msh_shaifak', player: player.name, target: target.name };
          broadcastActionAnnouncement(room, {
            cardType: 'msh_shaifak',
            title: '🙈 مـــــش شـايـفـــــك!',
            actorName: player.name,
            actorAvatar: player.avatar,
            targetName: target.name,
            targetAvatar: target.avatar,
            desc: `${player.name} جمّد دور ${target.name}! دوره القادم ملغي تماماً!`,
            sound: 'impact',
            duration: 3000
          });
        }
      }
      if (pIdx === room.currentIdx) {
        startTurnTimer(room);
        broadcastRoomState(room);
        if (player.isBot) scheduleBotTurn(room);
        return;
      } else {
        broadcastRoomState(room);
        return;
      }
    }

    case 'kefaya_3leik': {
      let targetIdx = extraData.targetIdx;
      if (targetIdx === undefined || targetIdx === pIdx) {
        targetIdx = nextTurnIndex(pIdx, room.direction, room.players.length);
      }
      const target = room.players[targetIdx];
      if (target) {
        if (target.immune) {
          room.logs.push(`🛡️ ${target.name} محمي بالمناعة! فشل كارت كفاية عليك.`);
        } else {
          room.kefayaTarget = targetIdx;
          room.logs.push(`🖐️ ${player.name} طبق "كفاية عليك" على ${target.name}!`);
          room.lastEvent = { type: 'action_kefaya_3leik', player: player.name, target: target.name };
          broadcastActionAnnouncement(room, {
            cardType: 'kefaya_3leik',
            title: '🖐️ كفـــــايـــــة علـيـــــك!',
            actorName: player.name,
            actorAvatar: player.avatar,
            targetName: target.name,
            targetAvatar: target.avatar,
            desc: `${player.name} قيّد ${target.name}! بمجرد ما ينجح في أول طلب في دوره، هينتهي دوره فوراً!`,
            sound: 'impact',
            duration: 3000
          });

          // If target is currently taking their turn and already had a successful ask:
          if (targetIdx === room.currentIdx && target.successCount > 0) {
            room.logs.push(`🛑 انتهى دور ${target.name} فوراً بكارت كفاية عليك!`);
            advanceTurn(room);
            return;
          }
        }
      }
      if (pIdx === room.currentIdx) {
        startTurnTimer(room);
        broadcastRoomState(room);
        if (player.isBot) scheduleBotTurn(room);
        return;
      } else {
        broadcastRoomState(room);
        return;
      }
    }

    case 'sayad': {
      let targetIdx = extraData.targetIdx;
      if (targetIdx === undefined || targetIdx === pIdx) {
        const others = room.players.filter((p, i) => i !== pIdx && p.hand.length > 0 && !p.immune);
        if (others.length > 0) targetIdx = room.players.indexOf(others[Math.floor(Math.random() * others.length)]);
      }
      const target = room.players[targetIdx];
      if (target && target.hand.length > 0) {
        if (target.immune) {
          room.logs.push(`🛡️ ${target.name} محمي بالمناعة! فشل كارت الصياد.`);
        } else {
          const randIdx = Math.floor(Math.random() * target.hand.length);
          const stolen = target.hand.splice(randIdx, 1)[0];
          player.hand.push(stolen);
          room.logs.push(`🎯 ${player.name} اصطاد كارت عشوائي من ${target.name}! ودوره مستمر.`);
          room.lastEvent = { type: 'action_sayad', player: player.name, target: target.name };
          emitToRoom(room.code, 'card_transfer_anim', {
            fromIdx: targetIdx,
            toIdx: pIdx,
            fromName: target.name,
            toName: player.name,
            count: 1
          });
          broadcastActionAnnouncement(room, {
            cardType: 'sayad',
            title: '🎯 الـصـيـــــاد الـمـاهـــــر!',
            actorName: player.name,
            actorAvatar: player.avatar,
            targetName: target.name,
            targetAvatar: target.avatar,
            desc: `${player.name} اصطاد وسرق كارت عشوائي سري من يد ${target.name}! ودوره مستمر ليطلب رقماً!`,
            sound: 'impact',
            duration: 3000
          });
          applySetCheck(room);
        }
      }
      startTurnTimer(room);
      broadcastRoomState(room);
      if (player.isBot) scheduleBotTurn(room);
      return;
    }

    case 'od_le7afak': {
      // Official rule: "اسال على لمه اتجمعت بعدد ورق ايدك وخدها من غير الكارت ده"
      const handCount = player.hand.length;
      let stolen = false;
      let victimName = '';
      for (let i = 0; i < room.players.length; i++) {
        if (i !== pIdx) {
          const victim = room.players[i];
          const sIdx = victim.sets.indexOf(handCount);
          if (sIdx !== -1) {
            victim.sets.splice(sIdx, 1);
            player.sets.push(handCount);
            stolen = true;
            victimName = victim.name;
            break;
          }
        }
      }
      const label = handCount === 11 ? 'كا' : handCount === 12 ? 'تش' : `${handCount}`;
      if (stolen) {
        room.logs.push(`📜 قد لحافك! ${player.name} سرق لِمّة رقم [${label}] من ${victimName}! ودوره مستمر.`);
        broadcastActionAnnouncement(room, {
          cardType: 'od_le7afak',
          title: '📜 قَـــــد لِـحـــــافَـك!',
          actorName: player.name,
          actorAvatar: player.avatar,
          targetName: victimName,
          desc: `${player.name} في إيده ${handCount} كروت، وسرق لِمّة رقم [${label}] من ${victimName}! ودوره مستمر!`,
          sound: 'impact',
          duration: 3000
        });
      } else {
        room.logs.push(`📜 قد لحافك: ${player.name} معاه ${handCount} كروت، لكن مفيش لاعب مجمع لِمّة برقم [${label}]. ودوره مستمر.`);
        broadcastActionAnnouncement(room, {
          cardType: 'od_le7afak',
          title: '📜 قَـــــد لِـحـــــافَـك!',
          actorName: player.name,
          actorAvatar: player.avatar,
          desc: `${player.name} بحث عن لِمّة برقم عدد كروت يده [ ${label} ] لكن ملقاش حد مجمعها. ودوره مستمر!`,
          sound: 'impact',
          duration: 2500
        });
      }
      startTurnTimer(room);
      broadcastRoomState(room);
      if (player.isBot) scheduleBotTurn(room);
      return;
    }

    case 'herbaiya': {
      // Chameleon: copies an action card chosen from discard pile
      let copiedType = extraData.copiedAction;
      const validDiscard = room.discardPile.filter(c => c.type !== 'number' && c.type !== 'herbaiya');
      if (!copiedType && validDiscard.length > 0) {
        copiedType = validDiscard[validDiscard.length - 1].type;
      }

      if (copiedType) {
        const actionMeta = ACTION_CARDS_META[copiedType] || { name: copiedType };
        room.logs.push(`🦎 حرباية! ${player.name} اختار تقليد قوة كارت [${actionMeta.name}] من الأرض!`);
        broadcastActionAnnouncement(room, {
          cardType: 'herbaiya',
          title: '🦎 تـحـــــوّل الحـــــربـايـــــة!',
          actorName: player.name,
          actorAvatar: player.avatar,
          desc: `${player.name} استخدم كارت الحرباية واختار تقليد قوة كارت [ ${actionMeta.name} ] من الأرض!`,
          sound: 'impact',
          duration: 5000
        });
        handlePlayAction(room, player, { type: copiedType, id: card.id }, extraData, true);
        return;
      } else {
        io.to(player.id).emit('error_message', '⚠️ لم ينزل أي كارت أكشن على الأرض بعد لتقليده!');
        player.hand.push(card);
        room.discardPile.pop();
        room.lastPlayedCard = room.discardPile[room.discardPile.length - 1] || null;
        broadcastRoomState(room);
        return;
      }
    }

    case 'bos_bosa': {
      let targetIdx = extraData.targetIdx;
      if (targetIdx === undefined || targetIdx === pIdx) {
        const others = room.players.filter((p, i) => i !== pIdx && p.hand.length > 0 && !p.immune);
        if (others.length > 0) targetIdx = room.players.indexOf(others[0]);
      }
      const target = room.players[targetIdx];
      if (target && target.hand.length > 0) {
        if (target.immune) {
          room.logs.push(`🛡️ ${target.name} محمي بالمناعة! فشل كارت بص بصة.`);
        } else {
          const randomCard = target.hand[Math.floor(Math.random() * target.hand.length)];
          if (!player.isBot) {
            emitToPlayer(player.id, 'private_peek', {
              targetName: target.name,
              card: randomCard
            });
          }
          room.logs.push(`👁️ ${player.name} بص بصه سرية على كارت عند ${target.name}!`);
          room.lastEvent = { type: 'action_bos_bosa', player: player.name, target: target.name };
          broadcastActionAnnouncement(room, {
            cardType: 'bos_bosa',
            title: '👁️ بـــــص بـصـــــة!',
            actorName: player.name,
            actorAvatar: player.avatar,
            targetName: target.name,
            targetAvatar: target.avatar,
            desc: `${player.name} بص بصه استخباراتية سرية على أوراق ${target.name}! ودوره مستمر!`,
            sound: 'impact',
            duration: 2400
          });
        }
      }
      startTurnTimer(room);
      broadcastRoomState(room);
      if (player.isBot) scheduleBotTurn(room);
      return;
    }

    case 'badl_edain': {
      if (extraData.swapTwoOthers && extraData.target1Idx !== undefined && extraData.target2Idx !== undefined) {
        const p1 = room.players[extraData.target1Idx];
        const p2 = room.players[extraData.target2Idx];
        if (p1 && p2 && extraData.target1Idx !== extraData.target2Idx) {
          if (p1.immune || p2.immune) {
            room.logs.push(`🛡️ فشل تبديل الأوراق لوجود حماية درع المناعة!`);
          } else {
            const temp = [...p1.hand];
            p1.hand = [...p2.hand];
            p2.hand = temp;
            room.logs.push(`🤝 بدل إيدي! ${player.name} بدّل كل أوراق ${p1.name} مع ${p2.name} بدون ما يلمس ورقه! ودوره مستمر.`);
            room.lastEvent = { type: 'action_badl_edain', player: player.name, target: `${p1.name} و ${p2.name}` };
            emitToRoom(room.code, 'hand_swap_animation', { p1Idx: extraData.target1Idx, p2Idx: extraData.target2Idx, p1Name: p1.name, p2Name: p2.name });
            broadcastActionAnnouncement(room, {
              cardType: 'badl_edain',
              title: '🤝 بـــــدّل ورق اثـنـيـــــن!',
              actorName: player.name,
              actorAvatar: player.avatar,
              targetName: `${p1.name} و ${p2.name}`,
              targetAvatar: '🔀',
              desc: `${player.name} قرر يبدّل كل أوراق ${p1.name} مع ${p2.name} تماماً! ودوره مستمر ليطلب رقماً!`,
              sound: 'impact',
              duration: 3200
            });
            applySetCheck(room, p1);
            applySetCheck(room, p2);
          }
        }
      } else {
        let targetIdx = extraData.targetIdx;
        if (targetIdx === undefined || targetIdx === pIdx) {
          const others = room.players.filter((p, i) => i !== pIdx && !p.immune);
          if (others.length > 0) targetIdx = room.players.indexOf(others[0]);
        }
        const target = room.players[targetIdx];
        if (target) {
          if (target.immune) {
            room.logs.push(`🛡️ ${target.name} محمي بالمناعة! فشل تبديل الأوراق معه.`);
          } else {
            const temp = [...player.hand];
            player.hand = [...target.hand];
            target.hand = temp;
            room.logs.push(`🤝 بدل إيدي! ${player.name} بدل كل ورقه مع ${target.name}! ودوره مستمر.`);
            room.lastEvent = { type: 'action_badl_edain', player: player.name, target: target.name };
            emitToRoom(room.code, 'hand_swap_animation', { p1Idx: pIdx, p2Idx: targetIdx, p1Name: player.name, p2Name: target.name });
            broadcastActionAnnouncement(room, {
              cardType: 'badl_edain',
              title: '🤝 بـــــدّل إيـــــدي!',
              actorName: player.name,
              actorAvatar: player.avatar,
              targetName: target.name,
              targetAvatar: target.avatar,
              desc: `${player.name} بدّل كل أوراقه بالكامل مع ${target.name}! إرباك كامل للطاولة! ودوره مستمر ليطلب رقماً!`,
              sound: 'impact',
              duration: 3000
            });
            applySetCheck(room, player);
            applySetCheck(room, target);
          }
        }
      }
      if (pIdx === room.currentIdx) {
        startTurnTimer(room);
        broadcastRoomState(room);
        if (player.isBot) scheduleBotTurn(room);
        return;
      } else {
        broadcastRoomState(room);
        return;
      }
    }

    case 'magnatees': {
      const num = Number(extraData.value !== undefined ? extraData.value : (player.hand.find(c => c.type === 'number')?.value || 0));
      let totalCollected = 0;
      const contributors = [];
      for (let i = 0; i < room.players.length; i++) {
        if (i !== pIdx) {
          const otherP = room.players[i];
          const matched = otherP.hand.filter(c => c.type === 'number' && c.value === num);
          if (matched.length > 0) {
            const mIds = new Set(matched.map(c => c.id));
            otherP.hand = otherP.hand.filter(c => !mIds.has(c.id));
            player.hand.push(...matched);
            totalCollected += matched.length;
            contributors.push(`${otherP.name} (${matched.length})`);
            room.logs.push(`🧲 مغناطيس سحب ${matched.length} كارت رقم ${num} من ${otherP.name}!`);
          }
        }
      }
      if (totalCollected > 0) {
        const numStr = num === 11 ? 'كا' : num === 12 ? 'تش' : num;
        room.logs.push(`🧲 إجمالي ما جمعه المغناطيس لـ ${player.name}: ${totalCollected} كارت!`);
        broadcastActionAnnouncement(room, {
          cardType: 'magnatees',
          cardValue: num,
          title: '🧲 مـغـنــاطـيـــــس جـبّـــــار!',
          actorName: player.name,
          actorAvatar: player.avatar,
          desc: `${player.name} سحب كل كروت رقم [ ${numStr} ] بالمغناطيس من: ${contributors.join(' و ')}! واستمر دوره.`,
          sound: 'impact',
          duration: 3200
        });
        applySetCheck(room);
        startTurnTimer(room);
        broadcastRoomState(room);
        if (player.isBot) scheduleBotTurn(room);
        return;
      } else {
        const numStr = num === 11 ? 'كا' : num === 12 ? 'تش' : num;
        room.logs.push(`🧲 محدش عنده رقم ${numStr}! CATCH بالمغناطيس!`);
        broadcastActionAnnouncement(room, {
          cardType: 'magnatees',
          cardValue: num,
          title: '🧲 مـغـنــاطـيـــــس خـائـــــب!',
          actorName: player.name,
          actorAvatar: player.avatar,
          desc: `${player.name} طلب رقم [ ${numStr} ] بالمغناطيس ومحدش من اللاعبين كان معاه! احتسبت CATCH.`,
          sound: 'catch',
          duration: 3000
        });
        if (room.deck.length > 0) {
          player.hand.push(room.deck.shift());
          applySetCheck(room);
        }
        advanceTurn(room);
        return;
      }
    }

    case 'special': {
      if (extraData.targetIdx !== undefined && extraData.value !== undefined) {
        const valLabel = extraData.value === 11 ? 'كا' : extraData.value === 12 ? 'تش' : extraData.value;
        broadcastActionAnnouncement(room, {
          cardType: 'special',
          title: '💎 اسـبـيـشـيـــــال!',
          actorName: player.name,
          actorAvatar: player.avatar,
          desc: `${player.name} استخدم اسبيشيال وطلب رقم [${valLabel}] بدون ما يكون معاه!`,
          sound: 'impact',
          duration: 2400
        });
        handleAsk(room, pIdx, extraData.targetIdx, extraData.value);
        return;
      }
      advanceTurn(room);
      return;
    }

    case 'kdab': {
      // Kdab is strictly a reactive defense card when asked for a number!
      player.hand.push(card);
      room.discardPile.pop();
      emitToPlayer(player.id, 'error_message', '⚠️ كارت « كداب » كارت رد فعل دفاعي! احتفظ بيه في إيدك، ولما حد يطلب منك رقم هتقدر تكدب عليه وتلبّسه CATCH!');
      broadcastRoomState(room);
      return;
    }

    case 'joker': {
      const val = Number(extraData.value);
      const matchingCards = player.hand.filter(c => c.type === 'number' && c.value === val);
      if (matchingCards.length < 3) {
        // Return joker to hand
        player.hand.push(card);
        room.discardPile.pop();
        room.lastPlayedCard = room.discardPile[room.discardPile.length - 1] || null;
        io.to(player.id).emit('error_message', `⚠️ لازم يكون معاك 3 كروت على الأقل من رقم [${val === 11 ? 'كا' : val === 12 ? 'تش' : val}] عشان تقفله بالجوكر!`);
        broadcastRoomState(room);
        return;
      }

      const cardsToConsume = matchingCards.slice(0, 3);
      const removeIds = new Set(cardsToConsume.map(c => c.id));
      player.hand = player.hand.filter(c => !removeIds.has(c.id));
      player.sets.push(val);
      room.jokerUsers = room.jokerUsers || [];
      room.jokerUsers.push({
        playerId: player.id,
        playerName: player.name,
        playerAvatar: player.avatar,
        value: val,
        busted: false
      });
      const label = val === 11 ? 'كا' : val === 12 ? 'تش' : `${val}`;
      room.logs.push(`🃏 ${player.name} اختار تفعيل الجوكر وقفل لِمّة سرية! ⭐`);
      room.lastEvent = { type: 'joker_set', player: player.name };

      broadcastActionAnnouncement(room, {
        cardType: 'joker',
        title: `🃏 لِمّة جـوكـر سـريـة!`,
        actorName: player.name,
        actorAvatar: player.avatar,
        desc: `${player.name} قرر تفعيل الجوكر وقفل لِمّة سرية جديدة بنجاح!`,
        sound: 'impact',
        duration: 2800
      });

      checkGameOver(room);
      startTurnTimer(room);
      broadcastRoomState(room);
      if (player.isBot) scheduleBotTurn(room);
      return;
    }

    case 'hat_enta': {
      // "هات انت" (Hat Enta) is a reactive interrupt card played when someone else is currently playing and has just successfully asked for a card (successCount > 0).
      const currentPlayer = room.players[room.currentIdx];
      
      if (pIdx === room.currentIdx) {
        io.to(player.id).emit('error_message', '⚠️ كارت "هات انت" بيتلعب عشان توقف لاعب تاني بياخد كروت وتسرق منه الدور!');
        player.hand.push(card);
        room.discardPile.pop();
        room.lastPlayedCard = room.discardPile[room.discardPile.length - 1] || null;
        return;
      }

      if (currentPlayer && currentPlayer.successCount > 0) {
        room.logs.push(`✋ هات انت! ${player.name} قاطع دور ${currentPlayer.name} وسرق الدور لنفسه!`);
        broadcastActionAnnouncement(room, {
          cardType: 'hat_enta',
          title: '✋ هـــــات انـــــت!',
          actorName: player.name,
          actorAvatar: player.avatar,
          targetName: currentPlayer.name,
          targetAvatar: currentPlayer.avatar,
          desc: `${player.name} رمى كارت "هات انت"! وقف ${currentPlayer.name} بعد ما طلب رقم، وسرق الدور وبقى دوره هو!`,
          sound: 'impact',
          duration: 4000
        });

        // Steal the turn
        if (room.turnTimerInterval) clearInterval(room.turnTimerInterval);
        room.currentIdx = pIdx;
        const newCurrent = room.players[room.currentIdx];
        newCurrent.successCount = 0; // reset
        
        startTurnTimer(room);
        broadcastRoomState(room);
        if (newCurrent.isBot) scheduleBotTurn(room);
        return;
      } else {
        io.to(player.id).emit('error_message', '⚠️ لازم اللاعب اللي عليه الدور يكون طلب رقم ونجح عشان تقدر توقفه بكارت "هات انت"!');
        player.hand.push(card);
        room.discardPile.pop();
        room.lastPlayedCard = room.discardPile[room.discardPile.length - 1] || null;
        return;
      }
    }

    default: {
      if (pIdx === room.currentIdx) {
        startTurnTimer(room);
        broadcastRoomState(room);
        if (player.isBot) scheduleBotTurn(room);
      } else {
        broadcastRoomState(room);
      }
      return;
    }
  }
}

// ====== SOCKET EVENT HANDLERS (SHARED BY SOCKET.IO AND GODOT WEBSOCKET) ======
function registerSocketHandlers(socket) {
  let currentRoomCode = null;

  // Anti-Spam Rate Limiter (Max 14 requests / sec per socket)
  let lastEventTime = 0;
  let eventCountInSec = 0;
  function checkRateLimit() {
    const now = Date.now();
    if (now - lastEventTime > 1000) {
      lastEventTime = now;
      eventCountInSec = 1;
      return true;
    }
    eventCountInSec++;
    if (eventCountInSec > 14) {
      socket.emit('error_message', '⚠️ أوامر سريعة جداً! تم كبح الطلب لحماية السيرفر.');
      return false;
    }
    return true;
  }

  // Name Sanitizer (Strip HTML, limit length to 16 chars)
  function sanitizeName(name, defaultName) {
    if (!name || typeof name !== 'string') return defaultName;
    const clean = name.replace(/[<>&"']/g, '').trim().substring(0, 16);
    return clean || defaultName;
  }

  // Helper to reconnect player into room
  function reconnectPlayer(room, existingPlayer) {
    if (existingPlayer.disconnectTimer) {
      clearTimeout(existingPlayer.disconnectTimer);
      existingPlayer.disconnectTimer = null;
    }
    existingPlayer.id = socket.id;
    existingPlayer.connected = true;
    if (existingPlayer.isHost) {
      room.hostId = socket.id;
    }

    currentRoomCode = room.code;
    socket.join(room.code);
    socket.emit('reconnect_success', { code: room.code, name: existingPlayer.name });
    room.logs.push(`🔄 استأنف ${existingPlayer.name} الاتصال وعاد إلى مقعده!`);
    broadcastRoomState(room);
  }

  // Create Room
  socket.on('create_room', ({ name, avatar, userId, sessionToken } = {}) => {
    if (!checkRateLimit()) return;
    const cleanName = sanitizeName(name, 'لاعب VIP');
    const room = createRoom(socket.id, cleanName, avatar, userId, sessionToken);
    currentRoomCode = room.code;
    socket.join(room.code);
    socket.emit('room_created', { code: room.code });
    broadcastRoomState(room);
  });

  // Create Bot Training Room (Instant 1-Click Game against 3 Bots)
  socket.on('create_bot_room', ({ name, avatar, userId, sessionToken } = {}) => {
    if (!checkRateLimit()) return;
    const cleanName = sanitizeName(name, 'لاعب VIP');
    const room = createRoom(socket.id, cleanName, avatar, userId, sessionToken);
    currentRoomCode = room.code;
    socket.join(room.code);

    // Add 3 Bots
    for (let i = 0; i < 3; i++) {
      const bName = BOT_NAMES[i % BOT_NAMES.length];
      const bAvatar = BOT_AVATARS[i % BOT_AVATARS.length];
      room.players.push({
        id: `bot_${Date.now()}_${i}_${Math.random()}`,
        name: bName,
        avatar: bAvatar,
        isHost: false,
        isBot: true,
        connected: true,
        hand: [],
        sets: [],
        immune: false,
        skipNext: false,
        extraTurns: 0,
        botMemory: {}
      });
      room.logs.push(`🤖 تمت إضافة بوت: ${bName}`);
    }

    // Deal and start game immediately
    room.deck = shuffle(buildDeck());
    room.discardPile = [];
    room.lastPlayedCard = null;
    room.status = 'playing';
    room.currentIdx = 0;
    room.direction = 1;

    for (const player of room.players) {
      player.hand = room.deck.splice(0, 5);
      player.sets = [];
      player.immune = false;
      player.skipNext = false;
      player.extraTurns = 0;
    }

    room.logs.push(`🚀 بدأت جولة تدريب البوتات بـ 4 لاعبين!`);
    room.logs.push(`🎴 تم توزيع 5 كروت لكل لاعب. الدور الأول لـ: ${room.players[0].name}`);
    room.lastEvent = { type: 'game_started' };

    applySetCheck(room);
    broadcastRoomState(room);

    const firstP = room.players[0];
    const hasNumbers = firstP.hand.some(c => c.type === 'number');
    if (!hasNumbers && room.deck.length > 0) {
      const drawn = room.deck.shift();
      firstP.hand.push(drawn);
      room.logs.push(`📥 ${firstP.name} معندوش أي أرقام في إيده! سحب كارت تلقائياً وانتهى دوره.`);
      broadcastActionAnnouncement(room, {
        cardType: 'deck',
        title: '📥 سـحـــــب كـــــارت!',
        actorName: firstP.name,
        actorAvatar: firstP.avatar,
        desc: `${firstP.name} معندوش أي أرقام في إيده! سحب كارت تلقائياً وتمرر الدور.`,
        sound: 'card',
        duration: 2000
      });
      advanceTurn(room);
    } else {
      startTurnTimer(room);
      if (room.players[0].isBot) scheduleBotTurn(room);
    }
  });

  // Reconnect Room (Secure Token-Based Recovery, Seat-Hijacking Protected)
  socket.on('reconnect_room', ({ code, userId, sessionToken } = {}) => {
    if (!checkRateLimit()) return;
    const rCode = (code || '').toUpperCase().trim();
    const room = rooms.get(rCode);
    if (!room) {
      socket.emit('reconnect_failed', { reason: 'room_not_found', code: rCode });
      return;
    }

    const existingPlayer = room.players.find(pl => 
      !pl.isBot && (
        (sessionToken && pl.sessionToken && pl.sessionToken === sessionToken) ||
        (userId && pl.userId && pl.userId === userId)
      )
    );

    if (!existingPlayer) {
      socket.emit('reconnect_failed', { reason: 'player_not_found', code: rCode });
      return;
    }

    reconnectPlayer(room, existingPlayer);
  });

  // Join Room
  socket.on('join_room', ({ code, name, avatar, userId, sessionToken } = {}) => {
    if (!checkRateLimit()) return;
    const rCode = (code || '').toUpperCase().trim();
    const room = rooms.get(rCode);

    if (!room) {
      socket.emit('error_message', 'كود الغرفة غير موجود!');
      return;
    }

    // Check if this player is actually reconnecting via secret token
    const existingPlayer = room.players.find(pl => 
      !pl.isBot && (
        (sessionToken && pl.sessionToken && pl.sessionToken === sessionToken) ||
        (userId && pl.userId && pl.userId === userId)
      )
    );

    if (existingPlayer) {
      if (avatar) existingPlayer.avatar = avatar;
      reconnectPlayer(room, existingPlayer);
      return;
    }

    if (room.status !== 'lobby') {
      socket.emit('error_message', 'اللعبة بدأت بالفعل في هذه الغرفة!');
      return;
    }
    if (room.players.length >= room.maxPlayers) {
      socket.emit('error_message', 'الغرفة ممتلئة (الحد الأقصى 8 لاعبين)!');
      return;
    }

    const cleanName = sanitizeName(name, `لاعب ${room.players.length + 1}`);
    currentRoomCode = rCode;
    socket.join(rCode);

    room.players.push({
      id: socket.id,
      userId: userId || null,
      sessionToken: sessionToken || null,
      name: cleanName,
      avatar: avatar || '🎮',
      isHost: false,
      isBot: false,
      connected: true,
      hand: [],
      sets: [],
      immune: false,
      skipNext: false,
      extraTurns: 0,
      botMemory: {}
    });

    room.logs.push(`👋 انضم ${cleanName} إلى الغرفة.`);
    broadcastRoomState(room);
  });

  // Add Bot
  socket.on('add_bot', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'lobby' || room.players[0].id !== socket.id) return;

    if (room.players.length >= room.maxPlayers) {
      socket.emit('error_message', 'تم الوصول للحد الأقصى للغرفة (8 لاعبين)!');
      return;
    }

    const botCount = room.players.filter(p => p.isBot).length;
    const bName = BOT_NAMES[botCount % BOT_NAMES.length];
    const bAvatar = BOT_AVATARS[botCount % BOT_AVATARS.length];

    room.players.push({
      id: `bot_${Date.now()}_${Math.random()}`,
      name: bName,
      avatar: bAvatar,
      isHost: false,
      isBot: true,
      connected: true,
      hand: [],
      sets: [],
      immune: false,
      skipNext: false,
      extraTurns: 0,
      botMemory: {}
    });

    room.logs.push(`🤖 تمت إضافة بوت: ${bName}`);
    broadcastRoomState(room);
  });

  // Remove Bot
  socket.on('remove_bot', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'lobby' || room.players[0].id !== socket.id) return;

    const botIdx = room.players.map(p => p.isBot).lastIndexOf(true);
    if (botIdx !== -1) {
      const removed = room.players.splice(botIdx, 1)[0];
      room.logs.push(`🗑️ تمت إزالة البوت: ${removed.name}`);
      broadcastRoomState(room);
    }
  });

  // Update Room Settings (turnSpeed, winTarget)
  socket.on('update_room_settings', ({ turnSpeed, winTarget } = {}) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'lobby' || room.players[0].id !== socket.id) return;

    if (turnSpeed) room.turnSpeed = turnSpeed;
    if (winTarget) room.winTarget = winTarget;

    const speedLbl = room.turnSpeed === 'fast' ? '⚡ سريع (15ث)' : room.turnSpeed === 'relaxed' ? '☕ رايق (45ث)' : '⚖️ متوازن (30ث)';
    const winLbl = room.winTarget === 'first_to_3' ? '⭐ أول من يجمع 3 لِمّات' : '🃏 إنهاء الديك كاملاً';
    room.logs.push(`⚙️ تم تحديث الإعدادات: السرعة [${speedLbl}] | الفوز [${winLbl}]`);
    broadcastRoomState(room);
  });

  // Rematch / New Round with same players
  socket.on('rematch', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'gameover' || room.players[0].id !== socket.id) return;

    room.deck = shuffle(buildDeck());
    room.discardPile = [];
    room.lastPlayedCard = null;
    room.status = 'playing';
    room.currentIdx = 0;
    room.direction = 1;
    room.winner = null;
    room.kefayaTarget = null;
    room.successCount = 0;

    for (const player of room.players) {
      player.hand = room.deck.splice(0, 5);
      player.sets = [];
      player.immune = false;
      player.skipNext = false;
      player.extraTurns = 0;
      player.successCount = 0;
      player.botMemory = { knownPlayerCards: {} };
    }

    room.logs = [
      `🔄 ريماتش جديد! بدأت جولة جديدة مع نفس أبطال الطاولة! 🃏`,
      `🎴 تم توزيع 5 كروت جديدة لكل لاعب. الدور الأول لـ: ${room.players[0].name}`
    ];
    room.lastEvent = { type: 'rematch_started' };

    broadcastActionAnnouncement(room, {
      cardType: 'el3ab_tani',
      title: '🔄 ريـمـــــاتـش جـديـــــد!',
      actorName: room.players[0].name,
      actorAvatar: room.players[0].avatar,
      desc: `بدأت جولة جديدة مع نفس اللاعبين! وزع الورق وانطلق!`,
      sound: 'impact',
      duration: 2500
    });

    applySetCheck(room);
    broadcastRoomState(room);
    startTurnTimer(room);
    if (room.players[0].isBot) scheduleBotTurn(room);
  });

  // Start Game
  socket.on('start_game', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'lobby' || room.players[0].id !== socket.id) return;

    if (room.players.length < room.minPlayers) {
      socket.emit('error_message', `الحد الأدنى لبدء اللعبة 4 لاعبين! يمكنك إضافة بوتات لتكملة العدد.`);
      return;
    }

    // Build & Deal Deck
    room.deck = shuffle(buildDeck());
    room.discardPile = [];
    room.lastPlayedCard = null;
    room.status = 'playing';
    room.currentIdx = 0;
    room.direction = 1;

    // Deal 5 cards each
    for (const player of room.players) {
      player.hand = room.deck.splice(0, 5);
      player.sets = [];
      player.immune = false;
      player.skipNext = false;
      player.extraTurns = 0;
    }

    room.logs.push(`🚀 بدأت اللعبة رسمياً بـ ${room.players.length} لاعبين!`);
    room.logs.push(`🎴 تم توزيع 5 كروت لكل لاعب. الدور الأول لـ: ${room.players[0].name}`);
    room.lastEvent = { type: 'game_started' };

    applySetCheck(room);
    broadcastRoomState(room);

    // Official Rule: If first player has NO numbers in hand, they auto-draw 1 card and turn advances!
    const firstP = room.players[0];
    const hasNumbers = firstP.hand.some(c => c.type === 'number');
    if (!hasNumbers && room.deck.length > 0) {
      const drawn = room.deck.shift();
      firstP.hand.push(drawn);
      room.logs.push(`📥 ${firstP.name} معندوش أي أرقام في إيده! سحب كارت تلقائياً وانتهى دوره.`);
      broadcastActionAnnouncement(room, {
        cardType: 'deck',
        title: '📥 سـحـــــب كـــــارت!',
        actorName: firstP.name,
        actorAvatar: firstP.avatar,
        desc: `${firstP.name} معندوش أي أرقام في إيده! سحب كارت تلقائياً وتمرر الدور.`,
        sound: 'card',
        duration: 2000
      });
      applySetCheck(room, firstP);
      broadcastRoomState(room);
      setTimeout(() => {
        advanceTurn(room);
      }, 2000);
      return;
    }

    startTurnTimer(room);

    // If first player is bot
    if (room.players[0].isBot) {
      scheduleBotTurn(room);
    }
  });

  // Action: Draw Card (ALLOWED ONLY IF PLAYER HAS NO NUMBER CARDS IN HAND!)
  socket.on('draw_card', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'playing') return;

    const pIdx = room.players.findIndex(p => p.id === socket.id);
    if (pIdx !== room.currentIdx) return; // Not player's turn
    if (!checkRateLimit()) return;

    const player = room.players[pIdx];
    const hasNumbers = player.hand.some(c => c.type === 'number');
    if (hasNumbers) {
      socket.emit('error_message', '🚫 ممنوع تسحب كارت ومعاك أرقام في إيدك! لازم تطلب رقم من كروتك.');
      return;
    }

    if (room.deck.length > 0) {
      const drawn = room.deck.shift();
      player.hand.push(drawn);
      room.logs.push(`📥 ${player.name} معندوش أرقام وسحب كارت وانتهى دوره.`);
      broadcastActionAnnouncement(room, {
        cardType: 'deck',
        title: '📥 سـحـــــب كـــــارت!',
        actorName: player.name,
        actorAvatar: player.avatar,
        desc: `${player.name} معندوش أرقام وسحب كارت من الديك وانتهى دوره!`,
        sound: 'card',
        duration: 2000
      });
      applySetCheck(room, player);
      broadcastRoomState(room);
      advanceTurn(room);
    }
  });

  // Action: Throw Item at Opponent (VIP Lounge interactive items: tea, slipper, tomato, bomb, rocket, heart)
  socket.on('throw_item', ({ targetIdx, itemType } = {}) => {
    if (!checkRateLimit()) return;
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    const senderIdx = room.players.findIndex(p => p.id === socket.id);
    if (senderIdx === -1 || targetIdx === undefined || targetIdx === senderIdx) return;

    const sender = room.players[senderIdx];
    const target = room.players[targetIdx];
    if (!target) return;

    emitToRoom(room.code, 'item_thrown', {
      fromIdx: senderIdx,
      fromName: sender.name,
      targetIdx,
      targetName: target.name,
      itemType: itemType || 'tea'
    });
  });

  // Action: Egyptian Quick Chat Phrases (with speech bubble over avatar)
  socket.on('quick_chat', ({ text, emoji } = {}) => {
    if (!checkRateLimit()) return;
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    const senderIdx = room.players.findIndex(p => p.id === socket.id);
    if (senderIdx === -1) return;

    const sender = room.players[senderIdx];
    const cleanChat = (text || '').replace(/[<>&"']/g, '').trim().substring(0, 45) || 'يا حلاوة اللِمّة! 🔥';
    emitToRoom(room.code, 'chat_bubble', {
      pIdx: senderIdx,
      name: sender.name,
      text: cleanChat,
      emoji: emoji || '💬'
    });
  });

  // Action: Ask for Number (Anti-Cheat Validated)
  socket.on('ask_number', ({ targetIdx, value } = {}) => {
    if (!checkRateLimit()) return;
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'playing') return;

    const pIdx = room.players.findIndex(p => p.id === socket.id);
    if (pIdx !== room.currentIdx) return; // Not player's turn

    const num = Number(value);
    if (isNaN(num) || num < 0 || num > 12) return;

    const player = room.players[pIdx];
    const target = room.players[targetIdx];
    if (!target || targetIdx === pIdx) {
      socket.emit('error_message', '⚠️ لا يمكنك استهداف نفسك أو لاعب غير موجود!');
      return;
    }

    // Anti-Cheat: Player MUST own at least 1 card of this number to ask for it
    const ownsCard = player.hand.some(c => c.type === 'number' && c.value === num);
    if (!ownsCard) {
      socket.emit('error_message', '⚠️ لا يمكنك طلب رقم لا تملكه في يدك (إلا بكارت سبيشيال 💎)!');
      return;
    }

    handleAsk(room, pIdx, targetIdx, num);
  });

  // Action: Liar decision (Truth or Lie)
  socket.on('liar_decision', ({ lie } = {}) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'playing') return;

    const pIdx = room.players.findIndex(p => p.id === socket.id);
    const target = room.players[pIdx];
    if (!target || !target.pendingLiarPrompt) return;

    const { askerIdx, requestedNumber } = target.pendingLiarPrompt;
    target.pendingLiarPrompt = null;

    if (lie) {
      executeLiarLie(room, askerIdx, pIdx, requestedNumber);
    } else {
      executeTruthfulTransfer(room, askerIdx, pIdx, requestedNumber);
    }
  });

  // Action: Play Action Card
  socket.on('play_action_card', ({ cardId, targetIdx, value, copiedAction } = {}) => {
    if (!checkRateLimit()) return;
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'playing') return;

    const pIdx = room.players.findIndex(p => p.id === socket.id);
    if (pIdx === -1) return;

    const player = room.players[pIdx];
    const card = player.hand.find(c => c.id === cardId);
    if (!card || card.type === 'number') return;

    const ANY_TIME_CARDS = ['msh_shaifak', 'mana3a', 'lef_w_erga3', 'kefaya_3leik', 'hat_enta'];
    const isAnyTime = ANY_TIME_CARDS.includes(card.type);

    if (pIdx !== room.currentIdx && !isAnyTime) {
      socket.emit('error_message', '⚠️ هذا الكارت يلعب في دورك فقط!');
      return;
    }

    handlePlayAction(room, player, card, { targetIdx, value, copiedAction });
  });

  // Action: Use Joker Card (Optional set completion with 3 cards)
  socket.on('use_joker', ({ cardId, value } = {}) => {
    if (!checkRateLimit()) return;
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'playing') return;

    const pIdx = room.players.findIndex(p => p.id === socket.id);
    if (pIdx === -1) return;
    const player = room.players[pIdx];

    const jokerCard = player.hand.find(c => c.type === 'joker' && (cardId ? c.id === cardId : true));
    if (!jokerCard) {
      socket.emit('error_message', '⚠️ ليس معك كارت جوكر!');
      return;
    }

    const val = Number(value);
    const matchingCards = player.hand.filter(c => c.type === 'number' && c.value === val);
    if (matchingCards.length < 3) {
      socket.emit('error_message', `⚠️ لازم يكون معاك 3 كروت على الأقل من رقم [${val === 11 ? 'كا' : val === 12 ? 'تش' : val}] عشان تقفله بالجوكر!`);
      return;
    }

    // Consume 3 matching number cards and the joker card
    const cardsToConsume = matchingCards.slice(0, 3);
    const removeIds = new Set([...cardsToConsume.map(c => c.id), jokerCard.id]);
    player.hand = player.hand.filter(c => !removeIds.has(c.id));
    
    // Add set
    player.sets.push(val);
    room.jokerUsers = room.jokerUsers || [];
    room.jokerUsers.push({
      playerId: player.id,
      playerName: player.name,
      playerAvatar: player.avatar,
      value: val,
      busted: false
    });
    const label = val === 11 ? 'كا' : val === 12 ? 'تش' : `${val}`;
    room.logs.push(`🃏 ${player.name} اختار تفعيل الجوكر وقفل لِمّة سرية! ⭐`);
    room.lastEvent = { type: 'joker_set', player: player.name };
    
    // Discard Joker
    room.discardPile.push(jokerCard);
    room.lastPlayedCard = jokerCard;

    broadcastActionAnnouncement(room, {
      cardType: 'joker',
      title: `🃏 لِمّة جـوكـر سـريـة!`,
      actorName: player.name,
      actorAvatar: player.avatar,
      desc: `${player.name} اختار تفعيل الجوكر وقفل لِمّة سرية جديدة بنجاح!`,
      sound: 'impact',
      duration: 2800
    });

    checkGameOver(room);

    // If it's the player's turn, completing a set allows them to continue their turn!
    if (pIdx === room.currentIdx && room.status === 'playing') {
      startTurnTimer(room);
    }

    broadcastRoomState(room);
  });

  // Action: Claim Natural 4-of-a-kind Set (Manual set drop by human player)
  socket.on('claim_natural_set', ({ number } = {}) => {
    if (!checkRateLimit()) return;
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'playing') return;

    const pIdx = room.players.findIndex(p => p.id === socket.id);
    if (pIdx === -1) return;
    const player = room.players[pIdx];

    const val = Number(number);
    if (isNaN(val)) return;

    const matchingCards = player.hand.filter(c => c.type === 'number' && c.value === val);
    if (matchingCards.length < 4) {
      socket.emit('error_message', `⚠️ لازم يكون معاك 4 كروت كاملة من رقم [${val === 11 ? 'كا' : val === 12 ? 'تش' : val}] عشان تنزل اللِمّة!`);
      return;
    }

    // Consume 4 matching number cards
    const cardsToConsume = matchingCards.slice(0, 4);
    const removeIds = new Set(cardsToConsume.map(c => c.id));
    player.hand = player.hand.filter(c => !removeIds.has(c.id));

    // Add set to player
    player.sets.push(val);

    // Secret log: Set value remains confidential
    room.logs.push(`🏅 ${player.name} اختار ينزل لِمة سرية كاملة! ⭐`);
    room.lastEvent = { type: 'set_completed', player: player.name };

    // Emit animation
    emitToRoom(room.code, 'set_completed_anim', {
      pIdx,
      pName: player.name,
      pAvatar: player.avatar,
      isJoker: false
    });

    // Action Announcement (Secret - without revealing number)
    broadcastActionAnnouncement(room, {
      cardType: 'number',
      title: `🏅 لِمّة سـريـة جـديـدة!`,
      actorName: player.name,
      actorAvatar: player.avatar,
      desc: `${player.name} نزل لِمة سرية جديدة بنجاح! ⭐`,
      sound: 'impact',
      duration: 2500
    });

    // Clear this completed number from all bots' memory
    for (const bot of room.players) {
      if (bot.isBot && bot.botMemory?.knownPlayerCards) {
        for (const pid of Object.keys(bot.botMemory.knownPlayerCards)) {
          bot.botMemory.knownPlayerCards[pid].delete(val);
        }
      }
    }

    checkGameOver(room);

    // If it's the player's turn, refresh timer so they have full time for subsequent moves
    if (pIdx === room.currentIdx && room.status === 'playing') {
      startTurnTimer(room);
    }

    broadcastRoomState(room);
  });

  // Counter Action: Reverse Ask with Hat Enta (هات انت كـ رد فعل فوري عند طلب الكارت)
  socket.on('counter_with_hat_enta', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'playing') return;

    const pIdx = room.players.findIndex(p => p.id === socket.id);
    if (pIdx === -1) return;
    const player = room.players[pIdx];

    if (!player.pendingHatEntaPrompt) {
      socket.emit('error_message', '⚠️ مفيش طلب موجه ليك حالياً للرد عليه بكارت هات انت!');
      return;
    }

    const { askerIdx, requestedNumber } = player.pendingHatEntaPrompt;
    executeHatEntaCounter(room, pIdx, askerIdx, requestedNumber);
  });

  socket.on('ignore_hat_enta', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'playing') return;

    const pIdx = room.players.findIndex(p => p.id === socket.id);
    if (pIdx === -1) return;
    const player = room.players[pIdx];

    if (!player.pendingHatEntaPrompt) return;

    if (room.hatEntaTimer) {
      clearTimeout(room.hatEntaTimer);
      room.hatEntaTimer = null;
    }
    const { askerIdx, requestedNumber } = player.pendingHatEntaPrompt;
    player.pendingHatEntaPrompt = null;
    continueNormalAskAfterHatEnta(room, askerIdx, pIdx, requestedNumber);
  });

  // Joker Showdown: Submit Guess for who used the Joker
  socket.on('submit_joker_guess', ({ targetPlayerId } = {}) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'joker_showdown' || !room.activeJokerChallenge) return;
    if (room.activeJokerChallenge.holder.id !== socket.id) return;
    resolveJokerChallenge(room, targetPlayerId);
  });

  // Joker Showdown: Skip Guess to avoid penalty risk
  socket.on('skip_joker_guess', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'joker_showdown' || !room.activeJokerChallenge) return;
    if (room.activeJokerChallenge.holder.id !== socket.id) return;
    resolveJokerChallenge(room, null);
  });

  // Reaction / Emoji Chat
  socket.on('send_reaction', ({ emoji } = {}) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;
    const sender = room.players.find(p => p.id === socket.id);
    if (sender) {
      emitToRoom(room.code, 'reaction_received', {
        playerName: sender.name,
        emoji: emoji || '🔥'
      });
    }
  });

  // Meme Sticker Broadcast (Speech Bubble over Avatar)
  socket.on('send_meme_sticker', ({ stickerUrl, stickerText } = {}) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;
    const sender = room.players.find(p => p.id === socket.id);
    if (sender) {
      emitToRoom(room.code, 'meme_sticker_broadcast', {
        playerId: socket.id,
        playerName: sender.name,
        stickerUrl,
        stickerText
      });
    }
  });

  // WebRTC Live Voice Chat Signaling
  socket.on('webrtc_signal', ({ targetId, signalData } = {}) => {
    if (!targetId || !signalData) return;
    emitToPlayer(targetId, 'webrtc_signal', {
      senderId: socket.id,
      signalData
    });
  });

  socket.on('webrtc_voice_state', ({ isMuted, isSpeaking } = {}) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;
    emitToRoom(room.code, 'webrtc_voice_state', {
      playerId: socket.id,
      isMuted: !!isMuted,
      isSpeaking: !!isSpeaking
    });
  });

  // Leave Room (Explicit exit by player)
  socket.on('leave_room', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    const p = room.players.find(pl => pl.id === socket.id);
    if (p) {
      if (p.disconnectTimer) clearTimeout(p.disconnectTimer);
      p.connected = false;
      room.logs.push(`🚪 غادر ${p.name} الطاولة.`);

      if (room.status === 'lobby') {
        room.players = room.players.filter(pl => pl.id !== socket.id);
        if (room.players.length === 0) {
          if (room.turnTimerInterval) clearInterval(room.turnTimerInterval);
          rooms.delete(currentRoomCode);
        } else if (p.isHost && room.players.length > 0) {
          room.players[0].isHost = true;
          room.hostId = room.players[0].id;
        }
      } else if (room.status === 'playing') {
        const hasConnectedHumans = room.players.some(pl => !pl.isBot && pl.connected && pl.id !== socket.id);
        if (!hasConnectedHumans) {
          if (room.turnTimerInterval) clearInterval(room.turnTimerInterval);
          if (room.hatEntaTimer) clearTimeout(room.hatEntaTimer);
          rooms.delete(currentRoomCode);
          socket.leave(room.code);
          currentRoomCode = null;
          socket.emit('left_room_success');
          return;
        }
        if (room.players[room.currentIdx]?.id === socket.id) {
          advanceTurn(room);
        }
      }
      broadcastRoomState(room);
    }

    socket.leave(room.code);
    currentRoomCode = null;
    socket.emit('left_room_success');
  });

  // Disconnect Handling (with 25s Grace Period for Mobile/Reload Recovery)
  socket.on('disconnect', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    const p = room.players.find(pl => pl.id === socket.id);
    if (p) {
      p.connected = false;
      room.logs.push(`⚠️ انقطع اتصال ${p.name}... بانتظار عودته.`);
      broadcastRoomState(room);

      if (p.disconnectTimer) clearTimeout(p.disconnectTimer);
      p.disconnectTimer = setTimeout(() => {
        if (!p.connected) {
          room.logs.push(`❌ غادر ${p.name} الطاولة نهائياً بعد انقطاع الاتصال.`);
          if (room.status === 'lobby') {
            room.players = room.players.filter(pl => pl.id !== p.id);
            if (room.players.length === 0) {
              if (room.turnTimerInterval) clearInterval(room.turnTimerInterval);
              rooms.delete(room.code);
              return;
            } else if (p.isHost && room.players.length > 0) {
              room.players[0].isHost = true;
              room.hostId = room.players[0].id;
            }
          } else if (room.status === 'playing') {
            const hasConnectedHumans = room.players.some(pl => !pl.isBot && pl.connected);
            if (!hasConnectedHumans) {
              if (room.turnTimerInterval) clearInterval(room.turnTimerInterval);
              if (room.hatEntaTimer) clearTimeout(room.hatEntaTimer);
              rooms.delete(room.code);
              return;
            }
            if (room.players[room.currentIdx]?.id === p.id) {
              advanceTurn(room);
            }
          }
          broadcastRoomState(room);
        }
      }, 25000);
    }
  });
}

// Socket.io connection
io.on('connection', (socket) => {
  registerSocketHandlers(socket);
});

// Godot Native WebSocket Server
const wss = new WebSocket.Server({ port: WS_PORT }, () => {
  console.log(`🔌 Godot Native WebSocket Bridge listening on ws://0.0.0.0:${WS_PORT}`);
});

wss.on('connection', (ws) => {
  const wsId = 'ws_' + Math.random().toString(36).substring(2, 9);
  const handlers = {};
  const socket = {
    id: wsId,
    isWs: true,
    emit(event, data) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event, data }));
      }
    },
    join(code) {
      if (!wsRooms.has(code)) wsRooms.set(code, new Set());
      wsRooms.get(code).add(socket);
    },
    leave(code) {
      if (wsRooms.has(code)) {
        wsRooms.get(code).delete(socket);
        if (wsRooms.get(code).size === 0) wsRooms.delete(code);
      }
    },
    on(event, fn) {
      handlers[event] = fn;
    }
  };
  wsSockets.set(wsId, socket);

  ws.on('message', (raw) => {
    try {
      const parsed = JSON.parse(raw.toString());
      const event = parsed.event || parsed.type;
      const data = parsed.data || {};
      if (handlers[event]) {
        handlers[event](data);
      }
    } catch (e) {
      console.error('Error handling WebSocket message:', e);
    }
  });

  ws.on('close', () => {
    if (handlers['disconnect']) {
      handlers['disconnect']();
    }
    wsSockets.delete(wsId);
  });

  registerSocketHandlers(socket);
});

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

server.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log(`\n======================================================`);
  console.log(`🃏 CATCH Online Multiplayer Server Running (Skrew Edition)!`);
  console.log(`💻 Local:   http://localhost:${PORT}`);
  console.log(`📱 Network: http://${localIP}:${PORT}`);
  console.log(`======================================================\n`);
});
