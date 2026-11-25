// Dapur Kilat — render: semua gambar digambar dari kode (canvas 2D, tanpa aset luar).
// Warna hangat dapur rumahan: lantai terakota, meja kayu, kompor baja, tiket kertas.

import { VIEW_W, VIEW_H, STATIONS, FLOOR, INGREDIENTS, PROCESSED, ingredientName } from './config.js';
import { orderRemainingMs, sameNeeds } from './state.js';

const C = {
  wall: '#f7e8c9', wallDark: '#efd9ae', floorA: '#e8a06a', floorB: '#dd8f57',
  wood: '#b07a45', woodDark: '#8f5f33', woodLight: '#c98f52',
  steel: '#c9ced6', steelDark: '#9aa1ad', counter: '#7a4a21',
  cream: '#fff8ea', ink: '#3a2a18', red: '#d94f3d', gold: '#ffd94d',
  green: '#4da34a', ticket: '#fffdf4',
};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 'bold', align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// --- ikon bahan (digambar, bukan gambar luar) --------------------------------

export function drawIngredient(ctx, id, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (id === 'roti') {
    ctx.fillStyle = '#e8b25c';
    ctx.beginPath(); ctx.ellipse(0, -r * 0.25, r, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c98d3e';
    ctx.beginPath(); ctx.ellipse(0, r * 0.28, r * 0.92, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3d0';
    for (const [sx, sy] of [[-0.4, -0.35], [0.1, -0.5], [0.45, -0.3], [0, -0.2]]) {
      ctx.beginPath(); ctx.ellipse(sx * r, sy * r, r * 0.12, r * 0.07, 0.4, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'daging') {
    ctx.fillStyle = '#e0787a';
    rr(ctx, -r, -r * 0.7, r * 2, r * 1.4, r * 0.5); ctx.fill();
    ctx.strokeStyle = '#f6c9c9'; ctx.lineWidth = r * 0.14;
    ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.3); ctx.quadraticCurveTo(0, r * 0.1, r * 0.6, -r * 0.35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 0.5, r * 0.3); ctx.quadraticCurveTo(0, r * 0.55, r * 0.5, r * 0.2); ctx.stroke();
  } else if (id === 'daging-masak') {
    ctx.fillStyle = '#8a5a33';
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.72, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5d3a1e'; ctx.lineWidth = r * 0.14;
    for (const off of [-0.45, 0, 0.45]) {
      ctx.beginPath(); ctx.moveTo(off * r, -r * 0.5); ctx.lineTo(off * r - r * 0.15, r * 0.5); ctx.stroke();
    }
    ctx.fillStyle = '#a9743f';
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.2, r * 0.18, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'selada') {
    ctx.fillStyle = '#69c24f';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.55, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#8ed97a';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4da34a'; ctx.lineWidth = r * 0.1;
    ctx.beginPath(); ctx.moveTo(0, -r * 0.4); ctx.lineTo(0, r * 0.4); ctx.stroke();
  } else if (id === 'selada-potong') {
    ctx.strokeStyle = '#69c24f'; ctx.lineWidth = r * 0.28; ctx.lineCap = 'round';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(-r * 0.8, i * r * 0.32); ctx.lineTo(r * 0.8, i * r * 0.32 + r * 0.12); ctx.stroke();
    }
  } else if (id === 'tomat') {
    ctx.fillStyle = '#e5493a';
    ctx.beginPath(); ctx.arc(0, r * 0.08, r * 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8a70';
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.25, r * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4da34a';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
      ctx.lineTo(Math.cos(a) * r * 0.5, -r * 0.75 + Math.sin(a) * r * 0.28);
      ctx.lineTo(Math.cos(a + 0.6) * r * 0.16, -r * 0.75 + Math.sin(a + 0.6) * r * 0.16);
    }
    ctx.closePath(); ctx.fill();
  } else if (id === 'tomat-potong') {
    ctx.fillStyle = '#f2664d';
    for (const off of [-0.42, 0.42]) {
      ctx.beginPath(); ctx.arc(off * r, 0, r * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd0c2';
      ctx.beginPath(); ctx.arc(off * r, 0, r * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f2664d';
    }
  } else {
    ctx.fillStyle = '#999';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, r, contents) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d8d2c4'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y, r * 0.72, r * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
  contents.forEach((id, i) => {
    const ox = x + (i - (contents.length - 1) / 2) * r * 0.55;
    drawIngredient(ctx, id, ox, y - r * 0.08, r * 0.34);
  });
}

// --- dapur -------------------------------------------------------------------

function drawFloorAndWalls(ctx) {
  ctx.fillStyle = C.wall;
  ctx.fillRect(0, 0, VIEW_W, 250);
  ctx.fillStyle = C.wallDark;
  ctx.fillRect(0, 236, VIEW_W, 14);
  // Ubin lantai terakota.
  const t = 62;
  for (let y = 250; y < VIEW_H; y += t) {
    for (let x = 0; x < VIEW_W; x += t) {
      ctx.fillStyle = ((x / t + y / t) % 2 === 0) ? C.floorA : C.floorB;
      ctx.fillRect(x, y, t, t);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let y = 250; y < VIEW_H; y += t) ctx.fillRect(0, y, VIEW_W, 2);
  for (let x = 0; x < VIEW_W; x += t) ctx.fillRect(x, 250, 2, VIEW_H - 250);
  // Karpet bundar di tengah lantai supaya dapur tidak terasa kosong.
  ctx.fillStyle = '#c97b4a';
  ctx.beginPath(); ctx.ellipse(640, 470, 300, 96, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#a85f33'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.ellipse(640, 470, 300, 96, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#e8a06a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(640, 470, 268, 78, 0, 0, Math.PI * 2); ctx.stroke();
  text(ctx, 'DAPUR KILAT', 640, 472, 20, '#f7e8c9');
}

function drawBins(ctx, state, hover) {
  for (const bin of STATIONS.bins) {
    const hot = hover && hover.x >= bin.x && hover.x <= bin.x + bin.w && hover.y >= bin.y && hover.y <= bin.y + bin.h;
    ctx.fillStyle = hot ? '#d99a55' : C.wood;
    rr(ctx, bin.x, bin.y, bin.w, bin.h, 10); ctx.fill();
    ctx.fillStyle = C.woodDark;
    ctx.fillRect(bin.x + 6, bin.y + bin.h - 14, bin.w - 12, 8);
    drawIngredient(ctx, bin.kind, bin.x + bin.w / 2, bin.y + 34, 22);
    text(ctx, bin.label, bin.x + bin.w / 2, bin.y + bin.h - 24, 13, '#fff');
  }
}

function drawChopBoard(ctx, state) {
  const s = STATIONS.chop;
  ctx.fillStyle = C.woodLight;
  rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
  ctx.fillStyle = '#e8c890';
  rr(ctx, s.x + 14, s.y + 12, s.w - 28, s.h - 40, 8); ctx.fill();
  // Pisau.
  ctx.save();
  ctx.translate(s.x + s.w - 34, s.y + 30);
  ctx.rotate(0.5);
  ctx.fillStyle = '#dfe3e8'; rr(ctx, 0, 0, 34, 9, 4); ctx.fill();
  ctx.fillStyle = '#5d3a1e'; rr(ctx, -16, 1, 16, 7, 3); ctx.fill();
  ctx.restore();
  if (state.chop.item) {
    const cx = s.x + s.w / 2 - 10;
    const cy = s.y + 52;
    drawIngredient(ctx, state.chop.item, cx, cy, 24);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    rr(ctx, s.x + 20, s.y + s.h - 22, s.w - 40, 10, 5); ctx.fill();
    ctx.fillStyle = '#ffd94d';
    rr(ctx, s.x + 20, s.y + s.h - 22, (s.w - 40) * state.chop.progress, 10, 5); ctx.fill();
    text(ctx, 'MEMOTONG…', s.x + s.w / 2, s.y + s.h - 32, 12, C.ink);
  } else {
    text(ctx, 'TALENAN', s.x + s.w / 2, s.y + s.h - 18, 13, '#fff');
    drawIngredient(ctx, 'selada-potong', s.x + 40, s.y + 52, 12);
    drawIngredient(ctx, 'tomat-potong', s.x + s.w - 40, s.y + 52, 12);
  }
}

function drawStove(ctx, state) {
  const s = STATIONS.stove;
  ctx.fillStyle = C.steelDark;
  rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
  ctx.fillStyle = C.steel;
  rr(ctx, s.x + 8, s.y + 8, s.w - 16, s.h - 16, 8); ctx.fill();
  state.burners.forEach((b, i) => {
    const bx = s.x + 58 + i * 110;
    const by = s.y + 55;
    ctx.fillStyle = '#3a3f46';
    ctx.beginPath(); ctx.arc(bx, by, 40, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#22262b';
    ctx.beginPath(); ctx.arc(bx, by, 32, 0, Math.PI * 2); ctx.fill();
    if (b.item) {
      if (b.burnt) {
        ctx.fillStyle = '#1c1c1c';
        ctx.beginPath(); ctx.ellipse(bx, by, 30, 20, 0, 0, Math.PI * 2); ctx.fill();
        text(ctx, 'GOSONG!', bx, by - 46, 13, '#fff');
      } else {
        drawIngredient(ctx, 'daging-masak', bx, by, 26);
        const p = Math.min(1, b.progress);
        ctx.strokeStyle = p >= 1 ? '#ffd94d' : '#ff9d3c';
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(bx, by, 34, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
        if (p >= 1) text(ctx, 'MATANG!', bx, by - 46, 13, '#ffd94d');
      }
    } else {
      text(ctx, i === 0 ? 'API 1' : 'API 2', bx, by, 12, '#7d838d');
    }
  });
  ctx.fillStyle = 'rgba(58,42,24,0.8)';
  rr(ctx, s.x + s.w / 2 - 38, s.y + s.h - 20, 76, 18, 9); ctx.fill();
  text(ctx, 'KOMPOR', s.x + s.w / 2, s.y + s.h - 10, 12, '#fff');
}

function drawPlating(ctx, state) {
  const s = STATIONS.plating;
  ctx.fillStyle = C.wood;
  rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
  ctx.fillStyle = '#e8c890';
  rr(ctx, s.x + 10, s.y + 10, s.w - 20, s.h - 34, 8); ctx.fill();
  state.plates.forEach((plate, i) => {
    const px = s.x + 42 + i * 86;
    const py = s.y + 52;
    const ready = plate.length > 0 && state.orders.some((o) => sameNeeds(plate, o.dish.needs));
    if (i === state.activePlate) {
      ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(px, py, 40, 20, 0, 0, Math.PI * 2); ctx.stroke();
    }
    if (ready) {
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Date.now() / 180);
      ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(px, py, 44, 23, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      text(ctx, 'SIAP!', px, py - 34, 12, '#b8860b');
    }
    if (plate.length === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(px, py, 34, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d8d2c4'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(px, py, 24, 10, 0, 0, Math.PI * 2); ctx.stroke();
    } else {
      drawPlate(ctx, px, py, 34, plate);
    }
  });
  text(ctx, 'RAKIT DI SINI', s.x + s.w / 2, s.y + s.h - 14, 12, '#fff');
}

function drawServeWindow(ctx, state) {
  const s = STATIONS.serve;
  const flash = state.serveFlashMs > 0;
  const holdingReady = state.hand && typeof state.hand === 'object'
    && state.orders.some((o) => sameNeeds(state.hand.plate, o.dish.needs));
  const glow = flash || holdingReady;
  ctx.fillStyle = flash ? '#ffe9a8' : glow ? '#ffd94d' : '#8a5a33';
  rr(ctx, s.x - 10, s.y - 26, s.w + 20, 30, 8); ctx.fill();
  ctx.fillStyle = C.red;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(s.x - 10 + i * 60, s.y - 26);
    ctx.lineTo(s.x + 50 + i * 60, s.y - 26);
    ctx.lineTo(s.x + 20 + i * 60, s.y + 4);
    ctx.lineTo(s.x - 10 + i * 60, s.y + 4);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#5d3a1e';
  rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
  ctx.fillStyle = '#2b1c10';
  rr(ctx, s.x + 12, s.y + 12, s.w - 24, s.h - 40, 6); ctx.fill();
  text(ctx, 'JENDELA SAJI  •  ANTAR PESANAN', s.x + s.w / 2, s.y + 34, 15, '#ffd94d');
  text(ctx, holdingReady ? 'Piring lengkap — antar sekarang!' : 'Pelanggan menunggu di seberang…', s.x + s.w / 2, s.y + 58, 13, holdingReady ? '#ffd94d' : '#cbb59a', 'normal');
  // Bel layanan.
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath(); ctx.arc(s.x + s.w - 34, s.y + s.h - 22, 12, Math.PI, 0); ctx.fill();
  ctx.fillRect(s.x + s.w - 40, s.y + s.h - 24, 12, 4);
  if (flash) text(ctx, 'TERIMA KASIH!', s.x + s.w / 2, s.y + s.h - 18, 14, '#fff');
}

function drawTrash(ctx) {
  const s = STATIONS.trash;
  ctx.fillStyle = '#6b7280';
  rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
  ctx.fillStyle = '#4b5563';
  rr(ctx, s.x + 14, s.y + 12, s.w - 28, s.h - 34, 6); ctx.fill();
  ctx.fillStyle = '#9ca3af';
  for (let i = 0; i < 3; i++) ctx.fillRect(s.x + 26 + i * 22, s.y + 22, 8, s.h - 52);
  text(ctx, 'SAMPAH', s.x + s.w / 2, s.y + s.h - 12, 12, '#fff');
}

// --- koki --------------------------------------------------------------------

function drawChef(ctx, state) {
  const c = state.chef;
  const bob = c.moving ? Math.sin(Date.now() / 90) * 3 : 0;
  const x = c.x;
  const y = c.y + bob;
  ctx.save();
  ctx.translate(x, y);
  // Bayangan.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(0, 26, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Badan + celemek.
  ctx.fillStyle = '#ffffff';
  rr(ctx, -20, -6, 40, 34, 12); ctx.fill();
  ctx.fillStyle = '#d94f3d';
  rr(ctx, -14, 4, 28, 20, 6); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(-14, 2, 28, 4);
  // Kepala + topi koki.
  ctx.fillStyle = '#f6c89f';
  ctx.beginPath(); ctx.arc(0, -18, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-9, -32, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -36, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(9, -32, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-16, -34, 32, 8);
  // Mata melihat ke arah gerak.
  ctx.fillStyle = '#222';
  const look = c.dir === 0 ? 3 : -3;
  ctx.beginPath(); ctx.arc(-5 + look, -18, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5 + look, -18, 2, 0, Math.PI * 2); ctx.fill();
  // Barang di tangan (diangkat di atas kepala supaya terbaca).
  if (state.hand) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(0, -52, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
    let handLabel;
    if (typeof state.hand === 'object') {
      drawPlate(ctx, 0, -48, 26, state.hand.plate);
      const match = state.orders.find((o) => sameNeeds(state.hand.plate, o.dish.needs));
      handLabel = match ? match.dish.name : 'Piring Lengkap';
    } else {
      drawIngredient(ctx, state.hand, 0, -50, 17);
      handLabel = ingredientName(state.hand);
    }
    ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
    const lw = ctx.measureText(handLabel).width + 16;
    ctx.fillStyle = 'rgba(58,42,24,0.9)';
    rr(ctx, -lw / 2, -84, lw, 20, 10); ctx.fill();
    text(ctx, handLabel, 0, -74, 12, '#fff');
  }
  ctx.restore();
}

// --- HUD: papan pesanan, timer, skor ------------------------------------------

function drawOrderBoard(ctx, state) {
  const y = 8;
  const w = 228;
  const h = 128;
  for (let i = 0; i < 3; i++) {
    const x = 16 + i * (w + 8);
    const order = state.orders[i];
    ctx.fillStyle = order ? C.ticket : 'rgba(255,253,244,0.45)';
    rr(ctx, x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = order ? '#d8c9a3' : '#d8c9a3';
    ctx.lineWidth = 2; ctx.stroke();
    if (!order) {
      text(ctx, '— menunggu pesanan —', x + w / 2, y + h / 2, 13, '#b09a72', 'normal');
      continue;
    }
    const remain = orderRemainingMs(order, state.nowMs);
    const frac = remain / order.patienceMs;
    const urgent = remain < 10000;
    const pulse = urgent ? 0.6 + 0.4 * Math.sin(Date.now() / 150) : 1;
    ctx.globalAlpha = pulse;
    text(ctx, order.dish.name.toUpperCase(), x + w / 2 - 16, y + 20, 15, urgent ? C.red : C.ink);
    ctx.globalAlpha = 1;
    order.dish.needs.forEach((id, j) => {
      drawIngredient(ctx, id, x + 34 + j * 46, y + 58, 17);
    });
    text(ctx, order.dish.needs.map(ingredientName).join(' + '), x + w / 2, y + 88, 12, '#7a6a4d', 'normal');
    ctx.fillStyle = '#e8dcc0';
    rr(ctx, x + 14, y + h - 20, w - 28, 9, 4); ctx.fill();
    ctx.fillStyle = frac > 0.5 ? C.green : frac > 0.25 ? '#e8a13c' : C.red;
    rr(ctx, x + 14, y + h - 20, (w - 28) * frac, 9, 4); ctx.fill();
    text(ctx, `$${order.dish.price}`, x + w - 12, y + 20, 14, C.green, 'bold', 'right');
  }
}

function drawTimerAndScore(ctx, state) {
  const cx = 836;
  const total = 180;
  const left = Math.max(0, Math.ceil(state.timeLeftMs / 1000));
  const mm = String(Math.floor(left / 60)).padStart(1, '0');
  const ss = String(left % 60).padStart(2, '0');
  const urgent = left <= 30;
  ctx.fillStyle = 'rgba(58,42,24,0.85)';
  rr(ctx, cx - 90, 8, 180, 56, 12); ctx.fill();
  text(ctx, `${mm}:${ss}`, cx, 30, 26, urgent ? '#ff6b5e' : '#fff');
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  rr(ctx, cx - 76, 52, 152, 6, 3); ctx.fill();
  ctx.fillStyle = urgent ? '#ff6b5e' : C.gold;
  rr(ctx, cx - 76, 52, 152 * (left / total), 6, 3); ctx.fill();

  const sx = 1010;
  ctx.fillStyle = 'rgba(58,42,24,0.85)';
  rr(ctx, sx, 8, 254, 128, 12); ctx.fill();
  text(ctx, `SKOR  ${state.score.toLocaleString('en-US')}`, sx + 127, 30, 24, '#fff');
  text(ctx, `LEVEL ${state.level}   •   DISAJIKAN ${state.served}`, sx + 127, 60, 14, '#ffd94d');
  if (state.combo >= 2) {
    ctx.fillStyle = '#ff9d3c';
    rr(ctx, sx + 52, 78, 150, 30, 15); ctx.fill();
    text(ctx, `🔥 KOMBO x${state.combo}`, sx + 127, 94, 15, '#fff');
  } else {
    text(ctx, 'Sajikan beruntun untuk kombo!', sx + 127, 94, 12, '#cbb59a', 'normal');
  }
  text(ctx, `Terlewat: ${state.missed}`, sx + 127, 120, 12, '#cbb59a', 'normal');
}

function drawMessage(ctx, state) {
  if (state.messageMs <= 0 || !state.message) return;
  const a = Math.min(1, state.messageMs / 300);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(58,42,24,0.9)';
  const w = ctx.measureText(state.message).width + 60;
  rr(ctx, VIEW_W / 2 - w / 2, 668, w, 40, 20); ctx.fill();
  text(ctx, state.message, VIEW_W / 2, 689, 17, '#fff');
  ctx.restore();
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 500));
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of state.floaters) {
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life / 400));
    text(ctx, f.text, f.x, f.y, 22, f.color);
  }
  ctx.globalAlpha = 1;
}

// --- layar menu & akhir ------------------------------------------------------

function drawMenu(ctx, state) {
  ctx.fillStyle = 'rgba(40,26,10,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = C.cream;
  rr(ctx, 290, 120, 700, 470, 20); ctx.fill();
  ctx.strokeStyle = C.red; ctx.lineWidth = 4; ctx.stroke();
  text(ctx, 'DAPUR KILAT', 640, 175, 52, C.red);
  text(ctx, 'Masak cepat, sajikan tepat waktu!', 640, 222, 20, C.ink, 'normal');
  const lines = [
    '1.  Ambil bahan dari rak (klik / tombol 1–4)',
    '2.  Potong di talenan, masak daging di kompor',
    '3.  Rakit piring di meja plating sampai lengkap',
    '4.  Antar ke Jendela Saji sebelum pelanggan kabur!',
  ];
  lines.forEach((l, i) => text(ctx, l, 640, 272 + i * 34, 18, C.ink, 'normal', 'center'));
  text(ctx, 'Gerak: WASD / Panah  •  Pakai: E / Spasi / Klik  •  Suara: M', 640, 432, 15, '#7a6a4d', 'normal');
  ctx.fillStyle = C.red;
  rr(ctx, 490, 470, 300, 56, 28); ctx.fill();
  text(ctx, '▶  MULAI SHIFT (Enter)', 640, 499, 20, '#fff');
  text(ctx, 'Shift 3 menit — makin banyak disajikan, makin deras pesanannya.', 640, 556, 14, '#7a6a4d', 'normal');
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(40,26,10,0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = C.cream;
  rr(ctx, 340, 130, 600, 450, 20); ctx.fill();
  ctx.strokeStyle = C.gold; ctx.lineWidth = 4; ctx.stroke();
  text(ctx, 'SHIFT SELESAI!', 640, 180, 44, C.red);
  const stars = state.served >= 14 ? 3 : state.served >= 9 ? 2 : state.served >= 5 ? 1 : 0;
  text(ctx, '★'.repeat(stars) + '☆'.repeat(3 - stars), 640, 232, 36, '#e8a13c');
  text(ctx, `SKOR AKHIR  ${state.score.toLocaleString('en-US')}`, 640, 292, 28, C.ink);
  text(ctx, `Disajikan: ${state.served}   •   Terlewat: ${state.missed}   •   Kombo terbaik: x${state.bestCombo}`, 640, 338, 18, C.ink, 'normal');
  text(ctx, `Level tercapai: ${state.level}`, 640, 372, 18, C.ink, 'normal');
  const verdict = stars === 3 ? 'Koki bintang tiga! Dapur ini milikmu.' : stars === 2 ? 'Dapur panas, tapi kamu bertahan. Hebat!' : stars === 1 ? 'Lumayan! Latihan lagi, pelanggan menunggu.' : 'Shift berat… coba lagi, koki!';
  text(ctx, verdict, 640, 412, 17, '#7a6a4d', 'normal');
  ctx.fillStyle = C.red;
  rr(ctx, 490, 450, 300, 56, 28); ctx.fill();
  text(ctx, '↻  MAIN LAGI (Enter)', 640, 479, 20, '#fff');
}

// --- render utama --------------------------------------------------------------

export function renderGame(ctx, state, hover) {
  ctx.save();
  if (state.shakeMs > 0) {
    ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
  }
  drawFloorAndWalls(ctx);
  drawBins(ctx, state, hover);
  drawChopBoard(ctx, state);
  drawStove(ctx, state);
  drawPlating(ctx, state);
  drawServeWindow(ctx, state);
  drawTrash(ctx);
  drawChef(ctx, state);
  drawParticles(ctx, state);
  drawOrderBoard(ctx, state);
  drawTimerAndScore(ctx, state);
  drawMessage(ctx, state);
  ctx.restore();
  if (state.screen === 'menu') drawMenu(ctx, state);
  if (state.screen === 'over') drawGameOver(ctx, state);
}
