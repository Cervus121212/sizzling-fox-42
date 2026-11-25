// Dapur Kilat — state: seluruh isi permainan (pesanan, tangan koki, kompor, piring,
// skor, kombo, timer shift) dan aturan mainnya. Tidak menggambar apa pun.

import {
  VIEW_W, VIEW_H, SHIFT_SECONDS, CHOP_SECONDS, COOK_SECONDS, BURN_SECONDS,
  INGREDIENTS, PROCESSED, DISHES, STATIONS, FLOOR, CHEF_SPEED,
  levelFor, spawnIntervalMs, patienceSeconds,
} from './config.js';

let orderSeq = 0;

export function makeOrder(level, nowMs) {
  const dish = DISHES[Math.floor(Math.random() * DISHES.length)];
  return {
    id: ++orderSeq,
    dish,
    bornAt: nowMs,
    patienceMs: patienceSeconds(level) * 1000,
    flashAt: nowMs + (patienceSeconds(level) - 10) * 1000,
  };
}

export function orderRemainingMs(order, nowMs) {
  return Math.max(0, order.bornAt + order.patienceMs - nowMs);
}

export function sameNeeds(a, b) {
  if (a.length !== b.length) return false;
  const count = (list) => {
    const m = new Map();
    for (const x of list) m.set(x, (m.get(x) ?? 0) + 1);
    return m;
  };
  const ma = count(a);
  const mb = count(b);
  if (ma.size !== mb.size) return false;
  for (const [k, v] of ma) if (mb.get(k) !== v) return false;
  return true;
}

export class GameState {
  constructor(audio) {
    this.audio = audio;
    this.screen = 'menu'; // menu | playing | over
    this.reset();
  }

  reset() {
    this.nowMs = 0;
    this.timeLeftMs = SHIFT_SECONDS * 1000;
    this.score = 0;
    this.served = 0;
    this.missed = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.level = 1;
    this.orders = [];
    this.spawnInMs = 1200;
    this.chef = { x: VIEW_W / 2, y: 520, dir: 0, moving: false, target: null, pendingAction: null };
    this.hand = null; // id bahan / hasil olahan, atau { plate: [...] } saat memegang piring
    this.chop = { item: null, progress: 0 };
    this.burners = [
      { item: null, progress: 0, burnt: false },
      { item: null, progress: 0, burnt: false },
    ];
    this.plates = [[], []]; // dua piring di meja plating; tiap piring = daftar id bahan
    this.activePlate = 0;
    this.floaters = [];
    this.particles = [];
    this.shakeMs = 0;
    this.serveFlashMs = 0;
    this.message = null;
    this.messageMs = 0;
    this.frozen = false; // mode screenshot: waktu berhenti, adegan diam
    this.shotMode = 0;
    this.lastTickSecond = -1;
  }

  startGame() {
    this.reset();
    this.screen = 'playing';
    this.spawnOrder();
  }

  spawnOrder() {
    if (this.orders.length >= 3) return;
    this.orders.push(makeOrder(this.level, this.nowMs));
  }

  levelUpCheck() {
    const next = levelFor(this.served);
    if (next > this.level) {
      this.level = next;
      this.audio.levelUp();
      this.showMessage(`LEVEL ${next} — PESANAN MAKIN DERAS!`, 2200);
    }
  }

  showMessage(text, ms = 1600) {
    this.message = text;
    this.messageMs = ms;
  }

  addFloater(x, y, text, color = '#fff') {
    this.floaters.push({ x, y, text, color, life: 1100 });
  }

  burst(x, y, color, n = 10) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 120;
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 500 + Math.random() * 400, color, r: 2 + Math.random() * 3 });
    }
  }

  steam(x, y) {
    this.particles.push({ x: x + (Math.random() - 0.5) * 30, y, vx: (Math.random() - 0.5) * 12, vy: -34 - Math.random() * 22, life: 900, color: 'rgba(255,255,255,0.75)', r: 5 + Math.random() * 5 });
  }

  // --- aksi pemain ---------------------------------------------------------

  grabIngredient(kind) {
    if (this.hand) { this.audio.error(); this.showMessage('TANGAN PENUH!'); return false; }
    if (!INGREDIENTS[kind]) return false;
    this.hand = kind;
    this.audio.pickup();
    return true;
  }

  chopStart() {
    if (!this.hand) { this.audio.error(); this.showMessage('AMBIL BAHAN DULU!'); return false; }
    const ing = INGREDIENTS[this.hand];
    if (!ing || !ing.chop) { this.audio.error(); this.showMessage('BAHAN INI TIDAK DIPOTONG'); return false; }
    if (this.chop.item) { this.audio.error(); return false; }
    this.chop.item = this.hand;
    this.chop.progress = 0;
    this.hand = null;
    this.audio.chopHit();
    return true;
  }

  stovePut() {
    if (!this.hand) {
      // Tangan kosong: ambil daging yang sudah matang dari kompor.
      const done = this.burners.find((b) => b.item === 'daging' && b.progress >= 1 && !b.burnt);
      if (done) {
        done.item = null;
        done.progress = 0;
        this.hand = 'daging-masak';
        this.audio.pickup();
        return true;
      }
      this.audio.error();
      this.showMessage('KOMPOR KOSONG / BELUM MATANG');
      return false;
    }
    if (this.hand !== 'daging') { this.audio.error(); this.showMessage('HANYA DAGING YANG DIMASAK'); return false; }
    const free = this.burners.find((b) => b.item === null);
    if (!free) { this.audio.error(); this.showMessage('KOMPOR PENUH!'); return false; }
    free.item = 'daging';
    free.progress = 0;
    free.burnt = false;
    this.hand = null;
    this.audio.place();
    return true;
  }

  plateAdd() {
    if (!this.hand) {
      // Tangan kosong: ambil piring yang sudah lengkap dari meja.
      const plate = this.plates[this.activePlate];
      if (plate.length > 0 && this.orders.some((o) => sameNeeds(plate, o.dish.needs))) {
        this.hand = { plate: [...plate] };
        this.plates[this.activePlate] = [];
        this.audio.pickup();
        return true;
      }
      this.audio.error();
      this.showMessage('PIRING BELUM LENGKAP');
      return false;
    }
    if (typeof this.hand === 'object') { this.audio.error(); return false; }
    const plate = this.plates[this.activePlate];
    // Hanya terima bahan yang memang dipakai salah satu resep yang sedang dipesan.
    const wanted = new Set(this.orders.flatMap((o) => o.dish.needs));
    if (!wanted.has(this.hand)) { this.audio.error(); this.showMessage('TIDAK ADA YANG PESAN BAHAN INI'); return false; }
    if (plate.includes(this.hand)) { this.audio.error(); this.showMessage('SUDAH ADA DI PIRING'); return false; }
    plate.push(this.hand);
    this.hand = null;
    this.audio.place();
    const done = this.orders.some((o) => sameNeeds(plate, o.dish.needs));
    if (done) {
      this.audio.ding();
      this.showMessage('PIRING SIAP — ANTAR KE JENDELA!', 1800);
    }
    return true;
  }

  serve() {
    if (!this.hand || typeof this.hand !== 'object' || !Array.isArray(this.hand.plate)) {
      this.audio.error();
      this.showMessage('BAWA PIRING LENGKAP KE SINI!');
      return false;
    }
    const idx = this.orders.findIndex((o) => sameNeeds(this.hand.plate, o.dish.needs));
    if (idx < 0) { this.audio.error(); this.showMessage('TIDAK COCOK DENGAN PESANAN'); return false; }
    const order = this.orders[idx];
    this.orders.splice(idx, 1);
    const remain = orderRemainingMs(order, this.nowMs);
    const tip = Math.round((remain / order.patienceMs) * 50);
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const mult = 1 + Math.min(4, this.combo - 1) * 0.25;
    const gained = Math.round((order.dish.price + tip) * mult);
    this.score += gained;
    this.served += 1;
    this.hand = null;
    this.serveFlashMs = 350;
    this.audio.serve();
    const wx = STATIONS.serve.x + STATIONS.serve.w / 2;
    this.addFloater(wx, STATIONS.serve.y - 14, `+${gained}`, '#ffd94d');
    if (this.combo >= 2) this.addFloater(wx, STATIONS.serve.y - 44, `KOMBO x${this.combo}!`, '#ff9d3c');
    this.burst(wx, STATIONS.serve.y + 40, '#ffd94d', 16);
    this.levelUpCheck();
    return true;
  }

  trash() {
    if (!this.hand) { this.audio.error(); return false; }
    this.hand = null;
    this.audio.place();
    this.showMessage('DIBUANG', 900);
    return true;
  }

  // Interaksi berdasarkan stasiun yang diklik / didekati.
  interact(stationId, arg) {
    if (this.screen !== 'playing' || this.frozen) return false;
    switch (stationId) {
      case 'bin': return this.grabIngredient(arg);
      case 'chop': return this.chopStart();
      case 'stove': return this.stovePut();
      case 'plating': return this.plateAdd();
      case 'serve': return this.serve();
      case 'trash': return this.trash();
      default: return false;
    }
  }

  // --- update --------------------------------------------------------------

  update(dtMs) {
    // Partikel & floater tetap bergerak walau beku (untuk screenshot yang hidup).
    for (const p of this.particles) {
      p.x += p.vx * (dtMs / 1000);
      p.y += p.vy * (dtMs / 1000);
      p.vy -= 12 * (dtMs / 1000);
      p.life -= dtMs;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const f of this.floaters) { f.y -= 34 * (dtMs / 1000); f.life -= dtMs; }
    this.floaters = this.floaters.filter((f) => f.life > 0);
    if (this.messageMs > 0) this.messageMs -= dtMs;
    if (this.serveFlashMs > 0) this.serveFlashMs -= dtMs;
    if (this.shakeMs > 0) this.shakeMs -= dtMs;
    if (this.screen !== 'playing' || this.frozen) return;

    this.nowMs += dtMs;
    this.timeLeftMs -= dtMs;

    // Koki berjalan menuju target klik.
    const c = this.chef;
    c.moving = false;
    if (c.target) {
      const dx = c.target.x - c.x;
      const dy = c.target.y - c.y;
      const d = Math.hypot(dx, dy);
      if (d < 8) {
        c.target = null;
        if (c.pendingAction) {
          const a = c.pendingAction;
          c.pendingAction = null;
          this.interact(a.station, a.arg);
        }
      } else {
        c.dir = dx >= 0 ? 0 : 1;
        c.moving = true;
        const step = (CHEF_SPEED * dtMs) / 1000;
        c.x += (dx / d) * step;
        c.y += (dy / d) * step;
      }
    }
    c.x = Math.max(FLOOR.x + 20, Math.min(FLOOR.x + FLOOR.w - 20, c.x));
    c.y = Math.max(FLOOR.y + 20, Math.min(FLOOR.y + FLOOR.h - 20, c.y));

    // Memotong: progres jalan sendiri, lalu hasil potongan kembali ke tangan.
    if (this.chop.item) {
      this.chop.progress += dtMs / (CHOP_SECONDS * 1000);
      if (Math.floor(this.chop.progress * 4) !== Math.floor((this.chop.progress - dtMs / (CHOP_SECONDS * 1000)) * 4)) this.audio.chopHit();
      if (this.chop.progress >= 1) {
        const done = `${this.chop.item}-potong`;
        this.chop.item = null;
        this.chop.progress = 0;
        if (!this.hand) {
          this.hand = done;
          this.audio.chopDone();
          this.burst(STATIONS.chop.x + 95, STATIONS.chop.y + 55, '#7ed957', 8);
        }
      }
    }

    // Kompor: masak lalu gosong kalau dibiarkan.
    let anyCooking = false;
    for (const b of this.burners) {
      if (!b.item) continue;
      anyCooking = true;
      b.progress += dtMs / (COOK_SECONDS * 1000);
      if (b.progress >= 1 && !b.burnt) {
        b.progress = 1;
        b.burnt = (b.burntMs ?? 0) + dtMs > BURN_SECONDS * 1000 ? true : b.burnt;
        b.burntMs = (b.burntMs ?? 0) + dtMs;
        if (b.burnt) { this.showMessage('DAGING GOSONG! BUANG!'); this.audio.expire(); }
      }
      if (b.item && b.progress < 1 && Math.random() < dtMs / 260) {
        this.steam(STATIONS.stove.x + 55 + (this.burners.indexOf(b) * 110), STATIONS.stove.y + 30);
      }
    }
    this.audio.setSizzling(anyCooking);

    // Pesanan baru & pesanan kedaluwarsa.
    this.spawnInMs -= dtMs;
    if (this.spawnInMs <= 0) {
      this.spawnOrder();
      this.spawnInMs = spawnIntervalMs(this.level);
    }
    for (let i = this.orders.length - 1; i >= 0; i--) {
      const o = this.orders[i];
      const remain = orderRemainingMs(o, this.nowMs);
      if (remain <= 0) {
        this.orders.splice(i, 1);
        this.missed += 1;
        this.combo = 0;
        this.shakeMs = 300;
        this.audio.expire();
        this.showMessage(`${o.dish.name.toUpperCase()} KEDALUWARSA!`, 1800);
      }
    }

    // Detik terakhir tiap 10 detik: bunyi tick saat ada pesanan hampir habis.
    const sec = Math.ceil(this.timeLeftMs / 1000);
    if (sec !== this.lastTickSecond) {
      this.lastTickSecond = sec;
      if (sec <= 10 && sec > 0) this.audio.tick();
    }

    if (this.timeLeftMs <= 0) {
      this.timeLeftMs = 0;
      this.screen = 'over';
      this.audio.setSizzling(false);
      this.audio.ding();
    }
  }
}
