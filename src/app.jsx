
const { useState, useEffect, useRef, useMemo } = React;

const AVATARS = ['😎','👑','🦁','🐺','🦅','🐉','🎩','🦊','🐯','💀','🔥','⚡','🎭','💎','🥷','🧞','🪙','🥊'];
const MEME_STICKERS = [
  { emoji: '😂', text: 'ههههه' },
  { emoji: '🔥', text: 'نااار' },
  { emoji: '😤', text: 'ياااا' },
  { emoji: '💀', text: 'خلاص' },
  { emoji: '🤡', text: 'مهرج' },
  { emoji: '👏', text: 'عاش' },
  { emoji: '😈', text: 'هيهيهي' },
  { emoji: '🥺', text: 'رحمة' },
];

const RADIAL_REACTIONS = [
  { emoji: '👍', text: 'لايك!' },
  { emoji: '👏', text: 'عاش!' },
  { emoji: '😂', text: 'ههههه' },
  { emoji: '🔥', text: 'ناااار' },
  { emoji: '😡', text: 'متغاظ!' },
  { emoji: '😭', text: 'حرااام' },
  { emoji: '😱', text: 'يا ساتر!' },
  { emoji: '👋', text: 'سلام!' },
  { emoji: '🤡', text: 'مهرج' },
  { emoji: '💀', text: 'شطبت!' },
];

const ACTION_INFO = {
  magnatees:   { name: 'مغناطيس 🧲', color: 'teal', desc: 'يسحب الرقم من كل اللاعبين' },
  special:     { name: 'سبيشيال 💎', color: 'teal', desc: 'اطلب رقم مش في إيدك' },
  el3ab_tani:  { name: 'العب تاني 🔄', color: 'teal', desc: 'دور إضافي فوراً' },
  od_le7afak:  { name: 'قد لحافك 📜', color: 'teal', desc: 'اسرق لِمّة برقم كروت إيدك' },
  badl_edain:  { name: 'بدل إيدي 🤝', color: 'teal', desc: 'بدل ورقك مع خصم' },
  bos_bosa:    { name: 'بص بصة 👁️', color: 'teal', desc: 'بص على كارت سري عند حد' },
  sayad:       { name: 'صياد 🎯',   color: 'teal', desc: 'اسحب كارت عشوائي من لاعب' },
  hat_enta:    { name: 'هات انت ✋', color: 'ruby', desc: 'اعكس الطلب وخد انت' },
  kefaya_3leik:{ name: 'كفاية عليك 🖐️', color: 'ruby', desc: 'وقف اللاعب بعد أول طلب' },
  msh_shaifak: { name: 'مش شايفك 🙈', color: 'ruby', desc: 'تخطي دور اللاعب القادم' },
  mana3a:      { name: 'مناعة 🛡️',   color: 'ruby', desc: 'حماية كاملة لمدة راوند' },
  lef_w_erga3: { name: 'لف وارجع 🔙', color: 'ruby', desc: 'اعكس اتجاه اللعب' },
  kdab:        { name: 'كداب 🤥',     color: 'ruby', desc: 'اكذب وقول معيش الكارت' },
  joker:       { name: 'جوكر 🃏',     color: 'gold', desc: '3 كروت + جوكر = لِمّة سرية' },
  herbaiya:    { name: 'الحرباية 🦎', color: 'purple', desc: 'قلد أي كارت من الأرض' },
};

// Red Action Cards that can be played at ANY time (even outside player's turn)
const ANY_TIME_CARDS = ['msh_shaifak', 'mana3a', 'lef_w_erga3', 'kefaya_3leik', 'hat_enta'];

// Comprehensive Card Superpowers & Strategy Guide
const CARD_DETAILS_GUIDE = {
  magnatees: {
    name: 'مغناطيس 🧲',
    category: 'أكشن هجومي جماعي ⚡',
    badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-400',
    when: 'في دورك فقط',
    power: 'بتختار أي رقم موجود في إيدك، والمغناطيس بيسحب كل الكروت من نفس الرقم ده من جميع اللاعبين على الطاولة في ضربة واحدة!',
    proTip: 'العبها لما تكون عارف إن أكتر من خصم معاهم نفس الرقم عشان تلم الـ 4 كروت وتقفل لِمّة في ثانية.'
  },
  special: {
    name: 'سبيشيال 💎',
    category: 'أكشن هجومي حر 🎯',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400',
    when: 'في دورك فقط',
    power: 'بيسمحلك تطلب أي رقم في اللعبة من أي لاعب تختاره، حتى لو الرقم ده مش معاك في إيدك أصلاً!',
    proTip: 'ممتاز لمباغتة الخصم اللي عمال يجمع كروت معينة أو عشان تاخد منه كارت قفل اللعبة.'
  },
  el3ab_tani: {
    name: 'العب تاني 🔄',
    category: 'أكشن تكتيكي ⏳',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400',
    when: 'في دورك فقط',
    power: 'بيديك دور إضافي فوراً! الدور مش هيلف للي بعدك وتقدر تطلب أو تلعب كارت تاني وراه.',
    proTip: 'استخدمه قبل ما تسحب أو لما تكون عايز تكسر خطة اللعب وتعمل حركتين ورا بعض.'
  },
  od_le7afak: {
    name: 'قد لحافك 📜',
    category: 'سرقة لِمّة كاملة 👑',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400',
    when: 'في دورك فقط',
    power: 'لو عدد الكروت اللي في إيدك يطابق رقم لِمّة جمعها أي لاعب، بتسرق اللِمّة دي كاملة لنفسك وتتحسب في نقاطك!',
    proTip: 'عد كروت إيدك بدقة؛ أول ما عدد كروتك يساوي رقم لِمّة عند خصمك اسرقها فوراً.'
  },
  badl_edain: {
    name: 'بدل إيدي 🤝',
    category: 'قلب موازين الجولة 🔄',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400',
    when: 'في دورك فقط',
    power: 'بتبدل كل الكروت اللي في إيدك مع كل كروت أي لاعب تاني على الطاولة في لحظة واحدة.',
    proTip: 'لو إيدك فيها كارت أو اتنين بس وخصمك معاه 6 أو 7 كروت، بدّل معاه وورطه!'
  },
  bos_bosa: {
    name: 'بص بصة 👁️',
    category: 'كشف الأوراق 🕵️',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-400',
    when: 'في دورك فقط',
    power: 'بتكشف كارت عشوائي سري من إيد أي لاعب تختاره عشان تعرف إيه اللي مخبيه.',
    proTip: 'استخدمه قبل ما تطلب رقم عشان تتأكد مين معاه الرقم المطلوب.'
  },
  sayad: {
    name: 'صياد 🎯',
    category: 'صيد عشوائي 🏹',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-400',
    when: 'في دورك فقط',
    power: 'بتسحب كارت عشوائي من إيد أي لاعب وتضمه لإيدك مباشرة.',
    proTip: 'كارت سريع بيزود كروتك ويقلل كروت الخصم بدون شروط.'
  },
  hat_enta: {
    name: 'هات انت ✋',
    category: 'دفاع وهجوم مضاد ⚡',
    badgeClass: 'bg-red-500/20 text-red-300 border-red-400',
    when: 'في أي وقت (رد دفاعي سريع)',
    power: 'لو لاعب طلب منك رقم أو نجح في أخذ كارت، بتلعب الكارت ده فوراً عشان توقفه وتسحب الدور منه ويبقى دورك انت!',
    proTip: 'احتفظ بيه دايماً كدرع سري مفاجئ لسرقة الدور في اللحظات الحاسمة.'
  },
  kefaya_3leik: {
    name: 'كفاية عليك 🖐️',
    category: 'دفاع وقفل الدور 🛑',
    badgeClass: 'bg-red-600/20 text-red-300 border-red-500',
    when: 'في أي وقت (رد دفاعي)',
    power: 'لما لاعب يطلب وينجح ويكون عايز يكمل دوره، العبها عليه عشان تنهي دوره فوراً وتجبره يمرر الدور للي بعده.',
    proTip: 'اقطع بيه سلسلة نجاح الخصم قبل ما يقفل لِمّة كاملة.'
  },
  msh_shaifak: {
    name: 'مش شايفك 🙈',
    category: 'تعطيل الخصم ⏭️',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-400',
    when: 'في دورك أو في أي وقت',
    power: 'بتلغى دور اللاعب اللي جاي بعدك وبتخليه ميعرفش يلعب ويتخطى دوره تماماً.',
    proTip: 'العبها على اللاعب اللي بعدك لو عارف إنه جاهز يكسب أو معاه كروت خطيرة.'
  },
  mana3a: {
    name: 'مناعة 🛡️',
    category: 'درع حصين 🛡️',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400',
    when: 'في أي وقت (دفاع)',
    power: 'بتديك درع حماية كاملة، مفيش أي لاعب يقدر يطلب منك أي رقم ولا يطبق عليك أي كارت أكشن لمدة دور كامل!',
    proTip: 'فعلها أول ما تلاقي الخصوم بدأوا يركزوا عليك وعايزين يسرقوا منك.'
  },
  lef_w_erga3: {
    name: 'لف وارجع 🔙',
    category: 'تغيير الاتجاه 🔄',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-400',
    when: 'في أي وقت',
    power: 'بيعكس اتجاه دوران اللعب على الطاولة فوراً (من مع عقارب الساعة إلى عكسها والعكس).',
    proTip: 'ابعد الدور عن اللاعب القوي وخليه يرجع للاعب أضعف أو للبوت.'
  },
  kdab: {
    name: 'كداب 🤥',
    category: 'خداع استراتيجي 🎭',
    badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-400',
    when: 'لما حد يطلب منك رقم',
    power: 'لما حد يطلب منك رقم وهو معاك فعلاً، تقدر تكذب وتقول معيش! وتفضل محتفظ بالرقم بدون ما تديهوله.',
    proTip: 'اكذب لما يكون معاك 3 كروت من الرقم عشان تحميهم وتلم الرابع بنفسك.'
  },
  joker: {
    name: 'جوكر 🃏',
    category: 'كارت سحري خارق 🌟',
    badgeClass: 'bg-amber-400/20 text-yellow-300 border-yellow-400',
    when: 'في دورك',
    power: 'الجوكر يقدر يكمل أي 3 كروت من نفس الرقم عشان يقفل لِمّة سرية فورية (3 كروت + جوكر = لِمّة)!',
    proTip: 'أقوى كارت في اللعبة، وفره لحد ما تجمع 3 كروت من أي رقم واقفله لِمّة بنقاط كاملة.'
  },
  herbaiya: {
    name: 'الحرباية 🦎',
    category: 'كارت سحري متعدد ✨',
    badgeClass: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400',
    when: 'في دورك',
    power: 'الحرباية بتقلد تأثير آخر كارت أكشن موجود في كومة المكشوف على الأرض في نص الطاولة!',
    proTip: 'راقب كارت الأرض، لو نزل مغناطيس أو سبيشيال، الحرباية هتكرر نفس القوة الجبارة.'
  }
};

function getCardDetailedInfo(card) {
  if (!card) return null;
  if (card.type === 'number') {
    if (card.value === 11) {
      return {
        name: 'كارت كا [11] 👑',
        category: 'كارت ملكي ذهبي 🌟',
        badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-400',
        when: 'في دورك فقط',
        power: 'كارت رقم 11 الملكي في كاتش. تجميعه مع لِمّة تش [12] في نفس الجولة بيديك بونص لِمّة إضافية (+1) هدية مجاناً!',
        proTip: 'حاول دايماً تجمع ثنائية كا وتش للحصول على 3 لِمّات بدل اتنين.'
      };
    }
    if (card.value === 12) {
      return {
        name: 'كارت تش [12] 👑',
        category: 'كارت ملكي ذهبي 🌟',
        badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-400',
        when: 'في دورك فقط',
        power: 'كارت رقم 12 الأسطوري في كاتش. يكمل ثنائية CATCH مع كارت كا [11] للحصول على بونص لِمّة كاملة!',
        proTip: 'اطلب كروت تش بذكاء لأنها أغلى كروت على الطاولة.'
      };
    }
    return {
      name: `كارت رقم ${card.value} 🔢`,
      category: 'كروت الأرقام الأساسية 🔢',
      badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400',
      when: 'في دورك فقط',
      power: `تطلب رقم ${card.value} من أي لاعب تختاره بشرط يكون معاك منه كارت في إيدك. لو معاه الرقم هيدهولك وتكمل دورك! كل 4 كروت من نفس الرقم بتقفل لِمّة سرية.`,
      proTip: 'راقب طلبات الخصوم عشان تعرف مين معاه الرقم وتطلبه منه في التوقيت المناسب.'
    };
  }
  return CARD_DETAILS_GUIDE[card.type] || {
    name: ACTION_INFO[card.type]?.name || card.type,
    category: 'كارت أكشن ⚡',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400',
    when: ANY_TIME_CARDS.includes(card.type) ? 'في أي وقت ⚡' : 'في دورك فقط ⏱️',
    power: ACTION_INFO[card.type]?.desc || 'كارت أكشن في لعبة كاتش.',
    proTip: 'العب الكارت بتكتيك لتحقيق الفوز.'
  };
}

// Cartoon Avatars inspired by Plan Image 4
const CARTOON_AVATARS = [
  { id: 'saeedi', name: 'الحاج فزاع', emoji: '👳‍♂️', desc: 'صعيدي أصيل مبيتهددش', cost: 0 },
  { id: 'batman', name: 'باتمان الشعبي', emoji: '🦇', desc: 'حامي الحارة بالليل', cost: 20 },
  { id: 'muallem', name: 'المعلم شنب', emoji: '👨🏻', desc: 'معلم الطاولة بالفانلة', cost: 20 },
  { id: 'captain', name: 'كابتن الطاولة', emoji: '🧢', desc: 'حريف كروت ورهانات', cost: 20 },
  { id: 'grandma', name: 'الحجة بركة', emoji: '👵', desc: 'طيبة بس بتكسب الكل', cost: 20 },
  { id: 'goth', name: 'بنت الجوث', emoji: '🖤', desc: 'غموض ونظرات مرعبة', cost: 20 },
  { id: 'cute_girl', name: 'بنت الكيوت', emoji: '🎧', desc: 'سماعات قطة ومزاجه رايق', cost: 20 },
  { id: 'chubby', name: 'الفتوة كوكو', emoji: '🥊', desc: 'صاحب الضربات القاضية', cost: 20 },
  { id: 'pharaoh', name: 'الملك رمسيس', emoji: '👑', desc: 'فرعون الكازينو الذهبي', cost: 50 },
  { id: 'wizard', name: 'الساحر عنتر', emoji: '🧙‍♂️', desc: 'بيخفي الورق في ثانية', cost: 50 },
];

// Card Back Skins inspired by Plan Image 5
const CARD_BACK_SKINS = [
  { id: 'classic', name: 'كاتش كلاسيك', bg: 'from-amber-400 to-amber-600', border: 'border-yellow-300', cost: 0 },
  { id: 'purple_radial', name: 'الموف الملكي', bg: 'from-purple-600 to-indigo-800', border: 'border-purple-300', cost: 20 },
  { id: 'gold_pharaoh', name: 'الذهب الفرعوني', bg: 'from-yellow-400 via-amber-300 to-yellow-600', border: 'border-yellow-100', cost: 20 },
  { id: 'cyan_neon', name: 'سايبر نيون', bg: 'from-cyan-500 to-blue-700', border: 'border-cyan-300', cost: 20 },
  { id: 'ruby_velvet', name: 'المخمل الأحمر', bg: 'from-red-600 to-rose-900', border: 'border-rose-300', cost: 20 },
];

// Authentic Egyptian Card-Table Meme Reaction Stickers
const MEME_REACTION_STICKERS = [
  { id: 'm1', text: 'ههههه شرير 😈', emoji: '😈', label: 'ضحكة الشر' },
  { id: 'm2', text: 'يا خبر أبيض! 😱', emoji: '😱', label: 'صدمة' },
  { id: 'm3', text: 'شاي خمسينة في المخ ☕', emoji: '☕', label: 'شاي رايق' },
  { id: 'm4', text: 'عاش يا وحش! 👏', emoji: '👏', label: 'عاش يا بطل' },
  { id: 'm5', text: 'اللعب ولّع نار! 🔥', emoji: '🔥', label: 'حريقة' },
  { id: 'm6', text: 'ههههههه مش قادر 😂', emoji: '😂', label: 'ميت ضحك' },
  { id: 'm7', text: 'ولا بيهمني ولا بتهدد 😤', emoji: '😤', label: 'مبتهددش' },
  { id: 'm8', text: 'يا عيني عالورق! 😭', emoji: '😭', label: 'حرااام' },
  { id: 'm9', text: 'في الجبهة في الجون 🎯', emoji: '🎯', label: 'في الجبهة' },
  { id: 'm10', text: 'خلاص شطبت وودعت 💀', emoji: '💀', label: 'خلاص شطبت' },
];

// Daily Quests with 0 initial progress
const INITIAL_QUESTS = [
  { id: 'q1', text: 'العب 3 جولات في أي مود', textEn: 'Play 3 rounds in any mode', target: 3, progress: 0, rewardType: 'gems', rewardAmount: 5, claimed: false },
  { id: 'q2', text: 'اقفل لِمّة واحدة بالجوكر أو الأرقام', textEn: 'Complete 1 set using numbers or Joker', target: 1, progress: 0, rewardType: 'coins', rewardAmount: 40, claimed: false },
  { id: 'q3', text: 'مكافأة الدخول اليومية المجانية', textEn: 'Daily free login bonus', target: 1, progress: 1, rewardType: 'coins', rewardAmount: 30, claimed: false },
];

// Bilingual Translations (Arabic / English)
const TRANSLATIONS = {
  ar: {
    playNow: 'العب الآن',
    privateTable: 'طاولة خاصة',
    training: 'تدريب',
    botTraining: 'تدريب فوري مع البوتات (أوفلاين)',
    quickTable: 'طاولة سريعة (عامة)',
    privateTableModalTitle: 'طاولة خاصة برمز سري',
    settings: 'إعدادات اللعبة',
    soundFx: 'مؤثرات الصوت',
    editProfile: 'تعديل الملف الشخصي',
    rules: 'قواعد اللعبة الرسمية',
    serverIp: 'خادم اللعبة (Server IP):',
    serverSubtitle: 'للهواتف والأونلاين على الشبكة',
    saveAndReconnect: 'حفظ وإعادة الاتصال 🔄',
    closeSettings: 'إغلاق الإعدادات ✓',
    language: 'لغة اللعبة (Language):',
    connected: 'متصل بالسيرفر',
    disconnected: 'غير متصل بالسيرفر',
    connecting: 'جاري الاتصال...',
    notConnectedAlert: '⚠️ غير متصل بسيرفر اللعبة حالياً!\nتأكد من تشغيل السيرفر وأن هاتفك متصل بنفس شبكة الواي فاي.',
    shop: 'المتجر',
    custom: 'التخصيص',
    home: 'الرئيسية',
    friends: 'الأصدقاء',
    leagues: 'المستويات',
    dailyQuests: 'المهام اليومية',
    resetsDaily: 'تتجدد يومياً',
    claim: 'استلم',
    claimed: 'تم ✓',
    comingSoon: 'قريباً 🔒',
    comingSoonAlert: 'الشحن والشراء عبر Google Play سيكون متاحاً قريباً! 🔒',
    shareViaApps: 'دعوة أصحابك عبر واتساب / التطبيقات',
    copyLink: 'نسخ رابط اللعبة المباشر 📋',
    linkCopied: 'تم نسخ الرابط للحافظة! 📋',
    leaveTable: '🚪 مغادرة',
    tableNumber: 'طاولة رقم',
    inviteCode: 'كود الطاولة للمشاركة والدعوة',
    playersAroundTable: 'اللاعبين حول الطاولة',
    waitingPlayers: 'في انتظار باقي اللاعبين للبدء...',
    startGame: 'بدء اللعبة 🚀',
    addBot: 'إضافة بوت 🤖',
    createPrivateTable: '🏠 إنشاء طاولة خاصة جديدة',
    orEnterCode: 'أو ادخل برمز طاولة صاحبك',
    join: 'انضم ➜',
    readRules: 'قراءة القواعد 📖',
    rulesGotIt: 'فهمت القواعد.. يلا نلعب! 🚀',
    saveProfile: 'حفظ الملف الشخصي ✓',
    playerNameLabel: 'اسم اللاعب',
    chooseAvatar: 'اختر شخصية VIP',
    liveMic: '🎙️ مايك الطاولة',
    micOn: '🎙️ مايك شغال',
  },
  en: {
    playNow: 'Play Now',
    privateTable: 'Private Table',
    training: 'Training',
    botTraining: 'Instant Bot Training',
    quickTable: 'Quick Table (Public)',
    privateTableModalTitle: 'Private Table with Code',
    settings: 'Game Settings',
    soundFx: 'Sound Effects',
    editProfile: 'Edit Profile',
    rules: 'Official Game Rules',
    serverIp: 'Game Server (Server IP):',
    serverSubtitle: 'For phones & local network play',
    saveAndReconnect: 'Save & Reconnect 🔄',
    closeSettings: 'Close Settings ✓',
    language: 'Language:',
    connected: 'Server Connected',
    disconnected: 'Server Disconnected',
    connecting: 'Connecting...',
    notConnectedAlert: '⚠️ Not connected to the game server!\nPlease ensure the server is running and your phone is on the same Wi-Fi network.',
    shop: 'Shop',
    custom: 'Custom',
    home: 'Home',
    friends: 'Friends',
    leagues: 'Leagues',
    dailyQuests: 'Daily Quests',
    resetsDaily: 'Resets daily',
    claim: 'Claim',
    claimed: 'Done ✓',
    comingSoon: 'Coming Soon 🔒',
    comingSoonAlert: 'Store purchases will be available soon in the upcoming update! 🔒',
    shareViaApps: 'Invite Friends via WhatsApp / Apps',
    copyLink: 'Copy Direct Game Link 📋',
    linkCopied: 'Link copied to clipboard! 📋',
    leaveTable: '🚪 Leave Table',
    tableNumber: 'Table #',
    inviteCode: 'Table Code for Invitation',
    playersAroundTable: 'Players Around Table',
    waitingPlayers: 'Waiting for players to start...',
    startGame: 'Start Game 🚀',
    addBot: 'Add Bot 🤖',
    createPrivateTable: '🏠 Create New Private Table',
    orEnterCode: 'Or enter a friend\'s table code',
    join: 'Join ➜',
    readRules: 'Read Rules 📖',
    rulesGotIt: 'Understood.. Let\'s Play! 🚀',
    saveProfile: 'Save Profile ✓',
    playerNameLabel: 'Player Name',
    chooseAvatar: 'Choose VIP Avatar',
    liveMic: '🎙️ Table Mic',
    micOn: '🎙️ Mic Active',
  }
};

function getCardImage(card) {
  if (!card) return '/cards/card_TCH.png';
  if (card.type === 'number') {
    if (card.value === 11) return '/cards/card_CA.png';
    if (card.value === 12) return '/cards/card_TCH.png';
    return `/cards/number_${card.value}.png`;
  }
  return `/cards/${card.type}.png`;
}

function getCardTitle(card) {
  if (!card) return '';
  if (card.type === 'number') {
    if (card.value === 11) return 'كارت كا [11]';
    if (card.value === 12) return 'كارت تش [12]';
    return `رقم ${card.value}`;
  }
  return ACTION_INFO[card.type]?.name || card.type;
}

// Native Mobile Haptic Touch Vibration Helper
function triggerHaptic(type = 'light') {
  try {
    if (window.Capacitor?.Plugins?.Haptics) {
      if (type === 'heavy') window.Capacitor.Plugins.Haptics.impact({ style: 'HEAVY' });
      else if (type === 'medium') window.Capacitor.Plugins.Haptics.impact({ style: 'MEDIUM' });
      else window.Capacitor.Plugins.Haptics.impact({ style: 'LIGHT' });
    } else if (navigator.vibrate) {
      if (type === 'heavy') navigator.vibrate([40, 80, 40]);
      else if (type === 'medium') navigator.vibrate(35);
      else navigator.vibrate(15);
    }
  } catch(e) {}
}

// Enhanced Web Audio Sound & Ambient Engine
class SoundFxEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicActive = false;
    this.musicInterval = null;
  }
  init() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
    }
  }
  play(name) {
    if (name === 'snap') triggerHaptic('light');
    else if (name === 'catch' || name === 'catch_slam') triggerHaptic('heavy');
    else if (name === 'impact' || name === 'celebration') triggerHaptic('medium');

    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      if (name === 'snap') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        osc.start(t); osc.stop(t + 0.08);
      } else if (name === 'whoosh' || name === 'card_slide') {
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.22);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(750, t);
        filter.frequency.exponentialRampToValueAtTime(250, t + 0.2);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        noise.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
        noise.start(t);
      } else if (name === 'catch' || name === 'catch_slam') {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(400, t);
        osc1.frequency.exponentialRampToValueAtTime(80, t + 0.45);
        osc2.frequency.setValueAtTime(260, t);
        osc2.frequency.exponentialRampToValueAtTime(60, t + 0.45);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        osc1.connect(gain); osc2.connect(gain); gain.connect(this.ctx.destination);
        osc1.start(t); osc2.start(t); osc1.stop(t + 0.5); osc2.stop(t + 0.5);
      } else if (name === 'celebration') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const st = t + (idx * 0.11);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, st);
          gain.gain.setValueAtTime(0.22, st);
          gain.gain.exponentialRampToValueAtTime(0.001, st + 0.7);
          osc.connect(gain); gain.connect(this.ctx.destination);
          osc.start(st); osc.stop(st + 0.7);
        });
      } else if (name === 'banter') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(1174, t + 0.1);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.28);
      } else if (name === 'impact') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.3);
      } else if (name === 'tick') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, t);
        osc.frequency.exponentialRampToValueAtTime(350, t + 0.04);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.04);
      }
    } catch(e){}
  }

  toggleAmbientMusic(callback) {
    this.init();
    if (this.musicActive) {
      this.stopAmbientMusic();
      if (callback) callback(false);
      return false;
    } else {
      this.startAmbientMusic();
      if (callback) callback(true);
      return true;
    }
  }

  startAmbientMusic() {
    if (!this.ctx || this.musicActive) return;
    this.musicActive = true;
    const chordProgression = [
      [146.83, 220, 261.63, 329.63],
      [98, 196, 246.94, 329.63],
      [130.81, 196, 246.94, 293.66],
      [110, 220, 277.18, 349.23]
    ];
    let step = 0;
    const playChord = () => {
      if (!this.musicActive || this.muted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const freqs = chordProgression[step % chordProgression.length];
      step++;
      freqs.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.03, t + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 3.8);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 3.8);
      });
    };
    playChord();
    this.musicInterval = setInterval(playChord, 4000);
  }

  stopAmbientMusic() {
    this.musicActive = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}
const soundFx = new SoundFxEngine();

const EGYPTIAN_BANTERS = [
  { text: 'يا حلاوة اللِمّة! 🔥', emoji: '🔥', sound: 'banter' },
  { text: 'كاتش في السلك يا معلم! 🚫', emoji: '🚫', sound: 'catch' },
  { text: 'درعك مش نافعك! 🛡️', emoji: '🛡️', sound: 'impact' },
  { text: 'هات يا باشا من سكات! ✋', emoji: '✋', sound: 'whoosh' },
  { text: 'كداب في أصل وشك! 🤥', emoji: '🤥', sound: 'snap' },
  { text: 'روّق على حالك واشرب شاي! ☕', emoji: '☕', sound: 'banter' },
  { text: 'اللعبة لفت عليك يا غالي! 🔙', emoji: '🔙', sound: 'whoosh' },
  { text: 'كفاية عليك كده النهاردة! 🖐️', emoji: '🖐️', sound: 'impact' },
];

// --- Egyptian Arabic Number Mapping ---
const ARABIC_NUMBERS = {
  'صفر': 0, '0': 0,
  'واحد': 1, '1': 1,
  'اتنين': 2, 'اثنين': 2, 'إثنين': 2, '2': 2,
  'تلاتة': 3, 'ثلاثة': 3, '3': 3,
  'اربعة': 4, 'أربعة': 4, '4': 4,
  'خمسة': 5, '5': 5,
  'ستة': 6, '6': 6,
  'سبعة': 7, '7': 7,
  'تمانية': 8, 'ثمانية': 8, '8': 8,
  'تسعة': 9, '9': 9,
  'عشرة': 10, '10': 10,
  'كا': 11, 'كاف': 11, 'حداشر': 11, 'أحد عشر': 11, 'إحدى عشر': 11, '11': 11,
  'تش': 12, 'شين': 12, 'اتناشر': 12, 'اثنا عشر': 12, '12': 12
};

function normalizeArabic(text) {
  if (!text) return '';
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\w\s\u0600-\u06FF]/gi, '')
    .trim()
    .toLowerCase();
}

function parseVoiceCommand(rawText, roomState, myId) {
  const norm = normalizeArabic(rawText);
  const me = roomState?.players?.find(p => p.id === myId);
  const opponents = roomState?.players?.filter(p => p.id !== myId) || [];

  // 1. Detect target opponent from name
  let targetIdx = -1;
  let targetPlayerName = '';
  for (let i = 0; i < opponents.length; i++) {
    const oppName = normalizeArabic(opponents[i].name);
    const words = oppName.split(' ');
    if (words.some(w => w.length >= 2 && norm.includes(w))) {
      targetIdx = roomState.players.findIndex(p => p.id === opponents[i].id);
      targetPlayerName = opponents[i].name;
      break;
    }
  }

  // 2. Detect requested number (0-12)
  let foundNumber = null;
  for (const [kw, val] of Object.entries(ARABIC_NUMBERS)) {
    const kwNorm = normalizeArabic(kw);
    const regex = new RegExp(`(^|\\s)${kwNorm}(\\s|$)`);
    if (regex.test(norm)) {
      foundNumber = val;
      break;
    }
  }

  // 3. Match Intent
  if (norm.includes('سحب') || norm.includes('اسحب') || norm.includes('كارت من الارض') || norm.includes('كارت من الديك')) {
    return { action: 'draw_card', label: '📥 سحب كارت من الأرض' };
  }

  if (norm.includes('مغناطيس') || norm.includes('المغناطيس')) {
    return {
      action: 'magnatees',
      value: foundNumber,
      label: foundNumber !== null ? `🧲 مغناطيس على رقم [ ${foundNumber === 11 ? 'كا' : foundNumber === 12 ? 'تش' : foundNumber} ]` : '🧲 فتح كارت المغناطيس'
    };
  }

  if (norm.includes('العب تاني') || norm.includes('دور تاني') || norm.includes('العب كمان')) {
    return { action: 'el3ab_tani', label: '🔄 كارت العب تاني' };
  }

  if (norm.includes('مناعه') || norm.includes('درع')) {
    return { action: 'mana3a', label: '🛡️ كارت المناعة' };
  }

  if (norm.includes('لف وارجع') || norm.includes('اعكس اللعب') || norm.includes('عكس الاتجاه')) {
    return { action: 'lef_w_erga3', label: '🔙 كارت لف وارجع' };
  }

  if (norm.includes('صياد') || norm.includes('اصطاد')) {
    return { action: 'sayad', targetIdx, targetPlayerName, label: '🎯 كارت الصياد' };
  }

  if (norm.includes('بدل') || norm.includes('تبديل')) {
    return { action: 'badl_edain', targetIdx, targetPlayerName, label: '🤝 كارت بدل إيدي' };
  }

  if (norm.includes('جوكر')) {
    return { action: 'joker', value: foundNumber, label: `🃏 كارت الجوكر ${foundNumber !== null ? 'مع رقم ' + (foundNumber === 11 ? 'كا' : foundNumber === 12 ? 'تش' : foundNumber) : ''}` };
  }

  if (norm.includes('مش شايفك') || norm.includes('غمي عينك') || norm.includes('مش شايف')) {
    return { action: 'msh_shaifak', targetIdx, targetPlayerName, label: '🙈 كارت مش شايفك' };
  }

  if (norm.includes('كفاية عليك') || norm.includes('كفايه عليك') || norm.includes('وقف') || norm.includes('كفايه')) {
    return { action: 'kefaya_3leik', targetIdx, targetPlayerName, label: '🖐️ كارت كفاية عليك' };
  }

  if (norm.includes('هات انت') || norm.includes('هات إنت') || norm.includes('هات يا')) {
    return { action: 'hat_enta', targetIdx, targetPlayerName, value: foundNumber, label: '✋ كارت هات انت' };
  }

  if (foundNumber !== null) {
    return {
      action: 'ask_number',
      value: foundNumber,
      targetIdx,
      targetPlayerName,
      label: `🎯 طلب رقم [ ${foundNumber === 11 ? 'كا' : foundNumber === 12 ? 'تش' : foundNumber} ] ${targetPlayerName ? 'من ' + targetPlayerName : ''}`
    };
  }

  return { action: 'unknown', text: rawText, label: `🗣️ "${rawText}"` };
}

// --- WebRTC P2P Voice Chat Manager ---
class VoiceChatManager {
  constructor(socket, onSpeakingChange, onError) {
    this.socket = socket;
    this.onSpeakingChange = onSpeakingChange;
    this.onError = onError;
    this.localStream = null;
    this.peers = new Map();
    this.audioElements = new Map();
    this.analyserInterval = null;
    this.isMuted = false;
    this.active = false;
  }

  async start() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      this.active = true;
      this.isMuted = false;
      this.setupSpeakingDetector();
      return true;
    } catch (err) {
      console.warn('Mic error:', err);
      if (this.onError) this.onError('تعذر تشغيل المايك. يرجى إعطاء صلاحية الميكروفون للمتصفح.');
      return false;
    }
  }

  stop() {
    this.active = false;
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    for (const pc of this.peers.values()) {
      pc.close();
    }
    this.peers.clear();
    for (const audio of this.audioElements.values()) {
      audio.pause();
      audio.remove();
    }
    this.audioElements.clear();
    if (this.analyserInterval) clearInterval(this.analyserInterval);
    if (this.socket) {
      this.socket.emit('webrtc_voice_state', { isMuted: true, isSpeaking: false });
    }
  }

  setMute(mute) {
    this.isMuted = mute;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(t => { t.enabled = !mute; });
    }
    if (this.socket) {
      this.socket.emit('webrtc_voice_state', { isMuted: mute, isSpeaking: false });
    }
  }

  setupSpeakingDetector() {
    if (!this.localStream) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const src = audioCtx.createMediaStreamSource(this.localStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let wasSpeaking = false;

      this.analyserInterval = setInterval(() => {
        if (!this.active || this.isMuted) {
          if (wasSpeaking) {
            wasSpeaking = false;
            if (this.socket) this.socket.emit('webrtc_voice_state', { isMuted: true, isSpeaking: false });
            if (this.onSpeakingChange) this.onSpeakingChange(this.socket.id, false);
          }
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        const isSpeaking = avg > 22;

        if (isSpeaking !== wasSpeaking) {
          wasSpeaking = isSpeaking;
          if (this.socket) this.socket.emit('webrtc_voice_state', { isMuted: this.isMuted, isSpeaking });
          if (this.onSpeakingChange) this.onSpeakingChange(this.socket.id, isSpeaking);
        }
      }, 150);
    } catch(e) {
      console.warn('Analyser setup error:', e);
    }
  }

  createPeer(targetId, initiator) {
    if (this.peers.has(targetId)) return this.peers.get(targetId);

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    pc.onicecandidate = (e) => {
      if (e.candidate && this.socket) {
        this.socket.emit('webrtc_signal', {
          targetId,
          signalData: { type: 'candidate', candidate: e.candidate }
        });
      }
    };

    pc.ontrack = (e) => {
      let audio = this.audioElements.get(targetId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audio.playsInline = true;
        document.body.appendChild(audio);
        this.audioElements.set(targetId, audio);
      }
      audio.srcObject = e.streams[0];
      audio.play().catch(err => console.warn('Audio play error:', err));
    };

    this.peers.set(targetId, pc);

    if (initiator) {
      pc.createOffer().then(offer => {
        return pc.setLocalDescription(offer);
      }).then(() => {
        if (this.socket) {
          this.socket.emit('webrtc_signal', {
            targetId,
            signalData: { type: 'offer', offer: pc.localDescription }
          });
        }
      }).catch(err => console.warn('Offer error:', err));
    }

    return pc;
  }

  async handleSignal(senderId, signalData) {
    if (!this.active) return;
    let pc = this.peers.get(senderId);
    if (!pc) {
      pc = this.createPeer(senderId, false);
    }

    try {
      if (signalData.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signalData.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (this.socket) {
          this.socket.emit('webrtc_signal', {
            targetId: senderId,
            signalData: { type: 'answer', answer }
          });
        }
      } else if (signalData.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signalData.answer));
      } else if (signalData.type === 'candidate' && signalData.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
      }
    } catch(err) {
      console.warn('Signal handling error:', err);
    }
  }

  syncPeers(players, myId) {
    if (!this.active) return;
    const currentPeerIds = new Set(players.filter(p => p.id !== myId && !p.isBot).map(p => p.id));
    for (const [id, pc] of this.peers.entries()) {
      if (!currentPeerIds.has(id)) {
        pc.close();
        this.peers.delete(id);
        const audio = this.audioElements.get(id);
        if (audio) { audio.pause(); audio.remove(); this.audioElements.delete(id); }
      }
    }
    for (const peerId of currentPeerIds) {
      if (!this.peers.has(peerId) && myId > peerId) {
        this.createPeer(peerId, true);
      }
    }
  }
}

function App() {
  const socketRef = useRef(null);
  const [roomState, setRoomState] = useState(null);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('catch_name') || '');
  const [avatar, setAvatar] = useState(() => localStorage.getItem('catch_avatar') || '😎');
  const [joinCode, setJoinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [muted, setMuted] = useState(false);

  // Persistent User Account & Lifetime Stats
  const [userId] = useState(() => {
    let id = localStorage.getItem('catch_user_id');
    if (!id) {
      id = 'u_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem('catch_user_id', id);
    }
    return id;
  });

  const [sessionToken] = useState(() => {
    let token = localStorage.getItem('catch_session_token');
    if (!token) {
      token = 'tok_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      localStorage.setItem('catch_session_token', token);
    }
    return token;
  });

  const [stats, setStats] = useState(() => {
    try {
      const saved = localStorage.getItem('catch_stats');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { games: 0, wins: 0, sets: 0 };
  });

  const [lastRoomCode, setLastRoomCode] = useState(() => localStorage.getItem('catch_last_room') || '');
  const [isEditingProfile, setIsEditingProfile] = useState(() => !localStorage.getItem('catch_name'));
  const [showRulesModal, setShowRulesModal] = useState(false);
  const recordedGameRef = useRef(null);

  // VIP Rank Progression based on lifetime wins
  const vipRank = useMemo(() => {
    const wins = stats.wins || 0;
    if (wins >= 25) return { title: 'أسطورة كاتش الملكية', badge: '👑 أسطورة VIP', pillClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-400' };
    if (wins >= 12) return { title: 'دايموند VIP', badge: '💎 دايموند VIP', pillClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400' };
    if (wins >= 6) return { title: 'كابتن الطاولة ذهبي', badge: '🥇 كابتن ذهبي', pillClass: 'bg-amber-500/20 text-amber-300 border-amber-400' };
    if (wins >= 3) return { title: 'صائد كروت فضي', badge: '🥈 صائد فضي', pillClass: 'bg-slate-500/20 text-slate-200 border-slate-300' };
    return { title: 'لاعب صاعد برونزي', badge: '🥉 مبتدئ برونزي', pillClass: 'bg-orange-500/20 text-orange-200 border-orange-600' };
  }, [stats.wins]);

  // In-Game State
  const [selectedCard, setSelectedCard] = useState(null);
  const [turnTimer, setTurnTimer] = useState(45);
  const [turnTimerTotal, setTurnTimerTotal] = useState(45);
  const [actionNotice, setActionNotice] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [showMemes, setShowMemes] = useState(false);
  const [showEmojiWheel, setShowEmojiWheel] = useState(false);
  const [customValue, setCustomValue] = useState(null); // for Special / Kdab
  const [speechBubbles, setSpeechBubbles] = useState({});
  const [liarPrompt, setLiarPrompt] = useState(null); // { askerName, requestedNumber, count }
  const [swapAnim, setSwapAnim] = useState(null); // { p1Idx, p2Idx, p1Name, p2Name }
  const [magnetModal, setMagnetModal] = useState(false);
  const [specialModal, setSpecialModal] = useState(false);
  const [jokerModal, setJokerModal] = useState(false);
  const [chameleonModal, setChameleonModal] = useState(false);
  const [chameleonSelectedAction, setChameleonSelectedAction] = useState(null);
  const [chameleonValue, setChameleonValue] = useState(null);
  const [cardDetailModal, setCardDetailModal] = useState(false);
  const [inspectCard, setInspectCard] = useState(null);
  const [swapModal, setSwapModal] = useState(false);
  const [swapMode, setSwapMode] = useState('with_me'); // 'with_me' | 'two_others'
  const [swapTarget1, setSwapTarget1] = useState(null);
  const [swapTarget2, setSwapTarget2] = useState(null);
  const [hatEntaPrompt, setHatEntaPrompt] = useState(null);
  const [selectedJokerTarget, setSelectedJokerTarget] = useState(null);
  const [jokerShowdownAnim, setJokerShowdownAnim] = useState(null);

  // Visual Juice & Motion States (Phase 1)
  const [screenShake, setScreenShake] = useState(false);
  const [catchStamp, setCatchStamp] = useState(null);
  const [setExplosion, setSetExplosion] = useState(null);
  const [flyingCards, setFlyingCards] = useState([]);
  const [askShowdown, setAskShowdown] = useState(null);

  // Audio & Banter States (Phase 3)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [showBanterDrawer, setShowBanterDrawer] = useState(false);

  // Navigation Tab State (home, shop, custom, leagues, friends)
  const [activeTab, setActiveTab] = useState('home');
  const [shopSubtab, setShopSubtab] = useState('stickers');
  const [customSubtab, setCustomSubtab] = useState('avatars');

  // Language State (Default: Arabic, with English support)
  const [lang, setLang] = useState(() => localStorage.getItem('catch_lang') || 'ar');
  const t = (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS['ar']?.[key] || key;

  // Realtime Connection State
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connected' | 'disconnected' | 'connecting'

  // Economy States (Coins & Gems with clean starting defaults: 500 Coins, 10 Gems)
  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem('catch_coins');
    if (saved !== null) {
      const val = parseInt(saved, 10);
      if (val === 1863) return 500; // Reset old mock value
      return isNaN(val) ? 500 : val;
    }
    return 500;
  });
  const [gems, setGems] = useState(() => {
    const saved = localStorage.getItem('catch_gems');
    if (saved !== null) {
      const val = parseInt(saved, 10);
      if (val === 4615) return 10; // Reset old mock value
      return isNaN(val) ? 10 : val;
    }
    return 10;
  });

  const [selectedCardBack, setSelectedCardBack] = useState(() => localStorage.getItem('catch_card_back') || 'classic');
  const [unlockedAvatars, setUnlockedAvatars] = useState(() => {
    try {
      const saved = localStorage.getItem('catch_unlocked_avatars');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return ['saeedi', 'batman', 'muallem'];
  });
  const [unlockedCardBacks, setUnlockedCardBacks] = useState(() => {
    try {
      const saved = localStorage.getItem('catch_unlocked_backs');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return ['classic'];
  });

  // Daily Quests State (tracks calendar day to prevent repeat claim exploit)
  const [quests, setQuests] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastClaimDate = localStorage.getItem('catch_last_daily_claim');
    try {
      const saved = localStorage.getItem('catch_quests');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map(q => {
          if (q.id === 'q3') {
            return { ...q, claimed: lastClaimDate === today, progress: 1 };
          }
          // Reset legacy mock progress
          if ((q.id === 'q1' || q.id === 'q2') && q.progress > 0 && !localStorage.getItem('catch_stats')) {
            return { ...q, progress: 0, claimed: false };
          }
          return q;
        });
      }
    } catch(e) {}
    return INITIAL_QUESTS;
  });

  // Mode Selection Dialog / Modal State
  const [showPlayModal, setShowPlayModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPrivateRoomModal, setShowPrivateRoomModal] = useState(false);
  const autoStartBotsRef = useRef(false);

  const addCoins = (amount) => {
    setCoins(prev => {
      const next = prev + amount;
      localStorage.setItem('catch_coins', next);
      return next;
    });
  };
  const addGems = (amount) => {
    setGems(prev => {
      const next = prev + amount;
      localStorage.setItem('catch_gems', next);
      return next;
    });
  };

  const handleClaimQuest = (questId) => {
    const today = new Date().toISOString().slice(0, 10);
    setQuests(prev => {
      const next = prev.map(q => {
        if (q.id === questId && !q.claimed && q.progress >= q.target) {
          if (q.rewardType === 'gems') addGems(q.rewardAmount);
          else addCoins(q.rewardAmount);
          soundFx.init();
          soundFx.play('celebration');
          if (q.id === 'q3') {
            localStorage.setItem('catch_last_daily_claim', today);
          }
          return { ...q, claimed: true };
        }
        return q;
      });
      localStorage.setItem('catch_quests', JSON.stringify(next));
      return next;
    });
  };

  // Helper to get active server URL for sharing and connections
  const getServerBaseUrl = () => {
    const custom = localStorage.getItem('catch_server_url');
    if (custom && custom.trim()) return custom.trim().replace(/\/+$/, '');
    const isNativeCapacitor = window.Capacitor?.isNativePlatform?.() || window.location.protocol === 'capacitor:' || window.location.protocol === 'file:' || (window.location.hostname === 'localhost' && !window.location.port);
    if (isNativeCapacitor) return 'http://192.168.1.15:3000';
    return window.location.origin;
  };

  // Check connection before launching any room
  const ensureConnected = () => {
    if (connectionStatus !== 'connected' || !socketRef.current?.connected) {
      soundFx.init();
      soundFx.play('impact');
      setErrorMsg(t('notConnectedAlert'));
      setShowSettingsModal(true);
      return false;
    }
    return true;
  };

  // Direct 1-Click Bot Match via Dedicated Server Event
  const handleStartBotTraining = () => {
    soundFx.init();
    if (!ensureConnected()) return;
    soundFx.play('celebration');
    const finalName = playerName.trim() || (lang === 'en' ? 'VIP Player' : 'لاعب VIP');
    setPlayerName(finalName);
    localStorage.setItem('catch_name', finalName);
    localStorage.setItem('catch_avatar', avatar);
    socketRef.current.emit('create_bot_room', { name: finalName, avatar, userId, sessionToken });
  };

  // Native Multi-App Share sheet (WhatsApp, WA Business, Telegram, SMS, etc.)
  const handleShareInvite = async (roomCode) => {
    soundFx.init();
    soundFx.play('snap');
    const base = getServerBaseUrl();
    const shareUrl = `${base}/?room=${roomCode || ''}`;
    const title = 'CATCH VIP';
    const text = lang === 'en'
      ? `🃏 Join my CATCH table [${roomCode}]! Click the link to play:\n${shareUrl}`
      : `🃏 تعال العب معايا كاتش أونلاين على طاولة VIP رقم [${roomCode}]!\nاضغط على الرابط للانضمام مباشرة:\n${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch(err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setErrorMsg(t('linkCopied'));
        setTimeout(() => setErrorMsg(''), 2500);
      }
    } catch(e) {}
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSelectAvatar = (av) => {
    soundFx.init();
    if (!unlockedAvatars.includes(av.id)) {
      if (gems >= av.cost) {
        setGems(prev => {
          const next = prev - av.cost;
          localStorage.setItem('catch_gems', next);
          return next;
        });
        const nextAvatars = [...unlockedAvatars, av.id];
        setUnlockedAvatars(nextAvatars);
        localStorage.setItem('catch_unlocked_avatars', JSON.stringify(nextAvatars));
        setAvatar(av.emoji);
        localStorage.setItem('catch_avatar', av.emoji);
        soundFx.play('celebration');
      } else {
        setErrorMsg('جواهر غير كافية! اجمع جواهر من المهام اليومية 💎');
        setTimeout(() => setErrorMsg(''), 2500);
      }
    } else {
      setAvatar(av.emoji);
      localStorage.setItem('catch_avatar', av.emoji);
      soundFx.play('snap');
    }
  };

  const handleSelectCardBack = (cb) => {
    soundFx.init();
    if (!unlockedCardBacks.includes(cb.id)) {
      if (gems >= cb.cost) {
        setGems(prev => {
          const next = prev - cb.cost;
          localStorage.setItem('catch_gems', next);
          return next;
        });
        const nextBacks = [...unlockedCardBacks, cb.id];
        setUnlockedCardBacks(nextBacks);
        localStorage.setItem('catch_unlocked_backs', JSON.stringify(nextBacks));
        setSelectedCardBack(cb.id);
        localStorage.setItem('catch_card_back', cb.id);
        soundFx.play('celebration');
      } else {
        setErrorMsg('جواهر غير كافية! اجمع جواهر من المهام اليومية 💎');
        setTimeout(() => setErrorMsg(''), 2500);
      }
    } else {
      setSelectedCardBack(cb.id);
      localStorage.setItem('catch_card_back', cb.id);
      soundFx.play('snap');
    }
  };

  // Drag & Drop States (Phase 2)
  const [draggingCard, setDraggingCard] = useState(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dragHoverIdx, setDragHoverIdx] = useState(null);

  // Voice Chat & Voice Command State
  const [voiceChatActive, setVoiceChatActive] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [speakingPlayers, setSpeakingPlayers] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceNotice, setVoiceNotice] = useState('');
  const voiceChatRef = useRef(null);
  const recognitionRef = useRef(null);

  const showVoiceNotice = (msg) => {
    setVoiceNotice(msg);
    setTimeout(() => setVoiceNotice(prev => prev === msg ? '' : prev), 3500);
  };

  const [serverUrlInput, setServerUrlInput] = useState(() => {
    return localStorage.getItem('catch_server_url') || 'http://192.168.1.15:3000';
  });

  useEffect(() => {
    soundFx.muted = muted;
  }, [muted]);

  useEffect(() => {
    const isNativeCapacitor = window.Capacitor?.isNativePlatform?.() || window.location.protocol === 'capacitor:' || window.location.protocol === 'file:' || (window.location.hostname === 'localhost' && !window.location.port);
    const storedServer = localStorage.getItem('catch_server_url');
    const targetUrl = storedServer || (isNativeCapacitor ? 'http://192.168.1.15:3000' : undefined);
    const socket = targetUrl ? io(targetUrl, { transports: ['websocket', 'polling'] }) : io({ transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    // Realtime connection tracking
    socket.on('connect', () => {
      setConnectionStatus('connected');
      const savedRoom = localStorage.getItem('catch_last_room');
      const savedName = localStorage.getItem('catch_name') || playerName;
      if (savedRoom) {
        socket.emit('reconnect_room', {
          code: savedRoom,
          userId,
          sessionToken,
          name: savedName
        });
      }
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', (err) => {
      setConnectionStatus('disconnected');
      console.warn('Socket connect_error:', err?.message || err);
    });

    // Check URL parameter auto-join (?room=CODE)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room');
      if (roomParam && !localStorage.getItem('catch_last_room')) {
        setJoinCode(roomParam.trim().toUpperCase());
      }
    } catch(e) {}

    socket.on('reconnect_success', ({ code, name }) => {
      localStorage.setItem('catch_last_room', code);
      setLastRoomCode(code);
      showVoiceNotice(`⚡ مرحباً بعودتك يا ${name}! تم استعادة مقعدك.`);
    });

    socket.on('reconnect_failed', () => {
      localStorage.removeItem('catch_last_room');
      setLastRoomCode('');
    });

    socket.on('left_room_success', () => {
      localStorage.removeItem('catch_last_room');
      setLastRoomCode('');
      setRoomState(null);
    });

    socket.on('room_state', (state) => {
      setRoomState(state);
      if (state && state.code) {
        localStorage.setItem('catch_last_room', state.code);
        setLastRoomCode(state.code);
      }
      if (state && state.status === 'lobby' && autoStartBotsRef.current) {
        autoStartBotsRef.current = false;
        socket.emit('add_bot');
        setTimeout(() => socket.emit('add_bot'), 250);
        setTimeout(() => socket.emit('add_bot'), 500);
        setTimeout(() => socket.emit('start_game'), 800);
      }
    });

    socket.on('timer_tick', ({ remaining, total }) => {
      setTurnTimer(remaining);
      if (total) setTurnTimerTotal(total);
      if (remaining <= 10 && remaining > 0) {
        soundFx.play('tick');
      }
    });

    socket.on('action_announcement', (ann) => {
      soundFx.init();
      soundFx.play(ann.sound === 'catch' ? 'catch' : 'impact');
      setActionNotice(ann);
      setTimeout(() => {
        setActionNotice(prev => prev === ann ? null : prev);
      }, Math.max(5000, ann.duration || 5000));
    });

    // Flying Card Transfer Animation (Phase 1)
    socket.on('card_transfer_anim', (data) => {
      soundFx.init();
      soundFx.play('card_slide');
      const id = 'fc_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      const isFromMe = data.fromPlayerId === socket.id;
      const isToMe = data.toPlayerId === socket.id;
      const fx = isFromMe ? 0 : (Math.random() * 160 - 80);
      const fy = isFromMe ? 220 : -160;
      const tx = isToMe ? 0 : (Math.random() * 160 - 80);
      const ty = isToMe ? 220 : -160;
      setFlyingCards(prev => [...prev, { id, card: data.card, fx, fy, tx, ty }]);
      setTimeout(() => {
        setFlyingCards(prev => prev.filter(c => c.id !== id));
      }, 950);
    });

    // Set Completion Burst Animation (Phase 1)
    socket.on('set_completed_anim', (data) => {
      soundFx.init();
      soundFx.play('celebration');
      setSetExplosion(data);
      setTimeout(() => setSetExplosion(null), 3600);
    });

    // Dramatic Ask Duel & Card Showdown (Phase 4 — طلب الكارت المباشر)
    socket.on('ask_showdown_anim', (data) => {
      soundFx.init();
      soundFx.play('card_slide');
      setAskShowdown({ ...data, stage: 'suspense' });

      // Stage 2: Verdict Stamp (✔️ or ❌)
      setTimeout(() => {
        setAskShowdown(prev => prev ? { ...prev, stage: 'verdict' } : null);
        if (data.success) {
          soundFx.play('celebration');
        } else {
          soundFx.play('catch_slam');
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 500);
        }
      }, 750);

      // Stage 3: Card Flight (if success) towards Asker
      if (data.success) {
        setTimeout(() => {
          setAskShowdown(prev => prev ? { ...prev, stage: 'flying' } : null);
          soundFx.play('card_slide');
        }, 1900);

        setTimeout(() => {
          setAskShowdown(null);
        }, 2750);
      } else {
        // If CATCH, stay prominently visible for 2.8s so all players can read and memorize
        setTimeout(() => {
          setAskShowdown(null);
        }, 2800);
      }
    });

    // Dramatic CATCH Stamp Animation (Phase 1)
    socket.on('catch_stamp_anim', (data) => {
      // Kept for backward compatibility when askShowdown is not used
    });

    socket.on('liar_decision_prompt', (data) => {
      soundFx.init();
      soundFx.play('impact');
      setLiarPrompt(data);
    });

    socket.on('hat_enta_counter_prompt', (data) => {
      soundFx.init();
      soundFx.play('impact');
      setHatEntaPrompt(data);
      setTimeout(() => setHatEntaPrompt(null), 4500);
    });

    socket.on('hand_swap_animation', (data) => {
      soundFx.init();
      soundFx.play('impact');
      setSwapAnim(data);
      setTimeout(() => setSwapAnim(null), 2600);
    });

    socket.on('joker_showdown_result', (data) => {
      soundFx.init();
      soundFx.play(data.success ? 'celebration' : 'impact');
      setJokerShowdownAnim(data);
      setTimeout(() => setJokerShowdownAnim(null), 4500);
    });

    socket.on('error_message', (msg) => {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 3200);
    });

    socket.on('meme_sticker_broadcast', ({ playerId, stickerUrl, stickerText }) => {
      setSpeechBubbles(prev => ({ ...prev, [playerId]: { text: stickerText, emoji: stickerUrl } }));
      setTimeout(() => {
        setSpeechBubbles(prev => { const n = {...prev}; delete n[playerId]; return n; });
      }, 3000);
    });

    socket.on('webrtc_signal', ({ senderId, signalData }) => {
      if (voiceChatRef.current) {
        voiceChatRef.current.handleSignal(senderId, signalData);
      }
    });

    socket.on('webrtc_voice_state', ({ playerId, isSpeaking }) => {
      setSpeakingPlayers(prev => ({ ...prev, [playerId]: isSpeaking }));
    });

    return () => {
      if (voiceChatRef.current) voiceChatRef.current.stop();
      if (recognitionRef.current) recognitionRef.current.stop();
      socket.disconnect();
    };
  }, []);

  // Lifetime player stats tracker on round end
  useEffect(() => {
    if (roomState && roomState.status === 'gameover' && roomState.winner) {
      const gameKey = `${roomState.code}_${roomState.winner}`;
      if (recordedGameRef.current !== gameKey) {
        recordedGameRef.current = gameKey;
        const myPlayer = roomState.players.find(p => p.id === socketRef.current?.id);
        const isWinner = myPlayer && roomState.winner.includes(myPlayer.name);
        const setsCount = myPlayer?.sets?.length || 0;

        setStats(prev => {
          const updated = {
            games: (prev.games || 0) + 1,
            wins: (prev.wins || 0) + (isWinner ? 1 : 0),
            sets: (prev.sets || 0) + setsCount
          };
          localStorage.setItem('catch_stats', JSON.stringify(updated));
          return updated;
        });
      }
    }
  }, [roomState?.status, roomState?.winner]);

  const me = roomState?.players?.find(p => p.id === socketRef.current?.id);
  const isMyTurn = roomState?.status === 'playing' && roomState?.players[roomState.currentIdx]?.id === socketRef.current?.id;
  const isHost = me?.isHost;

  // Sorted Hand: Numbers (0-10, CA 11, TCH 12) -> Action cards
  const sortedHand = useMemo(() => {
    if (!me?.hand) return [];
    const numbers = me.hand.filter(c => c.type === 'number').sort((a, b) => a.value - b.value);
    const actions = me.hand.filter(c => c.type !== 'number');
    return [...numbers, ...actions];
  }, [me?.hand]);

  // Unique numbers in hand for Magnet / easy selection
  const handNumberCards = useMemo(() => {
    if (!me?.hand) return [];
    const counts = {};
    const sampleCards = {};
    for (const c of me.hand) {
      if (c.type === 'number') {
        counts[c.value] = (counts[c.value] || 0) + 1;
        sampleCards[c.value] = c;
      }
    }
    return Object.keys(counts).map(v => Number(v)).sort((a, b) => a - b).map(value => ({
      value,
      count: counts[value],
      sampleCard: sampleCards[value]
    }));
  }, [me?.hand]);

  const executeMagnet = (pickedValue) => {
    soundFx.init();
    soundFx.play('impact');
    const magnetCard = selectedCard?.type === 'magnatees' ? selectedCard : me?.hand?.find(c => c.type === 'magnatees');
    if (!magnetCard) return;
    socketRef.current.emit('play_action_card', { cardId: magnetCard.id, value: pickedValue });
    setMagnetModal(false);
    setSelectedCard(null);
    setCustomValue(null);
  };

  const executeSpecial = (pickedValue) => {
    soundFx.init();
    soundFx.play('snap');
    setCustomValue(pickedValue);
    setSpecialModal(false);
  };

  // Available 3-card sets for Joker selection
  const handThreeSets = useMemo(() => {
    if (!me?.hand) return [];
    const counts = {};
    const sampleCards = {};
    for (const c of me.hand) {
      if (c.type === 'number') {
        counts[c.value] = (counts[c.value] || 0) + 1;
        sampleCards[c.value] = c;
      }
    }
    return Object.keys(counts)
      .map(v => Number(v))
      .filter(v => counts[v] >= 3)
      .sort((a, b) => a - b)
      .map(value => ({
        value,
        count: counts[value],
        sampleCard: sampleCards[value]
      }));
  }, [me?.hand]);

  const executeJoker = (pickedValue) => {
    soundFx.init();
    soundFx.play('impact');
    const jokerCard = selectedCard?.type === 'joker' ? selectedCard : me?.hand?.find(c => c.type === 'joker');
    if (!jokerCard) return;
    socketRef.current.emit('use_joker', { cardId: jokerCard.id, value: pickedValue });
    setJokerModal(false);
    setSelectedCard(null);
    setCustomValue(null);
  };

  // Available action cards on the table floor / discard pile for Chameleon (الحرباية)
  const availableFloorActions = useMemo(() => {
    if (!roomState?.discardPile) return [];
    const map = {};
    for (const c of roomState.discardPile) {
      if (c && c.type && c.type !== 'number' && c.type !== 'herbaiya') {
        map[c.type] = (map[c.type] || 0) + 1;
      }
    }
    return Object.entries(map).map(([type, count]) => ({
      type,
      count,
      meta: ACTION_INFO[type] || { name: type, desc: '' }
    }));
  }, [roomState?.discardPile]);

  const executeChameleon = (copiedType, targetIdx = undefined, value = undefined) => {
    soundFx.init();
    soundFx.play('impact');
    const chamCard = selectedCard?.type === 'herbaiya' ? selectedCard : me?.hand?.find(c => c.type === 'herbaiya');
    if (!chamCard) return;
    socketRef.current.emit('play_action_card', {
      cardId: chamCard.id,
      copiedAction: copiedType,
      targetIdx,
      value
    });
    setChameleonModal(false);
    setChameleonSelectedAction(null);
    setChameleonValue(null);
    setSelectedCard(null);
    setCustomValue(null);
  };

  // Sync WebRTC peers when players join or change
  useEffect(() => {
    if (voiceChatRef.current && voiceChatActive && roomState?.players) {
      voiceChatRef.current.syncPeers(roomState.players, socketRef.current?.id);
    }
  }, [roomState?.players, voiceChatActive]);

  const handleToggleVoiceChat = async () => {
    soundFx.init();
    if (!voiceChatActive) {
      if (!voiceChatRef.current) {
        voiceChatRef.current = new VoiceChatManager(
          socketRef.current,
          (pId, isSpeaking) => setSpeakingPlayers(prev => ({ ...prev, [pId]: isSpeaking })),
          (err) => setErrorMsg(err)
        );
      }
      const ok = await voiceChatRef.current.start();
      if (ok) {
        setVoiceChatActive(true);
        setVoiceMuted(false);
        if (roomState?.players) {
          voiceChatRef.current.syncPeers(roomState.players, socketRef.current?.id);
        }
        showVoiceNotice('🎙️ تم تشغيل الشات الصوتي المباشر على الطاولة!');
      }
    } else {
      const nextMute = !voiceMuted;
      setVoiceMuted(nextMute);
      voiceChatRef.current.setMute(nextMute);
      showVoiceNotice(nextMute ? '🔇 تم كتم المايك' : '🎙️ المايك شغال الآن');
    }
  };

  const executeVoiceCommand = (cmd) => {
    soundFx.init();
    if (!cmd || cmd.action === 'unknown') {
      showVoiceNotice(`لم أفهم الأمر: "${cmd?.text || ''}"`);
      return;
    }

    if (cmd.action === 'draw_card') {
      socketRef.current.emit('draw_card');
      showVoiceNotice('📥 تم سحب كارت من الأرض!');
      return;
    }

    if (cmd.action === 'magnatees') {
      const magCard = me?.hand?.find(c => c.type === 'magnatees');
      if (!magCard) {
        setErrorMsg('⚠️ ليس معك كارت مغناطيس!');
        return;
      }
      if (cmd.value !== null && cmd.value !== undefined) {
        socketRef.current.emit('play_action_card', { cardId: magCard.id, value: cmd.value });
        showVoiceNotice(`🧲 سحب رقم [ ${cmd.value === 11 ? 'كا' : cmd.value === 12 ? 'تش' : cmd.value} ] بالمغناطيس!`);
      } else {
        setSelectedCard(magCard);
        setMagnetModal(true);
      }
      return;
    }

    if (cmd.action === 'el3ab_tani') {
      const card = me?.hand?.find(c => c.type === 'el3ab_tani');
      if (card) {
        socketRef.current.emit('play_action_card', { cardId: card.id });
        showVoiceNotice('🔄 تم لعب كارت العب تاني!');
      } else {
        setErrorMsg('⚠️ ليس معك كارت العب تاني!');
      }
      return;
    }

    if (cmd.action === 'mana3a') {
      const card = me?.hand?.find(c => c.type === 'mana3a');
      if (card) {
        socketRef.current.emit('play_action_card', { cardId: card.id });
        showVoiceNotice('🛡️ تم تفعيل درع المناعة!');
      } else {
        setErrorMsg('⚠️ ليس معك كارت مناعة!');
      }
      return;
    }

    if (cmd.action === 'lef_w_erga3') {
      const card = me?.hand?.find(c => c.type === 'lef_w_erga3');
      if (card) {
        socketRef.current.emit('play_action_card', { cardId: card.id });
        showVoiceNotice('🔙 تم عكس اتجاه اللعب!');
      } else {
        setErrorMsg('⚠️ ليس معك كارت لف وارجع!');
      }
      return;
    }

    if (cmd.action === 'ask_number') {
      if (cmd.targetIdx === -1) {
        const card = me?.hand?.find(c => c.type === 'number' && c.value === cmd.value);
        if (card) {
          setSelectedCard(card);
          showVoiceNotice(`🎯 اخترت رقم [ ${cmd.value === 11 ? 'كا' : cmd.value === 12 ? 'تش' : cmd.value} ].. اضغط على اللاعب لطلبه منه!`);
        } else {
          setErrorMsg(`⚠️ ليس معك كارت رقم [ ${cmd.value === 11 ? 'كا' : cmd.value === 12 ? 'تش' : cmd.value} ]!`);
        }
      } else {
        const card = me?.hand?.find(c => c.type === 'number' && c.value === cmd.value);
        if (card) {
          socketRef.current.emit('ask_number', { targetIdx: cmd.targetIdx, value: cmd.value });
          showVoiceNotice(`🎯 طلبت رقم [ ${cmd.value === 11 ? 'كا' : cmd.value === 12 ? 'تش' : cmd.value} ] من ${roomState.players[cmd.targetIdx].name}!`);
        } else {
          const specialCard = me?.hand?.find(c => c.type === 'special');
          if (specialCard) {
            socketRef.current.emit('play_action_card', { cardId: specialCard.id, targetIdx: cmd.targetIdx, value: cmd.value });
            showVoiceNotice(`💎 طلبت رقم [ ${cmd.value === 11 ? 'كا' : cmd.value === 12 ? 'تش' : cmd.value} ] بسبيشيال من ${roomState.players[cmd.targetIdx].name}!`);
          } else {
            setErrorMsg(`⚠️ ليس معك كارت رقم [ ${cmd.value === 11 ? 'كا' : cmd.value === 12 ? 'تش' : cmd.value} ]!`);
          }
        }
      }
      return;
    }

    if (cmd.action === 'sayad' && cmd.targetIdx !== -1) {
      const card = me?.hand?.find(c => c.type === 'sayad');
      if (card) {
        socketRef.current.emit('play_action_card', { cardId: card.id, targetIdx: cmd.targetIdx });
        showVoiceNotice(`🎯 لعبت صياد على ${roomState.players[cmd.targetIdx].name}!`);
      } else {
        setErrorMsg('⚠️ ليس معك كارت صياد!');
      }
      return;
    }

    if (cmd.action === 'badl_edain' && cmd.targetIdx !== -1) {
      const card = me?.hand?.find(c => c.type === 'badl_edain');
      if (card) {
        socketRef.current.emit('play_action_card', { cardId: card.id, targetIdx: cmd.targetIdx });
        showVoiceNotice(`🤝 لعبت بدل إيدي مع ${roomState.players[cmd.targetIdx].name}!`);
      } else {
        setErrorMsg('⚠️ ليس معك كارت بدل إيدي!');
      }
      return;
    }

    if (cmd.action === 'joker') {
      const card = me?.hand?.find(c => c.type === 'joker');
      if (!card) {
        setErrorMsg('⚠️ ليس معك كارت جوكر في إيدك!');
        return;
      }
      if (cmd.value !== null && cmd.value !== undefined) {
        executeJoker(cmd.value);
        showVoiceNotice(`🃏 استخدمت الجوكر لقفل لِمّة رقم [ ${cmd.value === 11 ? 'كا' : cmd.value === 12 ? 'تش' : cmd.value} ]!`);
      } else {
        setSelectedCard(card);
        setJokerModal(true);
      }
      return;
    }

    if (cmd.action === 'msh_shaifak') {
      const card = me?.hand?.find(c => c.type === 'msh_shaifak');
      if (card) {
        if (cmd.targetIdx !== -1) {
          socketRef.current.emit('play_action_card', { cardId: card.id, targetIdx: cmd.targetIdx });
          showVoiceNotice(`🙈 لعبت مش شايفك على ${roomState.players[cmd.targetIdx].name}!`);
        } else {
          setSelectedCard(card);
          showVoiceNotice('🙈 اخترت مش شايفك.. اضغط على اللاعب لتجميد دوره!');
        }
      } else {
        setErrorMsg('⚠️ ليس معك كارت مش شايفك!');
      }
      return;
    }

    if (cmd.action === 'kefaya_3leik') {
      const card = me?.hand?.find(c => c.type === 'kefaya_3leik');
      if (card) {
        if (cmd.targetIdx !== -1) {
          socketRef.current.emit('play_action_card', { cardId: card.id, targetIdx: cmd.targetIdx });
          showVoiceNotice(`🖐️ لعبت كفاية عليك على ${roomState.players[cmd.targetIdx].name}!`);
        } else {
          setSelectedCard(card);
          showVoiceNotice('🖐️ اخترت كفاية عليك.. اضغط على اللاعب لتقييد دوره!');
        }
      } else {
        setErrorMsg('⚠️ ليس معك كارت كفاية عليك!');
      }
      return;
    }

    if (cmd.action === 'hat_enta') {
      const card = me?.hand?.find(c => c.type === 'hat_enta');
      if (card) {
        if (cmd.targetIdx !== -1) {
          socketRef.current.emit('play_action_card', { cardId: card.id, targetIdx: cmd.targetIdx, value: cmd.value });
          showVoiceNotice(`✋ لعبت هات انت على ${roomState.players[cmd.targetIdx].name}!`);
        } else {
          setSelectedCard(card);
          showVoiceNotice('✋ اخترت هات انت.. اضغط على اللاعب لعكس الطلب أو أخذ كارت!');
        }
      } else {
        setErrorMsg('⚠️ ليس معك كارت هات انت!');
      }
      return;
    }

    showVoiceNotice(cmd.label || 'تم استلام الأمر الصوتي');
  };

  const handleStartVoiceCommand = () => {
    soundFx.init();
    soundFx.play('snap');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg('متصفحك لا يدعم التعرف على الصوت. استخدم متصفح Chrome أو Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      recognitionRef.current = rec;
      rec.lang = 'ar-EG';
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      setIsListening(true);
      setVoiceTranscript('جاري الاستماع... اتكلم دلوقتي');

      rec.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const text = final || interim;
        setVoiceTranscript(text);

        if (final) {
          const cmd = parseVoiceCommand(final, roomState, socketRef.current?.id);
          executeVoiceCommand(cmd);
          setTimeout(() => setIsListening(false), 800);
        }
      };

      rec.onerror = (e) => {
        console.warn('Speech error:', e);
        setIsListening(false);
        if (e.error === 'not-allowed') {
          setErrorMsg('يرجى السماح بصلاحية الميكروفون للأوامر الصوتية.');
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.start();
    } catch(e) {
      console.warn('Speech start err:', e);
      setIsListening(false);
      setErrorMsg('تعذر بدء الاستماع للأمر الصوتي.');
    }
  };

  const handleCreateRoom = () => {
    soundFx.init();
    if (!ensureConnected()) return;
    soundFx.play('celebration');
    const finalName = playerName.trim() || (lang === 'en' ? 'VIP Player' : 'لاعب VIP');
    setPlayerName(finalName);
    localStorage.setItem('catch_name', finalName);
    localStorage.setItem('catch_avatar', avatar);
    socketRef.current.emit('create_room', { name: finalName, avatar, userId, sessionToken });
  };

  const handleJoinRoom = () => {
    soundFx.init();
    if (!ensureConnected()) return;
    if (joinCode.length !== 4) {
      setErrorMsg(lang === 'en' ? 'Room code must be 4 characters!' : 'كود الغرفة يتكون من 4 أحرف!');
      setTimeout(() => setErrorMsg(''), 2500);
      return;
    }
    soundFx.play('celebration');
    const finalName = playerName.trim() || (lang === 'en' ? 'VIP Player' : 'لاعب VIP');
    setPlayerName(finalName);
    localStorage.setItem('catch_name', finalName);
    localStorage.setItem('catch_avatar', avatar);
    socketRef.current.emit('join_room', { code: joinCode, name: finalName, avatar, userId, sessionToken });
  };

  const handleLeaveRoom = () => {
    localStorage.removeItem('catch_last_room');
    setLastRoomCode('');
    if (socketRef.current) socketRef.current.emit('leave_room');
    setRoomState(null);
  };

  const handleCardClick = (card) => {
    soundFx.init();
    soundFx.play('snap');
    if (card.type === 'magnatees') {
      setSelectedCard(card);
      setMagnetModal(true);
      return;
    }
    if (card.type === 'special') {
      setSelectedCard(card);
      setSpecialModal(true);
      return;
    }
    if (card.type === 'joker') {
      setSelectedCard(card);
      setJokerModal(true);
      return;
    }
    if (card.type === 'badl_edain') {
      setSelectedCard(card);
      setSwapModal(true);
      return;
    }
    if (card.type === 'herbaiya') {
      setSelectedCard(card);
      setChameleonSelectedAction(null);
      setChameleonValue(null);
      setChameleonModal(true);
      return;
    }
    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
      setCustomValue(null);
    } else {
      setSelectedCard(card);
      setCustomValue(null);
    }
  };

  // Direct Tap-to-Target on Opponent
  const handleOpponentSeatClick = (targetIdx) => {
    if (!selectedCard) return;
    const isAnyTime = ANY_TIME_CARDS.includes(selectedCard.type);
    if (!isMyTurn && !isAnyTime) return;

    const target = roomState.players[targetIdx];
    if (!target || target.id === socketRef.current.id) return;
    if (target.immune && selectedCard.type !== 'magnatees') {
      setErrorMsg(`${target.name} محمي بالدرع!`);
      setTimeout(() => setErrorMsg(''), 2000);
      return;
    }

    if (selectedCard.type === 'number') {
      const matchingCount = me?.hand?.filter(c => c.type === 'number' && c.value === selectedCard.value).length || 0;
      if (matchingCount >= 4) {
        setErrorMsg('⭐ معاك 4 كروت كاملة! اضغط على زرار تنزيل اللِمّة!');
        setTimeout(() => setErrorMsg(''), 2500);
        return;
      }
      if (!isMyTurn) return;
      // Normal Ask
      socketRef.current.emit('ask_number', { targetIdx, value: selectedCard.value });
      setSelectedCard(null);
      setCustomValue(null);
    } else if (selectedCard.type === 'special') {
      if (!isMyTurn) return;
      if (customValue === null) {
        setErrorMsg('اختار الرقم أولاً من القائمة فوق الكارت!');
        setTimeout(() => setErrorMsg(''), 2500);
        return;
      }
      socketRef.current.emit('play_action_card', { cardId: selectedCard.id, targetIdx, value: customValue });
      setSelectedCard(null);
      setCustomValue(null);
    } else if (['sayad', 'bos_bosa', 'badl_edain', 'msh_shaifak', 'kefaya_3leik', 'hat_enta'].includes(selectedCard.type)) {
      if (!isMyTurn && !ANY_TIME_CARDS.includes(selectedCard.type)) return;
      if (selectedCard.type === 'badl_edain') {
        setSwapTarget1(targetIdx);
        setSwapModal(true);
        return;
      }
      socketRef.current.emit('play_action_card', { cardId: selectedCard.id, targetIdx, value: customValue !== null ? customValue : undefined });
      setSelectedCard(null);
      setCustomValue(null);
    }
  };

  const handlePlaySelfAction = (card) => {
    if (!card) return;
    const isAnyTime = ANY_TIME_CARDS.includes(card.type);
    if (!isMyTurn && !isAnyTime) return;
    if (card.type === 'magnatees') {
      if (!isMyTurn) return;
      setMagnetModal(true);
      return;
    }
    socketRef.current.emit('play_action_card', { cardId: card.id });
    setSelectedCard(null);
    setCustomValue(null);
  };

  // --- HOME SCREEN & 5-TAB HUB (Plan Images 2, 4, 5, 6) ---
  if (!roomState) {
    return (
      <div className="w-full h-[100dvh] max-w-[480px] mx-auto flex flex-col justify-between relative overflow-hidden home-screen-bg text-white font-cairo select-none shadow-2xl">
        
        {/* TOP RESOURCE HEADER — NEON STYLE */}
        <header className="w-full shrink-0 px-3 pt-3 pb-2 flex items-center justify-between z-30 border-b"
                style={{ paddingTop: 'max(10px, env(safe-area-inset-top))', borderColor:'rgba(0,212,255,0.15)', background:'rgba(5,8,16,0.9)', backdropFilter:'blur(12px)' }}>
          
          {/* Left: Gems & Coins (Click opens Shop) */}
          <div className="flex items-center gap-2">
            <div onClick={() => { setActiveTab('shop'); setShopSubtab('currency'); }}
                 className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-black cursor-pointer transition hover:scale-105 active:scale-95"
                 title="المتجر وبنك الجواهر"
                 style={{borderColor:'rgba(0,212,255,0.4)', background:'rgba(0,212,255,0.07)', color:'var(--neon-blue)', textShadow:'0 0 8px var(--neon-blue)'}}>
              <span>💎</span>
              <span>{gems}</span>
              <span className="text-[10px] opacity-70 font-bold">+</span>
            </div>
            <div onClick={() => { setActiveTab('shop'); setShopSubtab('currency'); }}
                 className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-black cursor-pointer transition hover:scale-105 active:scale-95"
                 title="المتجر وبنك العملات"
                 style={{borderColor:'rgba(255,215,0,0.4)', background:'rgba(255,215,0,0.07)', color:'var(--neon-gold)', textShadow:'0 0 8px var(--neon-gold)'}}>
              <span>⭐</span>
              <span>{coins}</span>
              <span className="text-[10px] opacity-70 font-bold">+</span>
            </div>
          </div>

          {/* Right: Connection Status & Avatar Pill & Settings */}
          <div className="flex items-center gap-1.5">
            <div onClick={() => setShowSettingsModal(true)}
                 className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-[10px] font-bold cursor-pointer transition ${
                   connectionStatus === 'connected' 
                     ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300' 
                     : connectionStatus === 'connecting'
                       ? 'border-yellow-400/40 bg-yellow-500/10 text-yellow-300 animate-pulse'
                       : 'border-red-500/50 bg-red-500/15 text-red-300 animate-pulse'
                 }`}
                 title={connectionStatus === 'connected' ? 'السيرفر متصل جاهز للعب' : 'انقر لضبط عنوان السيرفر'}>
              <span className="w-1.5 h-1.5 rounded-full inline-block"
                    style={{ backgroundColor: connectionStatus === 'connected' ? '#10b981' : connectionStatus === 'connecting' ? '#eab308' : '#ef4444' }}></span>
              <span>{connectionStatus === 'connected' ? (lang === 'en' ? 'Online' : 'متصل') : connectionStatus === 'connecting' ? (lang === 'en' ? 'Connecting' : 'اتصال...') : (lang === 'en' ? 'Offline ⚙️' : 'غير متصل ⚙️')}</span>
            </div>

            <div onClick={() => setIsEditingProfile(true)}
                 className="flex items-center gap-1.5 px-2 py-1 rounded-xl border cursor-pointer transition"
                 style={{borderColor:'rgba(180,77,255,0.4)', background:'rgba(180,77,255,0.08)'}}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                   style={{border:'2px solid var(--neon-purple)', boxShadow:'0 0 8px rgba(180,77,255,0.5)'}}>
                {avatar}
              </div>
              <span className="text-[11px] font-black max-w-[55px] truncate" style={{color:'var(--neon-purple)'}}>
                {playerName || (lang === 'en' ? 'Player' : 'لاعب')}
              </span>
            </div>
            <button onClick={() => setShowSettingsModal(true)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition border"
                    style={{borderColor:'rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.6)'}}>
              ⚙️
            </button>
          </div>
        </header>

        {/* MAIN BODY PER TAB */}
        <main className="flex-1 w-full overflow-y-auto px-3.5 py-2 flex flex-col justify-between">
          
          {/* TAB 1: HOME (الرئيسية) */}
          {activeTab === 'home' && (
            <div className="flex-1 flex flex-col justify-between py-1">
              
              {/* Daily Quests Floating Card (Plan Image 2) */}
              <div className="w-full bg-black/40 backdrop-blur-sm border border-amber-400/30 rounded-2xl p-2.5 shadow-lg space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black text-amber-300 px-1">
                  <span className="flex items-center gap-1">📜 <span>{t('dailyQuests')}</span></span>
                  <span className="text-[10px] text-amber-200/70 font-normal">{t('resetsDaily')}</span>
                </div>
                <div className="space-y-1.5 max-h-24 overflow-y-auto">
                  {quests.map(q => (
                    <div key={q.id} className="flex items-center justify-between bg-black/50 border border-white/10 rounded-xl px-2.5 py-1 text-xs">
                      <div className="text-right flex-1 min-w-0 pr-1">
                        <p className="font-bold text-white text-[11px] truncate">{lang === 'en' && q.textEn ? q.textEn : q.text}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }}></div>
                          </div>
                          <span className="text-[9px] text-amber-200/80 font-bold">{q.progress}/{q.target}</span>
                        </div>
                      </div>
                      <button onClick={() => handleClaimQuest(q.id)} disabled={q.claimed || q.progress < q.target}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition shrink-0 ${
                          q.claimed 
                            ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-default'
                            : q.progress >= q.target 
                              ? 'btn-emerald text-white animate-pulse'
                              : 'bg-amber-600/30 text-amber-200 border-amber-500/30 opacity-60 cursor-not-allowed'
                        }`}>
                        {q.claimed ? t('claimed') : `${t('claim')} +${q.rewardAmount} ${q.rewardType === 'gems' ? '💎' : '⭐'}`}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ongoing Game Recovery Card */}
              {lastRoomCode && (
                <div className="w-full bg-gradient-to-r from-red-950/90 via-[#451c04]/90 to-red-950/90 border-2 border-yellow-400 rounded-2xl p-2.5 shadow-xl text-center flex items-center justify-between my-1 animate-pulse">
                  <div className="text-right">
                    <span className="text-xs font-black text-yellow-300 block">⚡ {lang === 'en' ? `Saved Active Round! [${lastRoomCode}]` : `جولة جارية محفوظة! [${lastRoomCode}]`}</span>
                    <span className="text-[10px] text-amber-200">{lang === 'en' ? 'Your seat is waiting for you' : 'مقعدك ودورك في انتظارك'}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => {
                      soundFx.init();
                      if (!ensureConnected()) return;
                      socketRef.current.emit('reconnect_room', { code: lastRoomCode, userId, sessionToken, name: playerName || 'لاعب VIP' });
                    }} className="btn-gold px-3 py-1.5 rounded-xl text-xs font-black shadow">
                      {lang === 'en' ? 'Resume 🚀' : 'استكمال 🚀'}
                    </button>
                    <button onClick={() => {
                      localStorage.removeItem('catch_last_room');
                      setLastRoomCode('');
                    }} className="bg-red-900/60 hover:bg-red-800 text-red-200 px-2 py-1.5 rounded-xl text-xs font-bold">
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* NEON BRANDING LOGO */}
              <div className="text-center my-auto py-2 flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="catch-3d-logo text-[72px] sm:text-[88px] leading-none select-none" style={{letterSpacing: '6px'}}>
                    CATCH
                  </div>
                  <div className="text-[11px] font-black tracking-[4px] text-center mt-1"
                       style={{color:'var(--neon-blue)', textShadow:'0 0 10px var(--neon-blue)'}}>
                    ● {lang === 'en' ? 'THE CARD GAME' : 'لعبة الكروت'} ●
                  </div>
                </div>

                {/* Animated neon line separator */}
                <div className="w-40 h-px mb-5" style={{background:'linear-gradient(90deg, transparent, var(--neon-blue), transparent)'}}/>
              </div>

              {/* Main CTA Buttons — neon style */}
              <div className="w-full space-y-3 pb-2">
                <button onClick={() => setShowPlayModal(true)}
                  className="btn-neon-green w-full py-4 rounded-2xl text-xl font-black flex items-center justify-center gap-3 transition active:scale-95">
                  <span className="text-2xl">▶</span>
                  <span>{t('playNow')}</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setShowPrivateRoomModal(true)}
                    className="btn-neon-purple py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-1.5 transition active:scale-95">
                    <span>🔒</span><span>{t('privateTable')}</span>
                  </button>
                  <button onClick={handleStartBotTraining}
                    className="btn-neon-blue py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-1.5 transition active:scale-95">
                    <span>🤖</span><span>{t('training')}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SHOP (المتجر - Plan Image 6) */}
          {activeTab === 'shop' && (
            <div className="flex-1 flex flex-col bg-black/60 rounded-3xl p-3 border border-amber-400/30 overflow-hidden">
              <h3 className="text-base font-black text-yellow-300 text-center pb-2 border-b border-amber-500/20">🛒 متجر الكازينو الملكي</h3>
              
              {/* Subtabs */}
              <div className="flex gap-1 my-2 bg-black/40 p-1 rounded-2xl border border-white/10">
                {[
                  { id: 'stickers', label: 'ملصقات وميمز 💬' },
                  { id: 'skins', label: 'سكنات الكروت 🃏' },
                  { id: 'currency', label: 'بنك الجواهر 💎' }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setShopSubtab(tab.id)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-black transition ${shopSubtab === tab.id ? 'bg-amber-500 text-black shadow' : 'text-white/70 hover:text-white'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Subtab Content */}
              <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-1">
                {shopSubtab === 'stickers' && (
                  <div className="grid grid-cols-2 gap-2">
                    {MEME_REACTION_STICKERS.map(s => (
                      <div key={s.id} className="bg-black/50 border border-amber-500/20 rounded-2xl p-2.5 text-center flex flex-col items-center justify-between">
                        <span className="text-3xl mb-1">{s.emoji}</span>
                        <p className="text-xs font-black text-white">{s.label}</p>
                        <p className="text-[10px] text-amber-200/70">{s.text}</p>
                        <button onClick={() => {
                          soundFx.init();
                          soundFx.play('impact');
                          setErrorMsg(`تم تجهيز ملصق [${s.label}] في طاولتك!`);
                          setTimeout(() => setErrorMsg(''), 2000);
                        }} className="btn-gold w-full py-1 rounded-xl text-[10px] font-black mt-2">
                          جاهز للاستخدام ✓
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {shopSubtab === 'skins' && (
                  <div className="space-y-2">
                    {CARD_BACK_SKINS.map(cb => {
                      const isUnlocked = unlockedCardBacks.includes(cb.id);
                      const isSelected = selectedCardBack === cb.id;
                      return (
                        <div key={cb.id} className={`flex items-center justify-between p-2.5 rounded-2xl border transition ${isSelected ? 'bg-yellow-500/20 border-yellow-400' : 'bg-black/50 border-white/10'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-14 rounded-lg bg-gradient-to-br ${cb.bg} border-2 ${cb.border} shadow-md flex items-center justify-center text-[10px] font-black text-white/80`}>
                              VIP
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-white">{cb.name}</p>
                              <span className="text-[10px] text-amber-200/70">{cb.cost === 0 ? 'مجاني كلاسيكي' : `${cb.cost} 💎 جوهرة`}</span>
                            </div>
                          </div>
                          <button onClick={() => handleSelectCardBack(cb)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black border transition ${
                              isSelected ? 'bg-emerald-500 text-black border-emerald-300' : 
                              isUnlocked ? 'btn-gold' : 'btn-ruby text-white'
                            }`}>
                            {isSelected ? 'مفعل ✓' : isUnlocked ? 'اختيار' : `شراء ${cb.cost} 💎`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {shopSubtab === 'currency' && (
                  <div className="space-y-2">
                    {[
                      { title: lang === 'en' ? 'Beginner Coins Pouch' : 'صرة عملات المبتدئين', amount: '+1,000 ⭐', price: '$0.99' },
                      { title: lang === 'en' ? 'Golden Coin Bag' : 'كيس عملات ذهبية', amount: '+5,000 ⭐', price: '$2.99' },
                      { title: lang === 'en' ? 'Royal Casino Vault' : 'خزانة الكازينو الملكية', amount: '+25,000 ⭐', price: '$9.99' },
                      { title: lang === 'en' ? 'Royal Gem Pouch' : 'حزمة الجواهر الملكية', amount: '+100 💎', price: '$4.99' },
                      { title: lang === 'en' ? 'Pharaoh Legend Chest' : 'صندوق أساطير الفراعنة', amount: '+500 💎', price: '$19.99' },
                    ].map((pack, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-black/50 border border-amber-500/20">
                        <div className={lang === 'en' ? 'text-left' : 'text-right'}>
                          <p className="text-xs font-black text-yellow-300">{pack.title}</p>
                          <p className="text-sm font-black text-white">{pack.amount}</p>
                        </div>
                        <button onClick={() => {
                          soundFx.init();
                          soundFx.play('snap');
                          setErrorMsg(t('comingSoonAlert'));
                          setTimeout(() => setErrorMsg(''), 2500);
                        }} className="bg-white/10 hover:bg-white/20 border border-white/20 text-amber-200 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition active:scale-95">
                          <span>🔒</span>
                          <span>{pack.price} ({t('comingSoon')})</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMIZATION (التخصيص - Plan Images 4 & 5) */}
          {activeTab === 'custom' && (
            <div className="flex-1 flex flex-col bg-black/60 rounded-3xl p-3 border border-amber-400/30 overflow-hidden">
              <h3 className="text-base font-black text-yellow-300 text-center pb-2 border-b border-amber-500/20">🎨 خزانة التخصيص والمظهر</h3>
              
              {/* Subtabs */}
              <div className="flex gap-1 my-2 bg-black/40 p-1 rounded-2xl border border-white/10">
                <button onClick={() => setCustomSubtab('avatars')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black transition ${customSubtab === 'avatars' ? 'bg-amber-500 text-black shadow' : 'text-white/70 hover:text-white'}`}>
                  شخصيات كرتونية 👳‍♂️
                </button>
                <button onClick={() => setCustomSubtab('card_backs')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black transition ${customSubtab === 'card_backs' ? 'bg-amber-500 text-black shadow' : 'text-white/70 hover:text-white'}`}>
                  ظهور الكروت 🃏
                </button>
              </div>

              {/* Subtab Content */}
              <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-1">
                {customSubtab === 'avatars' && (
                  <div className="grid grid-cols-2 gap-2">
                    {CARTOON_AVATARS.map(av => {
                      const isUnlocked = unlockedAvatars.includes(av.id);
                      const isSelected = avatar === av.emoji;
                      return (
                        <div key={av.id} onClick={() => handleSelectAvatar(av)}
                          className={`cursor-pointer rounded-2xl p-2.5 border text-center flex flex-col items-center justify-between transition ${
                            isSelected ? 'bg-yellow-500/25 border-yellow-400 scale-[1.02] shadow-lg' : 'bg-black/50 border-white/10 hover:border-white/30'
                          }`}>
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-amber-500/30 to-black/60 border border-amber-400/40 flex items-center justify-center text-3xl mb-1 shadow">
                            {av.emoji}
                          </div>
                          <p className="text-xs font-black text-white leading-tight">{av.name}</p>
                          <p className="text-[10px] text-amber-200/70 truncate w-full mt-0.5">{av.desc}</p>
                          <div className="w-full mt-2">
                            {isSelected ? (
                              <span className="block text-[10px] font-black bg-emerald-500/30 border border-emerald-400 text-emerald-300 py-0.5 rounded-lg">مفعل حالياً ✓</span>
                            ) : isUnlocked ? (
                              <span className="block text-[10px] font-black bg-white/10 border border-white/20 text-white/90 py-0.5 rounded-lg hover:bg-white/20">اختيار</span>
                            ) : (
                              <span className="block text-[10px] font-black bg-cyan-900/60 border border-cyan-400 text-cyan-200 py-0.5 rounded-lg">فتح بـ {av.cost} 💎</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {customSubtab === 'card_backs' && (
                  <div className="space-y-2">
                    {CARD_BACK_SKINS.map(cb => {
                      const isUnlocked = unlockedCardBacks.includes(cb.id);
                      const isSelected = selectedCardBack === cb.id;
                      return (
                        <div key={cb.id} onClick={() => handleSelectCardBack(cb)}
                          className={`cursor-pointer flex items-center justify-between p-2.5 rounded-2xl border transition ${
                            isSelected ? 'bg-yellow-500/20 border-yellow-400 shadow-md' : 'bg-black/50 border-white/10 hover:border-white/20'
                          }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-16 rounded-xl bg-gradient-to-br ${cb.bg} border-2 ${cb.border} shadow-md flex items-center justify-center text-xs font-black text-white/90`}>
                              CATCH
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-white">{cb.name}</p>
                              <span className="text-[10px] text-amber-200/70">{cb.cost === 0 ? 'المظهر الأساسي' : `${cb.cost} 💎`}</span>
                            </div>
                          </div>
                          <div>
                            {isSelected ? (
                              <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 border border-emerald-400 px-3 py-1 rounded-xl">مفعل ✓</span>
                            ) : isUnlocked ? (
                              <span className="text-xs font-black text-amber-300 bg-black/60 border border-amber-400 px-3 py-1 rounded-xl">اختيار</span>
                            ) : (
                              <span className="text-xs font-black text-cyan-300 bg-cyan-950/60 border border-cyan-400 px-3 py-1 rounded-xl">شراء {cb.cost} 💎</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: LEAGUES & LEVELS (المستويات - Plan Image 3) */}
          {activeTab === 'leagues' && (
            <div className="flex-1 flex flex-col bg-black/60 rounded-3xl p-3 border border-amber-400/30 overflow-hidden">
              <h3 className="text-base font-black text-yellow-300 text-center pb-1">🏆 دوري المستويات الملكية</h3>
              <p className="text-[11px] text-amber-200/70 text-center pb-2 border-b border-amber-500/20">احنا هنا بنعمل إيه؟ سلم الصعود للقمة!</p>
              
              <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-1">
                {[
                  { tier: '🥉 لاعب هاوي', req: '0 فوز', prize: 'دخول 100 عملة', perk: 'طاولات المبتدئين الودية', active: vipRank.badge.includes('برونزي') },
                  { tier: '🥈 صائد فضي', req: '3 انتصارات', prize: 'فوز +500 عملة', perk: 'أولوية التحديات والريماتش', active: vipRank.badge.includes('فضي') },
                  { tier: '🥇 كابتن ذهبي', req: '6 انتصارات', prize: 'فوز +1500 عملة + 10 💎', perk: 'مضاعفة نقاط الكروت الخاصة', active: vipRank.badge.includes('ذهبي') },
                  { tier: '💎 دايموند VIP', req: '12 انتصاراً', prize: 'فوز +3000 عملة + 25 💎', perk: 'خلفية ذهبية حصرية للطاولة', active: vipRank.badge.includes('دايموند') },
                  { tier: '👑 أسطورة كازينو كاتش', req: '25 انتصاراً', prize: 'فوز +10,000 عملة + 100 💎', perk: 'لقب أسطورة دائم وتاج مذهب', active: vipRank.badge.includes('أسطورة') },
                ].map((l, i) => (
                  <div key={i} className={`p-3 rounded-2xl border transition ${l.active ? 'bg-gradient-to-r from-yellow-500/30 to-amber-600/30 border-yellow-400 shadow-md' : 'bg-black/50 border-white/10'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-yellow-300">{l.tier}</span>
                      <span className="text-[10px] text-amber-200 font-bold bg-black/40 px-2 py-0.5 rounded-full border border-white/10">{l.req}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-white/90">
                      <span>الجائزة: <b className="text-emerald-400">{l.prize}</b></span>
                      {l.active && <span className="text-[10px] font-black bg-yellow-400 text-black px-2 py-0.5 rounded-full">مستواك الحالي 👑</span>}
                    </div>
                    <p className="text-[10px] text-amber-200/60 mt-1 font-semibold">الميزة: {l.perk}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FRIENDS (الأصدقاء) */}
          {activeTab === 'friends' && (
            <div className="flex-1 flex flex-col bg-black/60 rounded-3xl p-3 border border-amber-400/30 overflow-hidden text-center">
              <h3 className="text-base font-black text-yellow-300 pb-1">👥 أصدقاء الطاولة والمشاركة</h3>
              <p className="text-[11px] text-amber-200/70 pb-2 border-b border-amber-500/20">ادعُ شلتك والعبوا أونلاين بصوتكم في ثواني!</p>

              <div className="flex-1 overflow-y-auto space-y-3 py-2">
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3 text-right">
                  <span className="text-xl block mb-1">💬</span>
                  <h4 className="text-xs font-black text-emerald-300">{lang === 'en' ? 'Quick Invite via Apps' : 'دعوة سريعة عبر واتساب والتطبيقات'}</h4>
                  <p className="text-[11px] text-amber-100/80 mt-1 leading-relaxed">
                    {lang === 'en' ? 'Share link directly with friends to join your table instantly.' : 'شارك الرابط مع أصحابك ليدخلوا فوراً على نفس الطاولة بدون أي تعقيد.'}
                  </p>
                  <button onClick={() => handleShareInvite('')}
                     className="btn-emerald w-full py-2.5 rounded-xl text-xs font-black mt-2 flex items-center justify-center gap-1.5 shadow">
                    <span>💬</span>
                    <span>{t('shareViaApps')}</span>
                  </button>
                </div>

                <div className="bg-black/50 border border-white/10 rounded-2xl p-3 text-right">
                  <h4 className="text-xs font-black text-amber-300">📋 {t('copyLink')}</h4>
                  <button onClick={async () => {
                    const shareUrl = `${getServerBaseUrl()}/`;
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                      setErrorMsg(t('linkCopied'));
                    } catch(e) {}
                    setTimeout(() => setErrorMsg(''), 2500);
                  }} className="btn-gold w-full py-2.5 rounded-xl text-xs font-black mt-2">
                    {t('copyLink')}
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* BOTTOM 5-TAB TICKET BAR (Plan Images 2, 4, 5, 6) */}
        <nav className="w-full shrink-0 bg-[#160424] border-t-2 border-amber-500/40 shadow-2xl flex items-center justify-around px-1 py-1 z-30 relative"
             style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}>
          
          {/* Tab 1: Shop */}
          <button onClick={() => { soundFx.init(); soundFx.play('snap'); setActiveTab('shop'); }}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition ${activeTab === 'shop' ? 'ticket-tab-active font-black' : 'text-amber-200/70 hover:text-white'}`}>
            <span className="text-lg leading-none">🛒</span>
            <span className="text-[10px] mt-0.5">{t('shop')}</span>
          </button>

          {/* Tab 2: Customization */}
          <button onClick={() => { soundFx.init(); soundFx.play('snap'); setActiveTab('custom'); }}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition ${activeTab === 'custom' ? 'ticket-tab-active font-black' : 'text-amber-200/70 hover:text-white'}`}>
            <span className="text-lg leading-none">🎨</span>
            <span className="text-[10px] mt-0.5">{t('custom')}</span>
          </button>

          {/* Tab 3: Home (Raised 3D Center Hub) */}
          <button onClick={() => { soundFx.init(); soundFx.play('snap'); setActiveTab('home'); }}
            className="flex flex-col items-center -top-3 relative group">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-4 transition shadow-2xl ${
              activeTab === 'home'
                ? 'bg-gradient-to-tr from-yellow-400 via-amber-300 to-yellow-500 text-black border-white scale-110 shadow-[0_0_20px_#facc15]'
                : 'bg-[#2a0845] text-amber-300 border-amber-400/50 hover:scale-105'
            }`}>
              🏠
            </div>
            <span className={`text-[10px] font-black mt-0.5 ${activeTab === 'home' ? 'text-yellow-300 drop-shadow' : 'text-amber-200/70'}`}>{t('home')}</span>
          </button>

          {/* Tab 4: Friends */}
          <button onClick={() => { soundFx.init(); soundFx.play('snap'); setActiveTab('friends'); }}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition ${activeTab === 'friends' ? 'ticket-tab-active font-black' : 'text-amber-200/70 hover:text-white'}`}>
            <span className="text-lg leading-none">👥</span>
            <span className="text-[10px] mt-0.5">{t('friends')}</span>
          </button>

          {/* Tab 5: Leagues */}
          <button onClick={() => { soundFx.init(); soundFx.play('snap'); setActiveTab('leagues'); }}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition ${activeTab === 'leagues' ? 'ticket-tab-active font-black' : 'text-amber-200/70 hover:text-white'}`}>
            <span className="text-lg leading-none">🏆</span>
            <span className="text-[10px] mt-0.5">{t('leagues')}</span>
          </button>
        </nav>

        {/* MODAL 1: MODE PICKER / QUICK PLAY DIALOG */}
        {showPlayModal && (
          <div className="fixed inset-0 z-[350] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-gradient-to-b from-[#1b0a2a] to-[#0d0315] border-2 border-amber-400 rounded-3xl p-5 w-full max-w-sm shadow-2xl text-center space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
                <h3 className="text-base font-black text-yellow-300">🎮 {lang === 'en' ? 'Choose Game Mode' : 'اختر طريقة اللعب'}</h3>
                <button onClick={() => setShowPlayModal(false)} className="text-white/70 hover:text-white text-xl">✕</button>
              </div>

              <div className="space-y-2.5 pt-1">
                <button onClick={() => {
                  setShowPlayModal(false);
                  handleCreateRoom();
                }} className="btn-3d-green w-full py-3 rounded-2xl text-base font-black flex items-center justify-center gap-2">
                  <span>⚡</span>
                  <span>{t('quickTable')}</span>
                </button>

                <button onClick={() => {
                  setShowPlayModal(false);
                  handleStartBotTraining();
                }} className="btn-3d-orange w-full py-3 rounded-2xl text-base font-black flex items-center justify-center gap-2">
                  <span>🤖</span>
                  <span>{t('botTraining')}</span>
                </button>

                <button onClick={() => {
                  setShowPlayModal(false);
                  setShowPrivateRoomModal(true);
                }} className="btn-3d-purple w-full py-3 rounded-2xl text-base font-black flex items-center justify-center gap-2">
                  <span>🔒</span>
                  <span>{t('privateTableModalTitle')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: PRIVATE ROOM (CREATE / JOIN) */}
        {showPrivateRoomModal && (
          <div className="fixed inset-0 z-[350] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-gradient-to-b from-[#1b0a2a] to-[#0d0315] border-2 border-amber-400 rounded-3xl p-5 w-full max-w-sm shadow-2xl text-right space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
                <h3 className="text-base font-black text-yellow-300">🔒 {lang === 'en' ? 'Private Table with Friends' : 'طاولة خاصة مع أصحابك'}</h3>
                <button onClick={() => setShowPrivateRoomModal(false)} className="text-white/70 hover:text-white text-xl">✕</button>
              </div>

              <div className="space-y-2.5">
                <button onClick={() => {
                  setShowPrivateRoomModal(false);
                  handleCreateRoom();
                }} className="btn-gold w-full py-3 rounded-2xl text-base font-black shadow-lg">
                  {t('createPrivateTable')}
                </button>

                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-amber-500/30"></div>
                  <span className="text-amber-300/70 text-xs font-bold">{t('orEnterCode')}</span>
                  <div className="flex-1 h-px bg-amber-500/30"></div>
                </div>

                <div className="flex gap-2">
                  <input className="flex-1 bg-black/70 border-2 border-amber-500/40 rounded-2xl px-3 py-2 text-white text-center text-lg font-black tracking-[0.2em] uppercase placeholder-amber-200/40 focus:border-emerald-400 focus:outline-none"
                    placeholder="CODE" maxLength={4} value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} />
                  <button onClick={() => {
                    setShowPrivateRoomModal(false);
                    handleJoinRoom();
                  }} className="btn-emerald px-5 rounded-2xl text-sm font-black shadow-lg">
                    {t('join')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: SETTINGS & AUDIO */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-[350] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-gradient-to-b from-[#1b0a2a] to-[#0d0315] border-2 border-amber-400 rounded-3xl p-5 w-full max-w-sm shadow-2xl text-right space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
                <h3 className="text-base font-black text-yellow-300">⚙️ {t('settings')}</h3>
                <button onClick={() => setShowSettingsModal(false)} className="text-white/70 hover:text-white text-xl">✕</button>
              </div>

              <div className="space-y-2.5 text-xs text-amber-100">
                {/* Language Switcher */}
                <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/10">
                  <span className="font-bold">{t('language')}</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => {
                      setLang('ar');
                      localStorage.setItem('catch_lang', 'ar');
                    }} className={`px-2.5 py-1 rounded-lg text-xs font-black border transition ${lang === 'ar' ? 'bg-amber-500 text-black border-amber-300 shadow' : 'bg-black/50 text-white/70 border-white/10'}`}>
                      العربية 🇪🇬
                    </button>
                    <button onClick={() => {
                      setLang('en');
                      localStorage.setItem('catch_lang', 'en');
                    }} className={`px-2.5 py-1 rounded-lg text-xs font-black border transition ${lang === 'en' ? 'bg-amber-500 text-black border-amber-300 shadow' : 'bg-black/50 text-white/70 border-white/10'}`}>
                      English 🇬🇧
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/10">
                  <span className="font-bold">{t('soundFx')}</span>
                  <button onClick={() => setMuted(!muted)} className={`px-3 py-1 rounded-lg font-black border ${muted ? 'bg-red-900/60 text-red-200 border-red-500/40' : 'bg-emerald-900/60 text-emerald-200 border-emerald-500/40'}`}>
                    {muted ? '🔇' : '🔊'}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/10">
                  <span className="font-bold">{t('editProfile')}</span>
                  <button onClick={() => { setShowSettingsModal(false); setIsEditingProfile(true); }} className="btn-gold px-3 py-1 rounded-lg text-xs font-black">
                    {lang === 'en' ? 'Edit ✏️' : 'تعديل ✏️'}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/10">
                  <span className="font-bold">{t('rules')}</span>
                  <button onClick={() => { setShowSettingsModal(false); setShowRulesModal(true); }} className="btn-emerald px-3 py-1 rounded-lg text-xs font-black">
                    {t('readRules')}
                  </button>
                </div>

                {/* Server Endpoint Configuration */}
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-200">🌐 {t('serverIp')}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${connectionStatus === 'connected' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                      {connectionStatus === 'connected' ? `✓ ${t('connected')}` : `✕ ${t('disconnected')}`}
                    </span>
                  </div>
                  <input 
                    type="text" 
                    value={serverUrlInput} 
                    onChange={e => setServerUrlInput(e.target.value)}
                    placeholder="http://192.168.1.15:3000"
                    className="w-full bg-black/60 border border-amber-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white dir-ltr font-mono focus:border-yellow-400 focus:outline-none"
                  />
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => {
                        const cleanUrl = serverUrlInput.trim();
                        if (cleanUrl) {
                          localStorage.setItem('catch_server_url', cleanUrl);
                        } else {
                          localStorage.removeItem('catch_server_url');
                        }
                        showVoiceNotice(lang === 'en' ? '⚡ Server saved! Reconnecting...' : '⚡ تم حفظ عنوان السيرفر! جاري إعادة الاتصال...');
                        setTimeout(() => location.reload(), 600);
                      }}
                      className="flex-1 btn-gold py-1.5 rounded-lg text-[11px] font-black">
                      {t('saveAndReconnect')}
                    </button>
                    <button 
                      onClick={() => {
                        setServerUrlInput('http://192.168.1.15:3000');
                        localStorage.setItem('catch_server_url', 'http://192.168.1.15:3000');
                        showVoiceNotice(lang === 'en' ? '⚡ Reset to default IP: 192.168.1.15' : '⚡ تم تعيين IP الافتراضي (192.168.1.15)!');
                        setTimeout(() => location.reload(), 600);
                      }}
                      className="bg-white/10 hover:bg-white/20 text-amber-200 border border-white/20 px-2 py-1.5 rounded-lg text-[10px] font-bold" title="Default IP">
                      Default
                    </button>
                  </div>
                </div>
              </div>

              <button onClick={() => setShowSettingsModal(false)} className="btn-gold w-full py-2 rounded-xl text-xs font-black">
                {t('closeSettings')}
              </button>
            </div>
          </div>
        )}

        {/* MODAL 4: PROFILE EDIT DRAWER */}
        {isEditingProfile && (
          <div className="fixed inset-0 z-[360] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-gradient-to-b from-[#1b0a2a] to-[#0d0315] border-2 border-amber-400 rounded-3xl p-5 w-full max-w-sm shadow-2xl text-right space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
                <h3 className="text-base font-black text-yellow-300">👤 تعديل الملف الشخصي</h3>
                <button onClick={() => setIsEditingProfile(false)} className="text-white/70 hover:text-white text-xl">✕</button>
              </div>

              <div>
                <label className="text-amber-200 text-xs font-bold mb-1 block">اسم اللاعب</label>
                <input className="w-full bg-black/70 border-2 border-amber-500/40 rounded-2xl px-4 py-2 text-white text-base font-bold placeholder-amber-200/40 focus:border-yellow-400 focus:outline-none transition"
                  placeholder="اكتب اسمك..." maxLength={14} value={playerName} 
                  onChange={e => {
                    setPlayerName(e.target.value);
                    localStorage.setItem('catch_name', e.target.value);
                  }} />
              </div>

              <div>
                <label className="text-amber-200 text-xs font-bold mb-1 block">اختر شخصية VIP</label>
                <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto p-1">
                  {AVATARS.map(a => (
                    <button key={a} onClick={() => {
                      setAvatar(a);
                      localStorage.setItem('catch_avatar', a);
                    }}
                      className={`text-2xl p-1.5 rounded-xl transition-all ${avatar === a ? 'bg-yellow-500/30 border-2 border-yellow-400 scale-110 shadow' : 'bg-black/40 border border-transparent'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setIsEditingProfile(false)} className="btn-emerald w-full py-2.5 rounded-xl text-xs font-black">
                حفظ الملف الشخصي ✓
              </button>
            </div>
          </div>
        )}

        {/* MODAL 5: RULES MODAL */}
        {showRulesModal && (
          <div className="fixed inset-0 z-[370] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-gradient-to-b from-[#1b0a2a] to-[#0d0315] border-2 border-amber-400 rounded-3xl p-5 w-full max-w-md shadow-2xl text-right max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
                <h3 className="text-base sm:text-lg font-black text-yellow-300">📖 القواعد الرسمية للعبة كاتش</h3>
                <button onClick={() => setShowRulesModal(false)} className="text-white/70 hover:text-white text-2xl font-bold">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto py-3 space-y-2.5 text-xs text-amber-100 font-semibold leading-relaxed">
                <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  <p className="font-black text-amber-300 text-sm mb-1">🎯 الهدف والفوز:</p>
                  <p>جمع أكبر عدد من اللِمّات (Sets). اللِمة الطبيعية = 4 كروت بنفس الرقم (0 إلى 12). الفائز هو صاحب أكبر رصيد لِمّات عند انتهاء الورق.</p>
                </div>
                <div className="bg-yellow-500/10 p-2.5 rounded-xl border border-yellow-500/20">
                  <p className="font-black text-yellow-300 text-sm mb-1">🔥 ميزة كا (11) + تش (12):</p>
                  <p>إذا جمعت لِمة من كارت [كا 11] + لِمة من كارت [تش 12]، تُحسب لك 3 لِمات بدلاً من 2!</p>
                </div>
                <div className="bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20">
                  <p className="font-black text-purple-300 text-sm mb-1">🃏 كارت الجوكر الذهبي:</p>
                  <p>الجوكر اختياري في يدك! يمكنك في أي وقت استخدام الجوكر مع 3 كروت من نفس الرقم لإتمام لِمة كاملة فوراً.</p>
                </div>
                <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  <p className="font-black text-emerald-300 text-sm mb-1">🧲 كروت الأكشن التكتيكية:</p>
                  <p>• <b>المغناطيس:</b> اسحب الرقم المختار من كل اللاعبين فوراً.<br/>• <b>الحرباية:</b> اختر أي كارت نزل على الأرض في الديسكارد ونفذ قوته.<br/>• <b>العب تاني:</b> يمنحك دوراً إضافياً فوراً دون تمرير الدور.<br/>• <b>الكداب:</b> يتيح لك الكذب بقول "معيش" عند سؤالك عن رقم.</p>
                </div>
              </div>
              <button onClick={() => setShowRulesModal(false)} className="btn-gold w-full py-2.5 rounded-xl text-xs font-black mt-2">
                فهمت القواعد.. يلا نلعب! 🚀
              </button>
            </div>
          </div>
        )}

        {errorMsg && <div className="fixed bottom-14 left-4 right-4 bg-red-600 text-white px-4 py-2 rounded-2xl font-bold shadow-2xl z-50 text-xs text-center">{errorMsg}</div>}
      </div>
    );
  }

  // --- LOBBY SCREEN ---
  if (roomState.status === 'lobby') {
    const shareUrl = `${getServerBaseUrl()}/?room=${roomState.code}`;

    return (
      <div className="w-full h-[100dvh] max-w-[480px] mx-auto portrait-game-bg text-white font-cairo flex flex-col justify-between p-3 select-none overflow-y-auto shadow-2xl"
           style={{ paddingTop: 'max(8px, env(safe-area-inset-top))', paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        
        {/* Lobby Top Bar */}
        <div className="flex items-center justify-between pb-1 mb-1 border-b border-white/10">
          <button onClick={handleLeaveRoom} className="btn-ruby text-white px-2.5 py-1 rounded-xl text-xs font-black">
            {t('leaveTable')}
          </button>
          <span className="text-xs font-black text-amber-300">{t('tableNumber')} [{roomState.code}]</span>
          <button onClick={handleToggleVoiceChat}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition ${
                    voiceChatActive ? 'bg-emerald-600 border-emerald-400 text-white animate-pulse' : 'bg-white/10 text-white border-white/20'
                  }`}>
            {voiceChatActive ? t('micOn') : t('liveMic')}
          </button>
        </div>

        <div className="text-center my-1">
          <p className="text-amber-200 text-xs font-bold mb-1">{t('inviteCode')}</p>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl font-black text-yellow-400 tracking-[0.25em] bg-black/70 px-6 py-2 rounded-2xl border-2 border-yellow-400/50 shadow-2xl">{roomState.code}</span>
            <button onClick={async () => {
              try {
                await navigator.clipboard?.writeText(shareUrl);
                setErrorMsg(t('linkCopied'));
                setTimeout(() => setErrorMsg(''), 2000);
              } catch(e) {}
            }} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-xl transition border border-white/20" title="Copy Link">📋</button>
          </div>

          {/* Multi-App Native Share (WhatsApp, WA Business, Telegram, etc.) */}
          <div className="flex justify-center mb-1">
            <button onClick={() => handleShareInvite(roomState.code)}
               className="btn-emerald flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black shadow hover:scale-105 active:scale-95 transition">
              <span className="text-sm">💬</span>
              <span>{t('shareViaApps')}</span>
            </button>
          </div>
        </div>

        {/* Seated Players Grid */}
        <div className="w-full flex-1 my-2 overflow-y-auto px-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-amber-200 font-bold text-xs">اللاعبين حول الطاولة ({roomState.players.length}/{roomState.maxPlayers})</span>
            {roomState.players.length < roomState.minPlayers && (
              <span className="text-yellow-400 text-[10px] font-bold">باقي {roomState.minPlayers - roomState.players.length} لاعبين للبدء</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {roomState.players.map((p) => (
              <div key={p.id} className={`flex flex-col items-center p-2.5 rounded-2xl border-2 transition ${p.id === socketRef.current?.id ? 'bg-yellow-500/15 border-yellow-400' : 'bg-black/50 border-purple-500/30'} ${speakingPlayers[p.id] ? 'speaking-pulse ring-4 ring-emerald-400' : ''}`}>
                <div className="relative">
                  <span className="text-3xl mb-0.5 block">{p.avatar}</span>
                  {speakingPlayers[p.id] && (
                    <span className="absolute -top-1 -right-2 bg-emerald-500 text-white text-[8px] font-black px-1 rounded-full border border-white">🎙️</span>
                  )}
                </div>
                <p className="text-xs font-bold text-white truncate max-w-full text-center">{p.name}</p>
                <div className="flex gap-1 mt-0.5">
                  {p.isHost && <span className="text-[9px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.2 rounded-full font-bold">مضيف 👑</span>}
                  {p.isBot && <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded-full font-bold">بوت 🤖</span>}
                  {p.id === socketRef.current?.id && <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full font-bold">أنت</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lobby Controls & Custom Rules Settings */}
        <div className="w-full space-y-2 mb-1">
          {isHost ? (
            <>
              {/* Host Custom Game Settings */}
              <div className="bg-black/60 border border-amber-500/30 rounded-2xl p-2.5 text-right space-y-1.5">
                <p className="text-xs font-black text-amber-300 flex items-center gap-1">
                  <span>⚙️</span>
                  <span>قواعد الطاولة (للمضيف):</span>
                </p>

                {/* Turn Timer Speed */}
                <div className="flex items-center justify-between gap-1 text-[11px]">
                  <span className="text-amber-200/90 font-bold">⏱️ سرعة الدور:</span>
                  <div className="flex gap-1">
                    {[
                      { id: 'fast', label: '20ث ⚡' },
                      { id: 'normal', label: '45ث ⏱️' },
                      { id: 'relaxed', label: '60ث ☕' }
                    ].map(s => (
                      <button key={s.id} onClick={() => socketRef.current.emit('update_room_settings', { turnSpeed: s.id })}
                        className={`px-2 py-0.5 rounded-lg font-black border transition ${
                          (roomState.turnSpeed || 'normal') === s.id
                            ? 'bg-yellow-400 text-black border-yellow-200 shadow'
                            : 'bg-black/50 text-white/80 border-white/10 hover:bg-white/10'
                        }`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Win Target */}
                <div className="flex items-center justify-between gap-1 text-[11px] pt-1 border-t border-white/10">
                  <span className="text-amber-200/90 font-bold">🏆 شرط الفوز:</span>
                  <div className="flex gap-1">
                    {[
                      { id: 'first_to_3', label: 'أول 3 لِمّات 🥇' },
                      { id: 'full_deck', label: 'كل الورق 🃏' }
                    ].map(w => (
                      <button key={w.id} onClick={() => socketRef.current.emit('update_room_settings', { winTarget: w.id })}
                        className={`px-2 py-0.5 rounded-lg font-black border transition ${
                          (roomState.winTarget || 'first_to_3') === w.id
                            ? 'bg-amber-500 text-black border-yellow-200 shadow'
                            : 'bg-black/50 text-white/80 border-white/10 hover:bg-white/10'
                        }`}>
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => socketRef.current.emit('add_bot')} 
                  disabled={roomState.players.length >= roomState.maxPlayers}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl font-bold text-xs border-b-2 border-blue-800 transition shadow disabled:opacity-50">
                  {lang === 'en' ? '🤖 Add Bot' : '🤖 إضافة بوت'}
                </button>
                <button onClick={() => socketRef.current.emit('remove_bot')} 
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-xl font-bold text-xs border-b-2 border-gray-900 transition shadow">
                  {lang === 'en' ? '🗑️ Remove Bot' : '🗑️ إزالة بوت'}
                </button>
              </div>

              <button onClick={() => socketRef.current.emit('start_game')} 
                disabled={roomState.players.length < roomState.minPlayers}
                className={`btn-3d-green w-full py-3.5 rounded-2xl text-lg font-black transition ${roomState.players.length < roomState.minPlayers ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}>
                {lang === 'en' ? '🚀 Start Game Now!' : '🚀 ابدأ اللعبة الآن!'}
              </button>
            </>
          ) : (
            <div className="text-center text-amber-200 text-xs font-bold bg-black/50 py-3 rounded-2xl border border-amber-500/20 animate-pulse">
              {lang === 'en' ? '⏳ Waiting for host to start the game...' : '⏳ في انتظار المضيف لبدء اللعبة...'}
            </div>
          )}
        </div>

        {errorMsg && <div className="fixed bottom-6 bg-red-600 text-white px-6 py-2 rounded-2xl font-bold shadow-2xl z-50 text-xs">{errorMsg}</div>}
      </div>
    );
  }

  // --- GAME SCREEN (World-Class Casino / Mobile Seating) ---
  const opponents = roomState.players.filter(p => p.id !== socketRef.current?.id);
  const isAnyTimeSelected = selectedCard && ANY_TIME_CARDS.includes(selectedCard.type);
  const selectedHasNaturalSet = selectedCard?.type === 'number' && (me?.hand?.filter(c => c.type === 'number' && c.value === selectedCard.value).length || 0) >= 4;
  const isTargetableMode = selectedCard && !selectedHasNaturalSet && (
    (isMyTurn && selectedCard.type === 'number') || 
    (isMyTurn && ['special', 'sayad', 'bos_bosa', 'badl_edain'].includes(selectedCard.type)) ||
    ['msh_shaifak', 'kefaya_3leik', 'hat_enta'].includes(selectedCard.type)
  );

  // Touch & Mouse Drag Handlers for Mobile (Phase 2)
  const handleCardDragStart = (e, card) => {
    const isNum = card.type === 'number';
    const cardHasNatSet = isNum && (me?.hand?.filter(c => c.type === 'number' && c.value === card.value).length || 0) >= 4;
    const canPlay = isMyTurn || ANY_TIME_CARDS.includes(card.type) || cardHasNatSet;
    if (!canPlay) return;
    const touch = e.touches ? e.touches[0] : e;
    setDraggingCard(card);
    setDragPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleDragMove = (e) => {
    if (!draggingCard) return;
    const touch = e.touches ? e.touches[0] : e;
    setDragPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleDragEnd = (e) => {
    if (!draggingCard) return;
    const touch = e.changedTouches ? e.changedTouches[0] : e;
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const seatEl = el ? el.closest('[data-opponent-idx]') : null;
    if (seatEl) {
      const oppIdx = parseInt(seatEl.getAttribute('data-opponent-idx'), 10);
      if (!isNaN(oppIdx)) {
        setSelectedCard(draggingCard);
        handleOpponentSeatClick(oppIdx);
      }
    }
    setDraggingCard(null);
  };

  // Mobile Portrait Seating Distribution (Plan Images 1, 7, 9)
  const renderOpponentSeat = (p) => {
    if (!p) return <div className="w-14 h-16 opacity-0 pointer-events-none"></div>;
    const pRealIdx = roomState.players.findIndex(x => x.id === p.id);
    const isTurn = roomState.currentIdx === pRealIdx;
    const isTargetable = isTargetableMode && !p.immune;
    const bubble = speechBubbles[p.id];
    const timerPct = isTurn ? Math.max(0, turnTimer / (turnTimerTotal || 30)) : 0;
    const circumference = 2 * Math.PI * 24;

    return (
      <div key={p.id} 
        data-opponent-idx={pRealIdx}
        onClick={() => isTargetable && handleOpponentSeatClick(pRealIdx)}
        className={`seat-node flex flex-col items-center relative select-none cursor-pointer transition ${isTargetable ? 'target-active scale-105' : ''}`}>
        
        {/* Comic Meme Speech Bubble (Plan Images 1 & 7) */}
        {bubble && (
          <div className="comic-meme-bubble absolute -top-10 bg-white text-black px-2.5 py-1 rounded-2xl text-xs font-black whitespace-nowrap z-40 border-2 border-indigo-950 shadow-2xl animate-bounce">
            {bubble.emoji ? `${bubble.emoji} ` : ''}{bubble.text}
          </div>
        )}

        {/* Avatar Frame with Radial Timer Ring */}
        <div className="relative w-13 h-13 sm:w-15 sm:h-15 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="3.5" />
            {isTurn && (
              <circle cx="28" cy="28" r="24" fill="none" 
                stroke={turnTimer <= 10 ? '#ef4444' : '#facc15'} strokeWidth="3.5" strokeLinecap="round"
                className="timer-stroke"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - timerPct)} />
            )}
          </svg>

      {/* Avatar Inner Core — NEON */}
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl neon-avatar-ring transition ${isTurn ? 'is-turn' : ''} ${speakingPlayers[p.id] ? 'speaking-pulse ring-4 ring-emerald-400' : ''}`}>
            {p.avatar}
            {speakingPlayers[p.id] && (
              <span className="absolute -top-1.5 text-[8px] font-black px-1 rounded-full border border-white z-30"
                    style={{background:'var(--neon-green)', color:'#000'}}>🎙️</span>
            )}
            {!p.connected && (
              <span className="absolute -bottom-1 text-[8px] font-black px-1 rounded-full border z-30"
                    style={{background:'var(--neon-gold)', color:'#000', borderColor:'var(--neon-gold)'}}>انقطع</span>
            )}
            {p.immune && <span className="absolute -top-1 -right-1 text-xs drop-shadow">🛡️</span>}
            {p.skipNext && <span className="absolute -top-1 -left-1 text-xs drop-shadow">🙈</span>}
          </div>

          {isTargetable && (
            <span className="absolute -bottom-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white shadow-lg animate-bounce z-30">
              اطلب 🎯
            </span>
          )}
        </div>

        <p className={`text-[10px] sm:text-xs font-black mt-0.5 max-w-[70px] truncate text-center ${isTurn ? 'text-yellow-300' : 'text-white/90'}`}>
          {p.name}
        </p>

        {/* Compact Overlapping Opponent Cards Fan (Plan & Real Card Game Style) */}
        {p.cardCount > 0 ? (
          <div className="relative flex items-center justify-center my-0.5">
            <div className="flex items-center justify-center -space-x-2.5 sm:-space-x-3 px-1 py-0.5" style={{ height: '26px' }}>
              {Array.from({ length: Math.min(p.cardCount, 5) }).map((_, cIdx, arr) => {
                const rot = (cIdx - (arr.length - 1) / 2) * 6;
                return (
                  <div key={cIdx}
                       style={{ transform: `rotate(${rot}deg)`, zIndex: cIdx }}
                       className="w-3.5 h-5 sm:w-4 sm:h-6 rounded-[2px] bg-[#1e0407] border border-amber-400/60 shadow-[0_2px_4px_rgba(0,0,0,0.8)] overflow-hidden shrink-0 transition-transform">
                    <img src="/cards/card_TCH.png" className="w-full h-full object-cover opacity-90" alt="" />
                  </div>
                );
              })}
            </div>
            {/* Pill Badge with Exact Count */}
            <span className="absolute -bottom-1 -right-1 bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-md border border-amber-900 z-10 leading-tight">
              {p.cardCount}
            </span>
          </div>
        ) : (
          <div className="text-[9px] text-white/40 font-bold my-0.5">معندوش ورق</div>
        )}

        {/* 3D Claimed Sets Stack on Felt */}
        {p.sets && p.sets.length > 0 && (
          <div className="relative mt-0.5 flex items-center justify-center -space-x-1.5" title={`${p.sets.length} لِمّات مقفولة ومحمية`}>
            {p.sets.map((_, sIdx) => (
              <div 
                key={sIdx} 
                style={{ transform: `rotate(${(sIdx - (p.sets.length - 1) / 2) * 8}deg) translateY(${sIdx * -2}px)` }}
                className="w-4 h-6 rounded-sm bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 border border-yellow-200 shadow-[0_2px_5px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center shrink-0 transition-transform">
                <span className="text-[6px] leading-none drop-shadow">🔒</span>
                <span className="text-[5px] text-black font-black leading-none">⭐</span>
              </div>
            ))}
            <span className="absolute -bottom-1 -right-2 bg-yellow-400 text-black text-[8px] font-black px-1 rounded-full shadow border border-amber-900 leading-tight">
              {p.sets.length}
            </span>
          </div>
        )}
      </div>
    );
  };

  let topOpp = null;
  let leftOpp = null;
  let rightOpp = null;
  let extraOpps = [];

  if (opponents.length === 1) {
    topOpp = opponents[0];
  } else if (opponents.length === 2) {
    leftOpp = opponents[0];
    rightOpp = opponents[1];
  } else if (opponents.length === 3) {
    leftOpp = opponents[0];
    topOpp = opponents[1];
    rightOpp = opponents[2];
  } else if (opponents.length > 3) {
    leftOpp = opponents[0];
    topOpp = opponents[1];
    rightOpp = opponents[2];
    extraOpps = opponents.slice(3);
  }

  const getAskerFlyTransform = (askerId) => {
    if (!askerId) return 'scale(0.3) opacity(0)';
    if (askerId === socketRef.current?.id) {
      return 'translate(0px, 260px) scale(0.35) rotate(12deg)';
    }
    if (leftOpp && askerId === leftOpp.id) {
      return 'translate(-155px, -140px) scale(0.35) rotate(-18deg)';
    }
    if (rightOpp && askerId === rightOpp.id) {
      return 'translate(155px, -140px) scale(0.35) rotate(18deg)';
    }
    if (topOpp && askerId === topOpp.id) {
      return 'translate(0px, -230px) scale(0.35) rotate(-4deg)';
    }
    return 'translate(-80px, -240px) scale(0.35) rotate(-10deg)';
  };

  return (
    <div className="w-full h-[100dvh] max-w-[480px] mx-auto portrait-game-bg text-white font-cairo flex flex-col justify-between relative overflow-hidden select-none shadow-2xl"
         onMouseMove={handleDragMove} onMouseUp={handleDragEnd}
         onTouchMove={handleDragMove} onTouchEnd={handleDragEnd}>
      
      {/* Top HUD — Warm Burgundy & Gold (Matching Mockup) */}
      <header className="w-full shrink-0 flex items-center justify-between px-2.5 z-30"
              style={{height:'50px', paddingTop:'max(6px,env(safe-area-inset-top))'}}>
        <div className="w-full bg-[#1e0407]/90 backdrop-blur-md border border-amber-500/40 rounded-2xl px-3 py-1 flex items-center justify-between shadow-lg">
          <button onClick={handleLeaveRoom} className="text-amber-200/90 hover:text-white flex items-center gap-1 text-xs font-black transition">
            <span className="text-red-400">✕</span>
            <span>خروج</span>
          </button>

          {/* Turn / Player Name & Countdown Timer (Mockup style with Danger Pulse FX) */}
          <div className={`flex flex-col items-center px-2.5 py-0.5 rounded-xl transition-all duration-300 ${
            turnTimer <= 10 
              ? 'bg-red-950/85 border border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.9)] animate-pulse' 
              : ''
          }`}>
            <span className={`text-xs font-black leading-tight ${turnTimer <= 10 ? 'text-red-300' : 'text-amber-200'}`}>
              {turnTimer <= 10 ? '⚠️ انتبه للوقت!' : isMyTurn ? '👉 دورك الآن!' : `دور: ${roomState.players[roomState.currentIdx]?.name || 'انتظار'}`}
            </span>
            <span className={`text-[10px] font-black leading-tight ${turnTimer <= 10 ? 'text-red-400' : 'text-yellow-400/90'}`}>
              الوقت المتبقي: 00:{turnTimer < 10 ? '0' + turnTimer : turnTimer}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Card Superpowers & Details Button */}
            <button onClick={() => {
              if (selectedCard) {
                setInspectCard(selectedCard);
              } else if (!inspectCard) {
                setInspectCard(me?.hand?.[0] || { type: 'magnatees' });
              }
              setCardDetailModal(true);
            }}
            title={selectedCard ? `معلومات وتفاصيل كارت: ${getCardTitle(selectedCard)}` : 'تفاصيل وقوة الكروت'}
            className={`px-2 py-1 rounded-xl text-xs font-black transition border shadow flex items-center gap-1 ${
              selectedCard 
                ? 'bg-amber-400 text-black border-yellow-200 animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.85)]' 
                : 'bg-amber-500/15 border-amber-400/40 text-yellow-300 hover:bg-amber-500/25'
            }`}>
              <span>ℹ️</span>
              <span className="text-[10px] hidden sm:inline">تفاصيل</span>
            </button>

            <button onClick={() => {
              const active = soundFx.toggleAmbientMusic((s) => setIsMusicPlaying(s));
              setIsMusicPlaying(active);
            }} className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs transition border ${isMusicPlaying ? 'bg-amber-500/20 border-yellow-400 text-yellow-300' : 'bg-black/30 border-white/10 text-white/50'}`}>
              🎵
            </button>
            <button onClick={handleToggleVoiceChat}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs transition border ${
                      voiceChatActive 
                        ? (voiceMuted ? 'bg-amber-600/30 border-amber-400 text-amber-300' : 'bg-emerald-600/30 border-emerald-400 text-emerald-300 animate-pulse') 
                        : 'bg-black/30 border-white/10 text-white/50'
                    }`}>
              {voiceChatActive ? (voiceMuted ? '🔇' : '🎙️') : '🎙️'}
            </button>
            <button onClick={() => setShowBanterDrawer(!showBanterDrawer)}
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-xs border border-white/10 bg-black/30 text-white/70">
              🗣️
            </button>
          </div>
        </div>
      </header>

      {/* Main Oval Table Area (Matching Generated Mockup) */}
      <main className="flex-1 relative w-full flex flex-col items-center justify-center px-2 py-0.5 overflow-hidden">
        
        {/* The Oval Felt Table */}
        <div className="relative w-full max-w-[420px] h-[98%] max-h-[390px] sm:max-h-[430px] rounded-[110px] sm:rounded-[140px] border-[6px] border-[#220508] shadow-[0_0_0_2px_rgba(212,175,55,0.45),0_15px_40px_rgba(0,0,0,0.95),inset_0_0_60px_rgba(0,0,0,0.85)] flex flex-col justify-between items-center p-2.5 overflow-hidden"
             style={{ background: 'radial-gradient(ellipse at 50% 50%, #761421 0%, #520b14 60%, #30040a 100%)' }}>
          
          {/* Subtle Inner Dashed Ring */}
          <div className="absolute inset-2.5 rounded-[95px] sm:rounded-[125px] border border-dashed border-amber-400/20 pointer-events-none" />

          {/* Top Opponents Row */}
          <div className="w-full flex items-center justify-center gap-4 z-20 shrink-0 pt-0.5">
            {renderOpponentSeat(topOpp)}
            {extraOpps.map(op => renderOpponentSeat(op))}
          </div>

          {/* Middle Table Row (Left Opponent, Center Felt Deck/Discard, Right Opponent) */}
          <div className="w-full flex-1 flex items-center justify-between px-1.5 z-20 my-auto">
            {/* Left Seat */}
            <div className="w-16 flex justify-center">
              {renderOpponentSeat(leftOpp)}
            </div>

            {/* Center Felt Playmat */}
            <div className="flex-1 flex flex-col items-center justify-center gap-1.5 px-1">
              <div className="flex items-center justify-center gap-3 sm:gap-5">
                {/* Draw Deck */}
                <div className={`flex flex-col items-center cursor-pointer group transition ${roomState.isMyTurn ? 'hover:scale-105' : ''}`}
                     onClick={() => {
                       if (roomState.isMyTurn) {
                         socketRef.current.emit('draw_card');
                       }
                     }}>
                  <div className="relative">
                    <img src="/cards/card_back.png" className={`w-13 h-19 sm:w-15 sm:h-22 rounded-xl deck-shadow border-2 transition ${roomState.isMyTurn ? 'border-yellow-400 shadow-[0_0_18px_rgba(250,204,21,0.8)] animate-bounce' : 'border-amber-400/50'}`} alt="" />
                    <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-600 to-yellow-600 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded-full border border-amber-200 shadow-md">
                      {roomState.deckCount}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-amber-200/90 mt-0.5">{roomState.isMyTurn ? '👇 اسحب' : 'السحب'}</span>
                </div>

                {/* Turn Direction Indicator */}
                <div className="flex flex-col items-center pointer-events-none">
                  <div className="text-lg sm:text-xl text-yellow-400 animate-spin drop-shadow" style={{ animationDuration: '6s' }}>
                    {roomState.direction === 1 ? '↻' : '↺'}
                  </div>
                  <span className="text-[8px] text-amber-200/60 font-bold">
                    {roomState.direction === 1 ? 'مع الساعة' : 'عكس'}
                  </span>
                </div>

                {/* Discard Pile */}
                <div className="flex flex-col items-center">
                  {roomState.lastPlayedCard ? (
                    <div className="relative">
                      <img src={getCardImage(roomState.lastPlayedCard)} 
                        className="w-13 h-19 sm:w-15 sm:h-22 rounded-xl border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)] transform rotate-2" alt="" />
                    </div>
                  ) : (
                    <div className="w-13 h-19 sm:w-15 sm:h-22 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center bg-black/30">
                      <span className="text-white/40 text-[9px] font-bold">المكشوف</span>
                    </div>
                  )}
                  <span className="text-[9px] font-bold text-amber-200/90 mt-0.5">المكشوف</span>
                </div>
              </div>
            </div>

            {/* Right Seat */}
            <div className="w-16 flex justify-center">
              {renderOpponentSeat(rightOpp)}
            </div>
          </div>

          {/* Master Interactive Center Screen / شاشة التفاعلات والأحداث الحية */}
          <div className="w-full max-w-sm z-30 px-1 mb-0.5 transition-all">
            {actionNotice ? (
              <div className="bg-[#1f0407]/95 border border-yellow-400/80 rounded-xl p-1.5 shadow-[0_0_20px_rgba(250,204,21,0.5)] backdrop-blur-md">
                <div className="flex items-center justify-between pb-0.5 mb-0.5 border-b border-amber-400/30">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-yellow-300">⚡ أكشن مباشر!</span>
                  </div>
                  <div className="flex items-center gap-1 bg-black/50 px-1.5 py-0.2 rounded-full border border-yellow-400/30">
                    <span className="text-xs">{actionNotice.actorAvatar || '👤'}</span>
                    <span className="text-[9px] font-black text-amber-200">{actionNotice.actorName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <img src={getCardImage(actionNotice.cardType ? { type: actionNotice.cardType, value: actionNotice.cardValue } : null)} 
                    className="w-8 h-12 rounded-lg border border-yellow-300 shadow shrink-0 transform rotate-1" alt="" />
                  <div className="flex-1 min-w-0 text-right">
                    <h4 className="text-xs font-black text-yellow-300 leading-tight">
                      {actionNotice.title}
                    </h4>
                    <p className="text-[10px] text-white/95 font-bold mt-0.5 leading-tight truncate">
                      {actionNotice.desc}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* NORMAL LIVE EVENT / STATUS CONSOLE */
              <div className="bg-[#190306]/85 backdrop-blur-md border border-amber-500/30 rounded-xl p-1.5 shadow-md">
                <div className="flex items-center justify-between pb-0.5 mb-0.5 border-b border-white/10">
                  <div className="flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-black text-amber-300">⚡ الأحداث المباشرة</span>
                  </div>
                  <button onClick={() => setShowLog(!showLog)} className="text-[9px] font-black text-amber-300 hover:text-white bg-amber-500/20 border border-amber-400/30 px-1.5 py-0.2 rounded-lg transition">
                    السجل ({roomState.logs?.length || 0}) 📜
                  </button>
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  {(roomState.logs || []).slice(-1).map((log, i) => (
                    <div key={i} className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border leading-tight bg-gradient-to-r from-amber-950/80 to-[#220307]/80 border-amber-400/50 text-yellow-200 text-[10px] font-bold">
                      <span className="shrink-0 text-xs">🔥</span>
                      <span className="truncate flex-1 text-right">{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

        {/* Liar Decision Dialog Bar */}
        {liarPrompt && (
          <div className="fixed inset-x-4 top-20 sm:top-24 sm:max-w-md sm:mx-auto z-[200] bg-gradient-to-r from-red-950 via-purple-950 to-red-950 border-3 border-yellow-400 shadow-[0_10px_40px_rgba(0,0,0,0.9)] rounded-3xl p-4 text-center backdrop-blur-md animate-bounce">
            <span className="text-4xl block mb-1">🤥</span>
            <p className="text-base font-black text-yellow-300">
              {liarPrompt.askerName} بيطلب منك [{liarPrompt.requestedNumber === 11 ? 'كا' : liarPrompt.requestedNumber === 12 ? 'تش' : liarPrompt.requestedNumber}] ومعاك {liarPrompt.count} كارت!
            </p>
            <p className="text-xs text-amber-200/90 font-bold mb-3 mt-1">
              معاك كارت « كداب »! تقدر تكذب وتقول معيش وتخليه ياخد CATCH!
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => {
                socketRef.current.emit('liar_decision', { lie: true });
                setLiarPrompt(null);
              }} className="btn-ruby px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex-1 shadow-lg">
                🤥 اكذب وقول معيش!
              </button>
              <button onClick={() => {
                socketRef.current.emit('liar_decision', { lie: false });
                setLiarPrompt(null);
              }} className="btn-emerald px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex-1 shadow-lg">
                🤝 اديله الكروت بصدق
              </button>
            </div>
          </div>
        )}

        {/* Hat Enta Counter Decision Prompt */}
        {hatEntaPrompt && (
          <div className="fixed inset-x-4 top-20 sm:top-24 sm:max-w-md sm:mx-auto z-[200] bg-gradient-to-r from-red-950 via-purple-950 to-amber-950 border-3 border-red-500 shadow-[0_10px_40px_rgba(255,0,0,0.8)] rounded-3xl p-4 text-center backdrop-blur-md animate-bounce font-cairo">
            <span className="text-4xl block mb-1">🛑</span>
            <p className="text-base font-black text-yellow-300">
              {hatEntaPrompt.askerName} بيطلب منك [{hatEntaPrompt.requestedNumber === 11 ? 'كا' : hatEntaPrompt.requestedNumber === 12 ? 'تش' : hatEntaPrompt.requestedNumber}]!
            </p>
            <p className="text-xs text-amber-200/90 font-bold mb-3 mt-1">
              معاك كارت « هات انت »! تقدر تقلب الطاولة وتاخد ورقه وتستلم الدور!
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => {
                soundFx.init();
                soundFx.play('impact');
                socketRef.current.emit('counter_with_hat_enta');
                setHatEntaPrompt(null);
              }} className="btn-ruby px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex-1 shadow-lg border border-red-400">
                ⚡ اعكس الطلب (هات انت!)
              </button>
              <button onClick={() => {
                socketRef.current.emit('ignore_hat_enta');
                setHatEntaPrompt(null);
              }} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex-1 shadow-lg border border-white/10">
                تجاهل الكارت
              </button>
            </div>
          </div>
        )}

        {/* Swap Hands Animation Banner */}
        {swapAnim && (
          <div className="fixed inset-0 pointer-events-none z-[180] flex items-center justify-center">
            <div className="bg-black/85 px-8 py-6 rounded-3xl border-3 border-yellow-400 text-center shadow-[0_0_50px_rgba(250,204,21,0.5)] animate-pulse">
              <span className="text-5xl block animate-spin mb-2" style={{ animationDuration: '1.2s' }}>🔄</span>
              <p className="text-xl font-black text-yellow-400">
                بدل أيادي! 🤝
              </p>
              <p className="text-sm font-bold text-white mt-1">
                تم تبديل أوراق {swapAnim.p1Name} مع {swapAnim.p2Name}!
              </p>
            </div>
          </div>
        )}

        {/* Joker Showdown Result Stamp Banner */}
        {jokerShowdownAnim && (
          <div className="fixed inset-0 pointer-events-none z-[260] flex items-center justify-center p-4">
            <div className={`px-7 py-6 rounded-3xl border-3 text-center shadow-2xl backdrop-blur-md animate-bounce max-w-sm ${
              jokerShowdownAnim.success 
                ? 'bg-gradient-to-b from-emerald-950 via-black to-emerald-950 border-emerald-400 shadow-[0_0_60px_rgba(16,185,129,0.7)]'
                : jokerShowdownAnim.skipped
                ? 'bg-gradient-to-b from-gray-950 via-black to-gray-950 border-gray-400 shadow-[0_0_40px_rgba(255,255,255,0.3)]'
                : 'bg-gradient-to-b from-red-950 via-black to-red-950 border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.7)]'
            }`}>
              <span className="text-5xl block mb-2">{jokerShowdownAnim.success ? '🎯' : jokerShowdownAnim.skipped ? '🏳️' : '❌'}</span>
              <p className={`text-xl font-black ${
                jokerShowdownAnim.success ? 'text-emerald-300' : jokerShowdownAnim.skipped ? 'text-amber-200' : 'text-red-400'
              }`}>
                {jokerShowdownAnim.success ? 'اتقفش متلبس! قَفْشَة الجوكر!' : jokerShowdownAnim.skipped ? 'تم تخطي التخمين' : 'تخمين غير صحيح! عقوبة!'}
              </p>
              <p className="text-xs text-white/90 font-bold mt-2 leading-relaxed">
                {jokerShowdownAnim.success
                  ? `${jokerShowdownAnim.challengerName} قفش ${jokerShowdownAnim.accusedName}! لِمّة الجوكر رقم [${jokerShowdownAnim.valLabel}] اتسحبت وراحت للمخمن! 🔥`
                  : jokerShowdownAnim.skipped
                  ? `${jokerShowdownAnim.challengerName} فضّل عدم المخاطرة بلِمّة.`
                  : `${jokerShowdownAnim.challengerName} اتهم ${jokerShowdownAnim.accusedName} بالباطل! صاحب الجوكر الحقيقي هو ${jokerShowdownAnim.actualName || 'صاحب الجوكر'}! ${jokerShowdownAnim.penaltyGiven ? `خسر لِمّة كعقوبة وراحت لصاحب الجوكر ${jokerShowdownAnim.actualName || ''} مكافأة له على نجاح خدعته!` : ''}`}
              </p>
            </div>
          </div>
        )}

        {/* Endgame Joker Showdown Modal (قَفْشَة الجوكر الأخيرة) */}
        {roomState.jokerChallenge && (
          roomState.jokerChallenge.isChallengerMe ? (
            <div className="fixed inset-0 z-[250] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-gradient-to-b from-[#250836] via-[#140320] to-[#08010c] border-3 border-yellow-400 rounded-3xl p-5 w-full max-w-md shadow-[0_0_60px_rgba(250,204,21,0.7)] text-center font-cairo">
                <span className="text-4xl block mb-1">🕵️ 🃏</span>
                <h3 className="text-lg font-black text-yellow-300">
                  قَفْشَة الجوكر الأخيرة! (Joker Showdown)
                </h3>
                <p className="text-xs text-amber-200/90 font-bold mt-1">
                  معاك الكارت اليتيم رقم <span className="bg-yellow-400 text-black px-2 py-0.5 rounded-md font-black">[{roomState.jokerChallenge.orphanValue === 11 ? 'كا' : roomState.jokerChallenge.orphanValue === 12 ? 'تش' : roomState.jokerChallenge.orphanValue}]</span>! اللِمّة بتاعته اتقفلت في السر بالجوكر (3 كروت + جوكر)!
                </p>

                {/* Stakes Rule Warning */}
                <div className="bg-black/50 border border-yellow-500/30 rounded-2xl p-2.5 my-3 text-right text-xs space-y-1">
                  <p className="text-emerald-300 font-bold flex items-center gap-1">
                    <span>🎯</span>
                    <span>لو خمنت صح: هتقفشه وتاخد لِمّة الجوكر دي فوراً لحسابك!</span>
                  </p>
                  <p className="text-red-300 font-bold flex items-center gap-1">
                    <span>⚠️</span>
                    <span>لو خمنت غلط: هتخسر لِمّة من لِمّاتك كعقوبة وتروح لصاحب الجوكر الحقيقي مكافأة له على نجاح خدعته!</span>
                  </p>
                </div>

                <p className="text-xs font-black text-amber-200 mb-2 text-right">
                  👇 اختر اللاعب اللي شاكك إنه قفل اللِمّة بالجوكر:
                </p>

                {/* Opponents Selection Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 mb-3">
                  {roomState.jokerChallenge.possibleTargets.map(targetP => {
                    const isSelected = selectedJokerTarget === targetP.id;
                    return (
                      <button 
                        key={targetP.id}
                        onClick={() => setSelectedJokerTarget(targetP.id)}
                        className={`p-2 rounded-2xl flex flex-col items-center gap-1 transition shadow border relative ${
                          isSelected 
                            ? 'bg-amber-500/30 border-amber-300 ring-2 ring-yellow-400 scale-105'
                            : 'bg-black/50 border-white/10 hover:border-amber-400/50'
                        }`}>
                        <span className="text-2xl">{targetP.avatar}</span>
                        <span className="text-xs font-black text-white truncate max-w-full">{targetP.name}</span>
                        <span className="text-[10px] text-yellow-300">⭐ {targetP.setsCount} لِمّات</span>
                      </button>
                    );
                  })}
                </div>

                {/* Buttons */}
                <div className="space-y-2">
                  <button 
                    disabled={!selectedJokerTarget}
                    onClick={() => {
                      if (!selectedJokerTarget) return;
                      soundFx.init();
                      soundFx.play('impact');
                      socketRef.current.emit('submit_joker_guess', { targetPlayerId: selectedJokerTarget });
                      setSelectedJokerTarget(null);
                    }}
                    className={`w-full py-2.5 rounded-2xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 shadow-lg ${
                      selectedJokerTarget 
                        ? 'btn-gold cursor-pointer animate-pulse' 
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }`}>
                    <span>🕵️</span>
                    <span>اتّهم اللاعب ده واقفش لِمّة الجوكر!</span>
                  </button>
                  <button 
                    onClick={() => {
                      socketRef.current.emit('skip_joker_guess');
                      setSelectedJokerTarget(null);
                    }}
                    className="w-full py-2 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white/80 border border-white/10 transition">
                    🏳️ تخطي التخمين (مش عايز أخاطر بلِمّة)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="fixed inset-x-4 top-20 sm:top-24 sm:max-w-md sm:mx-auto z-[200] bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-950 border-3 border-yellow-400 shadow-[0_10px_40px_rgba(0,0,0,0.9)] rounded-3xl p-4 text-center backdrop-blur-md animate-pulse font-cairo">
              <span className="text-3xl block mb-1">🕵️ 🃏</span>
              <p className="text-base font-black text-yellow-300">
                مواجهة الجوكر الأخيرة قيد التخمين!
              </p>
              <p className="text-xs text-amber-200/90 font-bold mt-1">
                {roomState.jokerChallenge.challengerName} معاه الكارت اليتيم رقم [{roomState.jokerChallenge.orphanValue === 11 ? 'كا' : roomState.jokerChallenge.orphanValue === 12 ? 'تش' : roomState.jokerChallenge.orphanValue}] وبيخمن مين اللي قفل اللِمّة بالجوكر!
              </p>
            </div>
          )
        )}

      {/* Bottom Dock: My Hand & Controls — NEON DARK */}
      <footer className="w-full shrink-0 z-40 flex flex-col relative"
              style={{background:'rgba(5,8,16,0.96)', borderTop:'1px solid rgba(0,212,255,0.15)', backdropFilter:'blur(12px)',
                      paddingBottom:'max(8px,env(safe-area-inset-bottom))'}}>
        
        {/* Profile Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b" style={{borderColor:'rgba(255,255,255,0.06)'}}>
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* My Speech Bubble */}
              {speechBubbles[socketRef.current?.id] && (
                <div className="comic-meme-bubble absolute -top-10 -right-2 bg-white text-black px-2.5 py-1 rounded-2xl text-xs font-black whitespace-nowrap z-50 border-2 border-emerald-950 shadow-2xl animate-bounce">
                  {speechBubbles[socketRef.current?.id].emoji ? `${speechBubbles[socketRef.current?.id].emoji} ` : ''}{speechBubbles[socketRef.current?.id].text}
                </div>
              )}
              <span className={`text-3xl block leading-none p-1 rounded-xl ${speakingPlayers[socketRef.current?.id] ? 'speaking-pulse ring-2 ring-emerald-400' : ''}`}
                    style={{border:'1.5px solid rgba(0,212,255,0.3)', background:'rgba(0,212,255,0.05)'}}>
                {me.avatar}
              </span>
              {speakingPlayers[socketRef.current?.id] && (
                <span className="absolute -top-2 -right-1 text-[8px] font-black px-1 rounded-full border border-white"
                      style={{background:'var(--neon-green)', color:'#000'}}>🎙️</span>
              )}
            </div>
            <div>
              <p className="text-sm font-black leading-tight" style={{color:'var(--text-main)'}}>
                {me.name} <span className="text-[10px] font-bold" style={{color:'var(--neon-blue)'}}>• أنت</span>
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{background:'rgba(180,77,255,0.15)', color:'var(--neon-purple)', border:'1px solid rgba(180,77,255,0.3)'}}>
                  🃏 {me.hand.length}
                </span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full" style={{background:'rgba(255,215,0,0.1)', color:'var(--neon-gold)', border:'1px solid rgba(255,215,0,0.3)'}}>
                  ⭐ {me.score || me.sets.length}
                </span>
                {/* My Claimed Sets Display with Values */}
                {me.sets && me.sets.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto max-w-[140px] sm:max-w-[200px]" title="لِمّاتك المقفولة بأرقامها">
                    {me.sets.map((val, idx) => {
                      const lbl = val === 11 ? 'كا' : val === 12 ? 'تش' : `${val}`;
                      return (
                        <div key={idx} 
                             className="shrink-0 flex items-center gap-0.5 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-700 text-black font-black text-[9px] px-1.5 py-0.2 rounded-md border border-yellow-200 shadow">
                          <span className="text-[7px]">🔒</span>
                          <span>{lbl}</span>
                          <span className="text-[7px]">⭐</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleStartVoiceCommand}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition active:scale-95 ${
                      isListening 
                        ? 'btn-neon-red' 
                        : 'btn-neon-gold'
                    }`}>
              <span>{isListening ? '⏹️' : '🗣️'}</span>
              <span className="text-xs">🎤</span>
            </button>
            <button onClick={() => setShowEmojiWheel(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-black transition border flex items-center gap-1 active:scale-95 shadow-md"
                    style={{border:'1.5px solid rgba(52,211,153,0.5)', background:'rgba(52,211,153,0.12)', color:'#34d399'}}
                    title="عجلة الإيموجي والتفاعلات">
              <span className="text-sm">😊</span>
              <span className="text-[10px] font-bold">تفاعل</span>
            </button>
          </div>
        </div>

        {/* Memes Drawer */}
        {showMemes && (
          <div className="flex gap-2 px-4 py-2 overflow-x-auto bg-black/40 border-b border-white/10">
            {MEME_STICKERS.map((s, i) => (
              <button key={i} onClick={() => {
                socketRef.current.emit('send_meme_sticker', { stickerUrl: s.emoji, stickerText: s.text });
                setShowMemes(false);
              }}
                className="shrink-0 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl text-sm font-bold transition border border-white/10">
                {s.emoji} {s.text}
              </button>
            ))}
          </div>
        )}

        {/* No Numbers Notice & Draw Button */}
        {isMyTurn && !me.hand.some(c => c.type === 'number') && (
          <div className="w-full px-4 pt-2.5 flex justify-center">
            <button onClick={() => socketRef.current.emit('draw_card')}
                    className="btn-gold px-6 py-2 rounded-2xl text-xs sm:text-sm font-black shadow-xl animate-bounce flex items-center gap-2 border-2 border-yellow-300">
              <span>📥</span>
              <span>معندكش أي أرقام في إيدك! اضغط هنا للسحب وتمرير الدور</span>
            </button>
          </div>
        )}

        {/* Hand Cards — EXPANDED BOUNDED FAN LAYOUT (Always fully on-screen & easily readable) */}
        <div className="w-full px-1 pt-1 pb-1 flex justify-center overflow-visible">
          <div className="hand-fan-container" style={{ height: '148px', maxWidth: '420px', margin: '0 auto' }}>
            {sortedHand.map((card, i) => {
              const total = sortedHand.length;
              const isSelected = selectedCard?.id === card.id;
              const isNumber = card.type === 'number';
              const isAnyTime = ANY_TIME_CARDS.includes(card.type);
              const matchingNumberCount = isNumber ? me?.hand?.filter(c => c.type === 'number' && c.value === card.value).length : 0;
              const hasNaturalSet = matchingNumberCount >= 4;
              const canPlay = isMyTurn || isAnyTime || hasNaturalSet;
              
              // Smart Adaptive Fan Spacing:
              // Container max spread is 330px so cards NEVER clip outside screen margins
              const maxSpan = 265; 
              const naturalSpacing = 56;
              const spacing = total > 1 ? Math.min(naturalSpacing, maxSpan / (total - 1)) : 0;
              const totalSpan = (total - 1) * spacing;
              const startX = -totalSpan / 2;
              const xOffset = startX + i * spacing;
              
              // Arched rotation:
              const maxAngle = Math.min(18, total * 2.8);
              const angle = total > 1 ? ((i - (total - 1) / 2) / ((total - 1) / 2)) * maxAngle : 0;
              const normalizedPos = total > 1 ? (i - (total - 1) / 2) / ((total - 1) / 2) : 0;
              const arcY = Math.abs(normalizedPos) * (total > 4 ? 6 : 2);
              
              const fanStyle = {
                transform: isSelected 
                  ? `translateX(${xOffset}px) translateY(-54px) scale(1.22) rotate(0deg)`
                  : `translateX(${xOffset}px) translateY(${arcY}px) rotate(${angle}deg)`,
                zIndex: isSelected ? 99 : (i + 1),
                filter: isSelected 
                  ? 'drop-shadow(0 -18px 30px #facc15)'
                  : hasNaturalSet
                    ? 'drop-shadow(0 -6px 14px rgba(250,204,21,0.9))'
                    : isAnyTime 
                      ? 'drop-shadow(0 -5px 12px rgba(239,68,68,0.75))'
                      : 'drop-shadow(0 -4px 8px rgba(0,0,0,0.85))',
              };
              
              return (
                <div key={card.id}
                  className={`hand-fan-card ${!canPlay ? 'disabled opacity-45' : ''}`}
                  style={fanStyle}
                  onClick={() => handleCardClick(card)}
                  onTouchStart={(e) => handleCardDragStart(e, card)}
                  onMouseDown={(e) => handleCardDragStart(e, card)}>
                  
                  {/* Card Image — Significantly Enlarged (74px x 106px) */}
                  <div className="relative">
                    <img src={getCardImage(card)}
                      className="w-[74px] h-[106px] sm:w-[84px] sm:h-[120px] rounded-xl border-2 transition object-cover select-none"
                      style={{
                        borderColor: isSelected ? '#ffd700' : hasNaturalSet ? '#facc15' : isAnyTime ? '#ef4444' : 'rgba(212,175,55,0.4)',
                        boxShadow: isSelected ? '0 0 25px rgba(255,215,0,0.9)' : hasNaturalSet ? '0 0 16px rgba(250,204,21,0.85)' : isAnyTime ? '0 0 12px rgba(239,68,68,0.6)' : '0 4px 10px rgba(0,0,0,0.8)'
                      }}
                      alt="" />

                    {/* Golden Star Indicator when 4-of-a-kind is held */}
                    {hasNaturalSet && (
                      <div className="absolute top-1 left-1 pointer-events-none z-30">
                        <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-md border border-yellow-100 shadow-lg flex items-center gap-0.5 animate-pulse">
                          <span>⭐</span>
                          <span className="hidden xs:inline">لِمّة</span>
                        </span>
                      </div>
                    )}

                    {/* High-Contrast Top-Right Corner Value Badge for Instant Readability */}
                    <div className="absolute top-1 right-1 pointer-events-none">
                      {isNumber ? (
                        <span className="bg-black/90 text-yellow-300 font-black text-xs sm:text-sm px-1.5 py-0.2 rounded-md border border-yellow-400/80 shadow-md block leading-tight">
                          {card.value === 11 ? 'كا' : card.value === 12 ? 'تش' : card.value}
                        </span>
                      ) : (
                        <span className="bg-[#2a040b]/95 text-white font-black text-[10px] sm:text-xs px-1 py-0.2 rounded-md border border-amber-400/80 shadow-md block leading-tight">
                          {ACTION_INFO[card.type]?.name.slice(-2) || '⚡'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* High-Contrast Bottom Name Badge */}
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-20">
                    <span className="text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full border whitespace-nowrap shadow-lg block"
                          style={{
                            background: hasNaturalSet ? 'linear-gradient(135deg, #78350f, #451a03)' : isNumber ? (card.value >= 11 ? '#451a03' : '#180407') : isAnyTime ? '#450a0a' : '#2e1065',
                            color: hasNaturalSet ? '#fef08a' : isNumber ? (card.value >= 11 ? '#fef08a' : '#fef3c7') : isAnyTime ? '#fca5a5' : '#e9d5ff',
                            borderColor: hasNaturalSet ? '#eab308' : isNumber ? (card.value >= 11 ? '#eab308' : 'rgba(212,175,55,0.4)') : isAnyTime ? '#ef4444' : '#a855f7'
                          }}>
                      {hasNaturalSet ? `⭐ ${getCardTitle(card)}` : isAnyTime && !isMyTurn ? `⚡ ` : ''}{getCardTitle(card)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Action Trigger Bar (appears sleekly right above the hand when card is clicked) */}
        {selectedCard && (isMyTurn || ANY_TIME_CARDS.includes(selectedCard.type) || selectedHasNaturalSet) && (
          <div className="absolute -top-16 left-3 right-3 sm:left-auto sm:right-auto sm:w-[480px] sm:left-1/2 sm:-translate-x-1/2 bg-gradient-to-r from-gray-900/95 via-black/95 to-gray-900/95 border-2 border-yellow-400 shadow-2xl rounded-2xl p-2.5 flex items-center justify-between z-50">
            <div className="flex items-center gap-2 min-w-0">
              <img src={getCardImage(selectedCard)} className="w-8 h-11 rounded border border-yellow-300 shrink-0" alt="" />
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs sm:text-sm font-black text-yellow-300 leading-tight truncate">
                    {getCardTitle(selectedCard)}
                  </p>
                  {ANY_TIME_CARDS.includes(selectedCard.type) && (
                    <span className="text-[9px] bg-red-600 text-white font-black px-1.5 py-0.2 rounded-full shrink-0 animate-pulse">⚡ في أي وقت</span>
                  )}
                  {selectedHasNaturalSet && (
                    <span className="text-[9px] bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black px-2 py-0.5 rounded-full shrink-0 shadow animate-bounce">⭐ لِمّة جاهزة!</span>
                  )}
                  <button onClick={() => { setInspectCard(selectedCard); setCardDetailModal(true); }}
                          className="bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/50 text-yellow-300 text-[10px] font-black px-1.5 py-0.2 rounded-md transition flex items-center gap-0.5 shadow shrink-0">
                    <span>ℹ️</span>
                    <span>تفاصيل</span>
                  </button>
                </div>
                <p className="text-[10px] text-emerald-300 font-bold truncate">
                  {selectedHasNaturalSet ? '⭐ معاك 4 كروت كاملة! اضغط على زرار تنزيل اللِمّة!' :
                   selectedCard.type === 'number' ? '👈 اضغط على أي لاعب فوق لطلبه!' : 
                   selectedCard.type === 'kdab' ? '🛡️ كارت رد فعل دفاعي! احتفظ بيه في إيدك، ولما حد يطلب منك رقم هتقدر تكدب عليه وتلبّسه CATCH!' :
                   ['msh_shaifak', 'kefaya_3leik', 'hat_enta', 'sayad', 'bos_bosa', 'badl_edain'].includes(selectedCard.type) ? '👈 اضغط على اللاعب المستهدف فوق لتنفيذ الكارت عليه!' :
                   (ACTION_INFO[selectedCard.type]?.desc || '')}
                </p>
              </div>
            </div>

            {/* In-bar Mini Value Selector for Special & Hat Enta */}
            {['special', 'hat_enta'].includes(selectedCard.type) && (
              <div className="flex items-center gap-1 overflow-x-auto max-w-[150px] px-1">
                {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
                  <button key={num} onClick={() => setCustomValue(num)}
                    className={`shrink-0 w-6 h-6 rounded-lg text-xs font-black transition ${customValue === num ? 'bg-yellow-400 text-black scale-110' : 'bg-purple-900 text-white hover:bg-purple-700'}`}>
                    {num === 11 ? 'كا' : num === 12 ? 'تش' : num}
                  </button>
                ))}
              </div>
            )}

            {/* Instant Action Fire Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {selectedHasNaturalSet && (
                <button onClick={() => {
                  soundFx.init();
                  soundFx.play('celebration');
                  socketRef.current.emit('claim_natural_set', { number: selectedCard.value });
                  setSelectedCard(null);
                }} className="btn-gold px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black shadow-2xl animate-pulse flex items-center gap-1.5 border-2 border-yellow-200">
                  <span>⭐</span>
                  <span>نزل اللِمّة دلوقتي!</span>
                </button>
              )}
              {selectedCard.type === 'magnatees' && (
                <button onClick={() => setMagnetModal(true)} className="btn-gold px-3.5 py-1.5 rounded-xl text-xs font-black shadow-lg animate-pulse">
                  🧲 اختر الرقم واسحب من الكل!
                </button>
              )}
              {selectedCard.type === 'special' && (
                <button onClick={() => setSpecialModal(true)} className="btn-gold px-3.5 py-1.5 rounded-xl text-xs font-black shadow-lg">
                  {customValue !== null ? `💎 رقم [${customValue === 11 ? 'كا' : customValue === 12 ? 'تش' : customValue}]` : '💎 اختر الرقم للطلب'}
                </button>
              )}
              {selectedCard.type === 'joker' && (
                <button onClick={() => setJokerModal(true)} className="btn-gold px-3.5 py-1.5 rounded-xl text-xs font-black shadow-lg animate-pulse">
                  🃏 قفل لِمّة بالجوكر (اختياري)
                </button>
              )}
              {selectedCard.type === 'herbaiya' && (
                <button onClick={() => { setChameleonSelectedAction(null); setChameleonModal(true); }} className="btn-gold px-3.5 py-1.5 rounded-xl text-xs font-black shadow-lg animate-pulse">
                  🦎 قلد كارت من الأرض
                </button>
              )}
              {selectedCard.type === 'badl_edain' && (
                <button onClick={() => setSwapModal(true)} className="btn-gold px-3.5 py-1.5 rounded-xl text-xs font-black shadow-lg animate-pulse flex items-center gap-1">
                  <span>🤝</span>
                  <span>خيارات التبديل</span>
                </button>
              )}
              {['el3ab_tani', 'od_le7afak', 'mana3a', 'lef_w_erga3'].includes(selectedCard.type) && (
                <button onClick={() => handlePlaySelfAction(selectedCard)} className="btn-gold px-3.5 py-1.5 rounded-xl text-xs font-black shadow-lg">
                  العب الكارت ⚡
                </button>
              )}
              {['msh_shaifak', 'kefaya_3leik', 'hat_enta'].includes(selectedCard.type) && (
                <button onClick={() => {
                  const targetP = roomState.players.find((p, idx) => idx !== roomState.players.findIndex(meP => meP.id === socketRef.current?.id));
                  if (targetP) {
                    const tIdx = roomState.players.indexOf(targetP);
                    handleOpponentSeatClick(tIdx);
                  }
                }} className="btn-ruby px-3 py-1.5 rounded-xl text-xs font-black shadow-lg text-white">
                  العب فوراً ⚡
                </button>
              )}
              <button onClick={() => { setSelectedCard(null); setCustomValue(null); }} className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition">
                ✕
              </button>
            </div>
          </div>
        )}
      </footer>

      {/* Game Log Drawer */}
      {showLog && (
        <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] z-[250] bg-[#120424]/95 backdrop-blur-md border-r-2 border-amber-500/30 flex flex-col shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-base font-bold text-amber-200">📜 سجل أحداث الجولة</h3>
            <button onClick={() => setShowLog(false)} className="text-white/60 hover:text-white text-xl">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {(roomState.logs || []).slice().reverse().map((log, i) => (
              <p key={i} className="text-xs text-amber-100/90 font-semibold bg-white/5 rounded-xl px-3 py-2 leading-relaxed border border-white/5">
                {log}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Card Duel & Ask Showdown (Phase 4 — كارت المواجهة، علامة صح أو غلط، وطيران الكارت) */}
      {askShowdown && (
        <div className="fixed inset-0 pointer-events-none z-[330] flex items-center justify-center p-3 select-none">
          {/* Subtle Darkening backdrop */}
          <div className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${
            askShowdown.stage === 'flying' ? 'opacity-0' : 'opacity-100'
          }`} />

          <div
            className={`relative flex flex-col items-center transition-all duration-300 ${
              askShowdown.stage === 'flying' ? 'pointer-events-none' : 'duel-card-pop'
            }`}
            style={
              askShowdown.stage === 'flying' && askShowdown.success
                ? {
                    transform: getAskerFlyTransform(askShowdown.askerId),
                    opacity: 0,
                    transition: 'transform 0.75s cubic-bezier(0.2, 0.85, 0.25, 1), opacity 0.75s ease'
                  }
                : {}
            }>
            
            {/* 1. Header Matchup Duel Pill */}
            <div className={`mb-3 flex items-center gap-2 bg-[#1b0409]/95 border-2 ${
              askShowdown.stage === 'verdict' && askShowdown.success 
                ? 'border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.8)]' 
                : askShowdown.stage === 'verdict' && !askShowdown.success 
                  ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.8)]' 
                  : 'border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.6)]'
            } rounded-2xl px-3.5 py-1.5 backdrop-blur-md`}>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl">{askShowdown.askerAvatar || '👤'}</span>
                <span className="text-xs sm:text-sm font-black text-yellow-300 max-w-[85px] truncate">{askShowdown.askerName}</span>
              </div>
              
              <div className="flex items-center gap-1 px-1.5 bg-black/40 rounded-full py-0.5 border border-white/10">
                <span className="text-[10px] text-amber-200 font-bold">طلب كارت</span>
                <span className="text-yellow-400 font-black animate-pulse">👈</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-white/95 max-w-[85px] truncate">{askShowdown.targetName}</span>
                <span className="text-xl sm:text-2xl">{askShowdown.targetAvatar || '👤'}</span>
              </div>
            </div>

            {/* 2. The Big Card in Center */}
            <div className="relative">
              <div className={`relative transition-all duration-300 ${
                askShowdown.stage === 'suspense' ? 'scale-105 animate-pulse' : ''
              }`}>
                <img
                  src={getCardImage({ type: 'number', value: askShowdown.cardValue })}
                  className={`w-28 h-40 sm:w-36 sm:h-52 rounded-2xl border-4 transition-all duration-300 object-cover ${
                    askShowdown.stage === 'verdict' && askShowdown.success
                      ? 'border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.95)] ring-4 ring-emerald-300/60'
                      : askShowdown.stage === 'verdict' && !askShowdown.success
                        ? 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.95)] grayscale-[0.2]'
                        : 'border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.85)]'
                  }`}
                  alt=""
                />

                {/* Big Corner Badge with Number */}
                <div className="absolute top-2 right-2 pointer-events-none">
                  <span className="bg-black/95 text-yellow-300 font-black text-base sm:text-lg px-2.5 py-0.5 rounded-lg border-2 border-yellow-400 shadow-xl block leading-tight">
                    {askShowdown.cardValue === 11 ? 'كا' : askShowdown.cardValue === 12 ? 'تش' : askShowdown.cardValue}
                  </span>
                </div>

                {/* Suspense Spinner / Overlay */}
                {askShowdown.stage === 'suspense' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-2xl backdrop-blur-[1px]">
                    <span className="text-4xl animate-bounce">❓</span>
                    <span className="text-[11px] font-black text-yellow-300 mt-1 bg-black/85 px-2.5 py-0.5 rounded-full border border-yellow-400/60 shadow">
                      معاه ولا معندوش؟
                    </span>
                  </div>
                )}

                {/* 3. VERDICT STAMPS: Success (✔️) or CATCH (❌) */}
                {askShowdown.stage !== 'suspense' && askShowdown.success && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/35 rounded-2xl verdict-stamp-slam">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 border-4 border-white shadow-[0_0_40px_#10b981] flex flex-col items-center justify-center transform -rotate-12">
                      <span className="text-4xl sm:text-5xl font-black text-white leading-none">✔️</span>
                      <span className="text-[10px] font-black text-emerald-100 uppercase tracking-wider mt-0.5">معاه!</span>
                    </div>
                  </div>
                )}

                {askShowdown.stage !== 'suspense' && !askShowdown.success && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/45 rounded-2xl verdict-stamp-slam">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 border-4 border-white shadow-[0_0_40px_#ef4444] flex flex-col items-center justify-center transform rotate-12">
                      <span className="text-4xl sm:text-5xl font-black text-white leading-none">❌</span>
                      <span className="text-[10px] font-black text-red-100 uppercase tracking-wider mt-0.5">CATCH!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Verdict Outcome Text Banner */}
            {askShowdown.stage !== 'suspense' && (
              <div className="mt-3.5 animate-bounce">
                {askShowdown.success ? (
                  <div className="bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 text-white font-black text-xs sm:text-sm px-4 py-2 rounded-2xl border-2 border-white shadow-[0_0_25px_rgba(16,185,129,0.9)] flex items-center gap-2">
                    <span className="text-base">👏</span>
                    <span>معاه الكارت! سلم {askShowdown.count} {askShowdown.count === 1 ? 'كارت' : 'كروت'} لـ {askShowdown.askerName}!</span>
                    <span className="text-base animate-pulse">🚀</span>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white font-black text-xs sm:text-sm px-4 py-2 rounded-2xl border-2 border-white shadow-[0_0_25px_rgba(239,68,68,0.9)] flex items-center gap-2">
                    <span className="text-base">🚫</span>
                    <span>معندهوش! CATCH على {askShowdown.askerName}! غرامة سحب كارت 📥</span>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Dramatic Comic CATCH Stamp (Fallback only if askShowdown is not active) */}
      {!askShowdown && catchStamp && (
        <div className="fixed inset-0 pointer-events-none z-[320] flex items-center justify-center p-3 sm:p-4">
          <div className="catch-stamp-anim bg-gradient-to-br from-red-600 via-amber-500 to-red-700 text-white font-black px-5 sm:px-8 py-4 sm:py-6 rounded-3xl border-4 border-yellow-300 shadow-[0_0_90px_rgba(239,68,68,0.95)] text-center max-w-[90vw] sm:max-w-md w-full">
            <span className="text-4xl sm:text-6xl block tracking-widest drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] animate-pulse">💥 CATCH!</span>
            {catchStamp.askerName && catchStamp.targetName && (
              <p className="text-xs sm:text-sm font-bold text-amber-100 mt-1">
                {catchStamp.askerName} 🔍 طلب من {catchStamp.targetName}
              </p>
            )}
            <p className="text-xs sm:text-base font-black text-black bg-yellow-300 px-3 sm:px-4 py-1.5 rounded-xl mt-2 inline-block shadow-lg border border-yellow-100">
              طلع معندوش رقم [ {(() => {
                const val = catchStamp.value ?? catchStamp.number;
                return val === 11 ? 'كا' : val === 12 ? 'تش' : val;
              })()} ]! غرامة سحب كارت 📥
            </p>
          </div>
        </div>
      )}

      {/* Set Completion Burst Animation & Confetti (Phase 1) */}
      {setExplosion && (
        <div className="fixed inset-0 pointer-events-none z-[310] flex items-center justify-center p-4">
          <div className="relative">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="confetti-particle absolute w-3 h-3 rounded-sm"
                   style={{
                     backgroundColor: ['#facc15', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899'][i % 7],
                     '--cx': `${Math.cos(i * 15 * Math.PI / 180) * (140 + (i % 6) * 35)}px`,
                     '--cy': `${Math.sin(i * 15 * Math.PI / 180) * (140 + (i % 6) * 35)}px`,
                     '--crot': `${i * 60}deg`
                   }} />
            ))}
            <div className="set-burst-banner bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600 text-black font-black px-8 py-5 rounded-3xl border-4 border-yellow-100 shadow-[0_0_80px_rgba(250,204,21,0.95)] text-center">
              <div className="text-4xl mb-1">{setExplosion.pAvatar || setExplosion.avatar || '⭐'} ⭐</div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-wider drop-shadow">🎉 لِمّة جديدة مقفولة!</h3>
              <p className="text-sm sm:text-base font-black text-amber-950 mt-1">
                {setExplosion.pName || setExplosion.playerName} قفل لِمّة سرية جديدة بنجاح! {setExplosion.isJoker ? '🃏 بالجوكر!' : '🔥!'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Flying Cards Flight (Phase 1) */}
      {flyingCards.map(fc => (
        <div key={fc.id} className="card-flying-node fixed"
             style={{
               left: '50%', top: '50%',
               '--fx': `${fc.fx}px`, '--fy': `${fc.fy}px`,
               '--mx': `${(fc.fx + fc.tx) / 2}px`, '--my': `${Math.min(fc.fy, fc.ty) - 70}px`,
               '--tx': `${fc.tx}px`, '--ty': `${fc.ty}px`
             }}>
          <img src={getCardImage(fc.card)} className="w-14 h-20 rounded-xl border-2 border-yellow-300 shadow-2xl" alt="" />
        </div>
      ))}

      {/* Egyptian Casino Banter Soundboard Drawer (Phase 3) */}
      {showBanterDrawer && (
        <div className="fixed inset-x-3 bottom-44 sm:bottom-40 sm:max-w-lg sm:mx-auto z-[250] bg-[#1a0520]/95 border-2 border-amber-400 rounded-3xl p-3.5 shadow-[0_0_40px_rgba(250,204,21,0.6)] backdrop-blur-md">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-400/30">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
              <span className="text-base">🗣️</span>
              <span>إفيهات وصوتيات كازينو كاتش:</span>
            </div>
            <button onClick={() => setShowBanterDrawer(false)} className="text-white/60 hover:text-white text-xs font-bold px-2 py-0.5 rounded-lg bg-white/10">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
            {EGYPTIAN_BANTERS.map((b, idx) => (
              <button key={idx} onClick={() => {
                socketRef.current.emit('send_meme_sticker', { stickerUrl: b.emoji, stickerText: b.text });
                soundFx.init();
                soundFx.play(b.sound || 'banter');
                setShowBanterDrawer(false);
              }} className="bg-black/60 hover:bg-amber-600/30 border border-amber-500/30 hover:border-yellow-400 text-white hover:text-yellow-300 p-2 rounded-xl text-xs font-bold text-right flex items-center gap-2 transition active:scale-95">
                <span className="text-xl shrink-0">{b.emoji}</span>
                <span className="truncate">{b.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dragging Card Ghost Cursor (Phase 2) */}
      {draggingCard && (
        <div className="dragging-ghost" style={{ left: `${dragPos.x}px`, top: `${dragPos.y}px` }}>
          <img src={getCardImage(draggingCard)} className="w-16 h-24 sm:w-20 sm:h-30 rounded-xl border-2 border-yellow-300 shadow-2xl" alt="" />
        </div>
      )}

      {/* Paper Receipt Scoreboard (Plan Image 8) */}
      {roomState.status === 'gameover' && (() => {
        const sortedWinners = [...roomState.players].sort((a,b) => (b.score||b.sets.length) - (a.score||a.sets.length));
        const first = sortedWinners[0];

        return (
          <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="receipt-paper w-full max-w-sm rounded-3xl p-5 shadow-2xl relative my-auto border-t-8 border-b-8 border-yellow-400 text-center font-cairo">
              
              {/* Receipt Header */}
              <div className="border-b-2 border-dashed border-gray-300 pb-3 mb-3">
                <div className="font-mono text-xs tracking-widest text-gray-400 select-none mb-1">
                  ||| | |||| || ||| || |||| | ||
                </div>
                <span className="text-3xl block mb-0.5">🧾</span>
                <h2 className="text-xl font-black text-gray-900 tracking-wide">
                  فاتورة الحساب - انتهت الجولة
                </h2>
                <p className="text-xs text-gray-500 font-bold mt-0.5">
                  كازينو كاتش الملكي VIP • طاولة #{roomState.code}
                </p>
                {first && (
                  <div className="text-sm font-black text-emerald-700 mt-2 bg-emerald-50 py-1.5 px-2 rounded-xl border border-emerald-200 shadow-sm">
                    🏆 البطل المتوج: {first.name} {first.avatar}
                  </div>
                )}
              </div>

              {/* Player Score Breakdown Table (Image 8 style) */}
              <div className="space-y-1.5 mb-3.5">
                <div className="grid grid-cols-4 text-[11px] font-black text-gray-400 border-b pb-1 px-1">
                  <span className="text-right">اللاعب</span>
                  <span>اللِمّات</span>
                  <span>المضاعف</span>
                  <span>المجموع</span>
                </div>
                {sortedWinners.map((p, idx) => {
                  const hasKaTch = p.sets?.includes(11) && p.sets?.includes(12);
                  const isTop = idx === 0;
                  return (
                    <div key={p.id} className={`grid grid-cols-4 items-center p-2 rounded-xl text-xs font-bold transition ${
                      isTop ? 'bg-amber-100 border border-amber-300 text-gray-900 shadow-sm' : 'bg-gray-50 text-gray-700'
                    }`}>
                      <div className="flex items-center gap-1 text-right truncate">
                        <span>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👤'}</span>
                        <span className="truncate font-black">{p.name}</span>
                      </div>
                      <span className="font-bold text-gray-600">{p.sets?.length || 0}</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${hasKaTch ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-600'}`}>
                        {hasKaTch ? '2X 🔥' : '1X'}
                      </span>
                      <span className="font-black text-amber-600 text-sm">⭐ {p.score || p.sets?.length || 0}</span>
                    </div>
                  );
                })}
              </div>

              {/* Joker Secret Bluff Reveal Banner */}
              {roomState.jokerUsers && roomState.jokerUsers.length > 0 && (
                <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-950 border-2 border-yellow-400 rounded-2xl p-2.5 mb-3 text-right text-xs shadow-md">
                  <div className="flex items-center justify-between text-yellow-300 font-black text-xs mb-1.5 pb-1 border-b border-purple-500/40">
                    <span className="flex items-center gap-1">
                      <span>🃏</span>
                      <span>كشف أسرار الجوكر المخفية!</span>
                    </span>
                    <span className="text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 rounded-full font-black">خدع ومفاجآت</span>
                  </div>
                  <div className="space-y-1.5">
                    {roomState.jokerUsers.map((j, idx) => {
                      const valLabel = j.value === 11 ? 'كا' : j.value === 12 ? 'تش' : `${j.value}`;
                      return (
                        <div key={idx} className="flex items-center justify-between bg-black/50 px-2 py-1 rounded-xl text-[11px] text-white border border-white/5">
                          <span className="font-bold text-amber-200 flex items-center gap-1">
                            <span>{j.playerAvatar || '👤'}</span>
                            <span>{j.playerName}</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-purple-200 font-bold">
                              لِمّة <span className="text-yellow-300 bg-purple-900 px-1 py-0.2 rounded font-black border border-yellow-400/40">[{valLabel}]</span>
                            </span>
                            {j.busted ? (
                              <span className="bg-red-600/90 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full shadow border border-red-300 flex items-center gap-0.5 animate-pulse">
                                <span>🎯</span>
                                <span>اتقفش من {j.bustedBy}!</span>
                              </span>
                            ) : (
                              <span className="bg-emerald-600/90 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full shadow border border-emerald-300">
                                نفد باللِمّة! 💰
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Egyptian Humor & Countdown Joke Card (Image 8 style) */}
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-2.5 mb-3 text-right text-xs">
                <p className="font-black text-amber-900 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>تنبيه من إدارة كازينو كاتش:</span>
                </p>
                <p className="text-gray-700 text-[11px] font-bold mt-1 leading-relaxed">
                  الحاج فزاع والمعلم شنب بيحلفوا الدور الجاي مفيش رحمة.. جاري شحن الحظ والورق! 🎲
                </p>
              </div>

              {/* Lifetime Stats Counter Bar */}
              <div className="bg-gray-100 border border-gray-200 rounded-2xl p-2 mb-3.5 flex items-center justify-around text-center text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block">إجمالي فوزك</span>
                  <span className="text-xs font-black text-amber-600">🏆 {stats.wins}</span>
                </div>
                <div className="border-x border-gray-300 px-3">
                  <span className="text-[10px] text-gray-500 font-bold block">جولاتك</span>
                  <span className="text-xs font-black text-gray-800">🎮 {stats.games}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block">رتبتك</span>
                  <span className="text-[10px] font-black text-amber-700 block mt-0.5">{vipRank.badge}</span>
                </div>
              </div>

              {/* Rematch & Navigation Action Buttons */}
              <div className="space-y-2">
                {isHost ? (
                  <button onClick={() => socketRef.current.emit('rematch')} className="btn-3d-green w-full py-3 rounded-2xl text-base font-black flex items-center justify-center gap-2 transition">
                    <span>🔄</span>
                    <span>العب دور جديد (ريماتش فوراً)</span>
                  </button>
                ) : (
                  <div className="bg-amber-100 border border-amber-300 rounded-2xl p-2.5 text-center text-amber-900 font-bold text-xs animate-pulse">
                    ⏳ في انتظار المضيف لبدء دور ريماتش جديد...
                  </div>
                )}

                <button onClick={handleLeaveRoom} className="btn-3d-orange w-full py-2.5 rounded-2xl text-xs font-black transition">
                  🚪 خروج إلى شاشة الطاولات
                </button>
              </div>

              {/* Barcode graphic footer */}
              <div className="pt-3 mt-3 border-t border-dashed border-gray-300 flex flex-col items-center">
                <div className="font-mono text-xs tracking-widest text-gray-400 select-none">
                  |||| || | ||| |||| | ||
                </div>
                <span className="text-[9px] text-gray-400 mt-0.5">نتمنى لكم حظاً سعيداً في الجولة القادمة!</span>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Card Details & Superpowers Modal */}
      {cardDetailModal && inspectCard && (() => {
        const details = getCardDetailedInfo(inspectCard);
        if (!details) return null;
        return (
          <div className="fixed inset-0 z-[320] bg-black/85 backdrop-blur-md flex items-center justify-center p-3">
            <div className="bg-gradient-to-b from-[#2d050c] via-[#1a0306] to-[#0f0103] border-3 border-yellow-400 rounded-3xl p-4 sm:p-5 w-full max-w-md shadow-[0_0_60px_rgba(250,204,21,0.65)] text-center relative overflow-hidden flex flex-col max-h-[92vh]">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-amber-500/30 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">ℹ️</span>
                  <div className="text-right">
                    <h3 className="text-base sm:text-lg font-black text-amber-300 leading-tight">تفاصيل وقوة الكارت</h3>
                    <p className="text-[11px] text-amber-200/80 font-bold">دليل خواص وتكتيكات كاتش</p>
                  </div>
                </div>
                <button onClick={() => setCardDetailModal(false)}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white text-lg font-black flex items-center justify-center transition">
                  ✕
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto space-y-3 pr-1 text-right flex-1">
                
                {/* Big Card Visual Showcase */}
                <div className="flex flex-col items-center justify-center py-1">
                  <div className="relative group">
                    <img src={getCardImage(inspectCard)} 
                         className="w-24 h-36 sm:w-28 sm:h-40 rounded-2xl border-2 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.7)] object-cover transform hover:scale-105 transition duration-300" 
                         alt="" />
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-md whitespace-nowrap ${details.badgeClass}`}>
                        {details.category}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-lg sm:text-xl font-black text-yellow-300 mt-4 leading-tight">
                    {details.name}
                  </h4>
                  
                  {/* When to Play Badge */}
                  <div className="flex items-center gap-1.5 mt-1 bg-black/60 px-3 py-1 rounded-full border border-amber-500/30 text-xs font-bold text-amber-200">
                    <span>⏱️ وقت اللعب:</span>
                    <span className="text-yellow-400 font-black">{details.when}</span>
                  </div>
                </div>

                {/* Power & Effect Box */}
                <div className="bg-black/50 border border-amber-500/40 rounded-2xl p-3 shadow-md space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-yellow-300">
                    <span>⚡</span>
                    <span>قوة وتأثير الكارت:</span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-white/95 leading-relaxed">
                    {details.power}
                  </p>
                </div>

                {/* Pro Tactical Tip Box */}
                <div className="bg-gradient-to-r from-amber-950/60 to-yellow-950/40 border border-yellow-500/50 rounded-2xl p-3 shadow-md space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                    <span>💡</span>
                    <span>نصيحة الحريف (تكتيك الفوز):</span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-amber-100/95 leading-relaxed">
                    {details.proTip}
                  </p>
                </div>

                {/* Fast Switcher for Cards in My Hand */}
                {me?.hand && me.hand.length > 0 && (
                  <div className="pt-2 border-t border-amber-500/20">
                    <p className="text-xs font-black text-amber-200 mb-1.5">
                      🃏 تصفح باقي الكروت اللي في إيدك:
                    </p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {me.hand.map((c) => (
                        <button key={c.id} onClick={() => setInspectCard(c)}
                                className={`shrink-0 p-1 rounded-xl border transition ${inspectCard?.id === c.id ? 'border-yellow-400 bg-yellow-400/20 scale-105 shadow-md' : 'border-white/10 bg-black/40 hover:bg-black/60'}`}>
                          <img src={getCardImage(c)} className="w-10 h-14 rounded-lg object-cover" alt="" />
                          <span className="block text-[8px] font-black text-center text-amber-200 mt-0.5 max-w-[42px] truncate">
                            {getCardTitle(c)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Action Cards Encyclopedia Picker */}
                <div className="pt-2 border-t border-amber-500/20">
                  <p className="text-xs font-black text-amber-200 mb-1.5">
                    📖 استعراض جميع كروت الأكشن في اللعبة:
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto p-1">
                    {Object.keys(CARD_DETAILS_GUIDE).map(typeKey => (
                      <button key={typeKey} onClick={() => setInspectCard({ type: typeKey })}
                              className={`px-2 py-1.5 rounded-xl text-[10px] font-black border transition truncate ${inspectCard?.type === typeKey ? 'btn-gold' : 'bg-black/40 border-amber-500/30 text-amber-200 hover:bg-amber-500/20'}`}>
                        {CARD_DETAILS_GUIDE[typeKey].name}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Bottom Close Button */}
              <button onClick={() => setCardDetailModal(false)}
                      className="w-full mt-3 btn-gold py-2 rounded-2xl text-xs font-black shadow-lg shrink-0">
                فهمت، شكراً! 🚀
              </button>

            </div>
          </div>
        );
      })()}

      {/* Dedicated Magnet Number Selection Modal */}
      {magnetModal && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#2e050c] via-[#1a0206] to-[#100103] border-3 border-yellow-400 rounded-3xl p-5 w-full max-w-md shadow-[0_0_50px_rgba(250,204,21,0.6)] text-center">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
              <div className="flex items-center gap-2">
                <span className="text-3xl">🧲</span>
                <div className="text-right">
                  <h3 className="text-lg font-black text-amber-300">كارت المغناطيس الجبار</h3>
                  <p className="text-xs text-amber-200/80 font-bold">اطلب أي رقم في إيدك عشان تسحبه من كل اللاعبين فوراً!</p>
                </div>
              </div>
              <button onClick={() => setMagnetModal(false)} className="text-white/60 hover:text-white text-2xl font-bold">✕</button>
            </div>

            {/* Distinct Numbers in Hand */}
            <div className="my-4">
              <p className="text-xs font-black text-amber-200 mb-2.5 text-right">
                👇 الأرقام المتوفرة في إيدك الآن (اضغط لسحبه من جميع اللاعبين):
              </p>
              
              {handNumberCards.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {handNumberCards.map(({ value, count, sampleCard }) => (
                    <button key={value} onClick={() => executeMagnet(value)}
                      className="btn-gold p-2.5 rounded-2xl flex items-center justify-between gap-2 shadow-lg hover:scale-105 active:scale-95 transition">
                      <img src={getCardImage(sampleCard)} className="w-8 h-12 rounded-lg border border-amber-700 shadow shrink-0" alt="" />
                      <div className="text-right flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-950 truncate leading-tight">
                          {value === 11 ? 'كارت كا' : value === 12 ? 'كارت تش' : `رقم ${value}`}
                        </p>
                        <p className="text-[10px] text-amber-900 font-bold mt-0.5">معاك {count} {count === 1 ? 'كارت' : 'كروت'}</p>
                      </div>
                      <span className="text-base">🧲</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-red-950/60 border border-red-500/40 rounded-2xl p-3 text-red-200 text-xs font-bold mb-2">
                  ⚠️ معندكش كروت أرقام حالياً في إيدك!
                </div>
              )}
            </div>

            {/* Or Select from 0 to 12 Grid */}
            <div className="pt-3 border-t border-white/10">
              <p className="text-[11px] font-bold text-amber-200/70 mb-2 text-right">
                أو اختر أي رقم آخر (0 - 12):
              </p>
              <div className="grid grid-cols-7 gap-1.5">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                  <button key={num} onClick={() => executeMagnet(num)}
                    className="bg-black/60 hover:bg-amber-500 border border-amber-500/40 hover:border-yellow-300 text-amber-200 hover:text-black py-2 rounded-xl text-xs font-black transition shadow">
                    {num === 11 ? 'كا' : num === 12 ? 'تش' : num}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setMagnetModal(false)} className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white/80 py-2.5 rounded-2xl text-xs font-bold border border-white/10 transition">
              إلغاء ✕
            </button>

          </div>
        </div>
      )}

      {/* Dedicated Special Number Selection Modal */}
      {specialModal && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#2e050c] via-[#1a0206] to-[#100103] border-3 border-cyan-400 rounded-3xl p-5 w-full max-w-md shadow-[0_0_50px_rgba(34,211,238,0.5)] text-center">
            
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30">
              <div className="flex items-center gap-2">
                <span className="text-3xl">💎</span>
                <div className="text-right">
                  <h3 className="text-lg font-black text-cyan-300">كارت سبيشيال</h3>
                  <p className="text-xs text-cyan-200/80 font-bold">اطلب رقم مش في إيدك من أي لاعب!</p>
                </div>
              </div>
              <button onClick={() => setSpecialModal(false)} className="text-white/60 hover:text-white text-2xl font-bold">✕</button>
            </div>

            <div className="my-4">
              <p className="text-xs font-black text-cyan-200 mb-2.5 text-right">
                اختر الرقم الذي ترغب في طلبه من الخصم (ثم اضغط على الخصم):
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                  <button key={num} onClick={() => executeSpecial(num)}
                    className={`py-3 rounded-2xl text-sm font-black transition shadow border ${customValue === num ? 'bg-cyan-400 text-black border-white scale-105' : 'bg-black/60 hover:bg-cyan-600 border-cyan-500/40 text-cyan-200 hover:text-white'}`}>
                    {num === 11 ? 'كا (11)' : num === 12 ? 'تش (12)' : `رقم ${num}`}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setSpecialModal(false)} className="w-full mt-2 bg-white/10 hover:bg-white/20 text-white/80 py-2.5 rounded-2xl text-xs font-bold border border-white/10 transition">
              إلغاء ✕
            </button>

          </div>
        </div>
      )}

      {/* Dedicated Joker Optional Set Selection Modal */}
      {jokerModal && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#2e1d05] via-[#1c1202] to-[#0f0900] border-3 border-yellow-400 rounded-3xl p-5 w-full max-w-md shadow-[0_0_55px_rgba(250,204,21,0.65)] text-center">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-yellow-500/30">
              <div className="flex items-center gap-2">
                <span className="text-3xl">🃏</span>
                <div className="text-right">
                  <h3 className="text-lg font-black text-yellow-300">كارت الجوكر الذهبي (Joker)</h3>
                  <p className="text-xs text-amber-200/85 font-bold">الجوكر اختياري! تقدر تقفل بيه أي سيت ناقص (3 كروت + الجوكر = لِمّة)</p>
                </div>
              </div>
              <button onClick={() => setJokerModal(false)} className="text-white/60 hover:text-white text-2xl font-bold">✕</button>
            </div>

            {/* Content Area */}
            <div className="my-4">
              {handThreeSets.length > 0 ? (
                <>
                  <p className="text-xs font-black text-amber-200 mb-2.5 text-right">
                    👇 الأرقام المتوفرة في إيدك (3 كروت) وجاهزة للقفل بالجوكر:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
                    {handThreeSets.map(({ value, count, sampleCard }) => (
                      <button key={value} onClick={() => executeJoker(value)}
                        className="btn-gold p-3 rounded-2xl flex items-center justify-between gap-2.5 shadow-lg hover:scale-[1.03] active:scale-95 transition">
                        <img src={getCardImage(sampleCard)} className="w-9 h-13 rounded-lg border border-amber-700 shadow shrink-0" alt="" />
                        <div className="text-right flex-1 min-w-0">
                          <p className="text-sm font-black text-gray-950 truncate leading-tight">
                            {value === 11 ? 'كارت كا [11]' : value === 12 ? 'كارت تش [12]' : `رقم ${value}`}
                          </p>
                          <p className="text-[11px] text-amber-950 font-bold mt-0.5">معاك {count} كروت جاهزة!</p>
                          <span className="inline-block mt-1 bg-black/20 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                            قفل لِمّة ⭐
                          </span>
                        </div>
                        <span className="text-2xl">🃏</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-amber-950/50 border border-yellow-500/30 rounded-2xl p-4 text-center space-y-2">
                  <span className="text-3xl block">💡</span>
                  <p className="text-sm font-black text-yellow-300">
                    معندكش حالياً 3 كروت من نفس الرقم!
                  </p>
                  <p className="text-xs text-amber-200/80 font-bold leading-relaxed">
                    عشان تستخدم الجوكر، لازم تجمع 3 كروت من أي رقم في إيدك الأول.<br />
                    الجوكر هيفضل محفوظ في إيدك ومش هيتفعل إلا لما انت تقرر!
                  </p>
                </div>
              )}
            </div>

            {/* Cancel / Keep for later */}
            <button onClick={() => setJokerModal(false)} className="w-full mt-2 bg-white/10 hover:bg-white/20 text-white/90 py-2.5 rounded-2xl text-xs font-bold border border-white/10 transition flex items-center justify-center gap-1.5">
              <span>⏳</span>
              <span>احتفظ بالجوكر في إيدك لوقت تاني (إلغاء)</span>
            </button>

          </div>
        </div>
      )}

      {/* Dedicated Chameleon Discard Floor Selection Modal */}
      {chameleonModal && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#180a29] via-[#0d0417] to-[#05010a] border-3 border-purple-400 rounded-3xl p-5 w-full max-w-md shadow-[0_0_55px_rgba(168,85,247,0.65)] text-center">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/30">
              <div className="flex items-center gap-2">
                <span className="text-3xl">🦎</span>
                <div className="text-right">
                  <h3 className="text-lg font-black text-purple-300">كارت الحرباية (Chameleon)</h3>
                  <p className="text-xs text-purple-200/85 font-bold">
                    {chameleonSelectedAction 
                      ? `تنفيذ قوة: ${ACTION_INFO[chameleonSelectedAction]?.name || chameleonSelectedAction}` 
                      : 'اختر أي كارت نزل على الأرض لتقليد قوته فوراً!'}
                  </p>
                </div>
              </div>
              <button onClick={() => { setChameleonModal(false); setChameleonSelectedAction(null); }} className="text-white/60 hover:text-white text-2xl font-bold">✕</button>
            </div>

            {/* Modal Content */}
            <div className="my-4 text-right">
              {!chameleonSelectedAction ? (
                /* Step 1: List of all unique action cards on the floor */
                availableFloorActions.length > 0 ? (
                  <>
                    <p className="text-xs font-black text-purple-200 mb-2.5">
                      👇 كروت الأكشن المتوفرة في المقبرة/الأرض (اضغط لتقليد القوة):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                      {availableFloorActions.map(({ type, count, meta }) => (
                        <button key={type} 
                          onClick={() => {
                            if (['el3ab_tani', 'mana3a', 'lef_w_erga3'].includes(type)) {
                              executeChameleon(type);
                            } else {
                              setChameleonSelectedAction(type);
                            }
                          }}
                          className="bg-black/60 hover:bg-purple-900/60 border-2 border-purple-500/40 hover:border-purple-300 p-2.5 rounded-2xl flex items-center gap-2.5 shadow-lg transition hover:scale-[1.02] active:scale-95 text-right">
                          <img src={getCardImage({ type })} className="w-9 h-13 rounded-lg border border-purple-400 shadow shrink-0" alt="" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-purple-200 truncate">{meta.name}</p>
                            <p className="text-[10px] text-purple-300/80 font-bold line-clamp-1">{meta.desc}</p>
                            <span className="inline-block mt-0.5 text-[9px] bg-purple-950 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                              نزل {count} {count === 1 ? 'مرة' : 'مرات'} على الأرض
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-4 text-center space-y-2">
                    <span className="text-3xl block">💡</span>
                    <p className="text-sm font-black text-purple-300">لم ينزل أي كارت أكشن على الأرض حتى الآن!</p>
                    <p className="text-xs text-purple-200/80 font-bold leading-relaxed">
                      الأرضية فارغة حالياً. احتفظ بالحرباية في إيدك لحد ما ينزل كارت أكشن في الديسكارد وتقدر تقلده.
                    </p>
                  </div>
                )
              ) : (
                /* Step 2: Extra Input for chosen card */
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-purple-950/40 px-3 py-1.5 rounded-xl border border-purple-400/30">
                    <div className="flex items-center gap-2">
                      <img src={getCardImage({ type: chameleonSelectedAction })} className="w-7 h-10 rounded border border-purple-300" alt="" />
                      <span className="text-xs font-black text-purple-200">{ACTION_INFO[chameleonSelectedAction]?.name}</span>
                    </div>
                    <button onClick={() => setChameleonSelectedAction(null)} className="text-[11px] text-yellow-300 hover:underline font-bold">
                      ↩ اختيار كارت آخر
                    </button>
                  </div>

                  {/* If chosen card is Magnatees -> Pick Number */}
                  {chameleonSelectedAction === 'magnatees' && (
                    <div>
                      <p className="text-xs font-black text-amber-200 mb-2">اختر الرقم لسحبه من جميع اللاعبين بالمغناطيس:</p>
                      <div className="grid grid-cols-7 gap-1.5">
                        {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
                          <button key={num} onClick={() => executeChameleon('magnatees', undefined, num)}
                            className="bg-black/60 hover:bg-amber-500 border border-amber-500/40 hover:border-yellow-300 text-amber-200 hover:text-black py-2 rounded-xl text-xs font-black transition shadow">
                            {num === 11 ? 'كا' : num === 12 ? 'تش' : num}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* If chosen card targets an opponent -> Pick Opponent */}
                  {['sayad', 'badl_edain', 'msh_shaifak', 'kefaya_3leik', 'bos_bosa'].includes(chameleonSelectedAction) && (
                    <div>
                      <p className="text-xs font-black text-purple-200 mb-2">اضغط على الخصم المستهدف:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {roomState.players.map((p, idx) => {
                          if (p.id === socketRef.current?.id) return null;
                          return (
                            <button key={p.id} onClick={() => executeChameleon(chameleonSelectedAction, idx)}
                              className="bg-black/60 hover:bg-purple-800/50 border border-purple-500/40 hover:border-purple-300 p-2.5 rounded-2xl flex flex-col items-center gap-1 transition shadow hover:scale-105 active:scale-95">
                              <span className="text-3xl">{p.avatar}</span>
                              <span className="text-xs font-black text-white truncate max-w-full">{p.name}</span>
                              <span className="text-[10px] text-purple-300">🃏 {p.cardCount} كروت</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* If chosen card is Special -> Pick Number, then Pick Opponent */}
                  {chameleonSelectedAction === 'special' && (
                    chameleonValue === null ? (
                      <div>
                        <p className="text-xs font-black text-cyan-200 mb-2">اختر الرقم لطلبه بسبيشيال:</p>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
                            <button key={num} onClick={() => setChameleonValue(num)}
                              className="bg-black/60 hover:bg-cyan-500 border border-cyan-500/40 hover:border-cyan-300 text-cyan-200 hover:text-black py-2 rounded-xl text-xs font-black transition shadow">
                              {num === 11 ? 'كا' : num === 12 ? 'تش' : num}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-black text-cyan-200">اختر الخصم لطلب رقم [ {chameleonValue === 11 ? 'كا' : chameleonValue === 12 ? 'تش' : chameleonValue} ] منه:</p>
                          <button onClick={() => setChameleonValue(null)} className="text-[10px] text-yellow-300 underline">تغيير الرقم</button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {roomState.players.map((p, idx) => {
                            if (p.id === socketRef.current?.id) return null;
                            return (
                              <button key={p.id} onClick={() => executeChameleon('special', idx, chameleonValue)}
                                className="bg-black/60 hover:bg-cyan-800/50 border border-cyan-500/40 hover:border-cyan-300 p-2.5 rounded-2xl flex flex-col items-center gap-1 transition shadow hover:scale-105 active:scale-95">
                                <span className="text-3xl">{p.avatar}</span>
                                <span className="text-xs font-black text-white truncate max-w-full">{p.name}</span>
                                <span className="text-[10px] text-cyan-300">🃏 {p.cardCount} كروت</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Cancel Button */}
            <button onClick={() => { setChameleonModal(false); setChameleonSelectedAction(null); }} className="w-full mt-2 bg-white/10 hover:bg-white/20 text-white/90 py-2.5 rounded-2xl text-xs font-bold border border-white/10 transition">
              إلغاء والاحتفاظ بالحرباية ✕
            </button>

          </div>
        </div>
      )}

      {/* Dedicated Swap Hands (بدل إيدي) Modal */}
      {swapModal && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#1a1202] via-[#100a01] to-[#080500] border-3 border-amber-400 rounded-3xl p-5 w-full max-w-md shadow-[0_0_55px_rgba(245,158,11,0.65)] text-center font-cairo">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
              <div className="flex items-center gap-2">
                <span className="text-3xl">🤝</span>
                <div className="text-right">
                  <h3 className="text-lg font-black text-amber-300">كارت بدل إيدي (Swap Hands)</h3>
                  <p className="text-xs text-amber-200/85 font-bold">اختر نوع التبديل واللاعبين المستهدفين</p>
                </div>
              </div>
              <button onClick={() => { setSwapModal(false); setSwapTarget1(null); setSwapTarget2(null); }} className="text-white/60 hover:text-white text-2xl font-bold">✕</button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 gap-2 my-3 p-1 bg-black/50 rounded-2xl border border-amber-500/30">
              <button 
                onClick={() => { setSwapMode('with_me'); setSwapTarget1(null); setSwapTarget2(null); }}
                className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                  swapMode === 'with_me' 
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg scale-[1.02]' 
                    : 'text-amber-200/70 hover:text-white'
                }`}>
                <span>🔄</span>
                <span>بدّل إيدي مع لاعب</span>
              </button>
              <button 
                onClick={() => { setSwapMode('two_others'); setSwapTarget1(null); setSwapTarget2(null); }}
                className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                  swapMode === 'two_others' 
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg scale-[1.02]' 
                    : 'text-amber-200/70 hover:text-white'
                }`}>
                <span>🔀</span>
                <span>بدّل ورق اتنين ببعض</span>
              </button>
            </div>

            {/* Mode 1: Swap With Me */}
            {swapMode === 'with_me' && (
              <div className="my-3 text-right">
                <p className="text-xs font-black text-amber-200 mb-2">
                  اختر اللاعب الذي تريد أن تأخذ كل ورقه وتعطيه كل ورقك:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
                  {roomState.players.map((p, idx) => {
                    if (p.id === socketRef.current?.id) return null;
                    const isSelected = swapTarget1 === idx;
                    return (
                      <button 
                        key={p.id} 
                        onClick={() => setSwapTarget1(idx)}
                        className={`p-2.5 rounded-2xl flex flex-col items-center gap-1 transition shadow border ${
                          isSelected 
                            ? 'bg-amber-500/30 border-amber-300 ring-2 ring-yellow-400 scale-105' 
                            : 'bg-black/50 border-white/10 hover:border-amber-400/50'
                        }`}>
                        <span className="text-2xl">{p.avatar}</span>
                        <span className="text-xs font-black text-white truncate max-w-full">{p.name}</span>
                        <span className="text-[10px] text-amber-300">🃏 {p.cardCount} كروت</span>
                      </button>
                    );
                  })}
                </div>

                <button 
                  disabled={swapTarget1 === null}
                  onClick={() => {
                    const card = selectedCard?.type === 'badl_edain' ? selectedCard : me?.hand?.find(c => c.type === 'badl_edain');
                    if (!card || swapTarget1 === null) return;
                    soundFx.init();
                    soundFx.play('impact');
                    socketRef.current.emit('play_action_card', { cardId: card.id, targetIdx: swapTarget1 });
                    setSwapModal(false);
                    setSelectedCard(null);
                    setSwapTarget1(null);
                  }}
                  className={`w-full mt-3 py-2.5 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 shadow-lg ${
                    swapTarget1 !== null 
                      ? 'btn-gold cursor-pointer' 
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                  }`}>
                  <span>🤝</span>
                  <span>بدّل ورقي مع اللاعب المختار!</span>
                </button>
              </div>
            )}

            {/* Mode 2: Swap Two Others */}
            {swapMode === 'two_others' && (
              <div className="my-3 text-right">
                <p className="text-xs font-black text-amber-200 mb-2">
                  اختر لاعبين مختلفين لتبديل ورقهما ببعض دون أن تلمس ورقك:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
                  {roomState.players.map((p, idx) => {
                    if (p.id === socketRef.current?.id) return null;
                    const isT1 = swapTarget1 === idx;
                    const isT2 = swapTarget2 === idx;
                    const isSelected = isT1 || isT2;
                    return (
                      <button 
                        key={p.id} 
                        onClick={() => {
                          if (isT1) {
                            setSwapTarget1(null);
                          } else if (isT2) {
                            setSwapTarget2(null);
                          } else if (swapTarget1 === null) {
                            setSwapTarget1(idx);
                          } else if (swapTarget2 === null) {
                            setSwapTarget2(idx);
                          } else {
                            setSwapTarget1(idx);
                          }
                        }}
                        className={`p-2.5 rounded-2xl flex flex-col items-center gap-1 transition shadow border relative ${
                          isSelected 
                            ? 'bg-amber-500/30 border-amber-300 ring-2 ring-yellow-400 scale-105' 
                            : 'bg-black/50 border-white/10 hover:border-amber-400/50'
                        }`}>
                        {isT1 && <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-black text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">1</span>}
                        {isT2 && <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-black text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">2</span>}
                        <span className="text-2xl">{p.avatar}</span>
                        <span className="text-xs font-black text-white truncate max-w-full">{p.name}</span>
                        <span className="text-[10px] text-amber-300">🃏 {p.cardCount} كروت</span>
                      </button>
                    );
                  })}
                </div>

                <button 
                  disabled={swapTarget1 === null || swapTarget2 === null || swapTarget1 === swapTarget2}
                  onClick={() => {
                    const card = selectedCard?.type === 'badl_edain' ? selectedCard : me?.hand?.find(c => c.type === 'badl_edain');
                    if (!card || swapTarget1 === null || swapTarget2 === null || swapTarget1 === swapTarget2) return;
                    soundFx.init();
                    soundFx.play('impact');
                    socketRef.current.emit('play_action_card', {
                      cardId: card.id,
                      swapTwoOthers: true,
                      target1Idx: swapTarget1,
                      target2Idx: swapTarget2
                    });
                    setSwapModal(false);
                    setSelectedCard(null);
                    setSwapTarget1(null);
                    setSwapTarget2(null);
                  }}
                  className={`w-full mt-3 py-2.5 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 shadow-lg ${
                    swapTarget1 !== null && swapTarget2 !== null && swapTarget1 !== swapTarget2 
                      ? 'btn-gold cursor-pointer' 
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                  }`}>
                  <span>🔀</span>
                  <span>بدّل أوراق اللاعبين الاثنين الآن!</span>
                </button>
              </div>
            )}

            {/* Cancel Button */}
            <button onClick={() => { setSwapModal(false); setSwapTarget1(null); setSwapTarget2(null); }} 
              className="w-full mt-2 bg-white/10 hover:bg-white/20 text-white/90 py-2 rounded-2xl text-xs font-bold border border-white/10 transition">
              إلغاء ✕
            </button>

          </div>
        </div>
      )}

      {/* Floating Speech-to-Play Listening Overlay */}
      {isListening && (
        <div className="fixed inset-x-4 bottom-44 sm:bottom-40 sm:max-w-md sm:mx-auto z-[250] bg-black/90 border-2 border-yellow-400 rounded-3xl p-4 shadow-[0_0_40px_rgba(250,204,21,0.6)] backdrop-blur-md flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-end gap-1 h-6">
              <div className="voice-wave-bar"></div>
              <div className="voice-wave-bar"></div>
              <div className="voice-wave-bar"></div>
              <div className="voice-wave-bar"></div>
              <div className="voice-wave-bar"></div>
            </div>
            <span className="text-sm font-black text-yellow-300">جاري الاستماع لصوتك.. 🎤</span>
          </div>
          <p className="text-sm font-bold text-white bg-white/10 px-4 py-2 rounded-xl w-full border border-white/10 min-h-[42px] flex items-center justify-center">
            « {voiceTranscript || 'اتكلم دلوقتي (مثال: "اطلب 5 من أحمد" أو "مغناطيس 7")...'} »
          </p>
          <p className="text-[11px] text-amber-200/70 mt-1.5 leading-snug">
            تقدر تقول: "اطلب 5 من أحمد" | "مغناطيس 7" | "اسحب كارت" | "العب تاني" | "صياد على سارة"
          </p>
          <button onClick={() => {
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsListening(false);
          }} className="mt-2 text-xs text-red-400 hover:text-red-300 underline font-bold">
            إلغاء الأمر الصوتي ✕
          </button>
        </div>
      )}

      {/* Floating Voice Notice Toast */}
      {voiceNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[260] bg-emerald-950/95 border-2 border-emerald-400 text-emerald-200 px-5 py-2.5 rounded-2xl font-black text-sm shadow-[0_0_30px_rgba(16,185,129,0.7)] backdrop-blur-md flex items-center gap-2 animate-pulse">
          <span>🎙️</span>
          <span>{voiceNotice}</span>
        </div>
      )}

      {/* Radial Emoji Reaction Wheel Modal (inspired by Card Game Plan) */}
      {showEmojiWheel && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/65 backdrop-blur-sm animate-fade-in"
             onClick={() => setShowEmojiWheel(false)}>
          <div className="relative w-72 h-72 sm:w-84 sm:h-84 rounded-full flex items-center justify-center"
               onClick={e => e.stopPropagation()}>
            {/* Outer Glow Ring & Backdrop */}
            <div className="absolute inset-0 rounded-full border-4 border-emerald-400/70 shadow-[0_0_40px_rgba(52,211,153,0.5),inset_0_0_35px_rgba(52,211,153,0.25)] bg-gradient-to-b from-[#0b3820]/95 to-[#041a0e]/95 pointer-events-none" />
            
            {/* Center Close 'X' Button */}
            <button onClick={() => setShowEmojiWheel(false)}
                    className="w-14 h-14 rounded-full bg-emerald-950 border-2 border-emerald-400 text-emerald-200 text-xl font-black shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition z-20">
              ✕
            </button>

            {/* Radial Emojis Placed in Circle */}
            {RADIAL_REACTIONS.map((item, idx) => {
              const total = RADIAL_REACTIONS.length;
              const angle = (idx * (360 / total) - 90) * (Math.PI / 180);
              const radius = 108; // px
              const x = Math.round(radius * Math.cos(angle));
              const y = Math.round(radius * Math.sin(angle));
              return (
                <button key={idx}
                        onClick={() => {
                          socketRef.current?.emit('send_meme_sticker', { stickerUrl: item.emoji, stickerText: item.text });
                          triggerHaptic('light');
                          setShowEmojiWheel(false);
                        }}
                        style={{
                          transform: `translate(${x}px, ${y}px)`,
                          boxShadow: '0 4px 15px rgba(0,0,0,0.7)'
                        }}
                        className="absolute w-12 h-12 rounded-full bg-white/10 hover:bg-emerald-500/40 border-2 border-emerald-300 text-2xl flex items-center justify-center hover:scale-125 active:scale-90 transition z-10">
                  <span>{item.emoji}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {errorMsg && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2.5 rounded-2xl font-bold shadow-2xl z-50 text-sm">{errorMsg}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
