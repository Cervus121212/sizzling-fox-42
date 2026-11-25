// Dapur Kilat — input: keyboard (WASD/panah + E/Spasi + angka 1-4) dan mouse
// (klik stasiun = jalan ke sana lalu pakai; klik lantai = jalan saja).

import { VIEW_W, VIEW_H, STATIONS, STAND_SPOTS, FLOOR, CHEF_SPEED, INGREDIENTS } from './config.js';

export function stationAtPoint(x, y) {
  for (const bin of STATIONS.bins) {
    if (x >= bin.x && x <= bin.x + bin.w && y >= bin.y && y <= bin.y + bin.h) return { station: 'bin', arg: bin.kind };
  }
  for (const [id, s] of Object.entries(STATIONS)) {
    if (id === 'bins') continue;
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return { station: id, arg: null };
  }
  return null;
}

export function nearestStation(state) {
  const c = state.chef;
  let best = null;
  let bestD = Infinity;
  const check = (id, cx, cy) => {
    const d = Math.hypot(c.x - cx, c.y - cy);
    if (d < bestD) { bestD = d; best = id; }
  };
  for (const bin of STATIONS.bins) check('bin', bin.x + bin.w / 2, bin.y + bin.h / 2);
  check('chop', STATIONS.chop.x + STATIONS.chop.w / 2, STATIONS.chop.y + STATIONS.chop.h / 2);
  check('stove', STATIONS.stove.x + STATIONS.stove.w / 2, STATIONS.stove.y + STATIONS.stove.h / 2);
  check('plating', STATIONS.plating.x + STATIONS.plating.w / 2, STATIONS.plating.y + STATIONS.plating.h / 2);
  check('serve', STATIONS.serve.x + STATIONS.serve.w / 2, STATIONS.serve.y + STATIONS.serve.h / 2);
  check('trash', STATIONS.trash.x + STATIONS.trash.w / 2, STATIONS.trash.y + STATIONS.trash.h / 2);
  return { id: best, dist: bestD };
}

export function attachInput(canvas, state, audio, onStart, onRestart) {
  const keys = new Set();
  let hover = { x: -1, y: -1 };

  function toGameCoords(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * VIEW_W,
      y: ((e.clientY - r.top) / r.height) * VIEW_H,
    };
  }

  function nearestBinKind() {
    const c = state.chef;
    let best = null;
    let bestD = Infinity;
    for (const bin of STATIONS.bins) {
      const d = Math.hypot(c.x - (bin.x + bin.w / 2), c.y - (bin.y + bin.h / 2));
      if (d < bestD) { bestD = d; best = bin.kind; }
    }
    return best;
  }

  function useNearest() {
    const near = nearestStation(state);
    if (near.dist > 300) return;
    if (near.id === 'bin') state.interact('bin', nearestBinKind());
    else state.interact(near.id, null);
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    audio.unlock();
    if (e.repeat) return;
    keys.add(e.key.toLowerCase());
    if (state.screen === 'menu' && (e.key === 'Enter' || e.key === ' ')) { onStart(); return; }
    if (state.screen === 'over' && (e.key === 'Enter' || e.key.toLowerCase() === 'r')) { onRestart(); return; }
    if (state.screen !== 'playing') return;
    if (e.key === 'e' || e.key === 'E' || e.key === ' ') useNearest();
    if (e.key === 'm' || e.key === 'M') audio.setMuted(!audio.muted);
    const binKeys = { 1: 'roti', 2: 'daging', 3: 'selada', 4: 'tomat' };
    if (binKeys[e.key]) state.interact('bin', binKeys[e.key]);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

  canvas.addEventListener('mousemove', (e) => { hover = toGameCoords(e); });
  canvas.addEventListener('click', (e) => {
    audio.unlock();
    if (state.screen === 'menu') { onStart(); return; }
    if (state.screen === 'over') { onRestart(); return; }
    if (state.screen !== 'playing' || state.frozen) return;
    const p = toGameCoords(e);
    const hit = stationAtPoint(p.x, p.y);
    const c = state.chef;
    if (!hit) {
      c.target = { x: Math.max(FLOOR.x + 20, Math.min(FLOOR.x + FLOOR.w - 20, p.x)), y: Math.max(FLOOR.y + 20, Math.min(FLOOR.y + FLOOR.h - 20, p.y)) };
      c.pendingAction = null;
      return;
    }
    const spot = hit.station === 'bin' ? STAND_SPOTS.bins : STAND_SPOTS[hit.station];
    const d = Math.hypot(c.x - spot.x, c.y - spot.y);
    if (d < 130) {
      state.interact(hit.station, hit.arg);
    } else {
      c.target = { x: spot.x, y: spot.y };
      c.pendingAction = { station: hit.station, arg: hit.arg };
    }
  });

  // Gerak keyboard tiap frame; dipanggil dari loop utama.
  function applyKeys(dtMs) {
    if (state.screen !== 'playing' || state.frozen) return;
    let dx = 0;
    let dy = 0;
    if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
    if (keys.has('d') || keys.has('arrowright')) dx += 1;
    if (keys.has('w') || keys.has('arrowup')) dy -= 1;
    if (keys.has('s') || keys.has('arrowdown')) dy += 1;
    if (dx === 0 && dy === 0) return;
    const c = state.chef;
    c.target = null;
    c.pendingAction = null;
    const len = Math.hypot(dx, dy);
    c.dir = dx > 0 ? 0 : dx < 0 ? 1 : c.dir;
    c.moving = true;
    const step = (CHEF_SPEED * dtMs) / 1000;
    c.x = Math.max(FLOOR.x + 20, Math.min(FLOOR.x + FLOOR.w - 20, c.x + (dx / len) * step));
    c.y = Math.max(FLOOR.y + 20, Math.min(FLOOR.y + FLOOR.h - 20, c.y + (dy / len) * step));
  }

  return { applyKeys, getHover: () => hover };
}
