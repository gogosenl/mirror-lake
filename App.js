import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Image, ImageBackground, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const GENERATED_LEVELS = require('./levels');
const TOTAL_LEVELS = 500;
const TOTAL_STARS = TOTAL_LEVELS * 3;
const CHAPTER_SIZE = 25;
const TOTAL_CHAPTERS = Math.ceil(TOTAL_LEVELS / CHAPTER_SIZE);
const HINT_COST = 10;
const BEAM_STEP_DELAY = 58;
const BEAM_DRAW_DURATION = 210;
const LILY_BLOOM_DURATION = 1280;
const DEFAULT_PROGRESS = { unlocked: 1, stars: {}, moonCoins: 30, unlockedChapters: [0] };
const chapterCost = (chapter) => chapter === 0 ? 0 : 100 + chapter * 35;
const normalizeProgress = (saved = {}) => ({ ...DEFAULT_PROGRESS, ...saved, stars: saved.stars || {}, moonCoins: Number.isFinite(saved.moonCoins) ? saved.moonCoins : 30, unlockedChapters: Array.isArray(saved.unlockedChapters) && saved.unlockedChapters.length ? [...new Set([0, ...saved.unlockedChapters])] : [0] });

const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const REFLECT = [[3, 2, 1, 0], [1, 0, 3, 2]];
const SAVE_KEY = 'mirror-lake-progress-v1';
const SETTINGS_KEY = 'mirror-lake-settings-v1';
const ASSETS = {
  home: require('./assets/mirror-lake-splash-art.png'),
  mirror: require('./assets/mirror-premium-v3.png'),
  mirrorFixed: require('./assets/mirror-fixed-premium-v2.png'),
  mirrorFrozen: require('./assets/mirror-frozen-premium-v2.png'),
  mirrorLinked: require('./assets/mirror-linked-premium-v2.png'),
  mirrorOneUse: require('./assets/mirror-one-use-premium-v2.png'),
  mirrorMoving: require('./assets/mirror-moving-premium-v2.png'),
  mirrorTide: require('./assets/mirror-tide-premium-v2.png'),
  lilyClosed: require('./assets/lily-closed-anchored.png'),
  lilyOpen: require('./assets/lily-open-anchored.png'),
  star: require('./assets/star-gold.png'),
  lightSource: require('./assets/light-source-v3.png'),
  lightEmitter: require('./assets/light-emitter-v1.png'),
  mirrorFlare: require('./assets/mirror-flare-v2.png'),
  gameplayBg: require('./assets/gameplay-background.png'),
  levelsBg: require('./assets/levels-background.png'),
  rock: require('./assets/obstacle-rock-v1.png'),
  crystal: require('./assets/fixed-crystal-v1.png'),
  gate: require('./assets/one-way-gate-v1.png'),
  frozen: require('./assets/frozen-overlay-v1.png'),
  navHome: require('./assets/nav-home-v1.png'),
  navLevels: require('./assets/nav-levels-v1.png'),
  navSettings: require('./assets/nav-settings-v1.png'),
  gorsenLogo: require('./assets/gorsen-games-logo.png'),
  music: require('./assets/moonlake-ambient-v1.wav'),
  sfxTurn: require('./assets/mirror-turn-v1.wav'),
  sfxIce: require('./assets/ice-crack-v1.wav'),
  sfxTap: require('./assets/ui-tap-v1.wav'),
  sfxComplete: require('./assets/level-complete-v1.wav'),
  sfxCoin: require('./assets/gold-reward-v1.wav'),
  portal: require('./assets/moon-portal-v1.png'),
  seal: require('./assets/moon-seal-v1.png'),
  celebrationBurst: require('./assets/celebration-confetti-burst-v1.png'),
  celebrationFall: require('./assets/celebration-confetti-fall-v1.png'),
  victoryEmblem: require('./assets/victory-emblem-v1.png'),
  victoryCrestPremium: require('./assets/victory-crest-mobile.png'),
  goldCoin: require('./assets/moon-gold-coin-v1.png'),
};

const EN_LEVEL_TITLES = ['Silent Shore', 'First Reflection', 'Reed Passage', 'Moon Line', 'Lily Path', 'Deep Water', 'Blue Courtyard', 'Reverse Current', 'Four Turns', 'Reed Maze', 'Heart of the Lake', 'Morning Mist', 'Twin Shores', 'Silver Wave', 'Lost Light', 'Night Bloom', 'Silent Storm', 'Star Route', 'Mirrors of the Moon', 'The Last Lily'];
const COPY = {
  tr: {
    start: 'OYUNA BAŞLA', continue: 'DEVAM ET', play: 'OYNA', level: 'Bölüm', levels: 'Bölümler', home: 'Ana Sayfa', settings: 'Ayarlar', completed: 'tamamlandı', subtitle: 'Işığı yansıt. Nilüferleri uyandır.',
    levelSelect: 'BÖLÜM SEÇİMİ', heroTitle: 'Işığı nilüfere ulaştır.', heroText: 'Aynalara dokun, yansımaları değiştir ve gölün beş yüz gecesini aydınlat.', continueAt: 'Devam et', lakeMap: 'Göl haritası', open: 'açık', locked: 'Kilitli', reset: 'İlerlemeyi sıfırla', stars: 'YILDIZ', chapter: 'BÖLGE', previous: 'Önceki', nextChapter: 'Sonraki',
    resetTitle: 'İlerleme sıfırlansın mı?', resetBody: 'Açılan bölümler ve yıldızlar silinecek.', cancel: 'Vazgeç', resetAction: 'Sıfırla',
    moves: 'HAMLE', target: 'HEDEF', rock: 'KAYA', gate: 'TEK YÖN', crystal: 'AY KRİSTALİ', frozen: 'BUZLU AYNA', portal: 'AY PORTALI', seal: 'AY MÜHRÜ', energy: 'ENERJİ', linked: 'BAĞLI AYNA', multiGoal: 'ÇOKLU NİLÜFER', prism: 'RENK PRİZMASI', rune: 'AY RÜNLERİ', colorGoal: 'RENK EŞLEŞMESİ', mission: 'GÖREV', goldLight: 'ALTIN IŞIK', blueLight: 'MAVİ IŞIK', oneUse: 'TEK KULLANIM', moving: 'HAREKETLİ AYNA', tide: 'GELGİT', lit: 'Göl aydınlandı.', traveling: 'Işık nilüfere ilerliyor…', thaw: 'Önce buzlu aynaya dokun ve buzu kır.', gateHint: 'Işık kapılardan yalnızca ok yönünde geçer.', portalHint: 'Portallar ışığı eş portalın bulunduğu noktaya taşır.', sealHint: 'Nilüferden önce ay mührünü ışıkla etkinleştir.', energyEmpty: 'Ay enerjisi tükendi. Tahta yenilendi.', mirrorHint: 'Aynaları çevir ve ışığın yolunu bul.', linkedHint: '∞ işaretli aynalar birlikte döner.', multiHint: 'Işığı bütün nilüferlerden geçir.', prismHint: 'Nilüferi doğru ışık rengiyle uyandır.', runeHint: 'Işığı ay rünlerinden sırayla geçir.', tideHint: 'Her hamlede gelgit aynaların düzenini değiştirir.',
    levelDone: 'BÖLÜM TAMAMLANDI', lilyAwake: 'Nilüfer uyandı', bestTarget: 'En iyi hedef', next: 'Sonraki bölüm', backMap: 'Göl haritasına dön', calm: 'SAKİN', medium: 'AKINTI', hard: 'DERİN',
    language: 'Dil', turkish: 'Türkçe', english: 'English', music: 'Müzik', sound: 'Ses Efektleri', on: 'Açık', off: 'Kapalı', settingsInfo: 'Tercihler bu cihazda otomatik olarak kaydedilir.', back: 'Geri', audio: 'SES', display: 'DİL', moonCoins: 'ALTIN', hint: 'İPUCU', hintCost: 'İpucu kullan', noHint: 'Bu bölümde düzeltilecek ayna kalmadı.', notEnough: 'Yeterli altının yok.', reward: 'BÖLÜM ÖDÜLÜ', earned: 'kazandın', layer: 'KATMAN', unlockLayer: 'Katmanı aç', layerLocked: 'Bu göl katmanı henüz kilitli', unlockPrevious: 'Önce önceki katmanı açmalısın.', wallet: 'ALTIN KESEN', layerProgress: 'Katman ilerlemesi', newBest: 'BAŞARDIN', layerOpened: 'YENİ KATMAN AÇILDI', newLevels: '25 yeni bölüm seni bekliyor', returningHome: 'Ana ekrana dönülüyor…', goldAdded: 'Kesene aktarılıyor', congrats: 'TEBRİKLER!', brilliant: 'Gölü yeniden aydınlattın',
  },
  en: {
    start: 'START GAME', continue: 'CONTINUE', play: 'PLAY', level: 'Level', levels: 'Levels', home: 'Home', settings: 'Settings', completed: 'completed', subtitle: 'Reflect the light. Awaken the lilies.',
    levelSelect: 'LEVEL SELECT', heroTitle: 'Guide the light to the lily.', heroText: 'Tap mirrors, redirect reflections, and illuminate five hundred nights across the lake.', continueAt: 'Continue', lakeMap: 'Lake map', open: 'open', locked: 'Locked', reset: 'Reset progress', stars: 'STARS', chapter: 'REGION', previous: 'Previous', nextChapter: 'Next',
    resetTitle: 'Reset progress?', resetBody: 'Unlocked levels and collected stars will be erased.', cancel: 'Cancel', resetAction: 'Reset',
    moves: 'MOVES', target: 'PAR', rock: 'ROCK', gate: 'ONE WAY', crystal: 'MOON CRYSTAL', frozen: 'FROZEN MIRROR', portal: 'MOON PORTAL', seal: 'MOON SEAL', energy: 'ENERGY', linked: 'LINKED MIRRORS', multiGoal: 'MULTI LILY', prism: 'COLOR PRISM', rune: 'MOON RUNES', colorGoal: 'COLOR MATCH', mission: 'MISSION', goldLight: 'GOLD LIGHT', blueLight: 'BLUE LIGHT', oneUse: 'ONE USE', moving: 'MOVING MIRROR', tide: 'TIDE', lit: 'The lake is illuminated.', traveling: 'The light is reaching the lily…', thaw: 'Tap the frozen mirror first to break the ice.', gateHint: 'Light passes through gates only in the arrow direction.', portalHint: 'Portals carry the beam to their paired portal.', sealHint: 'Illuminate the moon seal before reaching the lily.', energyEmpty: 'Moon energy depleted. The board was restored.', mirrorHint: 'Rotate the mirrors and find the path of light.', linkedHint: 'Mirrors marked ∞ rotate together.', multiHint: 'Guide the light through every lily.', prismHint: 'Awaken the lily with the required light color.', runeHint: 'Guide the light through the moon runes in order.', tideHint: 'The tide changes the mirror layout after every move.',
    levelDone: 'LEVEL COMPLETE', lilyAwake: 'The lily awakened', bestTarget: 'Best target', next: 'Next level', backMap: 'Return to lake map', calm: 'CALM', medium: 'CURRENT', hard: 'DEEP',
    language: 'Language', turkish: 'Türkçe', english: 'English', music: 'Music', sound: 'Sound Effects', on: 'On', off: 'Off', settingsInfo: 'Preferences are saved automatically on this device.', back: 'Back', audio: 'AUDIO', display: 'LANGUAGE', moonCoins: 'GOLD', hint: 'HINT', hintCost: 'Use hint', noHint: 'No mirror needs correcting in this level.', notEnough: 'Not enough gold.', reward: 'LEVEL REWARD', earned: 'earned', layer: 'LAYER', unlockLayer: 'Unlock layer', layerLocked: 'This lake layer is still locked', unlockPrevious: 'Unlock the previous layer first.', wallet: 'GOLD POUCH', layerProgress: 'Layer progress', newBest: 'SUCCESS', layerOpened: 'NEW LAYER UNLOCKED', newLevels: '25 new levels are waiting for you', returningHome: 'Returning to the home screen…', goldAdded: 'Transferring to your pouch', congrats: 'CONGRATULATIONS!', brilliant: 'You illuminated the lake again',
  },
};

const RAW_LEVELS = [
  { n: 5, title: 'Sessiz Kıyı', start: [-1, 4, 0], goal: [5, 1], turns: [[2, 4], [2, 1]], flips: [0], extra: [] },
  { n: 5, title: 'İlk Yansıma', start: [1, -1, 1], goal: [4, 5], turns: [[1, 3], [4, 3]], flips: [1], extra: [[0, 1, 0]] },
  { n: 5, title: 'Kamış Geçidi', start: [5, 0, 2], goal: [-1, 4], turns: [[3, 0], [3, 4]], flips: [0, 1], extra: [[1, 1, 1]] },
  { n: 5, title: 'Ay Çizgisi', start: [0, 5, 3], goal: [4, -1], turns: [[0, 2], [4, 2]], flips: [0, 1], extra: [[2, 4, 0]] },
  { n: 5, title: 'Nilüfer Yolu', start: [-1, 2, 0], goal: [5, 4], turns: [[1, 2], [1, 4], [4, 4]], flips: [1, 2], extra: [[3, 0, 1], [3, 2, 0]] },
  { n: 6, title: 'Derin Su', start: [-1, 5, 0], goal: [6, 1], turns: [[2, 5], [2, 1], [5, 1]], flips: [0, 1, 2], extra: [[4, 4, 0]] },
  { n: 6, title: 'Mavi Avlu', start: [3, -1, 1], goal: [0, 6], turns: [[3, 2], [0, 2], [0, 5]], flips: [0, 2], extra: [[5, 0, 1], [2, 4, 0]] },
  { n: 6, title: 'Ters Akıntı', start: [6, 4, 2], goal: [1, -1], turns: [[4, 4], [4, 0], [1, 0]], flips: [1, 2], extra: [[0, 3, 1], [3, 2, 0]] },
  { n: 6, title: 'Dört Dönüş', start: [2, 6, 3], goal: [-1, 1], turns: [[2, 4], [5, 4], [5, 1], [0, 1]], flips: [0, 1, 3], extra: [[1, 3, 0], [4, 5, 1]] },
  { n: 6, title: 'Sazlık Labirenti', start: [-1, 0, 0], goal: [1, 6], turns: [[3, 0], [3, 3], [1, 3], [1, 5]], flips: [0, 2, 3], extra: [[5, 2, 1], [0, 4, 0]] },
  { n: 7, title: 'Gölün Kalbi', start: [7, 6, 2], goal: [2, -1], turns: [[5, 6], [5, 2], [2, 2], [2, 0]], flips: [0, 1, 2], extra: [[0, 5, 0], [4, 4, 1]] },
  { n: 7, title: 'Sabah Sisi', start: [0, -1, 1], goal: [7, 5], turns: [[0, 3], [3, 3], [3, 5], [6, 5]], flips: [1, 2, 3], extra: [[5, 1, 0], [1, 6, 1], [6, 2, 0]] },
  { n: 7, title: 'Çifte Kıyı', start: [-1, 6, 0], goal: [7, 0], turns: [[1, 6], [1, 2], [5, 2], [5, 0]], flips: [0, 1, 3], extra: [[3, 4, 1], [6, 6, 0], [0, 0, 1]] },
  { n: 7, title: 'Gümüş Dalga', start: [6, 7, 3], goal: [-1, 4], turns: [[6, 1], [4, 1], [4, 4], [0, 4]], flips: [0, 2, 3], extra: [[2, 0, 0], [1, 6, 1], [5, 5, 0]] },
  { n: 7, title: 'Kayıp Işık', start: [7, 3, 2], goal: [3, -1], turns: [[5, 3], [5, 6], [1, 6], [1, 1], [3, 1]], flips: [0, 1, 3, 4], extra: [[6, 0, 1], [3, 5, 0], [0, 3, 1]] },
  { n: 7, title: 'Gece Çiçeği', start: [2, -1, 1], goal: [7, 2], turns: [[2, 4], [0, 4], [0, 6], [6, 6], [6, 2]], flips: [0, 2, 3, 4], extra: [[4, 0, 0], [3, 3, 1], [5, 5, 0]] },
  { n: 7, title: 'Sessiz Fırtına', start: [-1, 1, 0], goal: [4, 7], turns: [[3, 1], [3, 5], [6, 5], [6, 0], [4, 0], [4, 6]], flips: [0, 1, 3, 4, 5], extra: [[1, 3, 0], [5, 2, 1], [0, 6, 0]] },
  { n: 7, title: 'Yıldız Rotası', start: [5, 7, 3], goal: [-1, 5], turns: [[5, 4], [2, 4], [2, 1], [0, 1], [0, 5]], flips: [0, 1, 2, 4], extra: [[6, 2, 1], [3, 6, 0], [4, 0, 1], [1, 3, 0]] },
  { n: 7, title: 'Ayın Aynaları', start: [7, 0, 2], goal: [6, 7], turns: [[4, 0], [4, 3], [1, 3], [1, 6], [6, 6]], flips: [0, 2, 3, 4], extra: [[2, 1, 1], [5, 4, 0], [0, 5, 1], [6, 2, 0]] },
  { n: 7, title: 'Son Nilüfer', start: [-1, 6, 0], goal: [7, 1], turns: [[2, 6], [2, 3], [0, 3], [0, 0], [5, 0], [5, 1]], flips: [0, 1, 2, 4, 5], extra: [[3, 5, 1], [6, 4, 0], [1, 1, 1], [4, 2, 0], [6, 6, 1]] },
];

function directionBetween(a, b) {
  if (b[0] > a[0] && b[1] === a[1]) return 0;
  if (b[1] > a[1] && b[0] === a[0]) return 1;
  if (b[0] < a[0] && b[1] === a[1]) return 2;
  if (b[1] < a[1] && b[0] === a[0]) return 3;
  throw new Error(`Geçersiz rota: ${a} -> ${b}`);
}

function makeLevel(raw, index) {
  const route = [raw.start.slice(0, 2), ...raw.turns, raw.goal];
  const mirrors = raw.turns.map((turn, i) => {
    const incoming = directionBetween(route[i], turn);
    const outgoing = directionBetween(turn, route[i + 2]);
    const solution = REFLECT.findIndex((map) => map[incoming] === outgoing);
    if (solution < 0) return null;
    return { x: turn[0], y: turn[1], solution, initial: raw.flips.includes(i) ? solution ^ 1 : solution, required: true };
  }).filter(Boolean);
  raw.extra.forEach(([x, y, initial]) => mirrors.push({ x, y, solution: initial, initial, required: false }));
  const id = index + 1;
  const solutionPath = [], solutionSegments = [];
  for (let i = 0; i < route.length - 1; i += 1) {
    const dir = directionBetween(route[i], route[i + 1]);
    let [x, y] = route[i]; const segment = [];
    while (x !== route[i + 1][0] || y !== route[i + 1][1]) {
      x += DIRS[dir][0]; y += DIRS[dir][1];
      if (x >= 0 && y >= 0 && x < raw.cols && y < raw.rows) { const point = { x, y, dir }; solutionPath.push(point); segment.push(point); }
    }
    solutionSegments.push(segment);
  }
  if ([10, 20].includes(id) || (id >= 30 && id % 5 === 0)) {
    const fixed = mirrors.find((m) => m.required);
    if (fixed) { fixed.fixed = true; fixed.initial = fixed.solution; }
  }
  if ([11, 26, 34].includes(id) || (id >= 40 && id % 7 === 0)) {
    const frozen = mirrors.find((m) => m.required && !m.fixed && m.initial !== m.solution);
    if (frozen) frozen.frozen = true;
  }
  const mirrorKeys = new Set(mirrors.map((m) => `${m.x},${m.y}`)), goalKey = `${raw.goal[0]},${raw.goal[1]}`;
  let portals = [];
  if ([9, 22, 38].includes(id) || (id >= 60 && id % 11 === 0)) {
    const candidates = solutionSegments.map((segment) => segment.filter((p) => !mirrorKeys.has(`${p.x},${p.y}`) && `${p.x},${p.y}` !== goalKey)).filter((segment) => segment.length >= 2).sort((a, b) => b.length - a.length);
    if (candidates.length) {
      const segment = candidates[0], a = segment[0], b = segment[segment.length - 1];
      portals = [{ x: a.x, y: a.y, to: { x: b.x, y: b.y } }, { x: b.x, y: b.y, to: { x: a.x, y: a.y } }];
    }
  }
  const portalKeys = new Set(portals.map((p) => `${p.x},${p.y}`));
  let gates = [];
  if ([4, 10].includes(id) || (id >= 25 && id % 6 === 0)) {
    const turnKeys = new Set(raw.turns.map(([x, y]) => `${x},${y}`));
    const choices = solutionPath.filter((p) => !turnKeys.has(`${p.x},${p.y}`) && !portalKeys.has(`${p.x},${p.y}`) && `${p.x},${p.y}` !== goalKey);
    if (choices.length) {
      const gateCount = id >= 60 ? 2 : 1;
      const selected = gateCount === 1 ? [choices[Math.floor(choices.length / 2)]] : [choices[Math.floor(choices.length * .34)], choices[Math.floor(choices.length * .68)]];
      gates = selected.filter((gate, gateIndex) => gate && selected.findIndex((other) => other.x === gate.x && other.y === gate.y) === gateIndex);
    }
  }
  const specialKeys = new Set([...mirrorKeys, ...portalKeys, ...gates.map((g) => `${g.x},${g.y}`)]);
  let seal = null;
  if ((id === 14 || id >= 45 && id % 9 === 0) && portals.length === 0) {
    const choices = solutionPath.filter((p) => !specialKeys.has(`${p.x},${p.y}`) && `${p.x},${p.y}` !== goalKey);
    if (choices.length) seal = choices[Math.floor(choices.length * .62)];
  }
  if (seal) specialKeys.add(`${seal.x},${seal.y}`);
  const occupied = new Set([...solutionPath.map((p) => `${p.x},${p.y}`), ...mirrors.map((m) => `${m.x},${m.y}`), ...gates.map((g) => `${g.x},${g.y}`), ...portals.map((p) => `${p.x},${p.y}`), ...(seal ? [`${seal.x},${seal.y}`] : [])]);
  const rocks = [];
  const rockCount = id >= 250 ? 7 : id >= 100 ? 6 : id >= 75 ? 5 : id >= 45 ? 4 : id >= 20 ? 3 : id >= 6 ? 2 : id >= 3 ? 1 : 0;
  for (let step = 0; step < raw.cols * raw.rows && rocks.length < rockCount; step += 1) {
    const x = (step + id) % raw.cols, y = (Math.floor(step / raw.cols) + id * 2) % raw.rows, key = `${x},${y}`;
    if (!occupied.has(key)) { rocks.push({ x, y }); occupied.add(key); }
  }
  const requiredMirrors = mirrors.filter((m) => m.required && !m.fixed);
  let links = [];
  if ([7, 12, 24, 32, 48, 56, 68, 84, 96].includes(id) && requiredMirrors.length >= 2) {
    const pair = requiredMirrors.slice(0, 2); pair.forEach((mirror) => { mirror.link = 'A'; mirror.initial = mirror.solution ^ 1; }); links = [{ id: 'A', mirrors: pair.map((mirror) => ({ x: mirror.x, y: mirror.y })) }];
  }
  if ([13, 25, 45, 55, 65, 75, 85, 95].includes(id)) {
    const oneUse = requiredMirrors.find((mirror) => mirror.initial !== mirror.solution && !mirror.frozen);
    if (oneUse) oneUse.oneUse = true;
  }
  const openCells = [];
  for (let y = 0; y < raw.rows; y += 1) for (let x = 0; x < raw.cols; x += 1) if (!occupied.has(`${x},${y}`)) openCells.push({ x, y });
  let movingMirror = null;
  if ([16, 28, 44, 50, 58, 72, 86, 98].includes(id) && openCells.length >= 2) {
    const mover = mirrors.find((mirror) => !mirror.required) || { x: openCells[0].x, y: openCells[0].y, initial: 0, solution: 0, required: false };
    if (!mirrors.includes(mover)) mirrors.push(mover);
    const destination = openCells.find((cell) => cell.x !== mover.x || cell.y !== mover.y) || openCells[1];
    mover.moving = true; mover.track = [{ x: mover.x, y: mover.y }, destination]; movingMirror = { from: { x: mover.x, y: mover.y }, to: destination };
  }
  let tide = null;
  if ([19, 40, 48, 50, 60, 74, 88, 100].includes(id)) {
    const tideMirrors = mirrors.filter((mirror) => !mirror.required).slice(0, 2);
    tideMirrors.forEach((mirror) => { mirror.tide = true; });
    tide = { mirrors: tideMirrors.map((mirror) => ({ x: mirror.x, y: mirror.y })) };
  }
  let extraGoals = [];
  if ([8, 15, 20, 38, 50, 62, 76, 90, 100].includes(id)) {
    const portalPathIndexes = portals.map((portal) => solutionPath.findIndex((point) => point.x === portal.x && point.y === portal.y)).filter((value) => value >= 0), portalLow = portalPathIndexes.length ? Math.min(...portalPathIndexes) : -1, portalHigh = portalPathIndexes.length ? Math.max(...portalPathIndexes) : -1;
    const choices = solutionPath.filter((point, pathIndex) => !specialKeys.has(`${point.x},${point.y}`) && `${point.x},${point.y}` !== goalKey && (portalLow < 0 || pathIndex < portalLow || pathIndex > portalHigh));
    if (choices.length) {
      const wanted = id >= 85 ? 2 : 1;
      const selected = wanted === 1 ? [choices[Math.floor(choices.length * .35)]] : [choices[Math.floor(choices.length * .28)], choices[Math.floor(choices.length * .7)]];
      extraGoals = selected.filter((point, pointIndex) => point && selected.findIndex((other) => other.x === point.x && other.y === point.y) === pointIndex).map((point) => ({ x: point.x, y: point.y }));
    }
  }
  let prisms = [];
  if ([1, 3, 6, 10, 18, 20, 41, 48, 54, 66, 78, 92, 100].includes(id) || (id > 100 && id % 12 === 0)) {
    const portalPathIndexes = portals.map((portal) => solutionPath.findIndex((point) => point.x === portal.x && point.y === portal.y)).filter((value) => value >= 0), portalLow = portalPathIndexes.length ? Math.min(...portalPathIndexes) : -1, portalHigh = portalPathIndexes.length ? Math.max(...portalPathIndexes) : -1;
    const choices = solutionPath.filter((point, pathIndex) => !specialKeys.has(`${point.x},${point.y}`) && `${point.x},${point.y}` !== goalKey && !extraGoals.some((goal) => goal.x === point.x && goal.y === point.y) && (portalLow < 0 || pathIndex < portalLow || pathIndex > portalHigh));
    if (choices.length) {
      const wanted = id >= 80 ? 2 : 1;
      const selected = wanted === 1 ? [choices[Math.floor(choices.length * .52)]] : [choices[Math.floor(choices.length * .38)], choices[Math.floor(choices.length * .66)]];
      prisms = selected.filter((point, pointIndex) => point && selected.findIndex((other) => other.x === point.x && other.y === point.y) === pointIndex).map((point, pointIndex) => ({ x: point.x, y: point.y, color: pointIndex === selected.length - 1 ? 'blue' : 'gold' }));
    }
  }
  const targetColor = prisms.length ? prisms[prisms.length - 1].color : null;
  let runes = [];
  if ([2, 5, 12, 17, 20].includes(id) || (id > 20 && id % 8 === 0)) {
    const portalPathIndexes = portals.map((portal) => solutionPath.findIndex((point) => point.x === portal.x && point.y === portal.y)).filter((value) => value >= 0), portalLow = portalPathIndexes.length ? Math.min(...portalPathIndexes) : -1, portalHigh = portalPathIndexes.length ? Math.max(...portalPathIndexes) : -1;
    const choices = solutionPath.filter((point, pathIndex) => !specialKeys.has(`${point.x},${point.y}`) && `${point.x},${point.y}` !== goalKey && !extraGoals.some((goal) => goal.x === point.x && goal.y === point.y) && !prisms.some((prism) => prism.x === point.x && prism.y === point.y) && (portalLow < 0 || pathIndex < portalLow || pathIndex > portalHigh));
    if (choices.length >= 2) {
      const wanted = id >= 40 ? 3 : 2;
      const selected = wanted === 2 ? [choices[Math.floor(choices.length * .3)], choices[Math.floor(choices.length * .7)]] : [choices[Math.floor(choices.length * .22)], choices[Math.floor(choices.length * .5)], choices[Math.floor(choices.length * .78)]];
      runes = selected.filter((point, pointIndex) => point && selected.findIndex((other) => other.x === point.x && other.y === point.y) === pointIndex).map((point, pointIndex) => ({ x: point.x, y: point.y, order: pointIndex + 1 }));
    }
  }
  const wrongByLink = new Set();
  const par = mirrors.filter((mirror) => { if (!mirror.required || mirror.fixed || mirror.initial === mirror.solution) return false; if (mirror.link) { if (wrongByLink.has(mirror.link)) return false; wrongByLink.add(mirror.link); } return true; }).length + mirrors.filter((mirror) => mirror.frozen).length;
  const moveLimit = [35, 50, 70, 85, 100].includes(id) || (id >= 80 && id % 13 === 0) ? par + (id >= 300 ? 4 : 3) : null;
  return { ...raw, id, mirrors, gates, rocks, portals, seal, links, movingMirror, tide, extraGoals, prisms, targetColor, runes, moveLimit, par };
}

const LEVELS = GENERATED_LEVELS.map(makeLevel);

function trace(level, mirrors) {
  let [x, y, dir] = level.start;
  const steps = [];
  const seen = new Set();
  const rockKeys = new Set((level.rocks || []).map((r) => `${r.x},${r.y}`));
  const gateMap = new Map((level.gates || []).map((g) => [`${g.x},${g.y}`, g]));
  const portalMap = new Map((level.portals || []).map((p) => [`${p.x},${p.y}`, p]));
  const extraGoalKeys = new Set((level.extraGoals || []).map((goal) => `${goal.x},${goal.y}`));
  const prismMap = new Map((level.prisms || []).map((prism) => [`${prism.x},${prism.y}`, prism]));
  const runeMap = new Map((level.runes || []).map((rune) => [`${rune.x},${rune.y}`, rune]));
  const litGoals = new Set(), litPrisms = new Set(), litRunes = new Set();
  let sealLit = false, beamColor = 'gold', runeProgress = 0;
  const result = (won = false) => ({ won, steps, sealLit, litGoals, litPrisms, litRunes, runeProgress, beamColor });
  for (let i = 0; i < 250; i += 1) {
    const fromDir = (dir + 2) % 4;
    x += DIRS[dir][0]; y += DIRS[dir][1];
    if (x < 0 || y < 0 || x >= level.cols || y >= level.rows) return result(false);
    const cellKey = `${x},${y}`;
    if (extraGoalKeys.has(cellKey)) litGoals.add(cellKey);
    const prism = prismMap.get(cellKey);
    if (prism) { litPrisms.add(cellKey); beamColor = prism.color || 'gold'; }
    const rune = runeMap.get(cellKey);
    if (rune && !litRunes.has(cellKey)) {
      if (rune.order === runeProgress + 1) { litRunes.add(cellKey); runeProgress += 1; }
      else { litRunes.clear(); runeProgress = 0; }
    }
    if (x === level.goal[0] && y === level.goal[1]) {
      steps.push({ x, y, fromDir, toDir: dir, goal: true, color: beamColor });
      const prerequisitesMet = (!level.seal || sealLit) && litGoals.size === extraGoalKeys.size && litPrisms.size === prismMap.size && litRunes.size === runeMap.size && (!level.targetColor || beamColor === level.targetColor);
      return result(prerequisitesMet);
    }
    const gate = gateMap.get(cellKey);
    if (rockKeys.has(cellKey) || (gate && gate.dir !== dir)) { steps.push({ x, y, fromDir, toDir: dir, blocked: true, color: beamColor }); return result(false); }
    if (level.seal && x === level.seal.x && y === level.seal.y) sealLit = true;
    const portal = portalMap.get(cellKey);
    if (portal) {
      steps.push({ x, y, fromDir, toDir: dir, portal: true, color: beamColor });
      x = portal.to.x; y = portal.to.y;
      steps.push({ x, y, fromDir, toDir: dir, portalExit: true, color: beamColor });
      const portalKey = `${x},${y},${dir}`;
      if (seen.has(portalKey)) return result(false);
      seen.add(portalKey); continue;
    }
    const mirror = mirrors.find((m) => m.x === x && m.y === y);
    const nextDir = mirror ? REFLECT[mirror.angle][dir] : dir;
    steps.push({ x, y, fromDir, toDir: nextDir, color: beamColor });
    dir = nextDir;
    const key = `${x},${y},${dir}`;
    if (seen.has(key)) return result(false);
    seen.add(key);
  }
  return result(false);
}

function lightRedrawPoint(beforeSteps = [], afterSteps = []) {
  const sharedLength = Math.min(beforeSteps.length, afterSteps.length);
  for (let index = 0; index < sharedLength; index += 1) {
    const before = beforeSteps[index], after = afterSteps[index];
    const sameArrival = before.x === after.x && before.y === after.y && before.fromDir === after.fromDir;
    if (!sameArrival) return Math.max(0, index - 1);
    const sameDeparture = before.toDir === after.toDir && !!before.portal === !!after.portal && !!before.portalExit === !!after.portalExit && !!before.blocked === !!after.blocked && !!before.goal === !!after.goal;
    if (!sameDeparture) return index;
  }
  return beforeSteps.length === afterSteps.length ? null : Math.max(0, sharedLength - 1);
}

function reachedFinalFlower(result) {
  return !!result?.won;
}

function Lily({ active = false, size = 52 }) {
  const [opened, setOpened] = useState(false);
  const charge = useRef(new Animated.Value(0)).current;
  const bloom = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let cancelled = false;
    charge.stopAnimation(); bloom.stopAnimation();
    if (!active) { setOpened(false); charge.setValue(0); bloom.setValue(0); return undefined; }
    setOpened(false); charge.setValue(0); bloom.setValue(0);
    const charging = Animated.timing(charge, { toValue: 1, duration: 430, easing: Easing.inOut(Easing.cubic), useNativeDriver: true });
    charging.start(({ finished }) => {
      if (!finished || cancelled) return;
      setOpened(true);
      Animated.timing(bloom, { toValue: 1, duration: 720, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
    return () => { cancelled = true; charging.stop(); };
  }, [active]);
  const assetSize = Math.max(38, Math.min(76, size * .94));
  return <View pointerEvents="none" collapsable={false} style={styles.lilyStage}>
    {active && <><Animated.View style={[styles.lilyChargeColumn, { opacity: charge.interpolate({ inputRange: [0, .15, .86, 1], outputRange: [0, .72, .9, 0] }), transform: [{ scaleY: charge.interpolate({ inputRange: [0, 1], outputRange: [.05, 1] }) }] }]} /><Animated.View style={[styles.lilyChargeCore, { opacity: charge.interpolate({ inputRange: [0, .2, .85, 1], outputRange: [0, .6, 1, 0] }), transform: [{ scale: charge.interpolate({ inputRange: [0, 1], outputRange: [.3, 1.18] }) }] }]} /></>}
    {opened && <><Animated.View style={[styles.lilyBloomRipple, { opacity: bloom.interpolate({ inputRange: [0, .18, 1], outputRange: [0, .82, 0] }), transform: [{ scaleX: bloom.interpolate({ inputRange: [0, 1], outputRange: [.28, 1.65] }) }, { scaleY: bloom.interpolate({ inputRange: [0, 1], outputRange: [.45, 1] }) }] }]} /><Animated.View style={[styles.lilyBloomRay, styles.lilyBloomRayHorizontal, { opacity: bloom.interpolate({ inputRange: [0, .14, .72, 1], outputRange: [0, .95, .32, 0] }), transform: [{ scaleX: bloom.interpolate({ inputRange: [0, 1], outputRange: [.12, 1.55] }) }] }]} /><Animated.View style={[styles.lilyBloomRay, styles.lilyBloomRayVertical, { opacity: bloom.interpolate({ inputRange: [0, .14, .72, 1], outputRange: [0, .9, .26, 0] }), transform: [{ scaleY: bloom.interpolate({ inputRange: [0, 1], outputRange: [.12, 1.5] }) }] }]} /><Animated.View style={[styles.lilyBloomCore, { opacity: bloom.interpolate({ inputRange: [0, .1, .65, 1], outputRange: [0, 1, .7, 0] }), transform: [{ scale: bloom.interpolate({ inputRange: [0, .24, 1], outputRange: [.25, 1.2, .72] }) }] }]} /></>}
    <View style={[styles.lilyAssetStage, { width: assetSize, height: assetSize }]}>
      <Animated.Image source={ASSETS.lilyClosed} resizeMode="contain" fadeDuration={0} style={[styles.lilyFixedAsset, { width: assetSize, height: assetSize, opacity: bloom.interpolate({ inputRange: [0, .08, .56, 1], outputRange: [1, 1, 0, 0] }) }]} />
      <Animated.Image source={ASSETS.lilyOpen} resizeMode="contain" fadeDuration={0} style={[styles.lilyFixedAsset, styles.lilyOpenAsset, { width: assetSize, height: assetSize, opacity: bloom.interpolate({ inputRange: [0, .12, .58, 1], outputRange: [0, 0, 1, 1] }) }]} />
    </View>
  </View>;
}

function GoalMarker({ active }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: active ? 620 : 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: active ? 620 : 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    animation.start(); return () => animation.stop();
  }, [active]);
  return <View pointerEvents="none" style={styles.goalMarker}>
    <Animated.View style={[styles.goalArtDecoFrame, active && styles.goalArtDecoFrameActive, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [.58, .92] }) }]}><View style={styles.goalFrameTopLeft} /><View style={styles.goalFrameTopRight} /><View style={styles.goalFrameBottomLeft} /><View style={styles.goalFrameBottomRight} /></Animated.View>
    <Animated.View style={[styles.goalBeacon, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [.68, 1] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [.92, 1.12] }) }] }]}><View style={styles.goalBeaconWing} /><View style={[styles.goalMoonDiamond, active && styles.goalMoonDiamondActive]} /><View style={[styles.goalBeaconWing, styles.goalBeaconWingRight]} /></Animated.View>
    <View style={[styles.goalLotusDock, active && styles.goalLotusDockActive]}><View style={styles.goalDockCapLeft} /><View style={styles.goalDockCapRight} /></View>
    <Animated.View style={styles.goalWaterLines}><Animated.View style={[styles.goalWaterLine, styles.goalWaterLineWide, active && styles.goalWaterLineActive, { transform: [{ scaleX: pulse.interpolate({ inputRange: [0, 1], outputRange: [.82, 1] }) }] }]} /><View style={[styles.goalWaterLine, active && styles.goalWaterLineActive]} /><View style={[styles.goalWaterLine, styles.goalWaterLineSmall, active && styles.goalWaterLineActive]} /></Animated.View>
  </View>;
}

function MirrorSprite({ mirror }) {
  const { angle, fixed, frozen } = mirror;
  const rotation = useRef(new Animated.Value(angle)).current;
  const arrival = useRef(new Animated.Value(mirror.moving ? .35 : 1)).current;
  useEffect(() => { Animated.spring(rotation, { toValue: angle, damping: 12, stiffness: 150, mass: .65, useNativeDriver: true }).start(); }, [angle]);
  useEffect(() => { if (mirror.moving) { arrival.setValue(.35); Animated.spring(arrival, { toValue: 1, damping: 9, stiffness: 135, useNativeDriver: true }).start(); } }, [mirror.x, mirror.y]);
  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });
  const source = frozen ? ASSETS.mirrorFrozen : mirror.oneUse ? ASSETS.mirrorOneUse : mirror.link ? ASSETS.mirrorLinked : mirror.moving ? ASSETS.mirrorMoving : mirror.tide ? ASSETS.mirrorTide : fixed ? ASSETS.mirrorFixed : ASSETS.mirror;
  const special = frozen || mirror.oneUse || mirror.link || mirror.moving || mirror.tide || fixed;
  return <View style={styles.mirrorWrap}><Animated.Image source={source} resizeMode="contain" fadeDuration={0} style={[styles.mirrorAsset, special && styles.specialMirrorAsset, mirror.moving && styles.movingMirrorAsset, { opacity: arrival, transform: [{ rotate }, { scale: arrival }] }]} /></View>;
}

function GateSprite({ dir }) {
  return <Image source={ASSETS.gate} resizeMode="contain" style={[styles.gateAsset, { transform: [{ rotate: `${dir * 90}deg` }] }]} />;
}
function PortalSprite() {
  const pulse = useRef(new Animated.Value(.88)).current;
  useEffect(() => { const loop = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1.05, duration: 720, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(pulse, { toValue: .88, duration: 720, easing: Easing.inOut(Easing.sin), useNativeDriver: true })])); loop.start(); return () => loop.stop(); }, []);
  return <Animated.Image source={ASSETS.portal} resizeMode="contain" style={[styles.portalAsset, { transform: [{ scale: pulse }] }]} />;
}
function SealSprite({ active }) {
  const scale = useRef(new Animated.Value(active ? 1.08 : .9)).current;
  useEffect(() => { Animated.spring(scale, { toValue: active ? 1.08 : .9, damping: 9, stiffness: 120, useNativeDriver: true }).start(); }, [active]);
  return <Animated.Image source={ASSETS.seal} resizeMode="contain" style={[styles.sealAsset, active && styles.sealAssetActive, { transform: [{ scale }] }]} />;
}
function PrismSprite({ active, color = 'gold' }) {
  return <View pointerEvents="none" style={[styles.prismOuter, color === 'blue' && styles.prismOuterBlue, active && styles.prismOuterActive]}><View style={[styles.prismInner, color === 'blue' && styles.prismInnerBlue]} /><Text style={styles.prismMark}>✦</Text></View>;
}
function RuneSprite({ order, active }) {
  return <View pointerEvents="none" style={[styles.runeOuter, active && styles.runeOuterActive]}><View style={[styles.runeInner, active && styles.runeInnerActive]}><Text style={[styles.runeNumber, active && styles.runeNumberActive]}>{order}</Text></View><View style={[styles.runeOrbit, active && styles.runeOrbitActive]} /></View>;
}
function MirrorMechanicBadge({ mirror }) {
  if (!mirror.link && !mirror.oneUse && !mirror.moving && !mirror.tide) return null;
  return <View pointerEvents="none" style={[styles.mechanicBadge, mirror.link && styles.linkBadge, mirror.oneUse && styles.oneUseBadge, (mirror.moving || mirror.tide) && styles.motionBadge]}><Text style={styles.mechanicBadgeText}>{mirror.link ? '∞' : mirror.oneUse ? '1' : mirror.moving ? '↔' : '≈'}</Text></View>;
}
function BeamHalf({ dir, delay = 0, animate = true, token = 0, color = 'gold' }) {
  const progress = useRef(new Animated.Value(0)).current;
  const flow = useRef(new Animated.Value(0)).current;
  const horizontal = dir === 0 || dir === 2;
  useEffect(() => {
    progress.stopAnimation();
    if (!animate) { progress.setValue(1); return; }
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: BEAM_DRAW_DURATION, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [token, animate]);
  useEffect(() => { const loop = Animated.loop(Animated.sequence([Animated.timing(flow, { toValue: 1, duration: 820, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(flow, { toValue: 0, duration: 820, easing: Easing.inOut(Easing.sin), useNativeDriver: true })])); loop.start(); return () => loop.stop(); }, []);
  const travel = flow.interpolate({ inputRange: [0, 1], outputRange: [-7, 7] });
  const palette = color === 'blue' ? { outer: 'rgba(65,220,255,.08)', soft: 'rgba(67,216,255,.30)', inner: 'rgba(116,235,255,.90)', core: '#effdff', shadow: '#44dcff' } : { outer: 'rgba(255,219,117,.025)', soft: 'rgba(255,217,105,.18)', inner: 'rgba(255,229,146,.76)', core: '#fffdf0', shadow: '#ffe8aa' };
  return <Animated.View style={[styles.beamSlot, horizontal ? styles.beamSlotHorizontal : styles.beamSlotVertical, dir === 0 && styles.east, dir === 1 && styles.south, dir === 2 && styles.west, dir === 3 && styles.north, { opacity: progress, transform: [{ scaleX: horizontal ? progress : 1 }, { scaleY: horizontal ? 1 : progress }] }]}><View style={[styles.beamOuterGlow, { backgroundColor: palette.outer }]} /><View style={[styles.beamSoftGlow, horizontal ? styles.beamSoftH : styles.beamSoftV, { backgroundColor: palette.soft }]} /><View style={[styles.beamInnerGlow, horizontal ? styles.beamInnerH : styles.beamInnerV, { backgroundColor: palette.inner, shadowColor: palette.shadow }]} /><View style={[styles.beamFineCore, horizontal ? styles.beamCoreH : styles.beamCoreV, { backgroundColor: palette.core }]} /><Animated.View style={[styles.beamFlow, horizontal ? styles.beamFlowH : styles.beamFlowV, { backgroundColor: palette.core, opacity: flow.interpolate({ inputRange: [0, .5, 1], outputRange: [.2, .9, .2] }), transform: [horizontal ? { translateX: travel } : { translateY: travel }] }]} /></Animated.View>;
}

function LightPulse({ delay = 0, token = 0, color = 'gold' }) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => { value.stopAnimation(); value.setValue(0); Animated.sequence([Animated.delay(delay), Animated.timing(value, { toValue: 1, duration: 100, easing: Easing.out(Easing.quad), useNativeDriver: true }), Animated.timing(value, { toValue: 0, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: true })]).start(); }, [token]);
  return <Animated.Image source={ASSETS.lightSource} resizeMode="contain" style={[styles.travelingLight, color === 'blue' && { tintColor: '#72e7ff' }, { opacity: value, transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [.45, 1] }) }] }]} />;
}

function ReflectionFlare({ token, animate }) {
  const value = useRef(new Animated.Value(animate ? 0 : .62)).current;
  useEffect(() => { value.stopAnimation(); if (!animate) { value.setValue(.62); return; } value.setValue(0); Animated.sequence([Animated.timing(value, { toValue: 1, duration: 100, useNativeDriver: true }), Animated.timing(value, { toValue: .62, duration: 240, useNativeDriver: true })]).start(); }, [token, animate]);
  return <Animated.Image source={ASSETS.mirrorFlare} resizeMode="contain" style={[styles.reflectionFlare, { opacity: value, transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [.7, 1] }) }] }]} />;
}

function SourceEmitter({ level, cell }) {
  const pulse = useRef(new Animated.Value(.96)).current;
  const rotation = `${level.start[2] * 90}deg`;
  useEffect(() => { const loop = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1.04, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(pulse, { toValue: .96, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true })])); loop.start(); return () => loop.stop(); }, []);
  return <View pointerEvents="none" style={[styles.sourceEmitterWrap, sourcePosition(level, cell)]}>
    <Animated.View style={[styles.sourceEmitterGlow, { opacity: pulse.interpolate({ inputRange: [.96, 1.04], outputRange: [.38, .72] }), transform: [{ scale: pulse }] }]} />
    <Animated.Image source={ASSETS.lightEmitter} resizeMode="contain" style={[styles.sourceEmitterAsset, { transform: [{ rotate: rotation }, { scale: pulse }] }]} />
  </View>;
}

function BeamPass({ beam, mirror, lightUpdate }) {
  const offset = Math.max(0, beam.index - lightUpdate.from);
  const animateIn = lightUpdate.full || beam.index > lightUpdate.from;
  const animateOut = lightUpdate.full || beam.index >= lightUpdate.from;
  const pulse = lightUpdate.full || beam.index >= lightUpdate.from;
  if (beam.blocked || beam.portal || beam.goal) return <BeamHalf dir={beam.fromDir} delay={offset * BEAM_STEP_DELAY} animate={animateIn} token={lightUpdate.revision} color={beam.color} />;
  if (beam.portalExit) return <BeamHalf dir={beam.toDir} delay={offset * BEAM_STEP_DELAY} animate={animateOut} token={lightUpdate.revision} color={beam.color} />;
  return <><BeamHalf dir={beam.fromDir} delay={offset * BEAM_STEP_DELAY} animate={animateIn} token={lightUpdate.revision} color={beam.color} /><BeamHalf dir={beam.toDir} delay={offset * BEAM_STEP_DELAY + 38} animate={animateOut} token={lightUpdate.revision} color={beam.color} />{pulse && <LightPulse delay={offset * BEAM_STEP_DELAY + 22} token={lightUpdate.revision} color={beam.color} />}{mirror && <ReflectionFlare token={lightUpdate.revision} animate={animateOut} />}</>;
}

function LakeBoard({ level, mirrors, onMirror, won, locked, lightUpdate }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const maxWidth = Math.min(windowWidth - 44, 410), maxHeight = Math.min(Math.max(340, windowHeight - 330), 570);
  const cell = Math.min(maxWidth / level.cols, maxHeight / level.rows), width = cell * level.cols, height = cell * level.rows;
  const traced = useMemo(() => trace(level, mirrors), [level, mirrors]);
  const pathMap = new Map();
  traced.steps.forEach((step, index) => {
    const key = `${step.x},${step.y}`, passes = pathMap.get(key) || [];
    passes.push({ ...step, index }); pathMap.set(key, passes);
  });
  const mirrorMap = new Map(mirrors.map((m, i) => [`${m.x},${m.y}`, { ...m, index: i }]));
  const rockKeys = new Set((level.rocks || []).map((r) => `${r.x},${r.y}`));
  const gateMap = new Map((level.gates || []).map((g) => [`${g.x},${g.y}`, g]));
  const portalKeys = new Set((level.portals || []).map((p) => `${p.x},${p.y}`));
  const extraGoalKeys = new Set((level.extraGoals || []).map((goal) => `${goal.x},${goal.y}`));
  const prismMap = new Map((level.prisms || []).map((prism) => [`${prism.x},${prism.y}`, prism]));
  const runeMap = new Map((level.runes || []).map((rune) => [`${rune.x},${rune.y}`, rune]));
  return <View style={[styles.boardFrame, styles.boardFrameExpanded, { width: width + 14, height: height + 14 }]}>
    <View pointerEvents="none" style={styles.boardAmbientGlow} />
    <View pointerEvents="none" style={styles.boardAmbientLine} />
    <View style={[styles.frameCorner, styles.frameCornerTL]} /><View style={[styles.frameCorner, styles.frameCornerTR]} /><View style={[styles.frameCorner, styles.frameCornerBL]} /><View style={[styles.frameCorner, styles.frameCornerBR]} />
    <View style={[styles.board, styles.boardSurfaceExpanded, { width, height }]}>
      <Image source={ASSETS.gameplayBg} resizeMode="cover" style={styles.boardWaterTexture} />
      <View style={styles.boardWaterTint} /><View style={styles.boardTopGlow} />
      {Array.from({ length: level.cols * level.rows }, (_, k) => {
      const x = k % level.cols, y = Math.floor(k / level.cols), key = `${x},${y}`, mirror = mirrorMap.get(key), beams = pathMap.get(key) || [], rock = rockKeys.has(key), gate = gateMap.get(key), portal = portalKeys.has(key), seal = level.seal && level.seal.x === x && level.seal.y === y, prism = prismMap.get(key), rune = runeMap.get(key), isExtraGoal = extraGoalKeys.has(key), isGoal = level.goal[0] === x && level.goal[1] === y || isExtraGoal, goalActive = won || isExtraGoal && traced.litGoals?.has(key);
      return <Pressable key={`${x}-${y}`} onPress={() => mirror && !mirror.fixed && onMirror(mirror.index)} disabled={!mirror || mirror.fixed || locked} style={({ pressed }) => [styles.cell, isGoal && styles.goalCell, isGoal && level.targetColor === 'blue' && styles.goalCellBlue, { width: cell, height: cell, left: x * cell, top: y * cell }, pressed && mirror && !mirror.fixed && styles.cellPressed]}>
        {(x * 3 + y) % 7 === 0 && !mirror && <View style={styles.waterGlint} />}
        {(x + y) % 5 === 0 && !mirror && !rock && !gate && !portal && !seal && !prism && !rune && <View style={styles.ripple} />}
        {isGoal && <Lily active={goalActive} size={cell} />}
        {mirror && !mirror.fixed && <View style={styles.mirrorSocket}><View style={styles.mirrorSocketInner} /></View>}
        {gate && <GateSprite dir={gate.dir} />}
        {beams.map((beam) => <BeamPass key={`${beam.index}-${beam.fromDir}-${beam.toDir}`} beam={beam} mirror={mirror} lightUpdate={lightUpdate} />)}
        {portal && <PortalSprite />}
        {seal && <SealSprite active={traced.sealLit} />}
        {prism && <PrismSprite active={traced.litPrisms?.has(key)} color={prism.color} />}
        {rune && <RuneSprite order={rune.order} active={traced.litRunes?.has(key)} />}
        {rock && <Image source={ASSETS.rock} resizeMode="contain" style={styles.rockAsset} />}
        {mirror && <MirrorSprite mirror={mirror} />}
      </Pressable>;
      })}
    </View>
    <SourceEmitter level={level} cell={cell} />
  </View>;
}

function sourcePosition(level, cell) { const [startX, startY, dir] = level.start, [dx, dy] = DIRS[dir], firstX = startX + dx, firstY = startY + dy, size = cell * .72, framePad = 7, centerX = framePad + firstX * cell + cell / 2 - dx * cell * .68, centerY = framePad + firstY * cell + cell / 2 - dy * cell * .68; return { left: centerX - size / 2, top: centerY - size / 2, width: size, height: size }; }
function Stars({ count, small = false }) { return <View style={styles.stars}>{[1, 2, 3].map((n) => <Image key={n} source={ASSETS.star} resizeMode="contain" style={[small ? styles.starAssetSmall : styles.starAsset, n <= count ? styles.starEarned : styles.starEmpty]} />)}</View>; }
function RewardStars({ count, animation }) {
  return <View style={styles.rewardStars}>{[1, 2, 3].map((n) => { const start = .12 + (n - 1) * .18, end = start + .24, reveal = animation.interpolate({ inputRange: [0, start, end, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' }); return <Animated.Image key={n} source={ASSETS.star} resizeMode="contain" style={[styles.rewardStar, n > count && styles.starEmpty, { opacity: n <= count ? reveal : .13, transform: [{ scale: n <= count ? reveal.interpolate({ inputRange: [0, 1], outputRange: [.15, 1] }) : .72 }, { rotate: n <= count ? reveal.interpolate({ inputRange: [0, 1], outputRange: ['-28deg', '0deg'] }) : '0deg' }] }]} />; })}</View>;
}
function GoldRain({ animation }) {
  const { width, height } = useWindowDimensions();
  const coins = [12, 25, 39, 53, 67, 81, 18, 33, 48, 62, 76, 88];
  return <View pointerEvents="none" style={styles.goldRain}>{coins.map((left, index) => {
    const delay = (index % 6) * .055, end = Math.min(.86, delay + .58);
    const fall = animation.interpolate({ inputRange: [0, delay, end, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' });
    const startX = (left / 100 - .5) * Math.min(width * .7, 290), targetX = -width * .5 + 66, startY = 16 + (index % 4) * 14, targetY = -height * .46;
    return <Animated.View key={index} style={[styles.flyingGold, { opacity: fall.interpolate({ inputRange: [0, .08, .88, 1], outputRange: [0, 1, 1, 0] }), transform: [{ perspective: 600 }, { translateY: fall.interpolate({ inputRange: [0, .24, 1], outputRange: [startY, startY - 52, targetY] }) }, { translateX: fall.interpolate({ inputRange: [0, .24, 1], outputRange: [startX, startX + (index % 2 ? 22 : -22), targetX] }) }, { rotateY: fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${720 + index * 40}deg`] }) }, { rotateZ: fall.interpolate({ inputRange: [0, 1], outputRange: [`${index % 2 ? 12 : -12}deg`, '0deg'] }) }, { scale: fall.interpolate({ inputRange: [0, .2, .84, 1], outputRange: [.45, 1, .82, .36] }) }] }]}><Image source={ASSETS.goldCoin} resizeMode="contain" style={styles.flyingGoldAsset} /></Animated.View>;
  })}</View>;
}
function CelebrationAssetFx({ animation }) {
  const { width, height } = useWindowDimensions();
  const burstSize = Math.min(560, width * 1.35);
  const colors = ['#ff4f70', '#ffd447', '#23d8d1', '#8c6cff', '#ff8a48', '#f7f2dc'];
  const pieces = Array.from({ length: 42 }, (_, index) => index);
  return <View pointerEvents="none" style={styles.assetFxLayer}>
    <Animated.Image source={ASSETS.celebrationBurst} resizeMode="contain" style={[styles.assetBurst, { width: burstSize, height: burstSize, left: (width - burstSize) / 2, top: height * .15, opacity: animation.interpolate({ inputRange: [0, .025, .72, 1], outputRange: [0, 1, .94, 0] }), transform: [{ translateY: animation.interpolate({ inputRange: [0, .18, 1], outputRange: [90, -28, 34] }) }, { scale: animation.interpolate({ inputRange: [0, .08, .24, 1], outputRange: [.08, 1.12, 1, 1.08] }) }] }]} />
    {pieces.map((index) => {
      const delay = (index % 9) * .018;
      const end = .58 + (index % 7) * .045;
      const fall = animation.interpolate({ inputRange: [0, delay, end, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' });
      const left = ((index * 37) % 96) / 100 * width;
      const drift = ((index * 29) % 110) - 55;
      const size = 8 + index % 5 * 2;
      return <Animated.View key={index} style={[styles.confettiPiece, { left, width: size, height: size * (index % 3 === 0 ? 2.1 : 1.25), borderRadius: index % 4 === 0 ? size : 2, backgroundColor: colors[index % colors.length], opacity: fall.interpolate({ inputRange: [0, .035, .82, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [-40 - (index % 5) * 24, height * 1.02] }) }, { translateX: fall.interpolate({ inputRange: [0, .5, 1], outputRange: [0, drift, -drift * .35] }) }, { rotate: fall.interpolate({ inputRange: [0, 1], outputRange: [`${index * 13}deg`, `${720 + index * 31}deg`] }) }, { scale: fall.interpolate({ inputRange: [0, .08, 1], outputRange: [.2, 1, .78] }) }] }]} />;
    })}
  </View>;
}
function GuaranteedConfetti() {
  const { width, height } = useWindowDimensions();
  const colors = ['#ff496c', '#ffd33f', '#22d4ce', '#8b6cff', '#ff8b4d', '#f7f0d8'];
  const pieces = Array.from({ length: 48 }, (_, index) => index);
  return <View pointerEvents="none" collapsable={false} renderToHardwareTextureAndroid style={styles.guaranteedConfettiLayer}>
    <Image fadeDuration={0} source={ASSETS.celebrationFall} resizeMode="contain" style={[styles.guaranteedConfettiAsset, { width: width * 1.16, height: Math.min(height * .62, width * 1.3), left: -width * .08 }]} />
    {pieces.map((index) => {
      const left = 3 + (index * 37) % 94;
      const top = 4 + (index * 53) % 91;
      const size = 7 + index % 5 * 2;
      return <View key={index} style={[styles.guaranteedConfettiPiece, { left: `${left}%`, top: `${top}%`, width: size, height: index % 3 === 0 ? size * 2.2 : size, borderRadius: index % 4 === 0 ? size : 2, backgroundColor: colors[index % colors.length], transform: [{ rotate: `${(index * 47) % 180}deg` }] }]} />;
    })}
  </View>;
}
function CelebrationExplosion() {
  const { width, height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  const colors = ['#ff496c', '#ffd33f', '#22d4ce', '#8b6cff', '#ff8b4d', '#fff3d6'];
  const particles = Array.from({ length: 54 }, (_, index) => index);
  useEffect(() => {
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration: 3900, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, []);
  const burstSize = Math.min(width * 1.48, 610);
  return <View pointerEvents="none" collapsable={false} renderToHardwareTextureAndroid style={styles.celebrationExplosionLayer}>
    <Image fadeDuration={0} source={ASSETS.celebrationFall} resizeMode="contain" style={[styles.celebrationFallStatic, { width: width * 1.2, height: Math.min(height * .68, width * 1.34), left: -width * .1 }]} />
    <Animated.Image fadeDuration={0} source={ASSETS.celebrationBurst} resizeMode="contain" style={[styles.celebrationExplosionAsset, { width: burstSize, height: burstSize, left: (width - burstSize) / 2, top: height * .12, opacity: progress.interpolate({ inputRange: [0, .035, .72, 1], outputRange: [0, 1, .95, .34] }), transform: [{ translateY: progress.interpolate({ inputRange: [0, .16, 1], outputRange: [100, -22, 25] }) }, { scale: progress.interpolate({ inputRange: [0, .09, .25, 1], outputRange: [.08, 1.14, 1, 1.04] }) }] }]} />
    {particles.map((index) => {
      const delay = (index % 10) * .014;
      const end = .62 + (index % 7) * .04;
      const fall = progress.interpolate({ inputRange: [0, delay, end, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' });
      const size = 8 + index % 5 * 2;
      const left = ((index * 41) % 96) / 100 * width;
      const drift = ((index * 23) % 120) - 60;
      return <Animated.View key={index} style={[styles.celebrationParticle, { left, width: size, height: index % 3 === 0 ? size * 2.2 : size * 1.15, borderRadius: index % 4 === 0 ? size : 2, backgroundColor: colors[index % colors.length], opacity: fall.interpolate({ inputRange: [0, .025, .84, 1], outputRange: [0, 1, 1, .18] }), transform: [{ translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [-50 - (index % 6) * 18, height * .98] }) }, { translateX: fall.interpolate({ inputRange: [0, .5, 1], outputRange: [0, drift, -drift * .4] }) }, { rotate: fall.interpolate({ inputRange: [0, 1], outputRange: [`${index * 11}deg`, `${720 + index * 29}deg`] }) }, { scale: fall.interpolate({ inputRange: [0, .06, 1], outputRange: [.15, 1, .78] }) }] }]} />;
    })}
  </View>;
}
const COIN_STREAM_START = .035;
const COIN_STREAM_SPAN = .68;
const COIN_FLIGHT_SPAN = .24;
function FlyingRewardCoin({ progress, index, total, points }) {
  const sourceLeft = points.source.x - 23;
  const sourceTop = points.source.y - 23;
  const targetX = points.target.x - points.source.x;
  const targetY = points.target.y - points.source.y;
  const start = COIN_STREAM_START + index * (COIN_STREAM_SPAN / Math.max(1, total));
  const end = Math.min(.98, start + COIN_FLIGHT_SPAN);
  const flight = progress.interpolate({ inputRange: [0, start, end, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' });
  const sideWobble = index % 2 === 0 ? -14 : 14;
  return <Animated.View pointerEvents="none" style={[styles.transferCoin, { left: sourceLeft, top: sourceTop, opacity: flight.interpolate({ inputRange: [0, .035, .9, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateX: flight.interpolate({ inputRange: [0, .24, .7, 1], outputRange: [0, targetX * .2 + sideWobble, targetX * .7 - sideWobble * .25, targetX] }) }, { translateY: flight.interpolate({ inputRange: [0, .24, .7, 1], outputRange: [0, targetY * .2 - 54 - index % 3 * 7, targetY * .7 - 24, targetY] }) }, { rotateZ: flight.interpolate({ inputRange: [0, 1], outputRange: [`${index * 13}deg`, `${360 + index * 23}deg`] }) }, { scale: flight.interpolate({ inputRange: [0, .12, .82, 1], outputRange: [.55, 1.08, .94, .7] }) }] }]}><View style={styles.transferCoinGlow} /><Text style={styles.transferCoinMark}>G</Text></Animated.View>;
}
function CoinTransferTrail({ progress, count, points }) {
  const coins = Array.from({ length: Math.max(0, count) }, (_, index) => index);
  return <View pointerEvents="none" style={styles.coinTransferLayer}>{coins.map((index) => <FlyingRewardCoin key={`reward-flight-${index}`} progress={progress} index={index} total={coins.length} points={points} />)}</View>;
}
function SuccessOverlay({ completeAnim, goldAnim, confettiAnim, walletDisplay, rewardDisplay, reward, earnedStars, copy, onPress }) {
  const { width, height } = useWindowDimensions();
  const [flightPoints, setFlightPoints] = useState({ source: { x: width / 2, y: height / 2 + 72 }, target: { x: 46, y: 72 } });
  const rewardLayout = useRef({ container: null, card: null, number: null }).current;
  const walletLayout = useRef({ container: null, number: null }).current;
  const walletPulse = useRef(new Animated.Value(1)).current;
  const transferPulse = useRef(new Animated.Value(1)).current;
  const crestEntrance = useRef(new Animated.Value(0)).current;
  const rewardEntrance = useRef(new Animated.Value(0)).current;
  const crestFloat = useRef(new Animated.Value(0)).current;
  const openingFlash = useRef(new Animated.Value(0)).current;
  const updateRewardPoint = () => {
    const { container, card, number } = rewardLayout;
    if (!container || !card || !number) return;
    setFlightPoints((old) => ({ ...old, source: { x: container.x + card.x + number.x + number.width / 2, y: container.y + card.y + number.y + number.height / 2 } }));
  };
  const updateWalletPoint = () => {
    const { container, number } = walletLayout;
    if (!container || !number) return;
    setFlightPoints((old) => ({ ...old, target: { x: container.x + number.x + number.width / 2, y: container.y + number.y + number.height / 2 } }));
  };
  const captureRewardContainer = ({ nativeEvent: { layout } }) => { rewardLayout.container = layout; updateRewardPoint(); };
  const captureRewardCard = ({ nativeEvent: { layout } }) => { rewardLayout.card = layout; updateRewardPoint(); };
  const captureRewardNumber = ({ nativeEvent: { layout } }) => { rewardLayout.number = layout; updateRewardPoint(); };
  const captureWalletContainer = ({ nativeEvent: { layout } }) => { walletLayout.container = layout; updateWalletPoint(); };
  const captureWalletNumber = ({ nativeEvent: { layout } }) => { walletLayout.number = layout; updateWalletPoint(); };
  useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(crestEntrance, { toValue: 1, duration: 620, easing: Easing.out(Easing.back(1.45)), useNativeDriver: true }),
      Animated.sequence([Animated.delay(260), Animated.timing(rewardEntrance, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true })]),
      Animated.sequence([Animated.delay(70), Animated.timing(openingFlash, { toValue: 1, duration: 190, easing: Easing.out(Easing.quad), useNativeDriver: true }), Animated.timing(openingFlash, { toValue: 0, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true })]),
    ]);
    const floating = Animated.loop(Animated.sequence([Animated.delay(680), Animated.timing(crestFloat, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(crestFloat, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true })]));
    entrance.start(); floating.start();
    return () => { entrance.stop(); floating.stop(); };
  }, []);
  useEffect(() => {
    if (rewardDisplay <= 0) return;
    walletPulse.stopAnimation(); transferPulse.stopAnimation(); walletPulse.setValue(1.055); transferPulse.setValue(1.035);
    Animated.parallel([Animated.spring(walletPulse, { toValue: 1, damping: 8, stiffness: 220, useNativeDriver: true }), Animated.spring(transferPulse, { toValue: 1, damping: 9, stiffness: 190, useNativeDriver: true })]).start();
  }, [rewardDisplay]);
  const walletTop = Platform.OS === 'ios' ? 58 : (StatusBar.currentHeight || 24) + 10;
  const exactFlightPoints = { source: flightPoints.source, target: { x: 62, y: walletTop + 29 } };
  const visiblePieces = Array.from({ length: 44 }, (_, index) => index);
  const visibleColors = ['#ff4164', '#ffd12f', '#19d3cc', '#8067ff', '#ff8746', '#fff3d4'];
  return <Pressable onPress={onPress} style={[styles.successScreenRoot, styles.successOverlay]}>
    <View pointerEvents="none" style={styles.successBackdropTint} />
    <View pointerEvents="none" style={styles.successWaterDecoration}><View style={[styles.successWaterRipple, styles.successWaterRippleWide]} /><View style={styles.successWaterRipple} /><View style={[styles.successWaterRipple, styles.successWaterRippleSmall]} /></View>
    {visiblePieces.map((index) => {
      const fromLeft = index % 2 === 0;
      const delay = .025 + (index % 17) * .031;
      const end = Math.min(.97, delay + .38 + (index % 4) * .025);
      const flight = confettiAnim.interpolate({ inputRange: [0, delay, end, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' });
      const top = height * (.25 + ((index * 31) % 34) / 100);
      const size = 8 + index % 5 * 2;
      const travel = width * (.56 + (index % 6) * .055);
      const lift = 55 + (index % 7) * 13;
      return <Animated.View pointerEvents="none" key={`visible-${index}`} style={[styles.successVisiblePiece, { left: fromLeft ? -22 : width + 8, top, width: size, height: index % 3 === 0 ? size * 2.2 : size, borderRadius: index % 4 === 0 ? size : 2, backgroundColor: visibleColors[index % visibleColors.length], opacity: flight.interpolate({ inputRange: [0, .025, .78, 1], outputRange: [0, 1, .95, 0] }), transform: [{ translateX: flight.interpolate({ inputRange: [0, .42, 1], outputRange: [0, fromLeft ? travel * .72 : -travel * .72, fromLeft ? travel : -travel] }) }, { translateY: flight.interpolate({ inputRange: [0, .36, 1], outputRange: [0, -lift, height * (.34 + (index % 5) * .045)] }) }, { rotate: flight.interpolate({ inputRange: [0, 1], outputRange: [`${index * 17}deg`, `${760 + index * 37}deg`] }) }, { scale: flight.interpolate({ inputRange: [0, .08, .75, 1], outputRange: [.18, 1.15, 1, .72] }) }] }]}><View style={styles.successPieceShine} /></Animated.View>;
    })}
    <View style={styles.simpleCelebrationScene}><Animated.View pointerEvents="none" style={[styles.successOpeningGlow, { opacity: openingFlash, transform: [{ scaleX: openingFlash.interpolate({ inputRange: [0, 1], outputRange: [.25, 1.25] }) }, { scaleY: openingFlash.interpolate({ inputRange: [0, 1], outputRange: [.4, 1] }) }] }]} /><Animated.Image source={ASSETS.victoryCrestPremium} resizeMode="contain" fadeDuration={0} style={[styles.successCrestAssetFlow, { width: Math.min(width - 24, 380), opacity: crestEntrance.interpolate({ inputRange: [0, 1], outputRange: [.35, 1] }), transform: [{ translateY: Animated.add(crestEntrance.interpolate({ inputRange: [0, 1], outputRange: [34, 0] }), crestFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -5] })) }, { scale: Animated.multiply(crestEntrance.interpolate({ inputRange: [0, 1], outputRange: [.72, 1] }), crestFloat.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] })) }] }]} /><Animated.View onLayout={captureRewardContainer} style={[styles.successRewardEntranceWrap, { opacity: rewardEntrance.interpolate({ inputRange: [0, 1], outputRange: [.3, 1] }), transform: [{ translateY: rewardEntrance.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }, { scale: rewardEntrance.interpolate({ inputRange: [0, 1], outputRange: [.88, 1] }) }] }]}><Animated.View onLayout={captureRewardCard} style={[styles.simpleRewardCard, styles.simpleRewardCardCelebration, { transform: [{ scale: transferPulse }] }]}><Image source={ASSETS.goldCoin} resizeMode="contain" style={styles.rewardGoldAsset} /><View onLayout={captureRewardNumber} style={styles.rewardNumberAnchor}><Text style={styles.simpleRewardNumber}>{Math.max(0, reward - rewardDisplay)}</Text></View></Animated.View></Animated.View></View>
    <CoinTransferTrail progress={goldAnim} count={reward} points={exactFlightPoints} />
    <Animated.View onLayout={captureWalletContainer} style={[styles.winGoldWallet, styles.simpleTopWallet, { top: walletTop, transform: [{ scale: walletPulse }] }]}><Image source={ASSETS.goldCoin} resizeMode="contain" style={styles.walletGoldAsset} /><View onLayout={captureWalletNumber} style={styles.walletNumberAnchor}><Text style={styles.winGoldAmount}>{walletDisplay}</Text></View></Animated.View>
  </Pressable>;
}

function ReliableSuccessOverlay({ goldAnim, confettiAnim, walletDisplay, rewardDisplay, reward, onPress }) {
  const { width, height } = useWindowDimensions();
  const walletPulse = useRef(new Animated.Value(1)).current;
  const pieces = Array.from({ length: 34 }, (_, index) => index);
  const colors = ['#ff4f70', '#ffd348', '#27d7ca', '#8b72ff', '#ff914d', '#fff1c7'];
  const walletTop = Platform.OS === 'ios' ? 58 : (StatusBar.currentHeight || 24) + 12;
  const crestWidth = Math.min(width - 24, 360);
  const flightPoints = { source: { x: width / 2, y: height * .25 + crestWidth / 2 + 59 }, target: { x: 45, y: walletTop + 28 } };
  useEffect(() => {
    walletPulse.stopAnimation(); walletPulse.setValue(1.09);
    Animated.spring(walletPulse, { toValue: 1, damping: 8, stiffness: 240, mass: .55, useNativeDriver: true }).start();
  }, [walletDisplay]);
  return <Pressable onPress={onPress} style={styles.reliableSuccessRoot}>
    <Image pointerEvents="none" source={ASSETS.home} resizeMode="cover" fadeDuration={0} style={styles.reliableSuccessBackground} />
    <View pointerEvents="none" style={styles.reliableSuccessTint} />
    {pieces.map((index) => {
      const fromLeft = index % 2 === 0;
      const start = .01 + (index % 13) * .035;
      const end = Math.min(.96, start + .46);
      const flight = confettiAnim.interpolate({ inputRange: [0, start, end, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' });
      return <Animated.View key={`reliable-confetti-${index}`} pointerEvents="none" style={[styles.reliableConfetti, { left: fromLeft ? -18 : width + 8, top: height * (.26 + (index % 9) * .035), width: 8 + index % 4 * 2, height: index % 3 === 0 ? 22 : 10, borderRadius: index % 4 === 0 ? 8 : 2, backgroundColor: colors[index % colors.length], opacity: flight.interpolate({ inputRange: [0, .04, .82, 1], outputRange: [0, 1, .95, 0] }), transform: [{ translateX: flight.interpolate({ inputRange: [0, 1], outputRange: [0, fromLeft ? width * 1.12 : -width * 1.12] }) }, { translateY: flight.interpolate({ inputRange: [0, .38, 1], outputRange: [0, -80 - index % 6 * 12, height * .42] }) }, { rotate: flight.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${540 + index * 29}deg`] }) }] }]} />;
    })}
    <View pointerEvents="none" style={styles.reliableSuccessCenter}>
      <View collapsable={false} style={[styles.reliableVictoryVisual, { width: crestWidth, height: crestWidth / 2 }]}><Image source={ASSETS.victoryCrestPremium} resizeMode="contain" fadeDuration={0} style={styles.reliableVictoryImage} /></View>
      <View style={styles.reliableRewardCard}><View style={styles.reliableRewardCoin}><Text style={styles.reliableRewardCoinMark}>G</Text></View><Text style={styles.reliableRewardNumber}>{Math.max(0, reward - rewardDisplay)}</Text></View>
    </View>
    <CoinTransferTrail progress={goldAnim} count={reward} points={flightPoints} />
    <Animated.View style={[styles.reliableWallet, { top: walletTop, transform: [{ scale: walletPulse }] }]}><View style={styles.reliableWalletCoin}><Text style={styles.reliableWalletCoinMark}>G</Text></View><Text style={styles.reliableWalletNumber}>{walletDisplay}</Text></Animated.View>
  </Pressable>;
}
function BackgroundImage({ source, style, children }) {
  return <ImageBackground source={source} resizeMode="cover" style={style} imageStyle={styles.backgroundImage}>{children}</ImageBackground>;
}
function SafeScreen({ style, children }) { return <View style={[style, { paddingTop: Platform.OS === 'ios' ? 54 : StatusBar.currentHeight || 24 }]}>{children}</View>; }

function OpeningAnimation({ onFinished }) {
  const { width, height } = useWindowDimensions();
  const entrance = useRef(new Animated.Value(0)).current;
  const lightTravel = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;
  const shade = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(1)).current;
  const closing = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const rippleLoop = Animated.loop(Animated.sequence([
      Animated.timing(ripple, { toValue: 1, duration: 1250, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(ripple, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    rippleLoop.start();
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(entrance, { toValue: 1, duration: 780, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(lightTravel, { toValue: 1, duration: 1350, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(shade, { toValue: 1, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.delay(340),
      Animated.parallel([
        Animated.timing(contentFade, { toValue: 0, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([Animated.delay(120), Animated.timing(closing, { toValue: 0, duration: 520, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })]),
      ]),
    ]);
    animation.start(({ finished }) => { if (finished) onFinished?.(); });
    return () => { animation.stop(); rippleLoop.stop(); };
  }, []);

  const beamDistance = Math.max(width, height) * 1.15;
  return <Animated.View pointerEvents="none" style={[styles.openingRoot, { opacity: closing }]}>
    <Animated.Image source={ASSETS.home} resizeMode="cover" fadeDuration={0} style={styles.openingBackground} />
    <Animated.View style={[styles.openingShade, { opacity: shade }]} />
    <Animated.View style={[styles.openingFxLayer, { opacity: contentFade }]}>
      <Animated.View style={[styles.openingLightSweep, { transform: [{ rotate: '-22deg' }, { translateX: lightTravel.interpolate({ inputRange: [0, 1], outputRange: [-beamDistance, beamDistance] }) }] }]} />
      <View style={styles.openingCenter}>
        <Animated.View style={[styles.openingMoonAura, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [34, 0] }) }, { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [.68, 1] }) }] }]}>
          <Animated.View style={[styles.openingRipple, { opacity: ripple.interpolate({ inputRange: [0, .55, 1], outputRange: [.05, .5, 0] }), transform: [{ scale: ripple.interpolate({ inputRange: [0, 1], outputRange: [.72, 1.65] }) }] }]} />
          <View style={styles.openingMoonGlass}><Text style={styles.openingMoon}>◐</Text></View>
        </Animated.View>
        <Animated.Text style={[styles.openingTitle, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }]}>MIRROR</Animated.Text>
        <Animated.Text style={[styles.openingTitleLake, { opacity: entrance.interpolate({ inputRange: [0, .35, 1], outputRange: [0, 0, 1] }), transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>LAKE</Animated.Text>
        <Animated.View style={[styles.openingDivider, { opacity: entrance, transform: [{ scaleX: entrance }] }]}><View style={styles.openingDividerCore} /></Animated.View>
      </View>
      <Animated.View style={[styles.openingWaterRipple, styles.openingWaterRippleWide, { opacity: ripple.interpolate({ inputRange: [0, .5, 1], outputRange: [.08, .55, 0] }), transform: [{ scaleX: ripple.interpolate({ inputRange: [0, 1], outputRange: [.45, 1.15] }) }] }]} />
      <Animated.View style={[styles.openingWaterRipple, { opacity: ripple.interpolate({ inputRange: [0, .6, 1], outputRange: [.12, .7, 0] }), transform: [{ scaleX: ripple.interpolate({ inputRange: [0, 1], outputRange: [.3, 1] }) }] }]} />
    </Animated.View>
  </Animated.View>;
}

function Home({ progress, playLevel, onPlay, onSettings, copy }) {
  const { width, height } = useWindowDimensions();
  const compact = height < 700 || width < 360;
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.045, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);
  return <BackgroundImage source={ASSETS.home} style={styles.homeBg}>
    <StatusBar barStyle="light-content" />
    <View style={styles.homeShade} />
    <SafeScreen style={[styles.homeSafe, compact && styles.homeSafeCompact]}>
      <View style={styles.homeTop}><View style={[styles.homeTopActions, compact && styles.homeTopActionsCompact]}><View style={[styles.homeCoinBadge, compact && styles.homeCoinBadgeCompact]}><Text style={[styles.homeCoinIcon, compact && styles.homeCoinIconCompact]}>G</Text><Text style={[styles.homeCoinText, compact && styles.homeTopTextCompact]}>{progress.moonCoins || 0}</Text></View><Pressable onPress={onSettings} style={({ pressed }) => [styles.homeSettingsButton, compact && styles.homeSettingsButtonCompact, pressed && styles.gameNavPressed]}><Image source={ASSETS.navSettings} style={[styles.homeSettingsIcon, compact && styles.homeSettingsIconCompact]} /></Pressable></View></View>
      <View style={[styles.homeCenter, compact && styles.homeCenterCompact]}><Animated.View style={[styles.homeMoonBadge, compact && styles.homeMoonBadgeCompact, { transform: [{ scale: pulse }] }]}><Text style={[styles.homeMoon, compact && styles.homeMoonCompact]}>◐</Text></Animated.View><Text style={[styles.homeTitle, compact && styles.homeTitleCompact]}>Mirror{`\n`}Lake</Text><Text style={[styles.homeSubtitle, compact && styles.homeSubtitleCompact]}>{copy.subtitle}</Text><Pressable onPress={onPlay} style={({ pressed }) => [styles.primaryHomeButton, styles.homePlayButtonCentered, compact && styles.homePlayButtonCompact, pressed && styles.buttonPressed]}><View pointerEvents="none" style={styles.homePlayTopGlow} /><View style={styles.homePlayCopy}><Text style={styles.homePlayMeta}>{copy.level.toUpperCase()} {playLevel}</Text><Text style={styles.homePlayLabel}>{copy.play}</Text></View></Pressable></View>
      <View style={[styles.homeActions, compact && styles.homeActionsCompact]}>
        <View style={[styles.homePublisher, compact && styles.homePublisherCompact]}><Image source={ASSETS.gorsenLogo} resizeMode="contain" style={[styles.homePublisherLogo, compact && styles.homePublisherLogoCompact]} /><Text style={styles.homePublisherName}>GÖRSEN GAMES</Text></View>
      </View>
    </SafeScreen>
  </BackgroundImage>;
}

function LevelMap({ progress, setProgress, onSelect, onReset, onHome, onSettings, copy, language }) {
  const unlocked = TOTAL_LEVELS;
  const currentLevel = Math.min(TOTAL_LEVELS, Math.max(1, progress.unlocked || 1));
  const totalStars = Object.values(progress.stars || {}).reduce((a, b) => a + b, 0);
  const unlockedChapters = progress.unlockedChapters || [0];
  const [chapterIndex, setChapterIndex] = useState(0);
  const [showLayerUnlock, setShowLayerUnlock] = useState(false);
  const layerUnlockAnim = useRef(new Animated.Value(0)).current;
  const chapterStart = chapterIndex * CHAPTER_SIZE, visibleLevels = LEVELS.slice(chapterStart, chapterStart + CHAPTER_SIZE);
  const chapterUnlocked = unlockedChapters.includes(chapterIndex), unlockCost = chapterCost(chapterIndex), previousUnlocked = chapterIndex === 0 || unlockedChapters.includes(chapterIndex - 1);
  const desiredContinue = currentLevel - 1, desiredChapter = Math.floor(desiredContinue / CHAPTER_SIZE), highestOpenChapter = Math.max(...unlockedChapters), continueIndex = unlockedChapters.includes(desiredChapter) ? desiredContinue : highestOpenChapter * CHAPTER_SIZE;
  function unlockChapter() {
    if (!previousUnlocked) { Alert.alert(copy.layerLocked, copy.unlockPrevious); return; }
    if ((progress.moonCoins || 0) < unlockCost) { Alert.alert(copy.layerLocked, copy.notEnough); return; }
    setProgress((old) => ({ ...old, moonCoins: Math.max(0, (old.moonCoins || 0) - unlockCost), unlockedChapters: [...new Set([...(old.unlockedChapters || [0]), chapterIndex])] }));
    layerUnlockAnim.setValue(0); setShowLayerUnlock(true);
    Animated.sequence([Animated.timing(layerUnlockAnim, { toValue: 1, duration: 430, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }), Animated.delay(1150), Animated.timing(layerUnlockAnim, { toValue: 0, duration: 320, useNativeDriver: true })]).start(() => setShowLayerUnlock(false));
  }
  return <BackgroundImage source={ASSETS.levelsBg} style={styles.screenBg}><View style={styles.levelsShade} /><SafeScreen style={styles.safe}><StatusBar barStyle="dark-content" /><ScrollView contentContainerStyle={styles.mapContent} showsVerticalScrollIndicator={false}>
    <View style={styles.brandRow}><Pressable onPress={onHome} style={styles.mapBack}><Image source={ASSETS.navHome} style={styles.mapNavIcon} /></Pressable><View style={styles.mapBrand}><Text style={styles.kicker}>{copy.levelSelect}</Text><Text style={styles.logo}>Mirror Lake</Text></View><View style={styles.mapHeaderTools}><View style={styles.mapCoinBadge}><Text style={styles.mapCoinIcon}>G</Text><Text style={styles.mapCoinAmount}>{progress.moonCoins || 0}</Text></View><View style={styles.totalBadge}><Text style={styles.totalNumber}>{totalStars}</Text><Text style={styles.totalLabel}>{copy.stars}</Text></View><Pressable onPress={onSettings} style={styles.mapSettings}><Image source={ASSETS.navSettings} style={styles.mapSettingsIcon} /></Pressable></View></View>
    <View style={styles.heroCard}><Text style={styles.heroMoon}>◐</Text><Text style={styles.heroTitle}>{copy.heroTitle}</Text><Text style={styles.heroText}>{copy.heroText}</Text><Pressable style={styles.continueButton} onPress={() => onSelect(continueIndex)}><Text style={styles.continueText}>{copy.continueAt} · {copy.level} {continueIndex + 1}</Text><Text style={styles.arrow}>→</Text></Pressable></View>
    <View style={styles.sectionRow}><Text style={styles.sectionTitle}>{copy.lakeMap}</Text><Text style={styles.sectionMeta}>{unlockedChapters.length}/{TOTAL_CHAPTERS} {copy.layer.toLowerCase()}</Text></View>
    <View style={styles.chapterNavigator}><Pressable disabled={chapterIndex === 0} onPress={() => setChapterIndex((old) => Math.max(0, old - 1))} style={[styles.chapterButton, chapterIndex === 0 && styles.chapterButtonDisabled]}><Text style={styles.chapterButtonText}>‹ {copy.previous}</Text></Pressable><View style={styles.chapterBadge}><Text style={styles.chapterLabel}>{copy.chapter}</Text><Text style={styles.chapterNumber}>{chapterIndex + 1}/{TOTAL_CHAPTERS}</Text></View><Pressable disabled={chapterIndex === TOTAL_CHAPTERS - 1} onPress={() => setChapterIndex((old) => Math.min(TOTAL_CHAPTERS - 1, old + 1))} style={[styles.chapterButton, chapterIndex === TOTAL_CHAPTERS - 1 && styles.chapterButtonDisabled]}><Text style={styles.chapterButtonText}>{copy.nextChapter} ›</Text></Pressable></View>
    {!chapterUnlocked && <View style={styles.layerLockCard}><View style={styles.layerLockIcon}><Text style={styles.layerLockMoon}>G</Text></View><Text style={styles.layerLockTitle}>{copy.layerLocked}</Text><Text style={styles.layerLockText}>{copy.layer} {chapterIndex + 1} · {chapterStart + 1}–{Math.min(TOTAL_LEVELS, chapterStart + CHAPTER_SIZE)}</Text><Pressable onPress={unlockChapter} style={[styles.layerUnlockButton, !previousUnlocked && styles.layerUnlockDisabled]}><Text style={styles.layerUnlockText}>{previousUnlocked ? `${copy.unlockLayer} · ● ${unlockCost}` : copy.unlockPrevious}</Text></Pressable></View>}
    <View style={styles.levelGrid}>{visibleLevels.map((level, localIndex) => {
      const i = chapterStart + localIndex, locked = !chapterUnlocked, star = progress.stars?.[level.id] || 0, difficulty = i < 125 ? copy.calm : i < 350 ? copy.medium : copy.hard;
      const marks = [...(level.rocks.length ? ['●'] : []), ...(level.gates.length ? ['›'] : []), ...(level.mirrors.some((m) => m.fixed) ? ['◇'] : []), ...(level.mirrors.some((m) => m.frozen) ? ['❄'] : []), ...(level.portals.length ? ['◎'] : []), ...(level.seal ? ['☾'] : []), ...(level.prisms.length ? ['◈'] : []), ...(level.runes.length ? ['①'] : []), ...(level.moveLimit ? ['⚡'] : [])];
      return <Pressable key={level.id} onPress={() => !locked && onSelect(i)} style={({ pressed }) => [styles.levelButton, locked && styles.levelLocked, pressed && !locked && styles.levelPressed]}>
        <View style={styles.levelCardTop}><View style={[styles.levelNumberBadge, locked && styles.levelNumberBadgeLocked]}><Text style={styles.levelNumber}>{locked ? '◆' : level.id}</Text></View><Text style={styles.levelDifficulty}>{difficulty}</Text></View>
        <Text style={styles.levelName} numberOfLines={2}>{locked ? copy.locked : language === 'en' ? level.titleEn : level.title}</Text>
        <View style={styles.levelMechanics}>{marks.map((mark, k) => <Text key={`${mark}-${k}`} style={styles.levelMechanicMark}>{mark}</Text>)}</View>
        <View style={styles.levelCardFooter}>{!locked ? <Stars count={star} small /> : <View />}<Text style={styles.levelStarCount}>{locked ? '—' : `${star}/3`}</Text></View>
      </Pressable>;
    })}</View>
    <Pressable onPress={onReset} style={styles.resetProgress}><Text style={styles.resetText}>{copy.reset}</Text></Pressable>
  </ScrollView></SafeScreen>{showLayerUnlock && <Animated.View pointerEvents="none" style={[styles.layerCelebration, { opacity: layerUnlockAnim, transform: [{ scale: layerUnlockAnim.interpolate({ inputRange: [0, 1], outputRange: [.7, 1] }) }] }]}><View style={styles.layerCelebrationMoon}><Text style={styles.layerCelebrationMoonText}>☾</Text></View><Text style={styles.layerCelebrationKicker}>{copy.layerOpened}</Text><Text style={styles.layerCelebrationTitle}>{copy.layer} {chapterIndex + 1}</Text><Text style={styles.layerCelebrationText}>{copy.newLevels}</Text></Animated.View>}</BackgroundImage>;
}

function Game({ index, progress, setProgress, onHome, onSettings, onComplete, copy, language, playSfx }) {
  const level = LEVELS[index];
  const [mirrors, setMirrors] = useState(() => level.mirrors.map((m) => ({ ...m, angle: m.initial })));
  const [moves, setMoves] = useState(0), [won, setWon] = useState(false), [goalReached, setGoalReached] = useState(false), [pending, setPending] = useState(false), [failed, setFailed] = useState(false), [reward, setReward] = useState(0), [rewardDisplay, setRewardDisplay] = useState(0), [earnedStars, setEarnedStars] = useState(0), [walletStart, setWalletStart] = useState(progress.moonCoins || 0), [walletDisplay, setWalletDisplay] = useState(progress.moonCoins || 0), [hinted, setHinted] = useState(false);
  const [lightUpdate, setLightUpdate] = useState({ revision: 0, from: 0, full: true });
  const completeAnim = useRef(new Animated.Value(0)).current;
  const goldAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const completionTimers = useRef([]);
  const rewardTransfer = useRef({ delay: null, animation: null });
  const advanceTimer = useRef(null);
  const transferComplete = useRef(false);
  function clearCompletionTimers() { completionTimers.current.forEach((timer) => clearTimeout(timer)); completionTimers.current = []; }
  function stopRewardTransfer() { clearTimeout(rewardTransfer.current.delay); rewardTransfer.current.animation?.stop(); rewardTransfer.current = { delay: null, animation: null }; }
  function stopAdvanceTimer() { clearTimeout(advanceTimer.current); advanceTimer.current = null; }
  function scheduleAdvance(delay = 950) { stopAdvanceTimer(); advanceTimer.current = setTimeout(() => { advanceTimer.current = null; onComplete(); }, delay); }
  function finishRewardTransfer() {
    if (!won || transferComplete.current) return;
    transferComplete.current = true; stopRewardTransfer();
    goldAnim.stopAnimation(); goldAnim.setValue(1);
    setRewardDisplay(reward); setWalletDisplay(walletStart + reward);
    scheduleAdvance();
  }
  function handleSuccessPress() {
    if (!transferComplete.current) { finishRewardTransfer(); return; }
    stopAdvanceTimer(); onComplete();
  }
  useEffect(() => { clearCompletionTimers(); stopRewardTransfer(); stopAdvanceTimer(); transferComplete.current = false; setMirrors(level.mirrors.map((m) => ({ ...m, angle: m.initial }))); setMoves(0); setWon(false); setGoalReached(false); setPending(false); setFailed(false); setReward(0); setRewardDisplay(0); setEarnedStars(0); setWalletStart(progress.moonCoins || 0); setWalletDisplay(progress.moonCoins || 0); setHinted(false); setLightUpdate((old) => ({ revision: old.revision + 1, from: 0, full: true })); completeAnim.setValue(0); goldAnim.setValue(0); confettiAnim.setValue(0); return () => { clearCompletionTimers(); stopRewardTransfer(); stopAdvanceTimer(); }; }, [index]);
  useEffect(() => {
    if (!won) return;
    scheduleAdvance(6000);
    confettiAnim.setValue(0);
    Animated.parallel([
      Animated.spring(completeAnim, { toValue: 1, damping: 13, stiffness: 105, overshootClamping: true, useNativeDriver: true }),
      Animated.timing(confettiAnim, { toValue: 1, duration: 6200, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  }, [won]);
  useEffect(() => {
    if (!won) return undefined;
    const finalWallet = walletStart + reward;
    transferComplete.current = false; stopRewardTransfer();
    setRewardDisplay(0); setWalletDisplay(walletStart); goldAnim.setValue(0);
    const spacing = COIN_STREAM_SPAN / Math.max(1, reward), firstLaunch = COIN_STREAM_START, firstArrival = firstLaunch + COIN_FLIGHT_SPAN;
    const transferListener = goldAnim.addListener(({ value }) => {
      const launched = value < firstLaunch ? 0 : Math.min(reward, Math.floor((value - firstLaunch) / spacing) + 1);
      const arrived = value < firstArrival ? 0 : Math.min(reward, Math.floor((value - firstArrival) / spacing) + 1);
      setRewardDisplay(launched);
      setWalletDisplay(walletStart + arrived);
    });
    if (!reward) {
      setWalletDisplay(finalWallet); transferComplete.current = true; scheduleAdvance(1200);
      return () => goldAnim.removeListener(transferListener);
    }
    const streamDuration = Math.max(2400, Math.min(3800, reward * 105));
    rewardTransfer.current.delay = setTimeout(() => {
      playSfx('coin');
      rewardTransfer.current.animation = Animated.timing(goldAnim, { toValue: 1, duration: streamDuration, easing: Easing.linear, useNativeDriver: true });
      rewardTransfer.current.animation.start(({ finished }) => { if (!finished) return; transferComplete.current = true; setRewardDisplay(reward); setWalletDisplay(finalWallet); rewardTransfer.current = { delay: null, animation: null }; scheduleAdvance(); });
    }, 820);
    return () => { stopRewardTransfer(); goldAnim.removeListener(transferListener); };
  }, [won]);
  function queueWin(result, nextMoves, redrawFrom = 0, walletBase = progress.moonCoins || 0) {
    const star = nextMoves <= level.par ? 3 : nextMoves <= level.par + 2 ? 2 : 1, previousStar = progress.stars?.[level.id] || 0;
    const coinReward = previousStar === 0 ? 10 + star * 8 : Math.max(6, Math.max(0, star - previousStar) * 6);
    const goalStep = Math.max(0, result.steps.length - 1), animatedSteps = Math.max(0, goalStep - Math.max(0, redrawFrom));
    const lightArrivalDelay = animatedSteps * BEAM_STEP_DELAY + BEAM_DRAW_DURATION + 80;
    clearCompletionTimers(); setGoalReached(false);
    setReward(coinReward); setEarnedStars(star); setWalletStart(walletBase); setPending(true);
    completionTimers.current.push(setTimeout(() => {
      setGoalReached(true); playSfx('complete');
      completionTimers.current.push(setTimeout(() => {
        setPending(false); setWon(true); setProgress((old) => ({ ...old, unlocked: Math.max(old.unlocked || 1, Math.min(TOTAL_LEVELS, level.id + 1)), moonCoins: (old.moonCoins || 0) + coinReward, unlockedChapters: [...new Set([...(old.unlockedChapters || [0]), Math.floor(Math.min(level.id, TOTAL_LEVELS - 1) / CHAPTER_SIZE)])], stars: { ...(old.stars || {}), [level.id]: Math.max(old.stars?.[level.id] || 0, star) } }));
      }, LILY_BLOOM_DURATION));
    }, lightArrivalDelay));
  }
  function rotateMirror(i) {
    if (pending || won) return;
    setFailed(false);
    const before = trace(level, mirrors), changed = mirrors[i];
    if (!changed || changed.fixed) return;
    const nextMoves = moves + 1;
    if (changed.frozen) {
      playSfx('ice');
      setMirrors(mirrors.map((m, k) => k === i ? { ...m, frozen: false } : m)); setMoves(nextMoves); if (level.moveLimit && nextMoves >= level.moveLimit) exhaustEnergy(); return;
    }
    playSfx('turn');
    let next = mirrors.map((m, k) => {
      const linked = changed.link && m.link === changed.link;
      if (k === i || linked) return { ...m, angle: m.angle ^ 1, fixed: m.oneUse && (k === i || linked) ? true : m.fixed };
      if (level.tide && m.tide) return { ...m, angle: m.angle ^ 1 };
      return m;
    });
    if (level.movingMirror) next = next.map((mirror) => { if (!mirror.moving) return mirror; const atStart = mirror.x === mirror.track[0].x && mirror.y === mirror.track[0].y, target = atStart ? mirror.track[1] : mirror.track[0]; return { ...mirror, x: target.x, y: target.y }; });
    setMirrors(next); setMoves(nextMoves);
    const result = trace(level, next);
    const redrawFrom = lightRedrawPoint(before.steps, result.steps);
    if (redrawFrom !== null) setLightUpdate((old) => ({ revision: old.revision + 1, from: redrawFrom, full: false }));
    if (reachedFinalFlower(result)) queueWin(result, nextMoves, redrawFrom ?? 0); else if (level.moveLimit && nextMoves >= level.moveLimit) exhaustEnergy();
  }
  function useHint() {
    if (pending || won) return;
    const targetIndex = mirrors.findIndex((m) => m.required && !m.fixed && (m.frozen || m.angle !== m.solution));
    if (targetIndex < 0) { Alert.alert(copy.hint, copy.noHint); return; }
    if ((progress.moonCoins || 0) < HINT_COST) { Alert.alert(copy.hint, copy.notEnough); return; }
    playSfx('tap'); setProgress((old) => ({ ...old, moonCoins: Math.max(0, (old.moonCoins || 0) - HINT_COST) }));
    const before = trace(level, mirrors), target = mirrors[targetIndex];
    const next = mirrors.map((m, i) => i === targetIndex || target.link && m.link === target.link ? { ...m, frozen: false, angle: m.solution, fixed: m.oneUse ? true : m.fixed } : m);
    const result = trace(level, next), redrawFrom = lightRedrawPoint(before.steps, result.steps);
    setMirrors(next); setHinted(true); setFailed(false); if (redrawFrom !== null) setLightUpdate((old) => ({ revision: old.revision + 1, from: redrawFrom, full: false }));
    setTimeout(() => setHinted(false), 900);
    if (reachedFinalFlower(result)) queueWin(result, Math.max(moves, level.par + 1), redrawFrom ?? 0, Math.max(0, (progress.moonCoins || 0) - HINT_COST));
  }
  function exhaustEnergy() { clearCompletionTimers(); setPending(true); completionTimers.current.push(setTimeout(() => { setMirrors(level.mirrors.map((m) => ({ ...m, angle: m.initial }))); setMoves(0); setGoalReached(false); setPending(false); setFailed(true); setLightUpdate((old) => ({ revision: old.revision + 1, from: 0, full: true })); }, 520)); }
  function restart() { clearCompletionTimers(); stopRewardTransfer(); stopAdvanceTimer(); transferComplete.current = false; setMirrors(level.mirrors.map((m) => ({ ...m, angle: m.initial }))); setMoves(0); setWon(false); setGoalReached(false); setPending(false); setFailed(false); setReward(0); setRewardDisplay(0); setEarnedStars(0); setWalletStart(progress.moonCoins || 0); setWalletDisplay(progress.moonCoins || 0); setHinted(false); completeAnim.setValue(0); goldAnim.setValue(0); confettiAnim.setValue(0); setLightUpdate((old) => ({ revision: old.revision + 1, from: 0, full: true })); }
  const hasFrozen = mirrors.some((m) => m.frozen);
  const missionTrace = useMemo(() => trace(level, mirrors), [level, mirrors]);
  const missionItems = [];
  if (level.targetColor) missionItems.push({ icon: '◈', label: level.targetColor === 'blue' ? copy.blueLight : copy.goldLight, complete: missionTrace.beamColor === level.targetColor && missionTrace.litPrisms?.size === level.prisms.length, blue: level.targetColor === 'blue' });
  if (level.runes?.length) missionItems.push({ icon: '☾', label: `${missionTrace.litRunes?.size || 0}/${level.runes.length}`, complete: missionTrace.litRunes?.size === level.runes.length });
  if (level.extraGoals?.length) missionItems.push({ icon: '✿', label: `${missionTrace.litGoals?.size || 0}/${level.extraGoals.length}`, complete: missionTrace.litGoals?.size === level.extraGoals.length });
  if (level.seal) missionItems.push({ icon: '✦', label: copy.seal, complete: missionTrace.sealLit });
  return <BackgroundImage source={ASSETS.gameplayBg} style={styles.screenBg}><View style={styles.gameShade} /><SafeScreen style={styles.gameSafe}><StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
    <View style={styles.gameHeader}><Pressable onPress={onHome} hitSlop={10} style={({ pressed }) => [styles.iconButton, pressed && styles.gameNavPressed]}><Image source={ASSETS.navHome} resizeMode="contain" style={styles.gameHeaderIconAsset} /></Pressable><View style={styles.headerGoldWallet}><View style={styles.headerGoldCoin}><Text style={styles.headerGoldCoinText}>G</Text></View><Text style={styles.headerGoldAmount}>{progress.moonCoins || 0}</Text></View><Pressable onPress={onSettings} hitSlop={10} style={({ pressed }) => [styles.iconButton, pressed && styles.gameNavPressed]}><Image source={ASSETS.navSettings} resizeMode="contain" style={styles.gameHeaderIconAsset} /></Pressable></View>
    <View style={styles.gameBody}><View style={styles.movePill}><Text style={styles.remainingMoveLabel}>{copy.moves}</Text><Text style={styles.remainingMoveNumber}>{Math.max(0, level.par - moves)}</Text>{level.moveLimit && <><View style={styles.pillLine} /><Text style={styles.energyText}>⚡ {Math.max(0, level.moveLimit - moves)}</Text></>}</View>{missionItems.length > 0 && <View style={styles.missionPanel}><Text style={styles.missionLabel}>{copy.mission}</Text><View style={styles.missionItems}>{missionItems.map((item, itemIndex) => <View key={`${item.label}-${itemIndex}`} style={[styles.missionChip, item.blue && styles.missionChipBlue, item.complete && styles.missionChipComplete]}><Text style={[styles.missionIcon, item.blue && styles.missionIconBlue]}>{item.icon}</Text><Text style={styles.missionText}>{item.label}</Text>{item.complete && <Text style={styles.missionCheck}>✓</Text>}</View>)}</View></View>}<LakeBoard level={level} mirrors={mirrors} onMirror={rotateMirror} won={goalReached} locked={won || pending} lightUpdate={lightUpdate} /></View>
  </SafeScreen><Modal visible={won} transparent={false} statusBarTranslucent animationType="fade" presentationStyle="fullScreen" onRequestClose={handleSuccessPress}><View style={styles.successModalHost}><ReliableSuccessOverlay goldAnim={goldAnim} confettiAnim={confettiAnim} walletDisplay={walletDisplay} rewardDisplay={rewardDisplay} reward={reward} onPress={handleSuccessPress} /></View></Modal></BackgroundImage>;
}

function SettingToggle({ value, onChange, copy }) {
  return <Pressable onPress={() => onChange(!value)} style={[styles.settingToggle, value && styles.settingToggleOn]}><Animated.View style={[styles.toggleKnob, value && styles.toggleKnobOn]} /><Text style={[styles.toggleLabel, value && styles.toggleLabelOn]}>{value ? copy.on : copy.off}</Text></Pressable>;
}

function SettingsScreen({ settings, setSettings, onBack, copy }) {
  const update = (key, value) => setSettings((old) => ({ ...old, [key]: value }));
  return <BackgroundImage source={ASSETS.levelsBg} style={styles.screenBg}><View style={styles.settingsShade} /><SafeScreen style={styles.settingsSafe}><StatusBar barStyle="dark-content" />
    <View style={styles.settingsHeader}><Pressable onPress={onBack} style={({ pressed }) => [styles.settingsBack, pressed && styles.gameNavPressed]}><Image source={ASSETS.navHome} resizeMode="contain" style={styles.settingsHomeIcon} /></Pressable><View style={styles.settingsHeaderPlate}><Text style={styles.settingsKicker}>MIRROR LAKE</Text><Text style={styles.settingsTitle}>{copy.settings}</Text></View></View>
    <ScrollView contentContainerStyle={styles.settingsContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.settingsSectionLabel}>{copy.display}</Text>
      <View style={styles.settingsCard}><View style={styles.settingCopy}><Text style={styles.settingName}>{copy.language}</Text><Text style={styles.settingDescription}>Türkçe / English</Text></View><View style={styles.languageControl}><Pressable onPress={() => update('language', 'tr')} style={[styles.languageChoice, settings.language === 'tr' && styles.languageChoiceActive]}><Text style={[styles.languageText, settings.language === 'tr' && styles.languageTextActive]}>TR</Text></Pressable><Pressable onPress={() => update('language', 'en')} style={[styles.languageChoice, settings.language === 'en' && styles.languageChoiceActive]}><Text style={[styles.languageText, settings.language === 'en' && styles.languageTextActive]}>EN</Text></Pressable></View></View>
      <Text style={styles.settingsSectionLabel}>{copy.audio}</Text>
      <View style={styles.settingsGroup}><View style={styles.settingsCard}><View style={styles.settingIconPlate}><Text style={styles.settingSymbol}>♫</Text></View><View style={styles.settingCopy}><Text style={styles.settingName}>{copy.music}</Text><Text style={styles.settingDescription}>Mirror Lake ambience</Text></View><SettingToggle value={settings.music} onChange={(v) => update('music', v)} copy={copy} /></View><View style={styles.settingsDivider} /><View style={styles.settingsCard}><View style={styles.settingIconPlate}><Text style={styles.settingSymbol}>✦</Text></View><View style={styles.settingCopy}><Text style={styles.settingName}>{copy.sound}</Text><Text style={styles.settingDescription}>UI · mirror · crystal</Text></View><SettingToggle value={settings.sound} onChange={(v) => update('sound', v)} copy={copy} /></View></View>
    </ScrollView>
  </SafeScreen></BackgroundImage>;
}

export default function App() {
  const [screen, setScreen] = useState('home'), [levelIndex, setLevelIndex] = useState(0), [progress, setProgress] = useState(DEFAULT_PROGRESS), [settings, setSettings] = useState({ language: 'tr', music: true, sound: true }), [settingsReturn, setSettingsReturn] = useState('home'), [loaded, setLoaded] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const sceneAnim = useRef(new Animated.Value(1)).current;
  const transitionVeil = useRef(new Animated.Value(0)).current;
  const transitioningRef = useRef(false);
  const splashHiddenRef = useRef(false);
  const storageRef = useRef(null), playersRef = useRef({});
  const copy = COPY[settings.language] || COPY.tr;
  function hideNativeSplash() {
    if (splashHiddenRef.current) return;
    splashHiddenRef.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }
  useEffect(() => {
    const fallback = setTimeout(hideNativeSplash, 300);
    return () => clearTimeout(fallback);
  }, []);
  useEffect(() => {
    let mounted = true;
    const startupFallback = setTimeout(() => { if (mounted) setLoaded(true); }, 1400);
    const storageTimer = setTimeout(() => {
      try {
        const storage = require('@react-native-async-storage/async-storage').default;
        storageRef.current = storage;
        Promise.all([storage.getItem(SAVE_KEY), storage.getItem(SETTINGS_KEY)]).then(([savedProgress, savedSettings]) => {
          if (!mounted) return;
          if (savedProgress) setProgress(normalizeProgress(JSON.parse(savedProgress)));
          if (savedSettings) setSettings((old) => ({ ...old, ...JSON.parse(savedSettings) }));
        }).catch(() => {}).finally(() => { if (mounted) { clearTimeout(startupFallback); setLoaded(true); } });
      } catch (_) { if (mounted) setLoaded(true); }
    }, 120);
    return () => {
      mounted = false; clearTimeout(startupFallback); clearTimeout(storageTimer);
    };
  }, []);
  useEffect(() => {
    let mounted = true;
    const preloadTimers = [ASSETS.gameplayBg, ASSETS.mirror, ASSETS.lilyClosed, ASSETS.victoryCrestPremium].map((source, index) => (
      setTimeout(() => {
        const uri = Image.resolveAssetSource(source)?.uri;
        if (uri) Image.prefetch(uri).catch(() => {});
      }, 240 + index * 130)
    ));
    const audioTimer = setTimeout(async () => {
      try {
        const audio = require('expo-audio');
        await audio.setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
        if (!mounted) return;
        playersRef.current = {
          music: audio.createAudioPlayer(ASSETS.music), turn: audio.createAudioPlayer(ASSETS.sfxTurn), ice: audio.createAudioPlayer(ASSETS.sfxIce),
          tap: audio.createAudioPlayer(ASSETS.sfxTap), complete: audio.createAudioPlayer(ASSETS.sfxComplete), coin: audio.createAudioPlayer(ASSETS.sfxCoin),
        };
        setAudioReady(true);
      } catch (_) {}
    }, 1450);
    return () => {
      mounted = false; preloadTimers.forEach(clearTimeout); clearTimeout(audioTimer);
      Object.values(playersRef.current).forEach((player) => { try { player.release(); } catch (_) {} });
      playersRef.current = {};
    };
  }, []);
  useEffect(() => { if (loaded && storageRef.current) storageRef.current.setItem(SAVE_KEY, JSON.stringify(progress)).catch(() => {}); }, [progress, loaded]);
  useEffect(() => { if (loaded && storageRef.current) storageRef.current.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => {}); }, [settings, loaded]);
  useEffect(() => {
    if (!audioReady) return;
    try {
      const musicPlayer = playersRef.current.music;
      if (!musicPlayer) return;
      musicPlayer.loop = true; musicPlayer.volume = .22;
      if (settings.music) musicPlayer.play(); else musicPlayer.pause();
    } catch (_) {}
  }, [settings.music, audioReady]);
  function playSfx(name) {
    if (!settings.sound) return;
    const player = playersRef.current[name] || playersRef.current.tap;
    if (!player) return;
    player.volume = name === 'complete' ? .48 : name === 'coin' ? .42 : .34;
    player.seekTo(0).then(() => player.play()).catch(() => {});
  }
  function navigate(nextScreen, nextLevel = levelIndex, withSound = true) {
    if (transitioningRef.current || nextScreen === screen && nextLevel === levelIndex) return;
    transitioningRef.current = true; setTransitioning(true);
    if (withSound) playSfx('tap');
    const coverDuration = withSound ? 230 : 310, revealDuration = withSound ? 460 : 560;
    sceneAnim.stopAnimation(); transitionVeil.stopAnimation();
    Animated.parallel([
      Animated.timing(transitionVeil, { toValue: 1, duration: coverDuration, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.timing(sceneAnim, { toValue: .9, duration: coverDuration, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (!finished) { transitioningRef.current = false; setTransitioning(false); return; }
      setLevelIndex(nextLevel); setScreen(nextScreen); sceneAnim.setValue(.92);
      setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(transitionVeil, { toValue: 0, duration: revealDuration, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(sceneAnim, { toValue: 1, duration: revealDuration, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start(() => { transitioningRef.current = false; setTransitioning(false); });
      })), 36);
    });
  }
  function openSettings(from) { setSettingsReturn(from); navigate('settings'); }
  const continueIndex = Math.min(TOTAL_LEVELS - 1, Math.max((progress.unlocked || 1) - 1, levelIndex));
  function finishLevel() {
    const nextIndex = Math.min(TOTAL_LEVELS - 1, levelIndex + 1);
    setProgress((old) => ({ ...old, unlocked: Math.max(old.unlocked || 1, nextIndex + 1) }));
    navigate(levelIndex >= TOTAL_LEVELS - 1 ? 'home' : 'game', nextIndex, false);
  }
  let content;
  if (screen === 'settings') content = <SettingsScreen settings={settings} setSettings={setSettings} onBack={() => navigate('home')} copy={copy} />;
  else if (screen === 'game') content = <Game index={levelIndex} progress={progress} setProgress={setProgress} onHome={() => navigate('home')} onSettings={() => openSettings('game')} onComplete={finishLevel} copy={copy} language={settings.language} playSfx={playSfx} />;
  else content = <Home progress={progress} playLevel={continueIndex + 1} onPlay={() => navigate('game', continueIndex)} onSettings={() => openSettings('home')} copy={copy} />;
  return <View style={styles.scene} onLayout={hideNativeSplash}>
    <Animated.View style={[styles.sceneContent, { opacity: sceneAnim, transform: [{ translateY: sceneAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }, { scale: sceneAnim.interpolate({ inputRange: [0, 1], outputRange: [.992, 1] }) }] }]}>{content}</Animated.View>
    <Animated.View pointerEvents={transitioning ? 'auto' : 'none'} style={[styles.transitionVeil, { opacity: transitionVeil }]}><View style={styles.transitionVeilGlow} /></Animated.View>
  </View>;
}

const C = { ink: '#16363c', lake: '#cfe8e9', deep: '#77adb5', paper: '#f5f3e9', white: '#fffdf7', gold: '#efc964', coral: '#e5796f', muted: '#6b8182' };
const styles = StyleSheet.create({
  scene: { flex: 1, backgroundColor: '#062b35', overflow: 'hidden' }, sceneContent: { ...StyleSheet.absoluteFillObject },
  backgroundFrame: { position: 'relative', overflow: 'hidden' },
  backgroundLayer: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', zIndex: 0 },
  backgroundContent: { flex: 1, position: 'relative', zIndex: 1, elevation: 1 },
  transitionVeil: { ...StyleSheet.absoluteFillObject, zIndex: 4000, elevation: 90, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#062f39' },
  transitionVeilGlow: { width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(78,211,199,.10)', shadowColor: '#75eee2', shadowOpacity: .62, shadowRadius: 54, elevation: 2 },
  openingRoot: { ...StyleSheet.absoluteFillObject, zIndex: 5000, elevation: 100, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#041a23' },
  openingBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  openingShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,24,34,.34)' },
  openingFxLayer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  openingLightSweep: { position: 'absolute', top: '-15%', width: 76, height: '135%', backgroundColor: 'rgba(255,241,175,.20)', shadowColor: '#fff1a8', shadowOpacity: .9, shadowRadius: 30, elevation: 5 },
  openingCenter: { alignItems: 'center', justifyContent: 'center', marginTop: -18 },
  openingMoonAura: { width: 124, height: 124, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  openingRipple: { position: 'absolute', width: 112, height: 112, borderRadius: 56, borderWidth: 1.5, borderColor: 'rgba(255,232,151,.62)', backgroundColor: 'rgba(105,235,224,.06)', shadowColor: '#8df9ed', shadowOpacity: .7, shadowRadius: 24 },
  openingMoonGlass: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(5,37,47,.70)', borderWidth: 1.5, borderColor: 'rgba(255,244,201,.72)', shadowColor: '#ffe696', shadowOpacity: .72, shadowRadius: 25, elevation: 12 },
  openingMoon: { color: '#fff1b5', fontSize: 61, lineHeight: 72, textShadowColor: 'rgba(255,225,121,.75)', textShadowRadius: 16 },
  openingTitle: { color: '#fffdf3', fontSize: 31, lineHeight: 36, fontWeight: '300', letterSpacing: 9, textAlign: 'center', marginLeft: 9, textShadowColor: 'rgba(0,18,27,.78)', textShadowRadius: 12 },
  openingTitleLake: { color: '#ffe49a', fontSize: 45, lineHeight: 50, fontWeight: '900', letterSpacing: 13, textAlign: 'center', marginLeft: 13, textShadowColor: 'rgba(255,214,91,.36)', textShadowRadius: 18 },
  openingDivider: { width: 142, height: 4, borderRadius: 2, marginTop: 15, backgroundColor: 'rgba(119,229,221,.30)', overflow: 'hidden' },
  openingDividerCore: { width: '58%', alignSelf: 'center', height: 2, marginTop: 1, borderRadius: 1, backgroundColor: '#ffe59c', shadowColor: '#fff0ac', shadowOpacity: .9, shadowRadius: 7 },
  openingWaterRipple: { position: 'absolute', bottom: '19%', width: '54%', height: 2, borderRadius: 2, backgroundColor: 'rgba(255,227,142,.72)', shadowColor: '#ffe294', shadowOpacity: .85, shadowRadius: 10 },
  openingWaterRippleWide: { bottom: '17%', width: '78%', height: 1, backgroundColor: 'rgba(125,235,227,.46)' },
  backgroundRoot: { flex: 1, position: 'relative', overflow: 'hidden' },
  backgroundImageLayer: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  backgroundImageFill: { width: '100%', height: '100%' },
  backgroundForeground: { flex: 1, zIndex: 1 },
  backgroundImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  backgroundLayer: { zIndex: 0 }, backgroundContent: { ...StyleSheet.absoluteFillObject, zIndex: 2, elevation: 2 },
  screenBg: { flex: 1, position: 'relative' },
  homeBg: { width: '100%', height: '100%' }, homeShade: { ...StyleSheet.absoluteFillObject, zIndex: 0, backgroundColor: 'rgba(5,31,40,.34)' }, homeSafe: { flex: 1, zIndex: 2, elevation: 3, paddingHorizontal: 24, paddingBottom: 16, justifyContent: 'space-between' }, homeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingTop: 8 }, homeStudio: { color: 'rgba(255,255,255,.82)', fontSize: 10, fontWeight: '900', letterSpacing: 2.2 }, homeScore: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(8,38,45,.68)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18 }, homeStar: { width: 24, height: 24, marginRight: 5 }, homeScoreText: { color: 'white', fontSize: 12, fontWeight: '850' }, homeCenter: { alignItems: 'center', marginTop: 58 }, homeMoonBadge: { width: 78, height: 78, borderRadius: 39, backgroundColor: 'rgba(255,255,255,.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,.35)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }, homeMoon: { color: '#fff4c4', fontSize: 51 }, homeTitle: { color: 'white', fontSize: 64, lineHeight: 56, textAlign: 'center', fontWeight: '900', letterSpacing: -3 }, homeSubtitle: { color: 'rgba(255,255,255,.86)', fontSize: 14, marginTop: 15, fontWeight: '650' }, homeActions: { gap: 10 }, primaryHomeButton: { backgroundColor: '#fffdf5', borderRadius: 20, minHeight: 72, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#00181f', shadowOffset: { width: 0, height: 8 }, shadowOpacity: .24, shadowRadius: 18, elevation: 7 }, homePlayButtonCentered: { alignSelf: 'center', minWidth: 146, width: 'auto', minHeight: 70, paddingHorizontal: 32, justifyContent: 'center', marginTop: 27, overflow: 'hidden', backgroundColor: 'rgba(5,42,50,.96)', borderWidth: 1.5, borderColor: 'rgba(255,222,123,.82)', shadowColor: '#ffe078', shadowOpacity: .42, shadowRadius: 17, elevation: 10 }, homePlayTopGlow: { position: 'absolute', top: 0, left: 24, right: 24, height: 2, borderRadius: 2, backgroundColor: '#ffe598', shadowColor: '#ffe598', shadowOpacity: .95, shadowRadius: 8 }, homePlayCopy: { alignItems: 'center', justifyContent: 'center' }, homePlayLabel: { color: '#fffdf2', fontSize: 23, lineHeight: 27, letterSpacing: 2.2, fontWeight: '950', textAlign: 'center', textShadowColor: 'rgba(255,222,120,.32)', textShadowRadius: 9 }, homePlayMeta: { color: '#ffe398', fontSize: 9, lineHeight: 12, marginBottom: 3, letterSpacing: 1.3, fontWeight: '900', textAlign: 'center' }, homePlayButtonCompact: { minWidth: 128, minHeight: 57, borderRadius: 16, paddingHorizontal: 25, marginTop: 16 }, homeButtonLabel: { color: C.ink, fontSize: 15, letterSpacing: 1, fontWeight: '900' }, homeButtonMeta: { color: C.muted, fontSize: 11, marginTop: 3, fontWeight: '650' }, homeButtonArrow: { color: C.coral, fontSize: 29, fontWeight: '700' }, secondaryHomeButton: { backgroundColor: 'rgba(8,38,45,.74)', borderWidth: 1, borderColor: 'rgba(255,255,255,.26)', borderRadius: 18, minHeight: 58, paddingHorizontal: 19, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, secondaryHomeText: { color: 'white', fontSize: 14, fontWeight: '850' }, secondaryHomeMeta: { color: 'rgba(255,255,255,.68)', fontSize: 10 }, buttonPressed: { transform: [{ scale: .975 }], opacity: .92 }, homePublisher: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(3,24,35,.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,.20)', borderRadius: 18, paddingVertical: 7, paddingHorizontal: 12, marginTop: 2 }, homePublisherLogo: { width: 40, height: 40, borderRadius: 10, marginRight: 10 }, homePublisherName: { color: 'white', fontSize: 11, fontWeight: '950', letterSpacing: 1.6 }, homePublisherCaption: { color: 'rgba(255,255,255,.55)', fontSize: 6.5, fontWeight: '800', letterSpacing: 1.1, marginTop: 3 },
  homeTopActions: { flexDirection: 'row', alignItems: 'center', gap: 8 }, homeSettingsButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(8,38,45,.70)', borderWidth: 1, borderColor: 'rgba(255,255,255,.24)', alignItems: 'center', justifyContent: 'center' }, homeSettingsIcon: { width: 28, height: 28 }, homeLevelsLabel: { flexDirection: 'row', alignItems: 'center' }, homeLevelsIcon: { width: 34, height: 34, marginRight: 9 },
  homeCoinBadge: { height: 38, minWidth: 66, paddingHorizontal: 10, borderRadius: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(8,38,45,.76)', borderWidth: 1, borderColor: 'rgba(255,226,135,.34)' }, homeCoinIcon: { color: '#ffe18b', fontSize: 21, fontWeight: '900', marginRight: 5 }, homeCoinText: { color: 'white', fontSize: 12, fontWeight: '900' },
  homeSafeCompact: { paddingHorizontal: 12, paddingBottom: 7 },
  homeTopActionsCompact: { gap: 5 },
  homeCoinBadgeCompact: { height: 32, minWidth: 50, paddingHorizontal: 7, borderRadius: 16 },
  homeCoinIconCompact: { fontSize: 16, marginRight: 3 },
  homeTopTextCompact: { fontSize: 9 },
  homeScoreCompact: { height: 32, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 16 },
  homeStarCompact: { width: 18, height: 18, marginRight: 3 },
  homeSettingsButtonCompact: { width: 34, height: 34, borderRadius: 17 },
  homeSettingsIconCompact: { width: 23, height: 23 },
  homeCenterCompact: { marginTop: 3 },
  homeMoonBadgeCompact: { width: 50, height: 50, borderRadius: 25, marginBottom: 7 },
  homeMoonCompact: { fontSize: 34 },
  homeTitleCompact: { fontSize: 42, lineHeight: 37, letterSpacing: -2 },
  homeSubtitleCompact: { fontSize: 10, marginTop: 7 },
  homeActionsCompact: { gap: 6 },
  primaryHomeButtonCompact: { minHeight: 54, borderRadius: 16, paddingHorizontal: 16 },
  homeButtonLabelCompact: { fontSize: 13 },
  homeProgressSummaryCompact: { minHeight: 38, borderRadius: 14, paddingHorizontal: 14 },
  homePublisherCompact: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 14, marginTop: 0 },
  homePublisherLogoCompact: { width: 29, height: 29, borderRadius: 7, marginRight: 7 },
  levelsShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(239,247,244,.78)' }, safe: { flex: 1, backgroundColor: 'transparent' }, mapContent: { padding: 22, paddingBottom: 56 }, brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 22 }, mapBack: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,253,247,.92)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.7)' }, mapNavIcon: { width: 32, height: 32 }, mapBrand: { flex: 1, marginLeft: 13 }, kicker: { fontSize: 10, letterSpacing: 2, color: C.muted, fontWeight: '800' }, logo: { fontSize: 28, fontWeight: '800', color: C.ink, letterSpacing: -1.2, marginTop: 2 }, mapHeaderTools: { flexDirection: 'row', alignItems: 'center', gap: 7 }, mapSettings: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,253,247,.90)', borderWidth: 1, borderColor: 'rgba(255,255,255,.7)', alignItems: 'center', justifyContent: 'center' }, mapSettingsIcon: { width: 27, height: 27 }, totalBadge: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }, totalNumber: { color: C.gold, fontSize: 18, fontWeight: '900' }, totalLabel: { color: 'white', fontSize: 7, letterSpacing: .8, fontWeight: '800' },
  heroCard: { backgroundColor: 'rgba(207,232,233,.89)', borderWidth: 1, borderColor: 'rgba(255,255,255,.62)', borderRadius: 30, padding: 26, overflow: 'hidden', marginBottom: 30, shadowColor: C.ink, shadowOffset: { width: 0, height: 10 }, shadowOpacity: .08, shadowRadius: 22, elevation: 3 }, heroMoon: { position: 'absolute', right: 18, top: -26, fontSize: 142, color: 'rgba(255,255,255,.45)' }, heroTitle: { color: C.ink, fontSize: 31, lineHeight: 34, fontWeight: '850', letterSpacing: -1, maxWidth: 260 }, heroText: { color: '#45686b', fontSize: 15, lineHeight: 22, marginTop: 12, maxWidth: 290 }, continueButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, backgroundColor: C.ink, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 18 }, continueText: { color: 'white', fontWeight: '800', fontSize: 14 }, arrow: { color: C.gold, fontSize: 20 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }, sectionTitle: { color: C.ink, fontSize: 22, fontWeight: '850' }, sectionMeta: { color: C.muted, fontSize: 12, fontWeight: '700' }, levelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11 }, levelButton: { width: '48.3%', minHeight: 164, backgroundColor: 'rgba(255,253,247,.94)', borderWidth: 1, borderColor: 'rgba(255,255,255,.78)', borderRadius: 24, padding: 15, justifyContent: 'space-between', shadowColor: C.ink, shadowOffset: { width: 0, height: 7 }, shadowOpacity: .11, shadowRadius: 15, elevation: 3 }, levelLocked: { backgroundColor: 'rgba(220,229,225,.80)', borderColor: 'rgba(255,255,255,.42)', shadowOpacity: .03 }, levelPressed: { transform: [{ scale: .97 }], opacity: .92 }, levelCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, levelNumberBadge: { width: 43, height: 43, borderRadius: 15, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center', shadowColor: C.ink, shadowOpacity: .14, shadowRadius: 6 }, levelNumberBadgeLocked: { backgroundColor: 'rgba(88,111,111,.22)' }, levelNumber: { color: C.gold, fontSize: 19, fontWeight: '900' }, levelDifficulty: { color: '#789091', fontSize: 8, fontWeight: '900', letterSpacing: 1.2 }, levelName: { color: C.ink, fontSize: 15, lineHeight: 18, fontWeight: '850', minHeight: 37, marginTop: 9 }, levelMechanics: { flexDirection: 'row', minHeight: 18, gap: 5, alignItems: 'center' }, levelMechanicMark: { color: '#4e7d80', fontSize: 14, fontWeight: '900' }, levelCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(72,107,107,.10)', paddingTop: 9, marginTop: 5 }, levelStarCount: { color: C.muted, fontSize: 9, fontWeight: '800' }, stars: { flexDirection: 'row', gap: 3, justifyContent: 'center', alignItems: 'center' }, starAsset: { width: 38, height: 38 }, starAssetSmall: { width: 17, height: 17 }, starEarned: { opacity: 1 }, starEmpty: { opacity: .14 }, resetProgress: { alignSelf: 'center', marginTop: 28, padding: 12 }, resetText: { color: C.muted, fontSize: 12, textDecorationLine: 'underline' },
  chapterNavigator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,253,247,.76)', borderWidth: 1, borderColor: 'rgba(255,255,255,.7)', borderRadius: 20, padding: 6, marginBottom: 16 }, chapterButton: { minWidth: 92, height: 38, paddingHorizontal: 10, borderRadius: 14, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }, chapterButtonDisabled: { opacity: .25 }, chapterButtonText: { color: 'white', fontSize: 10, fontWeight: '850' }, chapterBadge: { alignItems: 'center', justifyContent: 'center' }, chapterLabel: { color: C.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 }, chapterNumber: { color: C.ink, fontSize: 15, fontWeight: '900', marginTop: 1 },
  mapCoinBadge: { height: 42, minWidth: 58, borderRadius: 21, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.ink }, mapCoinIcon: { color: C.gold, fontSize: 19, fontWeight: '950', marginRight: 3 }, mapCoinAmount: { color: 'white', fontSize: 11, fontWeight: '900' }, layerLockCard: { backgroundColor: 'rgba(7,43,51,.92)', borderWidth: 1, borderColor: 'rgba(239,204,105,.45)', borderRadius: 26, padding: 22, alignItems: 'center', marginBottom: 16, shadowColor: C.ink, shadowOpacity: .18, shadowRadius: 16 }, layerLockIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(239,201,100,.14)', borderWidth: 1, borderColor: 'rgba(255,226,143,.42)', alignItems: 'center', justifyContent: 'center' }, layerLockMoon: { color: C.gold, fontSize: 34, fontWeight: '950' }, layerLockTitle: { color: 'white', fontSize: 19, fontWeight: '900', marginTop: 11 }, layerLockText: { color: 'rgba(255,255,255,.62)', fontSize: 11, fontWeight: '700', marginTop: 5 }, layerUnlockButton: { alignSelf: 'stretch', minHeight: 48, borderRadius: 15, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', marginTop: 17 }, layerUnlockDisabled: { backgroundColor: 'rgba(255,255,255,.16)' }, layerUnlockText: { color: C.ink, fontSize: 12, fontWeight: '950', textAlign: 'center', paddingHorizontal: 8 },
  layerCelebration: { position: 'absolute', left: 28, right: 28, top: '31%', zIndex: 120, borderRadius: 30, paddingHorizontal: 24, paddingVertical: 28, alignItems: 'center', backgroundColor: 'rgba(7,43,51,.97)', borderWidth: 1, borderColor: 'rgba(255,225,131,.72)', shadowColor: '#ffe08a', shadowOpacity: .48, shadowRadius: 28, elevation: 20 }, layerCelebrationMoon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: C.gold, borderWidth: 4, borderColor: 'rgba(255,255,255,.82)' }, layerCelebrationMoonText: { color: C.ink, fontSize: 41, fontWeight: '950' }, layerCelebrationKicker: { color: C.gold, fontSize: 9, fontWeight: '950', letterSpacing: 2, marginTop: 14 }, layerCelebrationTitle: { color: 'white', fontSize: 30, fontWeight: '950', marginTop: 4 }, layerCelebrationText: { color: 'rgba(255,255,255,.68)', fontSize: 12, fontWeight: '700', marginTop: 6 },
  gameShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(3,24,32,.34)' }, gameSafe: { flex: 1, backgroundColor: 'transparent' }, gameHeader: { height: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 }, headerSpacer: { width: 46, height: 46 }, iconButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(5,32,40,.76)', borderWidth: 1, borderColor: 'rgba(255,255,255,.30)', alignItems: 'center', justifyContent: 'center', shadowColor: '#001820', shadowOpacity: .25, shadowRadius: 8 }, gameHeaderIconAsset: { width: 30, height: 30 }, iconText: { color: 'white', fontSize: 37, lineHeight: 39, marginTop: -4 }, restartIcon: { color: 'white', fontSize: 24 }, headerCenter: { alignItems: 'center', maxWidth: '68%' }, chapter: { color: 'rgba(255,255,255,.72)', fontSize: 10, fontWeight: '850', letterSpacing: 1.6 }, gameTitle: { color: 'white', fontSize: 21, fontWeight: '850', marginTop: 3, textShadowColor: 'rgba(0,20,28,.72)', textShadowRadius: 9, textAlign: 'center' }, gameNavRow: { flexDirection: 'row', alignSelf: 'stretch', marginHorizontal: 16, gap: 5, backgroundColor: 'rgba(4,28,36,.78)', padding: 5, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,.20)', shadowColor: '#001820', shadowOpacity: .22, shadowRadius: 10 }, gameNavButton: { flex: 1, height: 46, borderRadius: 14, paddingHorizontal: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.12)' }, gameNavPressed: { opacity: .72, transform: [{ scale: .97 }] }, gameNavAsset: { width: 26, height: 26, marginRight: 5 }, gameNavText: { color: 'white', fontSize: 10, fontWeight: '850' }, gameBody: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 10, paddingBottom: 10 }, movePill: { flexDirection: 'row', alignItems: 'center', minHeight: 42, backgroundColor: 'rgba(255,253,247,.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,.72)', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, marginBottom: 8, shadowColor: '#001820', shadowOffset: { width: 0, height: 5 }, shadowOpacity: .24, shadowRadius: 12, elevation: 4 }, moveNumber: { color: C.ink, fontWeight: '900', fontSize: 20 }, moveLabel: { color: C.muted, fontWeight: '850', fontSize: 9, marginLeft: 5, letterSpacing: 1 }, pillLine: { height: 20, width: 1, backgroundColor: '#d8ddd7', marginHorizontal: 14 }, parText: { color: C.muted, fontSize: 10, fontWeight: '850', letterSpacing: .9 }, mechanicRow: { minHeight: 21, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5, marginBottom: 7, paddingHorizontal: 20 }, mechanicTag: { backgroundColor: 'rgba(4,30,38,.72)', borderWidth: 1, borderColor: 'rgba(255,231,163,.28)', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 4 }, mechanicText: { color: '#ffe7a3', fontSize: 8, fontWeight: '900', letterSpacing: .8 }, instruction: { color: 'rgba(255,255,255,.96)', fontSize: 13, fontWeight: '750', marginTop: 12, textShadowColor: 'rgba(0,20,28,.9)', textShadowRadius: 8, paddingHorizontal: 22, textAlign: 'center' },
  missionPanel: { minHeight: 42, maxWidth: '92%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, marginBottom: 7, borderRadius: 17, backgroundColor: 'rgba(3,27,36,.88)', borderWidth: 1, borderColor: 'rgba(151,231,231,.30)', shadowColor: '#001820', shadowOpacity: .34, shadowRadius: 10, elevation: 5 },
  missionLabel: { color: 'rgba(255,255,255,.48)', fontSize: 7, fontWeight: '950', letterSpacing: 1.2, marginHorizontal: 5 },
  missionItems: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, gap: 5 },
  missionChip: { minHeight: 30, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderRadius: 12, backgroundColor: 'rgba(255,216,95,.10)', borderWidth: 1, borderColor: 'rgba(255,221,116,.35)' },
  missionChipBlue: { backgroundColor: 'rgba(67,216,255,.11)', borderColor: 'rgba(103,226,255,.48)' },
  missionChipComplete: { backgroundColor: 'rgba(61,188,153,.22)', borderColor: 'rgba(128,255,210,.58)' },
  missionIcon: { color: '#ffdf75', fontSize: 13, fontWeight: '950', marginRight: 4 }, missionIconBlue: { color: '#6ee7ff' }, missionText: { color: '#fff8dc', fontSize: 8, fontWeight: '950', letterSpacing: .35 }, missionCheck: { color: '#8fffd5', fontSize: 11, fontWeight: '950', marginLeft: 5 },
  energyText: { color: '#bd8a16', fontSize: 11, fontWeight: '950', letterSpacing: .5 },
  gameEconomyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 7 }, gameWallet: { height: 36, minWidth: 70, paddingHorizontal: 12, borderRadius: 18, backgroundColor: 'rgba(4,30,38,.82)', borderWidth: 1, borderColor: 'rgba(255,225,133,.34)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, gameWalletMoon: { color: '#ffe18b', fontSize: 20, fontWeight: '950', marginRight: 5 }, gameWalletAmount: { color: 'white', fontSize: 12, fontWeight: '950' }, hintButton: { height: 36, minWidth: 106, paddingHorizontal: 11, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,253,247,.94)', borderWidth: 1, borderColor: 'rgba(255,255,255,.72)' }, hintButtonActive: { backgroundColor: '#fff0b7', transform: [{ scale: 1.05 }] }, hintIcon: { color: '#b88719', fontSize: 18, marginRight: 7 }, hintLabel: { color: C.ink, fontSize: 9, fontWeight: '950', letterSpacing: .7 }, hintPrice: { color: '#8c712b', fontSize: 8, fontWeight: '850', marginTop: -1 },
  boardFrame: { padding: 7, borderRadius: 32, backgroundColor: 'rgba(4,31,39,.96)', borderWidth: 1, borderColor: 'rgba(213,244,242,.32)', alignItems: 'center', justifyContent: 'center', overflow: 'visible', shadowColor: '#00131a', shadowOffset: { width: 0, height: 18 }, shadowOpacity: .56, shadowRadius: 28, elevation: 12 }, frameCorner: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#cdbb7c', borderWidth: 2, borderColor: 'rgba(255,246,202,.72)', zIndex: 20, shadowColor: '#ffe79d', shadowOpacity: .45, shadowRadius: 4 }, frameCornerTL: { left: 3, top: 3 }, frameCornerTR: { right: 3, top: 3 }, frameCornerBL: { left: 3, bottom: 3 }, frameCornerBR: { right: 3, bottom: 3 }, board: { backgroundColor: '#154f5a', borderWidth: 1, borderColor: 'rgba(213,248,244,.42)', borderRadius: 25, overflow: 'hidden' }, boardWaterTexture: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: .46 }, boardWaterTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,68,79,.63)' }, boardTopGlow: { position: 'absolute', left: 12, right: 12, top: 7, height: 1, backgroundColor: 'rgba(255,255,255,.38)', zIndex: 2 }, cell: { position: 'absolute', borderWidth: .45, borderColor: 'rgba(185,232,229,.11)', alignItems: 'center', justifyContent: 'center' }, goalCell: { backgroundColor: 'rgba(11,101,106,.48)' }, goalCellActive: { backgroundColor: 'rgba(48,171,160,.40)' }, cellPressed: { backgroundColor: 'rgba(255,255,255,.18)' }, waterGlint: { position: 'absolute', width: '30%', height: 1, borderRadius: 2, backgroundColor: 'rgba(235,255,251,.20)', transform: [{ rotate: '-8deg' }] }, mirrorSocket: { position: 'absolute', width: '90%', aspectRatio: 1, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(231,249,246,.28)', backgroundColor: 'rgba(2,38,47,.20)', alignItems: 'center', justifyContent: 'center', zIndex: 2 }, mirrorSocketInner: { width: '76%', aspectRatio: 1, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(214,244,239,.12)' }, mirrorWrap: { width: '91%', height: '91%', alignItems: 'center', justifyContent: 'center', zIndex: 7 }, mirrorAsset: { width: '100%', height: '100%' }, crystalAsset: { width: '92%', height: '92%' }, frozenAsset: { position: 'absolute', width: '112%', height: '112%', zIndex: 9 }, gateAsset: { position: 'absolute', width: '82%', height: '82%', zIndex: 6 }, rockAsset: { position: 'absolute', width: '92%', height: '92%', zIndex: 9 }, ripple: { width: '38%', aspectRatio: 1, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(224,250,247,.18)' }, goalDock: { position: 'absolute', alignItems: 'center', justifyContent: 'center', zIndex: 30 }, goalHalo: { position: 'absolute', width: '112%', aspectRatio: 1, borderRadius: 999, backgroundColor: 'rgba(255,224,130,.10)', borderWidth: 1, borderColor: 'rgba(255,238,181,.32)', shadowColor: '#ffe59e', shadowOpacity: .35, shadowRadius: 10 }, goalHaloWon: { backgroundColor: 'rgba(255,222,111,.28)', borderColor: 'rgba(255,246,201,.78)', shadowOpacity: .9, shadowRadius: 16 }, beamSlot: { position: 'absolute', zIndex: 3, overflow: 'visible', alignItems: 'center', justifyContent: 'center' }, beamSlotHorizontal: { height: 10, width: '54%', top: '50%', marginTop: -5 }, beamSlotVertical: { width: 10, height: '54%', left: '50%', marginLeft: -5 }, beamOuterGlow: { position: 'absolute', width: '108%', height: '108%', borderRadius: 1, backgroundColor: 'rgba(255,219,117,.025)' }, beamSoftGlow: { position: 'absolute', borderRadius: 2, backgroundColor: 'rgba(255,217,105,.18)' }, beamSoftH: { width: '110%', height: 6 }, beamSoftV: { width: 6, height: '110%' }, beamInnerGlow: { position: 'absolute', borderRadius: 2, backgroundColor: 'rgba(255,229,146,.76)', shadowColor: '#ffe8aa', shadowOpacity: .9, shadowRadius: 5 }, beamInnerH: { width: '108%', height: 3.2 }, beamInnerV: { width: 3.2, height: '108%' }, beamFineCore: { position: 'absolute', borderRadius: 1, backgroundColor: '#fffdf0' }, beamCoreH: { width: '110%', height: 1.25 }, beamCoreV: { width: 1.25, height: '110%' }, beamFlow: { position: 'absolute', borderRadius: 4, backgroundColor: '#ffffff' }, beamFlowH: { width: 11, height: 2 }, beamFlowV: { width: 2, height: 11 }, east: { left: '50%' }, west: { right: '50%' }, south: { top: '50%' }, north: { bottom: '50%' }, beamJoint: { position: 'absolute', width: 5, height: 5, borderRadius: 3, backgroundColor: '#fffef4', zIndex: 4 }, travelingLight: { position: 'absolute', width: 16, height: 16, zIndex: 5 }, reflectionFlare: { position: 'absolute', width: 34, height: 34, zIndex: 8 }, sourceAsset: { position: 'absolute', width: 40, height: 40, zIndex: 8 }, lilyChargeColumn: { position: 'absolute', bottom: '17%', width: 7, height: '66%', borderRadius: 8, backgroundColor: 'rgba(211,255,246,.95)', shadowColor: '#aaffed', shadowOpacity: 1, shadowRadius: 10, elevation: 9, zIndex: 4 }, lilyChargeCore: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(234,255,246,.92)', shadowColor: '#8fffe0', shadowOpacity: 1, shadowRadius: 13, elevation: 10, zIndex: 5 }, lilyAsset: { width: '100%', height: '100%', zIndex: 6 },
  sourceEmitterWrap: { position: 'absolute', zIndex: 14, alignItems: 'center', justifyContent: 'center' }, sourceEmitterGlow: { position: 'absolute', width: '82%', height: '82%', borderRadius: 999, backgroundColor: 'rgba(255,225,125,.24)', borderWidth: 1, borderColor: 'rgba(255,244,196,.48)', shadowColor: '#ffe08a', shadowOpacity: .95, shadowRadius: 12 }, sourceEmitterAsset: { width: '118%', height: '118%' },
  portalAsset: { position: 'absolute', width: '94%', height: '94%', zIndex: 8, shadowColor: '#9f74ff', shadowOpacity: .7, shadowRadius: 9 }, sealAsset: { position: 'absolute', width: '78%', height: '78%', zIndex: 7, opacity: .72 }, sealAssetActive: { opacity: 1, shadowColor: '#fff0a8', shadowOpacity: .9, shadowRadius: 11 },
  winOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, backgroundColor: 'rgba(2,19,28,.82)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 }, winBurst: { position: 'absolute', width: 330, height: 330, borderRadius: 165, borderWidth: 2, borderColor: 'rgba(255,225,116,.55)', backgroundColor: 'rgba(255,214,76,.08)', alignItems: 'center', justifyContent: 'center' }, winBurstInner: { width: 245, height: 245, borderRadius: 123, borderWidth: 1, borderColor: 'rgba(124,238,233,.40)' }, winSheet: { width: '100%', maxWidth: 390, backgroundColor: C.white, borderRadius: 32, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,239,177,.85)', shadowColor: '#ffe17b', shadowOffset: { width: 0, height: 0 }, shadowOpacity: .34, shadowRadius: 30, elevation: 18 }, winBadge: { position: 'absolute', top: -25, width: 50, height: 50, borderRadius: 25, backgroundColor: C.gold, borderWidth: 4, borderColor: C.white, alignItems: 'center', justifyContent: 'center', shadowColor: C.ink, shadowOpacity: .22, shadowRadius: 10 }, winCheck: { color: C.ink, fontSize: 25, lineHeight: 28, fontWeight: '950' }, winLily: { width: 104, height: 84, marginTop: 5, marginBottom: 1 }, winKicker: { color: '#527375', fontSize: 10, fontWeight: '950', letterSpacing: 2 }, winTitle: { color: C.ink, fontSize: 30, fontWeight: '950', marginTop: 5 }, winStarsPlate: { backgroundColor: '#f2eee0', borderRadius: 24, paddingHorizontal: 17, paddingVertical: 5, marginTop: 10 }, winSummary: { color: C.muted, fontSize: 12, marginTop: 9, fontWeight: '700' }, nextButton: { alignSelf: 'stretch', backgroundColor: C.ink, flexDirection: 'row', justifyContent: 'space-between', borderRadius: 17, paddingVertical: 16, paddingHorizontal: 18, marginTop: 18 }, nextText: { color: 'white', fontSize: 14, fontWeight: '850' },
  successModalRoot: { flex: 1, position: 'relative', backgroundColor: 'transparent' },
  rewardStars: { flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center' }, rewardStar: { width: 48, height: 48 }, rewardCard: { alignSelf: 'stretch', minHeight: 70, borderRadius: 19, paddingHorizontal: 13, marginTop: 12, backgroundColor: '#123b42', borderWidth: 1, borderColor: 'rgba(239,201,100,.48)', flexDirection: 'row', alignItems: 'center' }, rewardCoin: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', marginRight: 10 }, rewardCoinMoon: { color: C.ink, fontSize: 25, fontWeight: '950' }, rewardCopy: { flex: 1 }, rewardLabel: { color: 'rgba(255,255,255,.58)', fontSize: 8, fontWeight: '900', letterSpacing: 1.2 }, rewardAmount: { color: 'white', fontSize: 15, fontWeight: '950', marginTop: 2 }, walletAfter: { alignItems: 'flex-end' }, walletAfterLabel: { color: 'rgba(255,255,255,.48)', fontSize: 7, fontWeight: '900', letterSpacing: 1 }, walletAfterAmount: { color: '#ffe396', fontSize: 13, fontWeight: '950', marginTop: 3 }, layerProgressRow: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }, layerProgressLabel: { color: C.muted, fontSize: 9, fontWeight: '850' }, layerProgressCount: { color: C.ink, fontSize: 9, fontWeight: '950' }, layerProgressTrack: { alignSelf: 'stretch', height: 6, borderRadius: 3, backgroundColor: '#dfe7e2', overflow: 'hidden', marginTop: 5 }, layerProgressFill: { height: '100%', borderRadius: 3, backgroundColor: C.gold },
  settingsShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(232,244,241,.84)' }, settingsSafe: { flex: 1 }, settingsHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18, gap: 10 }, settingsBack: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(5,39,48,.94)', borderWidth: 1, borderColor: 'rgba(255,224,133,.58)', alignItems: 'center', justifyContent: 'center' }, settingsHomeIcon: { width: 32, height: 32 }, settingsHeaderPlate: { flex: 1, minHeight: 58, borderRadius: 19, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: 'rgba(5,39,48,.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,.20)', shadowColor: '#001820', shadowOpacity: .25, shadowRadius: 12, elevation: 5 }, settingsBackArrow: { color: C.ink, fontSize: 36, lineHeight: 38, marginTop: -4 }, settingsKicker: { color: '#ffe294', fontSize: 8, fontWeight: '900', letterSpacing: 1.8 }, settingsTitle: { color: '#fffdf4', fontSize: 25, lineHeight: 29, fontWeight: '900', marginTop: 1, textShadowColor: 'rgba(0,15,22,.7)', textShadowRadius: 6 }, settingsHeroIcon: { width: 52, height: 52 }, settingsContent: { paddingHorizontal: 20, paddingBottom: 46 }, settingsSectionLabel: { color: C.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.8, marginTop: 13, marginBottom: 9, marginLeft: 5 }, settingsGroup: { backgroundColor: 'rgba(255,253,247,.91)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,.82)', overflow: 'hidden', shadowColor: C.ink, shadowOffset: { width: 0, height: 8 }, shadowOpacity: .08, shadowRadius: 18 }, settingsCard: { minHeight: 86, backgroundColor: 'rgba(255,253,247,.91)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,.82)', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', shadowColor: C.ink, shadowOffset: { width: 0, height: 8 }, shadowOpacity: .08, shadowRadius: 18 }, settingIconPlate: { width: 44, height: 44, borderRadius: 15, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, settingSymbol: { color: C.gold, fontSize: 22, fontWeight: '900' }, settingCopy: { flex: 1 }, settingName: { color: C.ink, fontSize: 16, fontWeight: '850' }, settingDescription: { color: C.muted, fontSize: 10, marginTop: 3 }, settingsDivider: { height: 1, backgroundColor: 'rgba(55,91,91,.10)', marginHorizontal: 16 }, languageControl: { flexDirection: 'row', backgroundColor: '#dfe9e6', borderRadius: 15, padding: 3 }, languageChoice: { width: 48, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, languageChoiceActive: { backgroundColor: C.ink, shadowColor: C.ink, shadowOpacity: .18, shadowRadius: 5 }, languageText: { color: C.muted, fontSize: 11, fontWeight: '900' }, languageTextActive: { color: C.gold }, settingToggle: { width: 76, height: 38, borderRadius: 19, backgroundColor: '#dfe6e3', justifyContent: 'center', paddingHorizontal: 4 }, settingToggleOn: { backgroundColor: C.ink }, toggleKnob: { position: 'absolute', left: 4, width: 30, height: 30, borderRadius: 15, backgroundColor: 'white', shadowColor: C.ink, shadowOpacity: .14, shadowRadius: 4 }, toggleKnobOn: { left: 42, backgroundColor: C.gold }, toggleLabel: { color: C.muted, fontSize: 8, fontWeight: '900', alignSelf: 'flex-end', marginRight: 8 }, toggleLabelOn: { color: 'white', alignSelf: 'flex-start', marginLeft: 9, marginRight: 0 }, settingsNote: { marginTop: 24, borderRadius: 20, padding: 16, backgroundColor: 'rgba(7,43,51,.76)', flexDirection: 'row', alignItems: 'center' }, settingsNoteIcon: { width: 34, height: 34, marginRight: 12 }, settingsInfo: { flex: 1, color: 'rgba(255,255,255,.82)', fontSize: 11, lineHeight: 16 },
  boardFrameExpanded: { borderColor: 'rgba(213,244,242,.42)', shadowOpacity: .66, shadowRadius: 32, elevation: 15 },
  goalCellBlue: { backgroundColor: 'rgba(34,147,179,.42)', borderColor: 'rgba(110,231,255,.34)' },
  prismOuter: { position: 'absolute', zIndex: 8, width: '64%', height: '64%', transform: [{ rotate: '45deg' }], borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,199,50,.24)', borderWidth: 2, borderColor: '#ffd85f', shadowColor: '#ffd85f', shadowOpacity: .65, shadowRadius: 9 },
  prismOuterBlue: { backgroundColor: 'rgba(76,198,255,.22)', borderColor: '#78ddff', shadowColor: '#6bdcff' }, prismOuterActive: { backgroundColor: 'rgba(255,245,184,.48)', shadowOpacity: 1, shadowRadius: 15 },
  prismInner: { width: '58%', height: '58%', borderRadius: 7, backgroundColor: 'rgba(255,236,149,.48)', borderWidth: 1, borderColor: '#fff5c2' }, prismInnerBlue: { backgroundColor: 'rgba(136,229,255,.46)', borderColor: '#d8f8ff' }, prismMark: { position: 'absolute', color: 'white', fontSize: 15, fontWeight: '950', transform: [{ rotate: '-45deg' }] },
  runeOuter: { position: 'absolute', zIndex: 9, width: '72%', height: '72%', borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(4,37,55,.86)', borderWidth: 1.5, borderColor: 'rgba(104,220,255,.72)', shadowColor: '#55dcff', shadowOpacity: .52, shadowRadius: 8 }, runeOuterActive: { backgroundColor: 'rgba(30,135,143,.92)', borderColor: '#fff0a3', shadowColor: '#ffe985', shadowOpacity: 1, shadowRadius: 13 }, runeInner: { width: '62%', height: '62%', borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(184,243,255,.52)' }, runeInnerActive: { backgroundColor: 'rgba(255,224,103,.22)', borderColor: '#fff5c4' }, runeNumber: { color: '#9beaff', fontSize: 12, fontWeight: '950' }, runeNumberActive: { color: '#fff2aa' }, runeOrbit: { position: 'absolute', width: '112%', height: '42%', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(112,225,255,.38)', transform: [{ rotate: '-24deg' }] }, runeOrbitActive: { borderColor: 'rgba(255,239,154,.84)' },
  mechanicBadge: { position: 'absolute', right: '3%', top: '3%', zIndex: 18, width: '30%', aspectRatio: 1, maxWidth: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.88)', shadowColor: '#ffffff', shadowOpacity: .55, shadowRadius: 4 },
  linkBadge: { backgroundColor: '#35b9bd' }, oneUseBadge: { backgroundColor: '#d98942' }, motionBadge: { backgroundColor: '#7764c8' }, mechanicBadgeText: { color: 'white', fontSize: 11, lineHeight: 13, fontWeight: '950' },
  goldRain: { ...StyleSheet.absoluteFillObject, zIndex: 104, overflow: 'hidden' },
  headerGoldWallet: { minWidth: 76, height: 42, paddingHorizontal: 7, borderRadius: 21, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(5,32,40,.86)', borderWidth: 1, borderColor: 'rgba(255,210,72,.56)', shadowColor: '#ffc83d', shadowOpacity: .24, shadowRadius: 8 },
  headerGoldCoin: { width: 29, height: 29, borderRadius: 15, marginRight: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffc83d', borderWidth: 2, borderColor: '#fff0a0' },
  headerGoldCoinText: { color: '#7a4305', fontSize: 12, lineHeight: 14, fontWeight: '950' },
  headerGoldAmount: { color: '#fff3b0', fontSize: 13, fontWeight: '950' },
  hintButtonWide: { minWidth: 132, paddingHorizontal: 18 },
  winGoldWallet: { position: 'absolute', left: 18, top: 17, zIndex: 112, minWidth: 156, height: 58, paddingHorizontal: 8, borderRadius: 29, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(10,47,48,.98)', borderWidth: 2, borderColor: '#ffd45a', shadowColor: '#ffc83d', shadowOpacity: .72, shadowRadius: 18, elevation: 28 },
  winGoldCoin: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffc83d', borderWidth: 3, borderColor: '#fff4b0', shadowColor: '#ffd45a', shadowOpacity: .82, shadowRadius: 8 },
  winGoldCoinText: { color: '#7c4305', fontSize: 18, lineHeight: 21, fontWeight: '950' },
  winGoldLabel: { color: 'rgba(255,255,255,.58)', fontSize: 7, fontWeight: '950', letterSpacing: .8, marginLeft: 8 },
  winGoldAmount: { color: '#fff0a0', fontSize: 19, lineHeight: 21, fontWeight: '950', marginLeft: 8 },
  winGoldPlus: { color: '#ffd65d', fontSize: 11, fontWeight: '950', marginLeft: 'auto', paddingHorizontal: 6 },
  simpleTopWallet: { minWidth: 142, paddingRight: 10 },
  walletGoldAsset: { width: 50, height: 44, marginLeft: -5, marginRight: 1 },
  walletNumberAnchor: { alignItems: 'center', justifyContent: 'center' },
  assetFxLayer: { ...StyleSheet.absoluteFillObject, zIndex: 1000, overflow: 'hidden', elevation: 100 },
  assetBurst: { position: 'absolute' },
  assetFall: { position: 'absolute' },
  confettiPiece: { position: 'absolute', top: 0, shadowColor: '#fff6bc', shadowOpacity: .55, shadowRadius: 3, elevation: 81 },
  guaranteedConfettiLayer: { ...StyleSheet.absoluteFillObject, zIndex: 10000, elevation: 120, overflow: 'hidden' },
  guaranteedConfettiAsset: { position: 'absolute', top: -18, opacity: .92 },
  guaranteedConfettiPiece: { position: 'absolute', borderWidth: .7, borderColor: 'rgba(255,255,255,.72)', shadowColor: '#fff4a8', shadowOpacity: .9, shadowRadius: 4 },
  celebrationExplosionLayer: { ...StyleSheet.absoluteFillObject, zIndex: 20000, elevation: 160, overflow: 'hidden' },
  celebrationFallStatic: { position: 'absolute', top: -22, opacity: .78 },
  celebrationExplosionAsset: { position: 'absolute' },
  celebrationParticle: { position: 'absolute', top: 0, borderWidth: .8, borderColor: 'rgba(255,255,255,.78)', shadowColor: '#fff3a0', shadowOpacity: .8, shadowRadius: 3 },
  homeProgressSummary: { minHeight: 50, borderRadius: 18, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(4,30,38,.58)', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)' },
  homeProgressLabel: { color: 'rgba(255,255,255,.68)', fontSize: 9, fontWeight: '900', letterSpacing: 1.3, textTransform: 'uppercase' },
  homeProgressValue: { color: '#ffe08a', fontSize: 14, fontWeight: '950' },
  successScreenRoot: { flex: 1, width: '100%', height: '100%', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  successModalHost: { flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#062b35' },
  reliableSuccessRoot: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#062b35' },
  reliableSuccessBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', zIndex: 0 },
  reliableSuccessTint: { ...StyleSheet.absoluteFillObject, zIndex: 1, backgroundColor: 'rgba(2,28,38,.26)' },
  reliableSuccessCenter: { position: 'absolute', left: 0, right: 0, top: '25%', alignItems: 'center', justifyContent: 'center', zIndex: 200, elevation: 100 },
  reliableVictoryVisual: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 18, overflow: 'visible' },
  reliableVictoryImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', zIndex: 3 },
  reliableRewardCard: { minWidth: 190, height: 82, borderRadius: 41, paddingHorizontal: 21, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#073b43', borderWidth: 2, borderColor: '#f0ca62', shadowColor: '#ffd75c', shadowOpacity: .72, shadowRadius: 19, elevation: 22 },
  reliableRewardCoin: { width: 58, height: 58, borderRadius: 29, marginRight: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e6a91f', borderWidth: 4, borderColor: '#fff0a0', shadowColor: '#ffe36d', shadowOpacity: .95, shadowRadius: 10, elevation: 25 },
  reliableRewardCoinMark: { color: '#fff4b0', fontSize: 27, fontWeight: '950', textShadowColor: '#9c6510', textShadowRadius: 2 },
  reliableRewardNumber: { color: '#fff1a0', fontSize: 38, lineHeight: 43, fontWeight: '950' },
  reliableWallet: { position: 'absolute', left: 14, height: 56, minWidth: 112, paddingHorizontal: 11, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#073b43', borderWidth: 1.5, borderColor: '#f0ca62', zIndex: 300, elevation: 110 },
  reliableWalletCoin: { width: 40, height: 40, borderRadius: 20, marginRight: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e6a91f', borderWidth: 3, borderColor: '#fff0a0' },
  reliableWalletCoinMark: { color: '#fff4b0', fontSize: 18, fontWeight: '950' },
  reliableWalletNumber: { color: '#fff1a0', fontSize: 18, fontWeight: '950' },
  reliableConfetti: { position: 'absolute', zIndex: 20, elevation: 20, borderWidth: .8, borderColor: 'rgba(255,255,255,.86)' },
  successOverlay: { backgroundColor: 'rgba(2,28,40,.34)', paddingHorizontal: 0, overflow: 'hidden' },
  successBackdropTint: { ...StyleSheet.absoluteFillObject, zIndex: 0, backgroundColor: 'rgba(1,24,38,.28)' },
  successBackdropAura: { position: 'absolute', zIndex: 1, top: '22%', alignSelf: 'center', width: 390, height: 390, borderRadius: 195, backgroundColor: 'rgba(69,221,211,.13)', shadowColor: '#8bfff2', shadowOpacity: .62, shadowRadius: 52, elevation: 1 },
  successWaterDecoration: { position: 'absolute', zIndex: 2, left: 0, right: 0, bottom: '12%', height: 110, alignItems: 'center', justifyContent: 'space-around', opacity: .48 },
  successWaterRipple: { width: '58%', height: 2, borderRadius: 2, backgroundColor: 'rgba(255,224,127,.54)', shadowColor: '#ffe088', shadowOpacity: .76, shadowRadius: 9 },
  successWaterRippleWide: { width: '82%', opacity: .48 },
  successWaterRippleSmall: { width: '34%', opacity: .72 },
  successCelebrationGlow: { position: 'absolute', zIndex: 100, top: '26%', alignSelf: 'center', width: 285, height: 285, borderRadius: 143, backgroundColor: 'rgba(255,199,63,.18)', shadowColor: '#ffd85c', shadowOpacity: .9, shadowRadius: 44, elevation: 1 },
  confettiEmitter: { position: 'absolute', zIndex: 104, elevation: 5, top: '48%', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,211,76,.22)', borderWidth: 1.5, borderColor: 'rgba(255,239,170,.88)', shadowColor: '#ffd34e', shadowOpacity: .95, shadowRadius: 18 },
  confettiEmitterLeft: { left: -12 }, confettiEmitterRight: { right: -12 },
  confettiEmitterCore: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff1a6', borderWidth: 3, borderColor: '#f4b93a' },
  successVisiblePiece: { position: 'absolute', zIndex: 102, elevation: 3, borderWidth: .8, borderColor: 'rgba(255,255,255,.82)', shadowColor: '#fff4a8', shadowOpacity: .85, shadowRadius: 3 },
  successPieceShine: { position: 'absolute', left: '17%', top: 1, width: '28%', height: '72%', borderRadius: 3, backgroundColor: 'rgba(255,255,255,.56)' },
  simpleRewardCardCelebration: { alignSelf: 'center', zIndex: 5, marginTop: 0, shadowOpacity: .75, shadowRadius: 26, elevation: 20 },
  rewardNumberAnchor: { alignItems: 'center', justifyContent: 'center' },
  coinTransferLayer: { ...StyleSheet.absoluteFillObject, zIndex: 250, elevation: 105 },
  transferCoin: { position: 'absolute', width: 46, height: 46, borderRadius: 23, zIndex: 250, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8ae27', borderWidth: 3, borderColor: '#fff4b5', shadowColor: '#ffe26f', shadowOpacity: 1, shadowRadius: 14, elevation: 105 },
  transferCoinGlow: { position: 'absolute', width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: 'rgba(255,235,133,.62)', backgroundColor: 'rgba(255,211,73,.12)' },
  transferCoinMark: { color: '#fff8cb', fontSize: 20, fontWeight: '950', textShadowColor: '#8b5708', textShadowRadius: 3 },
  simpleCelebrationScene: { ...StyleSheet.absoluteFillObject, zIndex: 103, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  successOpeningGlow: { position: 'absolute', top: '34%', alignSelf: 'center', width: 280, height: 125, borderRadius: 70, backgroundColor: 'rgba(112,248,233,.18)', shadowColor: '#8dfff2', shadowOpacity: .88, shadowRadius: 38, elevation: 1 },
  successLightWash: { position: 'absolute', zIndex: 101, left: '10%', right: '10%', top: '32%', height: '35%', borderRadius: 42, backgroundColor: 'rgba(99,232,220,.16)', shadowColor: '#8df9ed', shadowOpacity: .75, shadowRadius: 34, elevation: 2 },
  successCrestAsset: { position: 'absolute', left: '3%', width: '94%', height: 172, zIndex: 1, shadowColor: '#75f4e9', shadowOpacity: .62, shadowRadius: 24, elevation: 12 },
  successCrestAssetFlow: { width: '94%', height: 172, zIndex: 1, shadowColor: '#75f4e9', shadowOpacity: .62, shadowRadius: 24, elevation: 12 },
  successRewardFlow: { marginTop: -18 },
  successRewardEntranceWrap: { zIndex: 5, marginTop: -18, alignItems: 'center', justifyContent: 'center' },
  successCrestPanel: { width: 318, height: 220, marginBottom: 34, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: 38, backgroundColor: 'rgba(4,38,49,.82)', borderWidth: 1.5, borderColor: 'rgba(146,245,233,.48)', borderTopColor: 'rgba(255,236,164,.78)', shadowColor: '#65e8dd', shadowOpacity: .58, shadowRadius: 32, elevation: 14 },
  successCrestTopAccent: { position: 'absolute', top: 0, width: 154, height: 3, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, backgroundColor: '#ffe08a', shadowColor: '#ffd95c', shadowOpacity: .95, shadowRadius: 12 },
  successCrestSheen: { position: 'absolute', top: -50, width: 58, height: 330, backgroundColor: 'rgba(255,255,255,.11)' },
  successBurstLines: { position: 'absolute', width: 216, height: 216, alignItems: 'center', justifyContent: 'center', opacity: .42 },
  successBurstLine: { position: 'absolute', width: 2, height: 182, borderRadius: 2, backgroundColor: 'rgba(117,240,229,.30)' },
  successVictoryRow: { width: '100%', height: 136, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  successLaurelWing: { width: 78, height: 120, justifyContent: 'space-evenly' },
  successLaurelLeft: { alignItems: 'flex-end', marginRight: -2 },
  successLaurelRight: { alignItems: 'flex-start', marginLeft: -2 },
  successLaurelLeaf: { width: 34, height: 13, borderRadius: 9, backgroundColor: 'rgba(255,216,91,.88)', borderWidth: 1, borderColor: 'rgba(255,247,200,.82)', shadowColor: '#ffd95a', shadowOpacity: .8, shadowRadius: 7, elevation: 5 },
  successSealFrame: { width: 112, height: 126, padding: 5, borderRadius: 34, backgroundColor: 'rgba(255,225,125,.15)', borderWidth: 1.5, borderColor: 'rgba(255,233,154,.72)', shadowColor: '#79f6e9', shadowOpacity: .82, shadowRadius: 25, elevation: 16 },
  successSealGlass: { flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: 28, backgroundColor: 'rgba(13,91,96,.94)', borderWidth: 2, borderColor: '#adfff5' },
  successSealHighlight: { position: 'absolute', left: 10, right: 10, top: 8, height: 20, borderRadius: 13, backgroundColor: 'rgba(255,255,255,.12)' },
  successSealCheck: { color: '#fff3b5', fontSize: 68, lineHeight: 76, fontWeight: '950', textShadowColor: '#ffd85c', textShadowRadius: 16 },
  successCrestBottomAccent: { position: 'absolute', bottom: 13, flexDirection: 'row', alignItems: 'center', gap: 8 },
  successAccentDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(128,244,234,.76)' },
  successAccentBar: { width: 76, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,224,119,.82)', shadowColor: '#ffd95b', shadowOpacity: .8, shadowRadius: 7 },
  victoryEmblem: { width: 238, height: 203, marginBottom: 2, shadowColor: '#ffe6a0', shadowOpacity: .72, shadowRadius: 24 },
  celebrationStarRow: { height: 58, marginBottom: 8, alignItems: 'center', justifyContent: 'center', transform: [{ scale: 1.18 }] },
  simpleMedalWrap: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  simpleMedal: { width: 132, height: 132, borderRadius: 66, alignItems: 'center', justifyContent: 'center', backgroundColor: '#efc964', borderWidth: 9, borderColor: '#fffdf3', shadowColor: '#ffd45a', shadowOpacity: .88, shadowRadius: 25, elevation: 22 },
  simpleCheck: { color: '#12383d', fontSize: 70, lineHeight: 78, fontWeight: '950' },
  simpleRewardCard: { minWidth: 226, height: 94, marginTop: 10, paddingHorizontal: 20, borderRadius: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(12,58,61,.96)', borderWidth: 2, borderColor: '#efc964', shadowColor: '#ffc83d', shadowOpacity: .42, shadowRadius: 16, elevation: 12 },
  rewardGoldAsset: { width: 78, height: 70, marginLeft: -8, marginRight: 4 },
  simpleRewardCoin: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', marginRight: 17, backgroundColor: '#ffc83d', borderWidth: 4, borderColor: '#fff1a1' },
  simpleRewardCoinMark: { color: '#7b4606', fontSize: 30, lineHeight: 34, fontWeight: '950' }, simpleRewardNumber: { color: '#fff0a0', fontSize: 39, lineHeight: 44, fontWeight: '950' },
  simpleTransferTrack: { width: 176, height: 5, borderRadius: 3, marginTop: 27, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,.13)' }, simpleTransferFill: { width: '100%', height: '100%', borderRadius: 3, backgroundColor: '#efc964' },
  simpleCelebrationDots: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 18 }, simpleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.25)' }, simpleDotActive: { width: 24, backgroundColor: '#efc964' },
  successRays: { position: 'absolute', zIndex: 101, width: 390, height: 390, borderRadius: 195, borderWidth: 2, borderColor: 'rgba(255,218,86,.42)', backgroundColor: 'rgba(255,205,58,.055)', alignItems: 'center', justifyContent: 'center' },
  successRaysInner: { width: 285, height: 285, borderRadius: 143, borderWidth: 2, borderColor: 'rgba(100,230,222,.30)', backgroundColor: 'rgba(82,213,205,.035)' },
  successScene: { ...StyleSheet.absoluteFillObject, zIndex: 103, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingTop: 54 },
  successLily: { width: 132, height: 104, marginBottom: -31, shadowColor: '#ffe078', shadowOpacity: .55, shadowRadius: 18 },
  successSeal: { width: 94, height: 94, borderRadius: 47, alignItems: 'center', justifyContent: 'center', backgroundColor: '#efc964', borderWidth: 7, borderColor: 'rgba(255,255,255,.94)', shadowColor: '#ffe078', shadowOpacity: .82, shadowRadius: 28, elevation: 20 },
  successCheck: { color: '#16363c', fontSize: 47, lineHeight: 52, fontWeight: '950' },
  successKicker: { color: '#efc964', fontSize: 11, fontWeight: '950', letterSpacing: 3.2, marginTop: 25 },
  successTitle: { color: 'white', fontSize: 35, lineHeight: 41, fontWeight: '950', textAlign: 'center', marginTop: 7, textShadowColor: 'rgba(116,235,227,.30)', textShadowRadius: 16 },
  successSubtitle: { color: 'rgba(255,255,255,.68)', fontSize: 11, fontWeight: '750', letterSpacing: .35, marginTop: 7 },
  successGoldCounter: { minWidth: 230, minHeight: 92, borderRadius: 30, marginTop: 24, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(18,59,63,.88)', borderWidth: 2, borderColor: 'rgba(255,210,70,.72)', shadowColor: '#ffc83d', shadowOpacity: .34, shadowRadius: 18 },
  successGoldCoin: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginRight: 14, backgroundColor: '#ffc83d', borderWidth: 4, borderColor: '#fff2a6', shadowColor: '#ffd45a', shadowOpacity: .85, shadowRadius: 12 },
  successGoldCoinText: { color: '#7c4305', fontSize: 24, lineHeight: 28, fontWeight: '950' },
  successGoldNumber: { color: '#fff0a0', fontSize: 34, lineHeight: 38, fontWeight: '950' },
  successGoldLabel: { color: 'rgba(255,255,255,.60)', fontSize: 9, fontWeight: '850', marginTop: 1 },
  successReturnText: { color: 'rgba(255,255,255,.68)', fontSize: 11, fontWeight: '800', marginTop: 28, letterSpacing: .3 },
  successDots: { flexDirection: 'row', gap: 6, marginTop: 10 },
  successDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.28)' },
  successDotBright: { width: 17, backgroundColor: '#efc964' },
  flyingGold: { position: 'absolute', left: '50%', top: '55%', width: 38, height: 32, marginLeft: -19, shadowColor: '#ffd354', shadowOpacity: .95, shadowRadius: 9, elevation: 22 },
  flyingGoldAsset: { width: '100%', height: '100%' },
  flyingGoldInner: { flex: 1, borderRadius: 12, backgroundColor: '#ffc83d', borderWidth: 1, borderColor: '#fff4b8', alignItems: 'center', justifyContent: 'center' },
  flyingGoldMark: { color: '#8a4b08', fontSize: 12, lineHeight: 14, fontWeight: '950' },
  goldRewardCard: { minHeight: 76, backgroundColor: '#173c3d', borderWidth: 2, borderColor: 'rgba(255,207,67,.72)', shadowColor: '#ffc83d', shadowOpacity: .32, shadowRadius: 13, elevation: 8 },
  goldRewardCoin: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: '#fff2a8', backgroundColor: '#ffc83d', shadowColor: '#ffd257', shadowOpacity: .72, shadowRadius: 9 },
  goldRewardAmount: { color: '#fff1a0', fontSize: 19, lineHeight: 22, textShadowColor: 'rgba(255,183,25,.45)', textShadowRadius: 8 },
  goldWalletAmount: { color: '#ffd85e', fontSize: 15 },
  boardSurfaceExpanded: { borderColor: 'rgba(213,248,244,.50)' },
  boardAmbientGlow: { position: 'absolute', left: -10, right: -10, top: -10, bottom: -10, borderRadius: 40, borderWidth: 8, borderColor: 'rgba(109,222,221,.07)', backgroundColor: 'rgba(32,174,179,.035)', shadowColor: '#86f5ed', shadowOpacity: .22, shadowRadius: 20 },
  boardAmbientLine: { position: 'absolute', left: 26, right: 26, bottom: -9, height: 2, borderRadius: 2, backgroundColor: 'rgba(255,224,139,.28)', shadowColor: '#ffe69a', shadowOpacity: .7, shadowRadius: 8 },
  remainingMoveLabel: { color: C.muted, fontSize: 9, lineHeight: 12, fontWeight: '900', letterSpacing: 1.2, marginRight: 8 },
  remainingMoveNumber: { color: C.ink, fontSize: 22, lineHeight: 25, fontWeight: '950' },
  specialMirrorAsset: { width: '112%', height: '112%', shadowColor: '#8ffff5', shadowOpacity: .28, shadowRadius: 7 },
  movingMirrorAsset: { width: '126%', height: '126%' },
  goalMarker: { position: 'absolute', width: '94%', height: '94%', zIndex: 4, alignItems: 'center', justifyContent: 'center' },
  goalArtDecoFrame: { position: 'absolute', left: '3%', right: '3%', top: '7%', bottom: '7%', borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(135,232,224,.36)' },
  goalArtDecoFrameActive: { borderColor: 'rgba(255,236,165,.72)', shadowColor: '#aafff5', shadowOpacity: .8, shadowRadius: 7 },
  goalFrameTopLeft: { position: 'absolute', left: -1, top: 0, width: '27%', height: 1.5, backgroundColor: 'rgba(171,245,237,.68)', transform: [{ rotate: '-12deg' }] },
  goalFrameTopRight: { position: 'absolute', right: -1, top: 0, width: '27%', height: 1.5, backgroundColor: 'rgba(171,245,237,.68)', transform: [{ rotate: '12deg' }] },
  goalFrameBottomLeft: { position: 'absolute', left: -1, bottom: 0, width: '24%', height: 1.5, backgroundColor: 'rgba(255,226,139,.55)', transform: [{ rotate: '12deg' }] },
  goalFrameBottomRight: { position: 'absolute', right: -1, bottom: 0, width: '24%', height: 1.5, backgroundColor: 'rgba(255,226,139,.55)', transform: [{ rotate: '-12deg' }] },
  goalBeacon: { position: 'absolute', top: '1%', height: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  goalBeaconWing: { width: 13, height: 1.5, marginRight: 4, borderRadius: 2, backgroundColor: 'rgba(141,232,224,.68)', transform: [{ rotate: '-12deg' }] },
  goalBeaconWingRight: { marginRight: 0, marginLeft: 4, transform: [{ rotate: '12deg' }] },
  goalLotusDock: { position: 'absolute', bottom: '10%', width: '68%', height: '20%', borderTopWidth: 2, borderColor: 'rgba(119,225,217,.52)', borderRadius: 999, backgroundColor: 'rgba(29,145,151,.06)', shadowColor: '#87eee5', shadowOpacity: .36, shadowRadius: 5 },
  goalLotusDockActive: { borderColor: 'rgba(255,231,151,.86)', backgroundColor: 'rgba(255,218,111,.06)', shadowColor: '#ffe28f', shadowOpacity: .8, shadowRadius: 8 },
  goalDockCapLeft: { position: 'absolute', left: -3, top: -4, width: 6, height: 6, transform: [{ rotate: '45deg' }], backgroundColor: '#7cd8d2', borderWidth: 1, borderColor: '#eafffb' },
  goalDockCapRight: { position: 'absolute', right: -3, top: -4, width: 6, height: 6, transform: [{ rotate: '45deg' }], backgroundColor: '#7cd8d2', borderWidth: 1, borderColor: '#eafffb' },
  goalCorner: { position: 'absolute', width: '19%', height: '19%', borderColor: 'rgba(165,240,231,.52)' },
  goalCornerActive: { borderColor: 'rgba(255,245,205,.92)', shadowColor: '#b6fff6', shadowOpacity: .9, shadowRadius: 6 },
  goalCornerTL: { left: '5%', top: '5%', borderLeftWidth: 1.4, borderTopWidth: 1.4, borderTopLeftRadius: 7 },
  goalCornerTR: { right: '5%', top: '5%', borderRightWidth: 1.4, borderTopWidth: 1.4, borderTopRightRadius: 7 },
  goalCornerBL: { left: '5%', bottom: '5%', borderLeftWidth: 1.4, borderBottomWidth: 1.4, borderBottomLeftRadius: 7 },
  goalCornerBR: { right: '5%', bottom: '5%', borderRightWidth: 1.4, borderBottomWidth: 1.4, borderBottomRightRadius: 7 },
  goalMoonDiamond: { width: 8, height: 8, borderRadius: 2, transform: [{ rotate: '45deg' }], backgroundColor: '#8de4dd', borderWidth: 1, borderColor: 'rgba(239,255,250,.9)', shadowColor: '#8df8ee', shadowOpacity: .7, shadowRadius: 5 },
  goalMoonDiamondActive: { backgroundColor: '#fff0b0', borderColor: '#fffdf1', shadowColor: '#ffe18a', shadowOpacity: 1, shadowRadius: 9 },
  goalWaterLines: { position: 'absolute', left: '8%', right: '8%', bottom: '1%', height: '16%', alignItems: 'center', justifyContent: 'space-around' },
  goalWaterLine: { width: '58%', height: 1, borderRadius: 1, backgroundColor: 'rgba(135,224,218,.44)' },
  goalWaterLineWide: { width: '82%', opacity: .65 },
  goalWaterLineSmall: { width: '34%', opacity: .8 },
  goalWaterLineActive: { backgroundColor: 'rgba(255,239,174,.88)', shadowColor: '#ffe59b', shadowOpacity: .8, shadowRadius: 5 },
  lilyStage: { ...StyleSheet.absoluteFillObject, zIndex: 30, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  lilyAssetStage: { position: 'relative', zIndex: 30, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  lilyFixedAsset: { position: 'absolute', left: 0, top: 0, zIndex: 30 },
  lilyOpenAsset: { zIndex: 31 },
  lilyBloomRipple: { position: 'absolute', bottom: '18%', width: '72%', height: '17%', borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(179,255,247,.92)', backgroundColor: 'rgba(86,224,215,.08)', shadowColor: '#9afff4', shadowOpacity: .9, shadowRadius: 9 },
  lilyBloomRay: { position: 'absolute', zIndex: 7, borderRadius: 2, backgroundColor: 'rgba(255,252,224,.96)', shadowColor: '#b8fff7', shadowOpacity: 1, shadowRadius: 9 },
  lilyBloomRayHorizontal: { width: '82%', height: 2 },
  lilyBloomRayVertical: { width: 2, height: '82%' },
  lilyBloomCore: { position: 'absolute', zIndex: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: '#f8ffff', shadowColor: '#a5fff4', shadowOpacity: 1, shadowRadius: 14 },
  loading: { flex: 1, backgroundColor: C.lake, alignItems: 'center', justifyContent: 'center' }, loadingMoon: { fontSize: 76, color: C.white }, loadingText: { color: C.ink, fontSize: 28, fontWeight: '900', marginTop: 8 },
});
