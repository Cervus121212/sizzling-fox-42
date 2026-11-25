// Dapur Kilat — shots: adegan deterministik untuk screenshot (?shot=1..4).
// Bukan gameplay acak: tiap nomor menata dapur persis seperti yang diminta bounty,
// lalu membekukan waktu supaya tangkapan layar stabil dan mudah dibaca.

import { DISHES, STATIONS } from './config.js';
import { makeOrder } from './state.js';

function dishById(id) {
  return DISHES.find((d) => d.id === id);
}

function fakeOrder(dishId, bornAt, patienceMs) {
  return { id: 900 + Math.floor(Math.random() * 90), dish: dishById(dishId), bornAt, patienceMs, flashAt: bornAt + patienceMs - 10000 };
}

// Shot 1 (cover): dapur penuh saat rush — 3 pesanan di papan, bahan di rak,
// daging di kompor, koki merakit burger di meja plating, timer 2:31, skor 1.250.
function stageRush(state) {
  state.screen = 'playing';
  state.score = 1250;
  state.served = 7;
  state.combo = 3;
  state.bestCombo = 3;
  state.level = 2;
  state.timeLeftMs = 151000;
  state.nowMs = 29000;
  state.orders = [
    fakeOrder('burger', 9000, 42000),
    fakeOrder('salad', 15000, 38000),
    fakeOrder('steak', 22000, 40000),
  ];
  state.chef.x = 1150;
  state.chef.y = 350;
  state.chef.dir = 1;
  state.hand = 'tomat-potong';
  state.plates[0] = ['roti', 'daging-masak'];
  state.activePlate = 0;
  state.burners[0] = { item: 'daging', progress: 0.6, burnt: false };
  state.chop.item = null;
  state.showMessage('PIRING SIAP — ANTAR KE JENDELA!', 60000);
  state.steam(STATIONS.stove.x + 55, STATIONS.stove.y + 30);
  state.steam(STATIONS.stove.x + 55, STATIONS.stove.y + 30);
}

// Shot 2: koki memotong tomat di talenan — pisau, potongan, progres setengah jalan.
function stageChopping(state) {
  state.screen = 'playing';
  state.score = 640;
  state.served = 3;
  state.combo = 2;
  state.bestCombo = 2;
  state.level = 1;
  state.timeLeftMs = 125000;
  state.nowMs = 55000;
  state.orders = [fakeOrder('salad', 40000, 36000)];
  state.chef.x = 700;
  state.chef.y = 320;
  state.chef.dir = 0;
  state.hand = null;
  state.chop.item = 'tomat';
  state.chop.progress = 0.55;
  state.plates[0] = ['selada-potong'];
  state.showMessage('MEMOTONG TOMAT…', 60000);
}

// Shot 3: daging mendesis di kompor — uap, cincin progres, satu tungku kosong.
function stageCooking(state) {
  state.screen = 'playing';
  state.score = 980;
  state.served = 5;
  state.combo = 2;
  state.bestCombo = 3;
  state.level = 2;
  state.timeLeftMs = 100000;
  state.nowMs = 80000;
  state.orders = [
    fakeOrder('steak', 60000, 34000),
    fakeOrder('burger', 70000, 40000),
  ];
  state.chef.x = 940;
  state.chef.y = 372;
  state.chef.dir = 0;
  state.hand = 'selada-potong';
  state.burners[0] = { item: 'daging', progress: 0.72, burnt: false };
  state.burners[1] = { item: null, progress: 0, burnt: false };
  for (let i = 0; i < 4; i++) state.steam(STATIONS.stove.x + 55, STATIONS.stove.y + 30);
  state.showMessage('DAGING HAMPIR MATANG!', 60000);
}

// Shot 4: piring burger lengkap di tangan koki di depan Jendela Saji — siap antar.
function stageReadyToServe(state) {
  state.screen = 'playing';
  state.score = 2100;
  state.served = 11;
  state.combo = 4;
  state.bestCombo = 4;
  state.level = 3;
  state.timeLeftMs = 58000;
  state.nowMs = 122000;
  state.orders = [
    fakeOrder('burger', 100000, 30000),
    fakeOrder('sandwich', 110000, 38000),
  ];
  state.chef.x = 640;
  state.chef.y = 500;
  state.chef.dir = 0;
  state.hand = { plate: ['roti', 'daging-masak', 'selada-potong'] };
  state.showMessage('BURGER KILAT SIAP — ANTAR SEKARANG!', 60000);
  state.burst(STATIONS.serve.x + 170, STATIONS.serve.y + 40, '#ffd94d', 12);
}

export function stageShot(state, n) {
  state.frozen = true;
  state.shotMode = n;
  state.floaters = [];
  state.particles = [];
  if (n === 1) stageRush(state);
  else if (n === 2) stageChopping(state);
  else if (n === 3) stageCooking(state);
  else if (n === 4) stageReadyToServe(state);
}
