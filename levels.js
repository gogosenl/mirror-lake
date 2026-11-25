const TOTAL_LEVELS = 500;

function rngFor(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(values, random) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const TR_ADJ = ['Sessiz', 'Gümüş', 'Derin', 'Kayıp', 'Saklı', 'Ayaz', 'Mavi', 'Durgun', 'Parlak', 'Gizemli', 'Uzak', 'Kadim', 'Yıldızlı', 'Sisli', 'Kristal', 'Gece', 'Kuzey', 'Rüya', 'Sonsuz', 'Fısıldayan'];
const EN_ADJ = ['Silent', 'Silver', 'Deep', 'Lost', 'Hidden', 'Frosted', 'Blue', 'Still', 'Radiant', 'Mystic', 'Distant', 'Ancient', 'Starry', 'Misty', 'Crystal', 'Midnight', 'Northern', 'Dreaming', 'Endless', 'Whispering'];
const TR_NOUN = ['Kıyı', 'Yansıma', 'Geçit', 'Çizgi', 'Nilüfer', 'Akıntı', 'Avlu', 'Labirent', 'Kalp', 'Dalga', 'Işık', 'Çiçek', 'Fırtına', 'Rota', 'Ayna', 'Ada', 'Kanal', 'Körfez', 'Bahçe', 'Tapınak', 'Ufuk', 'Girdap', 'Pınar', 'Köprü', 'Ay'];
const EN_NOUN = ['Shore', 'Reflection', 'Passage', 'Line', 'Lily', 'Current', 'Courtyard', 'Maze', 'Heart', 'Wave', 'Light', 'Bloom', 'Storm', 'Route', 'Mirror', 'Island', 'Channel', 'Bay', 'Garden', 'Temple', 'Horizon', 'Vortex', 'Spring', 'Bridge', 'Moon'];

function dimensionsFor(id) {
  const base = id <= 5 ? { cols: 5, rows: 5 } : id <= 20 ? { cols: 5, rows: 6 } : id <= 50 ? { cols: 6, rows: 7 } : id <= 75 ? { cols: 6, rows: 8 } : id <= 100 ? { cols: 6, rows: 9 } : id <= 250 ? { cols: 7, rows: 9 } : { cols: 7, rows: 10 };
  const variant = (id - 1) % 6;
  const shapes = [[0, 0], [0, 1], [1, 0], [0, 2], [1, 1], [0, 1]];
  return { cols: Math.min(7, base.cols + shapes[variant][0]), rows: Math.min(11, base.rows + shapes[variant][1]) };
}

function distanceToEdge(x, y, dir, cols, rows) {
  if (dir === 0) return cols - 1 - x;
  if (dir === 1) return rows - 1 - y;
  if (dir === 2) return x;
  return y;
}

function cellsAlong(x, y, dir, length) {
  const cells = [];
  for (let step = 0; step < length; step += 1) {
    x += DIRS[dir][0]; y += DIRS[dir][1]; cells.push([x, y]);
  }
  return cells;
}

function tryRoute(id, attempt, cols, rows, salt = 0) {
  const random = rngFor(id * 100003 + attempt * 7919 + cols * 97 + rows * 193 + salt * 15485863);
  const side = Math.floor(random() * 4);
  let start;
  if (side === 0) start = [Math.floor(random() * cols), -1, 1];
  else if (side === 1) start = [cols, Math.floor(random() * rows), 2];
  else if (side === 2) start = [Math.floor(random() * cols), rows, 3];
  else start = [-1, Math.floor(random() * rows), 0];
  let [x, y, dir] = start;
  const visited = new Set(), turns = [];
  const targetTurns = id <= 3 ? 2 : id <= 10 ? 3 : id <= 20 ? 4 : id <= 35 ? 5 : id <= 50 ? 6 : id <= 75 ? 7 : id <= 100 ? 8 : id <= 250 ? 8 : 9;
  for (let turnIndex = 0; turnIndex < targetTurns; turnIndex += 1) {
    const max = x < 0 || y < 0 || x >= cols || y >= rows ? (dir % 2 === 0 ? cols : rows) : distanceToEdge(x, y, dir, cols, rows);
    const minimum = turnIndex === 0 ? 2 : 1;
    const lengths = shuffled(Array.from({ length: Math.max(0, max - minimum + 1) }, (_, i) => i + minimum), random);
    let selected = null;
    for (const length of lengths) {
      const cells = cellsAlong(x, y, dir, length);
      if (cells.some(([cx, cy]) => cx < 0 || cy < 0 || cx >= cols || cy >= rows || visited.has(`${cx},${cy}`))) continue;
      const [tx, ty] = cells[cells.length - 1];
      const nextDirs = shuffled([(dir + 1) % 4, (dir + 3) % 4], random);
      const nextDir = nextDirs.find((candidate) => {
        const nx = tx + DIRS[candidate][0], ny = ty + DIRS[candidate][1];
        return nx >= 0 && ny >= 0 && nx < cols && ny < rows && !visited.has(`${nx},${ny}`) && !cells.some(([cx, cy]) => cx === nx && cy === ny);
      });
      if (nextDir !== undefined) { selected = { cells, x: tx, y: ty, dir: nextDir }; break; }
    }
    if (!selected) return null;
    selected.cells.forEach(([cx, cy]) => visited.add(`${cx},${cy}`));
    x = selected.x; y = selected.y; turns.push([x, y]); dir = selected.dir;
  }
  const maxFinal = distanceToEdge(x, y, dir, cols, rows);
  const finalLengths = shuffled(Array.from({ length: maxFinal }, (_, i) => i + 1), random);
  let goal = null;
  for (const length of finalLengths) {
    const cells = cellsAlong(x, y, dir, length);
    if (cells.every(([cx, cy]) => !visited.has(`${cx},${cy}`))) { cells.forEach(([cx, cy]) => visited.add(`${cx},${cy}`)); goal = cells[cells.length - 1]; break; }
  }
  if (!goal || turns.some(([tx, ty]) => tx === goal[0] && ty === goal[1])) return null;
  const pathKeys = new Set(visited);
  const empty = [];
  for (let cy = 0; cy < rows; cy += 1) for (let cx = 0; cx < cols; cx += 1) if (!pathKeys.has(`${cx},${cy}`)) empty.push([cx, cy]);
  const extraCount = id <= 3 ? 0 : id <= 10 ? 1 : id <= 20 ? 2 : id <= 35 ? 3 : id <= 50 ? 4 : id <= 75 ? 5 : id <= 100 ? 6 : 7;
  const extra = shuffled(empty, random).slice(0, extraCount).map(([ex, ey]) => [ex, ey, random() < .5 ? 0 : 1]);
  const flipRatio = id <= 10 ? .5 + random() * .25 : id <= 50 ? .64 + random() * .22 : .74 + random() * .2;
  const flipCount = Math.max(1, Math.min(turns.length, Math.ceil(turns.length * flipRatio)));
  const flips = shuffled(turns.map((_, index) => index), random).slice(0, flipCount).sort((a, b) => a - b);
  return { cols, rows, start, goal, turns, flips, extra };
}

function generateLevel(id, salt = 0) {
  const { cols, rows } = dimensionsFor(id);
  let route = null;
  for (let attempt = 0; attempt < 1200 && !route; attempt += 1) route = tryRoute(id, attempt, cols, rows, salt);
  if (!route) throw new Error(`Could not generate level ${id}`);
  const adjective = (id - 1) % TR_ADJ.length, noun = Math.floor((id - 1) / TR_ADJ.length) % TR_NOUN.length;
  return { ...route, title: `${TR_ADJ[adjective]} ${TR_NOUN[noun]}`, titleEn: `${EN_ADJ[adjective]} ${EN_NOUN[noun]}` };
}

const signatures = new Set(), levels = [];
for (let id = 1; id <= TOTAL_LEVELS; id += 1) {
  let level, signature, salt = 0;
  do {
    level = generateLevel(id, salt); salt += 1;
    signature = JSON.stringify([level.cols, level.rows, level.start, level.goal, level.turns, level.extra]);
  } while (signatures.has(signature));
  signatures.add(signature); levels.push(level);
}
module.exports = levels;
