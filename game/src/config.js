// Dapur Kilat — config: ukuran arena, bahan, resep, dan laju shift.
// Satu-satunya tempat angka-angka permainan tinggal; semua modul lain membacanya dari sini.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const SHIFT_SECONDS = 180;
export const CHEF_SPEED = 300;
export const CHEF_RADIUS = 26;
export const INTERACT_RANGE = 250;
export const CHOP_SECONDS = 1.5;
export const COOK_SECONDS = 4;
export const BURN_SECONDS = 6;

// Bahan mentah yang bisa diambil dari rak pantry (bin), dan hasil olahannya.
export const INGREDIENTS = {
  roti:   { id: 'roti',          name: 'Roti',          color: '#e8b25c', chop: false, cook: false },
  daging: { id: 'daging',        name: 'Daging',        color: '#e0787a', chop: false, cook: true  },
  selada: { id: 'selada',        name: 'Selada',        color: '#69c24f', chop: true,  cook: false },
  tomat:  { id: 'tomat',         name: 'Tomat',         color: '#e5493a', chop: true,  cook: false },
};

// Hasil olahan: kunci = id bahan + cara olah.
export const PROCESSED = {
  'selada-potong': { id: 'selada-potong', name: 'Selada Potong', color: '#7ed957', from: 'selada' },
  'tomat-potong':  { id: 'tomat-potong',  name: 'Tomat Potong',  color: '#f2664d', from: 'tomat' },
  'daging-masak':  { id: 'daging-masak',  name: 'Daging Masak',  color: '#8a5a33', from: 'daging' },
};

export function ingredientName(id) {
  return (INGREDIENTS[id] ?? PROCESSED[id] ?? { name: id }).name;
}

// Menu yang dipesan pelanggan. needs = daftar id bahan (mentah yang sudah diolah).
export const DISHES = [
  { id: 'burger',   name: 'Burger Kilat',   needs: ['roti', 'daging-masak', 'selada-potong'], price: 120 },
  { id: 'salad',    name: 'Salad Segar',    needs: ['selada-potong', 'tomat-potong'],          price: 90 },
  { id: 'steak',    name: 'Steak Tomat',    needs: ['daging-masak', 'tomat-potong'],           price: 140 },
  { id: 'sandwich', name: 'Sandwich Taman', needs: ['roti', 'tomat-potong', 'selada-potong'], price: 110 },
];

// Stasiun dapur: posisi dan ukuran di arena (koordinat VIEW 1280x720).
export const STATIONS = {
  bins: [
    { kind: 'roti',   x: 30,  y: 150, w: 120, h: 84, label: 'ROTI' },
    { kind: 'daging', x: 160, y: 150, w: 120, h: 84, label: 'DAGING' },
    { kind: 'selada', x: 290, y: 150, w: 120, h: 84, label: 'SELADA' },
    { kind: 'tomat',  x: 420, y: 150, w: 120, h: 84, label: 'TOMAT' },
  ],
  chop:    { x: 600,  y: 150, w: 190, h: 110, label: 'TALENAN' },
  stove:   { x: 830,  y: 150, w: 220, h: 110, label: 'KOMPOR' },
  plating: { x: 1080, y: 150, w: 170, h: 110, label: 'PIRING SAJI' },
  serve:   { x: 470,  y: 540, w: 340, h: 110, label: 'JENDELA SAJI' },
  trash:   { x: 1120, y: 540, w: 110, h: 110, label: 'SAMPAH' },
};

// Titik lantai tempat koki berdiri saat memakai tiap stasiun.
export const STAND_SPOTS = {
  bins:   { x: 285, y: 300 },
  chop:   { x: 695, y: 300 },
  stove:  { x: 940, y: 300 },
  plating:{ x: 1165, y: 300 },
  serve:  { x: 640, y: 500 },
  trash:  { x: 1175, y: 500 },
};

export const FLOOR = { x: 16, y: 250, w: 1248, h: 454 };

export function levelFor(served) {
  return 1 + Math.floor(served / 4);
}

export function spawnIntervalMs(level) {
  return Math.max(9000, 16000 - (level - 1) * 1800);
}

export function patienceSeconds(level) {
  return Math.max(24, 42 - (level - 1) * 3);
}
