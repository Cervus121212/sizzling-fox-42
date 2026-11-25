// Dapur Kilat — main: loop permainan, layar menu/bermain/selesai,
// dan mode screenshot (?shot=1..4) untuk tangkapan layar bounty.

import { VIEW_W, VIEW_H } from './config.js';
import { GameState } from './state.js';
import { KitchenAudio } from './audio.js';
import { attachInput } from './input.js';
import { renderGame } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const audio = new KitchenAudio();
const state = new GameState(audio);
// Diekspos untuk playtest otomatis (dan debugging di konsol browser).
window.__dapurKilat = state;

const params = new URLSearchParams(window.location.search);
const shot = Number(params.get('shot') || 0);
if (shot >= 1 && shot <= 4) {
  stageShot(state, shot);
  state.screen = 'playing';
}

const input = attachInput(canvas, state, audio,
  () => { audio.unlock(); state.startGame(); announce('Shift dimulai. Sajikan pesanan sebelum waktunya habis.'); },
  () => { audio.unlock(); state.startGame(); announce('Shift baru dimulai.'); },
);

function announce(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function resize() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', resize);
resize();

let last = performance.now();
let announcedOver = false;

function frame(now) {
  const dtMs = Math.min(100, now - last);
  last = now;
  input.applyKeys(dtMs);
  state.update(dtMs);
  renderGame(ctx, state, input.getHover());
  if (state.screen === 'over' && !announcedOver) {
    announcedOver = true;
    announce(`Shift selesai. Skor akhir ${state.score}, ${state.served} hidangan disajikan.`);
  }
  if (state.screen === 'playing') announcedOver = false;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
