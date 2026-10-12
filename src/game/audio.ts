import type {Theme} from '@/game/levels';

export type SfxName =
  | 'jump'
  | 'highjump'
  | 'coin'
  | 'powerup'
  | 'stomp'
  | 'fireball'
  | 'hurt'
  | 'gameover'
  | 'checkpoint'
  | 'flag'
  | 'bosshit'
  | 'bossdefeat';

const MUSIC_KEY = 'bitquest.muted';

// Original chiptune loops (16 eighth-note steps per bar pair).
type Track = {melody: (number | 0)[]; bass: (number | 0)[]; tempo: number; wave: OscillatorType};

const n = (semitonesFromA4: number) => 440 * Math.pow(2, semitonesFromA4 / 12);
// Helper: note name -> semitones from A4 (e.g. C5 = 3, E5 = 7, A4 = 0, C4 = -9).
const N = (name: string): number => {
  const names: Record<string, number> = {C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2};
  const letter = name[0];
  const sharp = name[1] === '#';
  const octave = Number(name[name.length - 1]);
  return names[letter] + (sharp ? 1 : 0) + (octave - 4) * 12;
};

const TRACKS: Record<Theme, Track> = {
  grass: {
    tempo: 138,
    wave: 'square',
    melody: [
      N('E5'), N('E5'), 0, N('E5'), 0, N('C5'), N('E5'), 0,
      N('G5'), 0, 0, 0, N('G4'), 0, 0, 0,
      N('C5'), 0, N('G4'), 0, N('E4'), 0, 0, N('A4'),
      N('B4'), N('A#4'), N('A4'), 0, N('G4'), N('E5'), N('G5'), N('A5'),
    ],
    bass: [
      N('C3'), 0, N('C3'), 0, N('G2'), 0, N('C3'), 0,
      N('E3'), 0, N('E3'), 0, N('G2'), 0, N('G2'), 0,
      N('C3'), 0, N('C3'), 0, N('G2'), 0, N('C3'), 0,
      N('F3'), 0, N('F3'), 0, N('G3'), 0, N('G2'), 0,
    ],
  },
  cave: {
    tempo: 104,
    wave: 'triangle',
    melody: [
      N('A4'), 0, N('C5'), 0, N('E5'), 0, N('D5'), 0,
      N('C5'), 0, N('A4'), 0, 0, 0, 0, 0,
      N('F4'), 0, N('A4'), 0, N('C5'), 0, N('B4'), 0,
      N('A4'), 0, N('G4'), 0, 0, 0, 0, 0,
    ],
    bass: [
      N('A2'), 0, 0, 0, N('A2'), 0, 0, 0,
      N('F2'), 0, 0, 0, N('F2'), 0, 0, 0,
      N('D3'), 0, 0, 0, N('D3'), 0, 0, 0,
      N('E3'), 0, 0, 0, N('E2'), 0, 0, 0,
    ],
  },
  castle: {
    tempo: 150,
    wave: 'sawtooth',
    melody: [
      N('E4'), N('F4'), N('E4'), N('D#4'), N('E4'), N('F#4'), N('E4'), N('D#4'),
      N('E4'), N('G4'), N('E4'), N('C4'), N('E4'), N('G#4'), N('E4'), N('B3'),
      N('C4'), N('D4'), N('C4'), N('B3'), N('C4'), N('D#4'), N('C4'), N('B3'),
      N('C4'), N('E4'), N('C4'), N('G3'), N('C4'), N('F#4'), N('C4'), N('A3'),
    ],
    bass: [
      N('E2'), N('E2'), N('E2'), 0, N('E2'), N('E2'), N('E2'), 0,
      N('C2'), N('C2'), N('C2'), 0, N('D2'), N('D2'), N('D2'), 0,
      N('C2'), N('C2'), N('C2'), 0, N('C2'), N('C2'), N('C2'), 0,
      N('A1'), N('A1'), N('A1'), 0, N('B1'), N('B1'), N('B1'), 0,
    ],
  },
  sky: {
    tempo: 126,
    wave: 'square',
    melody: [
      N('G5'), 0, N('E5'), 0, N('C5'), 0, N('E5'), 0,
      N('G5'), 0, N('A5'), 0, N('G5'), 0, 0, 0,
      N('F5'), 0, N('D5'), 0, N('B4'), 0, N('D5'), 0,
      N('F5'), 0, N('G5'), 0, N('F5'), 0, 0, 0,
    ],
    bass: [
      N('C3'), 0, N('G2'), 0, N('C3'), 0, N('G2'), 0,
      N('A2'), 0, N('E2'), 0, N('A2'), 0, N('E2'), 0,
      N('F2'), 0, N('C3'), 0, N('F2'), 0, N('C3'), 0,
      N('G2'), 0, N('D3'), 0, N('G2'), 0, N('G2'), 0,
    ],
  },
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private schedulerId: number | null = null;
  private currentTheme: Theme | null = null;
  private step = 0;
  private nextNoteTime = 0;
  muted = false;

  constructor() {
    try {
      this.muted = localStorage.getItem(MUSIC_KEY) === '1';
    } catch {
      /* storage unavailable */
    }
  }

  // Must be called from a user gesture the first time (autoplay policies).
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext || (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.5;
    this.musicGain.connect(this.master);
    // Pre-render a white-noise buffer for percussion / fireball sounds.
    const len = this.ctx.sampleRate * 0.5;
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    try {
      localStorage.setItem(MUSIC_KEY, muted ? '1' : '0');
    } catch {
      /* storage unavailable */
    }
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.02);
    }
  }

  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // -------------------------------------------------------------------------
  // Sound effects
  // -------------------------------------------------------------------------
  sfx(name: SfxName) {
    if (!this.ctx || !this.master || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const tone = (freq: number, endFreq: number, dur: number, wave: OscillatorType, vol: number, start = 0) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, t + start);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t + start + dur);
      gain.gain.setValueAtTime(vol, t + start);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
      osc.connect(gain).connect(this.master!);
      osc.start(t + start);
      osc.stop(t + start + dur + 0.02);
    };
    const noise = (dur: number, vol: number, start = 0, freq = 1200) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq, t + start);
      filter.frequency.exponentialRampToValueAtTime(80, t + start + dur);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, t + start);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
      src.connect(filter).connect(gain).connect(this.master!);
      src.start(t + start);
      src.stop(t + start + dur + 0.02);
    };
    switch (name) {
      case 'jump':
        tone(260, 660, 0.16, 'square', 0.14);
        break;
      case 'highjump':
        tone(320, 990, 0.28, 'square', 0.14);
        break;
      case 'coin':
        tone(n(N('B5')), n(N('B5')), 0.08, 'square', 0.12);
        tone(n(N('E6')), n(N('E6')), 0.35, 'square', 0.12, 0.08);
        break;
      case 'powerup':
        [0, 4, 7, 12, 16, 19].forEach((s, i) => tone(n(N('C5') + s), n(N('C5') + s), 0.1, 'square', 0.1, i * 0.07));
        break;
      case 'stomp':
        tone(280, 60, 0.18, 'square', 0.16);
        noise(0.12, 0.14);
        break;
      case 'fireball':
        noise(0.2, 0.16, 0, 2400);
        tone(560, 120, 0.2, 'sawtooth', 0.08);
        break;
      case 'hurt':
        tone(340, 110, 0.32, 'sawtooth', 0.14);
        break;
      case 'gameover':
        [N('G4'), N('E4'), N('C4'), N('G3')].forEach((f, i) => tone(n(f), n(f), 0.28, 'square', 0.12, i * 0.22));
        break;
      case 'checkpoint':
        [N('C5'), N('E5'), N('G5')].forEach((f, i) => tone(n(f), n(f), 0.14, 'square', 0.1, i * 0.09));
        break;
      case 'flag':
        [0, 4, 7, 12, 7, 12, 16].forEach((s, i) => tone(n(N('C5') + s), n(N('C5') + s), 0.12, 'square', 0.1, i * 0.1));
        break;
      case 'bosshit':
        tone(160, 50, 0.22, 'sawtooth', 0.16);
        noise(0.15, 0.12);
        break;
      case 'bossdefeat':
        [N('C4'), N('G3'), N('E3'), N('C3')].forEach((f, i) => {
          tone(n(f), n(f), 0.3, 'square', 0.12, i * 0.18);
          noise(0.3, 0.1, i * 0.18, 700);
        });
        break;
    }
  }

  // -------------------------------------------------------------------------
  // Background music (lookahead step sequencer)
  // -------------------------------------------------------------------------
  startBgm(theme: Theme) {
    this.ensure();
    if (!this.ctx || !this.musicGain) return;
    if (this.currentTheme === theme && this.schedulerId !== null) return;
    this.stopBgm();
    this.currentTheme = theme;
    this.step = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.08;
    const track = TRACKS[theme] ?? TRACKS.grass;
    const stepDur = 60 / track.tempo / 2; // eighth notes

    const scheduleStep = (stepIdx: number, when: number) => {
      const ctx = this.ctx!;
      const play = (freq: number, wave: OscillatorType, dur: number, vol: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(freq, when);
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.linearRampToValueAtTime(vol, when + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
        osc.connect(gain).connect(this.musicGain!);
        osc.start(when);
        osc.stop(when + dur + 0.02);
      };
      const mel = track.melody[stepIdx % track.melody.length];
      if (mel) play(n(mel), track.wave, stepDur * 0.9, 0.055);
      const bass = track.bass[stepIdx % track.bass.length];
      if (bass) play(n(bass), 'triangle', stepDur * 0.95, 0.09);
    };

    this.schedulerId = window.setInterval(() => {
      if (!this.ctx) return;
      while (this.nextNoteTime < this.ctx.currentTime + 0.3) {
        scheduleStep(this.step, this.nextNoteTime);
        this.step++;
        this.nextNoteTime += stepDur;
      }
    }, 120);
  }

  stopBgm() {
    if (this.schedulerId !== null) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
    this.currentTheme = null;
  }
}

export const audio = new AudioEngine();
