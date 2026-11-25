// Dapur Kilat — audio: semua bunyi disintesis dengan WebAudio, tanpa file suara.
// Dipanggil hanya setelah gestur pemain (klik/tombol), jadi AudioContext selalu diizinkan.

export class KitchenAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.sizzleGain = null;
    this.sizzleOn = false;
    this.musicTimer = null;
    this.musicStep = 0;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.startSizzleBed();
    this.startMusic();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  tone(freq, dur, type = 'sine', vol = 0.2, when = 0, slideTo = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noiseBurst(dur, vol = 0.25, freq = 1800) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 0.8;
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
  }

  // Lantai desis kompor: noise loop yang gain-nya mengikuti ada/tidaknya daging dimasak.
  startSizzleBed() {
    const len = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 5200;
    filter.Q.value = 0.4;
    this.sizzleGain = this.ctx.createGain();
    this.sizzleGain.gain.value = 0;
    src.connect(filter);
    filter.connect(this.sizzleGain);
    this.sizzleGain.connect(this.master);
    src.start();
  }

  setSizzling(on) {
    if (!this.ctx || !this.sizzleGain) return;
    if (on === this.sizzleOn) return;
    this.sizzleOn = on;
    this.sizzleGain.gain.linearRampToValueAtTime(on ? 0.05 : 0, this.ctx.currentTime + 0.2);
  }

  // Musik latar ringan: bassline pizzicato sederhana, 8 langkah berulang.
  startMusic() {
    const bass = [110, 0, 131, 0, 98, 0, 147, 0];
    this.musicTimer = window.setInterval(() => {
      if (this.muted || !this.ctx) return;
      const f = bass[this.musicStep % bass.length];
      this.musicStep++;
      if (f > 0) this.tone(f, 0.22, 'triangle', 0.07);
      if (this.musicStep % 8 === 4) this.tone(330, 0.12, 'sine', 0.04);
    }, 300);
  }

  pickup() { this.tone(520, 0.08, 'sine', 0.16); this.tone(780, 0.09, 'sine', 0.12, 0.05); }
  chopHit() { this.noiseBurst(0.07, 0.3, 2400); this.tone(180, 0.06, 'square', 0.08); }
  chopDone() { this.tone(660, 0.1, 'sine', 0.15); this.tone(880, 0.12, 'sine', 0.15, 0.07); }
  place() { this.tone(300, 0.08, 'triangle', 0.18, 0, 180); }
  ding() { this.tone(1046, 0.35, 'sine', 0.2); this.tone(1568, 0.4, 'sine', 0.12, 0.08); }
  serve() {
    this.tone(523, 0.12, 'sine', 0.2);
    this.tone(659, 0.12, 'sine', 0.2, 0.1);
    this.tone(784, 0.2, 'sine', 0.22, 0.2);
    this.tone(1046, 0.3, 'sine', 0.18, 0.32);
  }
  error() { this.tone(160, 0.16, 'square', 0.12); this.tone(120, 0.2, 'square', 0.12, 0.1); }
  expire() { this.tone(392, 0.15, 'sawtooth', 0.1); this.tone(311, 0.25, 'sawtooth', 0.1, 0.12); }
  levelUp() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.16, i * 0.09));
  }
  tick() { this.tone(1200, 0.05, 'sine', 0.08); }
}
