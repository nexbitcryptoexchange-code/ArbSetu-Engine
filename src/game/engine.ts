import {LEVEL_BUILDERS, LEVEL_COUNT, ROWS, TILE, type LevelData, type Theme} from '@/game/levels';
import {audio} from '@/game/audio';
import {HAPTICS, ParticlePool, haptic} from '@/game/fx';
import type {GameConfig} from '@/types';

export const VIEW_W = 960;
export const VIEW_H = ROWS * TILE; // 544

export interface HudState {
  score: number;
  coins: number;
  lives: number;
  level: number;
  timeLeft: number;
  power: 'small' | 'big' | 'fire' | 'star';
}

export interface RunResult {
  outcome: 'won' | 'game-over';
  score: number;
  coins: number;
  level: number;
  levelsUnlocked: number;
  durationSec: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  down: boolean;
  jumpHeld: boolean;
  attackHeld: boolean;
}

type EntityKind = 'goomba' | 'mushroom' | 'flower' | 'star' | 'coinpop' | 'squash' | 'fireball' | 'boss';

type Entity = {
  type: EntityKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  timer: number;
  dead?: boolean;
  emerging?: number;
  hp?: number;
  flash?: number;
};

const SOLID = new Set(['#', 'B', '?', 'M', 'S', 'I', 'U', 'p', '=']);
const FRAMES_PER_SEC = 60;
const MAX_FALL = 15;
const MAX_FIREBALLS = 2;
const RUN_MULTIPLIER = 1.45;

function isSolidTile(ch: string) {
  return SOLID.has(ch);
}

export class MarioGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: GameConfig;
  private onHud: (hud: HudState) => void;
  private onExit: (result: RunResult) => void;
  private onGameOverPrompt: () => void;

  private raf = 0;
  private lastTime = 0;
  private acc = 0;
  private frames = 0;
  private simFrame = 0;
  private running = false;
  private destroyed = false;
  private paused = false;

  private level!: LevelData;
  private levelIndex = 0;
  private flagX = -1;
  private bumps = new Map<string, number>(); // block bounce animation offsets
  private checkpoints = new Map<number, {px: number; py: number; tx: number; ty: number}>();
  private particles = new ParticlePool(420);

  // Player state
  private px = 64;
  private py = 0;
  private pvx = 0;
  private pvy = 0;
  private big = false;
  private fire = false;
  private starTimer = 0;
  private invulnTimer = 0;
  private onGround = false;
  private crouching = false;
  private facing: 1 | -1 = 1;
  private jumpUsed = false;
  private lastJumpPressAt = 0;
  private animTimer = 0;

  // Run state
  private score = 0;
  private coins = 0;
  private lives = 3;
  private timeLeft = 300;
  private startedAt = Date.now();
  private levelsUnlocked = 1;
  private exiting = false;

  private entities: Entity[] = [];
  input: InputState = {left: false, right: false, down: false, jumpHeld: false, attackHeld: false};

  // Cached background gradients (rebuilt per level theme)
  private skyGrad: CanvasGradient | null = null;
  private skyGradTheme: Theme | null = null;
  private dustMotes = Array.from({length: 34}, (_, i) => ({
    x: (i * 137) % VIEW_W,
    y: (i * 91) % VIEW_H,
    spd: 0.12 + ((i * 7) % 10) / 40,
    size: 1 + (i % 3),
    alpha: 0.12 + ((i * 13) % 10) / 45,
    phase: i,
  }));
  private tileSpriteCache = new Map<string, HTMLCanvasElement>();

  private keyHandler: (e: KeyboardEvent) => void;

  constructor(opts: {
    canvas: HTMLCanvasElement;
    config: GameConfig;
    onHud: (hud: HudState) => void;
    onExit: (result: RunResult) => void;
    onGameOverPrompt?: () => void;
    startLevel?: number;
  }) {
    this.canvas = opts.canvas;
    const ctx = opts.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.config = opts.config;
    this.onHud = opts.onHud;
    this.onExit = opts.onExit;
    this.onGameOverPrompt = opts.onGameOverPrompt ?? (() => this.finish('game-over'));

    this.lives = opts.config.initialLives;
    this.timeLeft = opts.config.timeLimitSec;
    this.loadLevel(opts.startLevel ?? 0);
    this.resetPlayer();

    this.keyHandler = (e: KeyboardEvent) => this.onKey(e);
    window.addEventListener('keydown', this.keyHandler);
    window.addEventListener('keyup', this.keyHandler);
  }

  start() {
    if (this.running || this.destroyed) return;
    this.running = true;
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  destroy() {
    this.destroyed = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.keyHandler);
    window.removeEventListener('keyup', this.keyHandler);
    audio.stopBgm();
  }

  // Called by the touch Jump button (and keyboard jump uses the same path).
  pressJump() {
    audio.ensure();
    const now = performance.now();
    const isDoubleTap = now - this.lastJumpPressAt < 280;
    this.lastJumpPressAt = now;
    this.input.jumpHeld = true;

    if (this.paused) return;
    if (this.onGround) {
      this.pvy = -this.config.jumpVelocity;
      this.onGround = false;
      this.jumpUsed = false;
      audio.sfx('jump');
      haptic(HAPTICS.jump);
      this.puffDust(this.px + this.playerW / 2, this.py + this.playerH);
    } else if (isDoubleTap && !this.jumpUsed) {
      // Rapid double-tap = mid-air second jump
      this.pvy = -this.config.jumpVelocity * 0.9;
      this.jumpUsed = true;
      audio.sfx('highjump');
      haptic(HAPTICS.doubleJump);
      this.particles.burst(this.px + this.playerW / 2, this.py + this.playerH, 8, ['#ffffff', '#cfe8ff'], 2, {gravity: 0.1, life: 22, size: 2});
    }
  }

  releaseJump() {
    this.input.jumpHeld = false;
  }

  // Attack button / key: throw a fireball (with Fire Flower) — also runs while held.
  pressAttack() {
    audio.ensure();
    this.input.attackHeld = true;
    if (this.paused || this.exiting) return;
    if (this.fire) {
      const active = this.entities.reduce((n, e) => n + (e.type === 'fireball' && !e.dead ? 1 : 0), 0);
      if (active < MAX_FIREBALLS) {
        const fx = this.facing === 1 ? this.px + this.playerW : this.px - 14;
        this.entities.push({type: 'fireball', x: fx, y: this.py + this.playerH / 2 - 7, vx: this.facing * 7, vy: 2, w: 14, h: 14, timer: 180});
        audio.sfx('fireball');
        haptic(HAPTICS.fireball);
      }
    }
  }

  releaseAttack() {
    this.input.attackHeld = false;
  }

  private onKey(e: KeyboardEvent) {
    const down = e.type === 'keydown';
    switch (e.code) {
      case 'ArrowLeft':
        this.input.left = down;
        e.preventDefault();
        break;
      case 'ArrowRight':
        this.input.right = down;
        e.preventDefault();
        break;
      case 'ArrowDown':
        this.input.down = down;
        e.preventDefault();
        break;
      case 'ArrowUp':
      case 'Space':
      case 'KeyW':
      case 'KeyZ':
        if (down && !e.repeat) this.pressJump();
        if (!down) this.releaseJump();
        e.preventDefault();
        break;
      case 'KeyX':
      case 'KeyL':
        if (down && !e.repeat) this.pressAttack();
        if (down) this.input.attackHeld = true;
        if (!down) this.releaseAttack();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        if (down) this.input.attackHeld = true;
        if (!down) this.releaseAttack();
        break;
    }
  }

  // -------------------------------------------------------------------------
  // Level loading
  // -------------------------------------------------------------------------
  private loadLevel(index: number) {
    this.levelIndex = index;
    this.level = LEVEL_BUILDERS[index]();
    this.flagX = -1;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < this.level.width; x++) {
        if (this.level.grid[y][x] === 'F') this.flagX = x;
      }
    }
    this.entities = this.level.goombas.map((g) => ({
      type: 'goomba' as const,
      x: g.x * TILE,
      y: g.y * TILE,
      vx: -this.config.goombaSpeed,
      vy: 0,
      w: 26,
      h: 26,
      timer: 0,
    }));
    if (this.level.boss) {
      this.entities.push({
        type: 'boss',
        x: this.level.boss.x * TILE,
        y: this.level.boss.y * TILE,
        vx: -1.1,
        vy: 0,
        w: 52,
        h: 44,
        timer: 0,
        hp: 5,
        flash: 0,
      });
    }
    this.timeLeft = this.config.timeLimitSec;
    this.bumps.clear();
    this.particles.clear();
    // Restore the activated-checkpoint visual when the grid is rebuilt.
    const cp = this.checkpoints.get(index);
    if (cp) this.level.grid[cp.ty][cp.tx] = 'k';
    this.skyGrad = null;
    this.skyGradTheme = null;
    audio.startBgm(this.level.theme);
  }

  private resetPlayer() {
    const cp = this.checkpoints.get(this.levelIndex);
    this.px = cp ? cp.px : this.level.spawn.x * TILE;
    this.py = cp ? cp.py : this.level.spawn.y * TILE;
    this.pvx = 0;
    this.pvy = 0;
    this.onGround = false;
    this.jumpUsed = false;
  }

  private get playerH() {
    return this.big ? 42 : 28;
  }

  private get playerW() {
    return 24;
  }

  // -------------------------------------------------------------------------
  // Main loop (fixed 60 Hz simulation, rAF-driven rendering)
  // -------------------------------------------------------------------------
  private tick = (t: number) => {
    if (!this.running) return;
    const delta = Math.min(t - this.lastTime, 100);
    this.lastTime = t;
    this.acc += delta;
    const step = 1000 / FRAMES_PER_SEC;
    while (this.acc >= step) {
      this.update();
      this.acc -= step;
    }
    this.render();
    if (this.frames++ % 6 === 0) this.pushHud();
    this.raf = requestAnimationFrame(this.tick);
  };

  private pushHud() {
    this.onHud({
      score: this.score,
      coins: this.coins,
      lives: this.lives,
      level: this.levelIndex + 1,
      timeLeft: Math.max(0, Math.ceil(this.timeLeft)),
      power: this.starTimer > 0 ? 'star' : this.fire ? 'fire' : this.big ? 'big' : 'small',
    });
  }

  private update() {
    if (this.exiting || this.paused) return;
    this.animTimer++;
    this.simFrame++;

    // Timer
    if (this.simFrame % FRAMES_PER_SEC === 0) {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.loseLife();
        return;
      }
    }

    this.updatePlayer();
    this.updateEntities();
    this.checkFlag();
    this.particles.update();

    for (const [k, v] of this.bumps) {
      if (v <= 1) this.bumps.delete(k);
      else this.bumps.set(k, v - 2);
    }

    if (this.starTimer > 0) this.starTimer--;
    if (this.invulnTimer > 0) this.invulnTimer--;
  }

  private updatePlayer() {
    const speed = this.config.playerSpeed * (this.input.attackHeld ? RUN_MULTIPLIER : 1);
    const crouch = this.input.down && this.onGround;
    this.crouching = crouch;

    // Horizontal movement
    if (this.input.left && !crouch) {
      this.pvx = -speed;
      this.facing = -1;
    } else if (this.input.right && !crouch) {
      this.pvx = speed;
      this.facing = 1;
    } else {
      this.pvx *= 0.7;
      if (Math.abs(this.pvx) < 0.1) this.pvx = 0;
    }

    // Variable jump: reduced gravity while jump is held and still rising
    const gravity = this.config.gravity * (this.pvy < 0 && this.input.jumpHeld ? 0.55 : 1);
    this.pvy = Math.min(this.pvy + gravity, MAX_FALL);

    // Horizontal collision
    this.px += this.pvx;
    this.collideX();

    // Vertical collision
    this.py += this.pvy;
    this.collideY();

    if (this.px < 0) {
      this.px = 0;
      this.pvx = 0;
    }
    const maxPx = this.level.width * TILE - this.playerW;
    if (this.px > maxPx) this.px = maxPx;

    // Fell into a pit
    if (this.py > VIEW_H + 80) this.loseLife();

    // Collect loose coins, activate checkpoints
    this.collectCoins();
    this.checkCheckpoints();

    // Running dust
    if (this.onGround && Math.abs(this.pvx) > this.config.playerSpeed && this.simFrame % 5 === 0) {
      this.puffDust(this.px + this.playerW / 2, this.py + this.playerH);
    }
  }

  private tileAt(tx: number, ty: number): string {
    if (ty < 0 || ty >= ROWS) return '.';
    if (tx < 0 || tx >= this.level.width) return '#'; // level edges are walls
    return this.level.grid[ty][tx];
  }

  private collideX() {
    const h = this.playerH;
    const y0 = Math.floor(this.py / TILE);
    const y1 = Math.floor((this.py + h - 1) / TILE);
    if (this.pvx > 0) {
      const tx = Math.floor((this.px + this.playerW - 1) / TILE);
      for (let ty = y0; ty <= y1; ty++) {
        if (isSolidTile(this.tileAt(tx, ty))) {
          this.px = tx * TILE - this.playerW;
          this.pvx = 0;
          break;
        }
      }
    } else if (this.pvx < 0) {
      const tx = Math.floor(this.px / TILE);
      for (let ty = y0; ty <= y1; ty++) {
        if (isSolidTile(this.tileAt(tx, ty))) {
          this.px = (tx + 1) * TILE;
          this.pvx = 0;
          break;
        }
      }
    }
  }

  private collideY() {
    const w = this.playerW;
    const x0 = Math.floor(this.px / TILE);
    const x1 = Math.floor((this.px + w - 1) / TILE);
    if (this.pvy > 0) {
      const ty = Math.floor((this.py + this.playerH) / TILE);
      for (let tx = x0; tx <= x1; tx++) {
        if (isSolidTile(this.tileAt(tx, ty))) {
          if (!this.onGround && this.pvy > 8) {
            this.puffDust(this.px + w / 2, ty * TILE);
          }
          this.py = ty * TILE - this.playerH;
          this.pvy = 0;
          this.onGround = true;
          this.jumpUsed = false;
          return;
        }
      }
      this.onGround = false;
    } else if (this.pvy < 0) {
      const ty = Math.floor(this.py / TILE);
      for (let tx = x0; tx <= x1; tx++) {
        if (isSolidTile(this.tileAt(tx, ty))) {
          this.py = (ty + 1) * TILE;
          this.pvy = 0;
          this.bumpBlock(tx, ty);
          return;
        }
      }
    }
  }

  private bumpBlock(tx: number, ty: number) {
    const ch = this.tileAt(tx, ty);
    const key = `${tx},${ty}`;
    if (ch === '?' || ch === 'M' || ch === 'S' || ch === 'I') {
      this.level.grid[ty][tx] = 'U';
      this.bumps.set(key, 8);
      if (ch === '?') {
        this.coins += 1;
        this.score += this.config.coinPoints;
        this.entities.push({type: 'coinpop', x: tx * TILE + 4, y: ty * TILE - 20, vx: 0, vy: -9, w: 24, h: 24, timer: 40});
        audio.sfx('coin');
        haptic(HAPTICS.coin);
        this.particles.burst(tx * TILE + TILE / 2, ty * TILE, 10, ['#fbd000', '#fff350', '#ffffff'], 2.6, {gravity: 0.22, life: 26, size: 3});
      } else {
        const type: EntityKind = ch === 'M' ? 'mushroom' : ch === 'I' ? 'flower' : 'star';
        this.entities.push({type, x: tx * TILE + 4, y: ty * TILE, vx: type === 'mushroom' ? 1.6 : type === 'star' ? 2 : 0, vy: -2, w: 26, h: 26, timer: 0, emerging: 26});
        audio.sfx('powerup');
      }
    } else if (ch === 'B') {
      if (this.big) {
        this.level.grid[ty][tx] = '.';
        this.score += 50;
        this.bumps.set(key, 6);
        audio.sfx('stomp');
        this.particles.burst(tx * TILE + TILE / 2, ty * TILE + TILE / 2, 14, ['#c84c0c', '#8a3a08', '#e07438'], 3.4, {gravity: 0.42, life: 34, size: 4});
      } else {
        this.bumps.set(key, 8);
      }
    }
  }

  private collectCoins() {
    const cx0 = Math.floor(this.px / TILE);
    const cx1 = Math.floor((this.px + this.playerW - 1) / TILE);
    const cy0 = Math.floor(this.py / TILE);
    const cy1 = Math.floor((this.py + this.playerH - 1) / TILE);
    for (let ty = cy0; ty <= cy1; ty++) {
      for (let tx = cx0; tx <= cx1; tx++) {
        if (this.tileAt(tx, ty) === 'C') {
          this.level.grid[ty][tx] = '.';
          this.coins += 1;
          this.score += this.config.coinPoints;
          audio.sfx('coin');
          haptic(HAPTICS.coin);
          this.particles.burst(tx * TILE + TILE / 2, ty * TILE + TILE / 2, 8, ['#fbd000', '#fff350'], 2.4, {gravity: 0.15, life: 24, size: 3});
        }
      }
    }
  }

  private checkCheckpoints() {
    if (this.checkpoints.has(this.levelIndex)) return; // already activated this level
    const cx0 = Math.floor(this.px / TILE);
    const cx1 = Math.floor((this.px + this.playerW - 1) / TILE);
    const cy0 = Math.floor(this.py / TILE);
    const cy1 = Math.floor((this.py + this.playerH - 1) / TILE);
    for (let ty = cy0; ty <= cy1; ty++) {
      for (let tx = cx0; tx <= cx1; tx++) {
        if (this.tileAt(tx, ty) === 'K') {
          this.level.grid[ty][tx] = 'k';
          this.checkpoints.set(this.levelIndex, {px: this.px, py: this.py, tx, ty});
          audio.sfx('checkpoint');
          haptic(HAPTICS.checkpoint);
          this.particles.burst(tx * TILE + TILE / 2, ty * TILE + TILE / 2, 16, ['#4cd7f6', '#ffffff', '#fbd000'], 3, {gravity: 0.08, life: 40, size: 3});
        }
      }
    }
  }

  private updateEntities() {
    for (const e of this.entities) {
      if (e.dead) continue;
      if (e.type === 'coinpop') {
        e.vy += 0.6;
        e.y += e.vy;
        e.timer--;
        if (e.timer <= 0) e.dead = true;
        continue;
      }
      if (e.type === 'squash') {
        e.timer--;
        if (e.timer <= 0) e.dead = true;
        continue;
      }
      if (e.type === 'fireball') {
        this.updateFireball(e);
        continue;
      }
      if (e.emerging && e.emerging > 0) {
        e.emerging -= 0.5;
        e.y -= 0.5;
        continue;
      }

      const gravity = e.type === 'star' ? this.config.gravity * 0.6 : this.config.gravity;
      e.vy = Math.min(e.vy + gravity, MAX_FALL);

      // Horizontal
      e.x += e.vx;
      {
        const y0 = Math.floor(e.y / TILE);
        const y1 = Math.floor((e.y + e.h - 1) / TILE);
        if (e.vx > 0) {
          const tx = Math.floor((e.x + e.w - 1) / TILE);
          for (let ty = y0; ty <= y1; ty++) {
            if (isSolidTile(this.tileAt(tx, ty))) {
              e.x = tx * TILE - e.w;
              e.vx = -Math.abs(e.vx);
              break;
            }
          }
        } else if (e.vx < 0) {
          const tx = Math.floor(e.x / TILE);
          for (let ty = y0; ty <= y1; ty++) {
            if (isSolidTile(this.tileAt(tx, ty))) {
              e.x = (tx + 1) * TILE;
              e.vx = Math.abs(e.vx);
              break;
            }
          }
        }
      }

      // Vertical
      e.y += e.vy;
      {
        const x0 = Math.floor(e.x / TILE);
        const x1 = Math.floor((e.x + e.w - 1) / TILE);
        if (e.vy > 0) {
          const ty = Math.floor((e.y + e.h) / TILE);
          for (let tx = x0; tx <= x1; tx++) {
            if (isSolidTile(this.tileAt(tx, ty))) {
              e.y = ty * TILE - e.h;
              e.vy = e.type === 'star' ? -9 : 0;
              break;
            }
          }
        }
      }

      if (e.y > VIEW_H + 100) {
        e.dead = true;
        continue;
      }

      if (e.type === 'goomba' || e.type === 'mushroom' || e.type === 'star' || e.type === 'flower' || e.type === 'boss') {
        this.playerEntityCollision(e);
      }
      if (e.flash && e.flash > 0) e.flash--;
    }
    this.entities = this.entities.filter((e) => !e.dead);
  }

  private updateFireball(e: Entity) {
    e.vy = Math.min(e.vy + this.config.gravity * 0.45, 10);
    e.x += e.vx;
    e.y += e.vy;
    e.timer--;

    // Wall hit
    const tx = Math.floor((e.vx > 0 ? e.x + e.w : e.x) / TILE);
    const ty0 = Math.floor(e.y / TILE);
    const ty1 = Math.floor((e.y + e.h - 1) / TILE);
    for (let ty = ty0; ty <= ty1; ty++) {
      if (isSolidTile(this.tileAt(tx, ty))) {
        this.explodeFireball(e);
        return;
      }
    }

    // Ground bounce
    if (e.vy > 0) {
      const gty = Math.floor((e.y + e.h) / TILE);
      for (let tx = Math.floor(e.x / TILE); tx <= Math.floor((e.x + e.w - 1) / TILE); tx++) {
        if (isSolidTile(this.tileAt(tx, gty))) {
          e.y = gty * TILE - e.h;
          e.vy = -4.5;
          break;
        }
      }
    }

    if (e.timer <= 0 || e.y > VIEW_H + 60) {
      e.dead = true;
      return;
    }

    // Enemy hits
    for (const other of this.entities) {
      if (other.dead || other === e) continue;
      if (other.type !== 'goomba' && other.type !== 'boss') continue;
      if (e.x + e.w <= other.x || e.x >= other.x + other.w || e.y + e.h <= other.y || e.y >= other.y + other.h) continue;
      this.explodeFireball(e);
      if (other.type === 'goomba') {
        other.dead = true;
        this.score += this.config.goombaStompPoints;
        this.particles.burst(other.x + other.w / 2, other.y + other.h / 2, 14, ['#8a4b1e', '#e07438', '#5a2f10'], 3.2, {life: 30, size: 3});
        audio.sfx('stomp');
      } else {
        this.damageBoss(other);
      }
      return;
    }
  }

  private explodeFireball(e: Entity) {
    e.dead = true;
    this.particles.burst(e.x + e.w / 2, e.y + e.h / 2, 10, ['#ff7b1c', '#fbd000', '#ff4400'], 2.6, {gravity: 0.1, life: 20, size: 3, glow: true});
  }

  private damageBoss(boss: Entity) {
    if (boss.dead) return;
    boss.hp = (boss.hp ?? 1) - 1;
    boss.flash = 10;
    if (boss.hp <= 0) {
      boss.dead = true;
      this.score += 5000;
      audio.sfx('bossdefeat');
      haptic(HAPTICS.gameover);
      this.particles.burst(boss.x + boss.w / 2, boss.y + boss.h / 2, 40, ['#2bb673', '#fbd000', '#ff7b1c', '#ffffff'], 5, {life: 50, size: 5, glow: true});
    } else {
      audio.sfx('bosshit');
      this.particles.burst(boss.x + boss.w / 2, boss.y + boss.h / 2, 10, ['#2bb673', '#ffffff'], 3, {life: 24, size: 3});
    }
  }

  private playerEntityCollision(e: Entity) {
    const px0 = this.px;
    const px1 = this.px + this.playerW;
    const py0 = this.py;
    const py1 = this.py + this.playerH;
    if (px1 <= e.x || px0 >= e.x + e.w || py1 <= e.y || py0 >= e.y + e.h) return;

    if (e.type === 'mushroom') {
      e.dead = true;
      this.score += 1000;
      audio.sfx('powerup');
      haptic(HAPTICS.powerup);
      this.particles.burst(e.x + e.w / 2, e.y + e.h / 2, 12, ['#e52521', '#ffffff', '#ffe6c8'], 2.8, {gravity: 0.15, life: 28, size: 3});
      if (!this.big) {
        this.big = true;
        this.py -= 14; // grow upward
      }
      return;
    }
    if (e.type === 'flower') {
      e.dead = true;
      this.score += 1000;
      audio.sfx('powerup');
      haptic(HAPTICS.powerup);
      this.particles.burst(e.x + e.w / 2, e.y + e.h / 2, 16, ['#ff7b1c', '#fbd000', '#ffffff'], 3, {gravity: 0.1, life: 30, size: 3, glow: true});
      if (!this.big) {
        this.big = true;
        this.py -= 14;
      }
      this.fire = true;
      return;
    }
    if (e.type === 'star') {
      e.dead = true;
      this.score += 1000;
      audio.sfx('powerup');
      this.starTimer = FRAMES_PER_SEC * 10; // 10 seconds of invincibility
      return;
    }
    if (e.type === 'goomba') {
      if (this.starTimer > 0) {
        e.dead = true;
        this.score += this.config.goombaStompPoints;
        this.entities.push({type: 'squash', x: e.x, y: e.y, vx: 0, vy: 0, w: e.w, h: 8, timer: 30});
        this.particles.burst(e.x + e.w / 2, e.y + e.h / 2, 12, ['#8a4b1e', '#fff350'], 3, {life: 28, size: 3});
        audio.sfx('stomp');
        return;
      }
      const falling = this.pvy > 0;
      const above = py1 - e.y < e.h * 0.75;
      if (falling && above) {
        e.dead = true;
        this.score += this.config.goombaStompPoints;
        this.entities.push({type: 'squash', x: e.x, y: e.y + e.h - 8, vx: 0, vy: 0, w: e.w, h: 8, timer: 30});
        this.pvy = -8;
        this.particles.burst(e.x + e.w / 2, e.y + e.h, 10, ['#8a4b1e', '#5a2f10', '#ffffff'], 2.6, {life: 26, size: 3});
        audio.sfx('stomp');
        haptic(HAPTICS.stomp);
      } else if (this.invulnTimer <= 0) {
        this.hurt();
      }
      return;
    }
    if (e.type === 'boss') {
      if (this.starTimer > 0) {
        this.damageBoss(e);
        return;
      }
      const falling = this.pvy > 0;
      const above = py1 - e.y < e.h * 0.6;
      if (falling && above) {
        this.damageBoss(e);
        this.pvy = -9;
        haptic(HAPTICS.stomp);
      } else if (this.invulnTimer <= 0) {
        this.hurt();
      }
    }
  }

  private hurt() {
    audio.sfx('hurt');
    haptic(HAPTICS.hurt);
    if (this.fire) {
      this.fire = false;
      this.invulnTimer = FRAMES_PER_SEC * 1.5;
      this.particles.burst(this.px + this.playerW / 2, this.py + this.playerH / 2, 10, ['#ff7b1c', '#ffffff'], 2.6, {life: 24, size: 3});
    } else if (this.big) {
      this.big = false;
      this.invulnTimer = FRAMES_PER_SEC * 1.5;
      this.py += 14;
      this.particles.burst(this.px + this.playerW / 2, this.py + this.playerH / 2, 10, ['#e52521', '#ffffff'], 2.6, {life: 24, size: 3});
    } else {
      this.loseLife();
    }
  }

  private loseLife() {
    this.lives -= 1;
    if (this.lives <= 0) {
      // Out of lives: freeze the simulation and let the host UI offer a
      // continue (e.g. via a rewarded ad) before the run is finalised.
      this.paused = true;
      audio.sfx('gameover');
      haptic(HAPTICS.gameover);
      this.pushHud();
      this.onGameOverPrompt();
      return;
    }
    this.big = false;
    this.fire = false;
    this.starTimer = 0;
    this.invulnTimer = 0;
    this.loadLevel(this.levelIndex);
    this.resetPlayer();
    this.pushHud();
  }

  // Resume after a "game over / continue?" prompt: refill lives and restart
  // the current level from the last activated checkpoint (progress kept, run
  // not yet submitted).
  grantContinue(extraLives: number) {
    if (this.destroyed) return;
    this.lives = Math.max(1, extraLives);
    this.big = false;
    this.fire = false;
    this.starTimer = 0;
    this.invulnTimer = 0;
    this.loadLevel(this.levelIndex);
    this.resetPlayer();
    this.paused = false;
    this.pushHud();
  }

  // Give up on the continue prompt: finalise the run as a normal game over.
  endGame() {
    if (this.exiting) return;
    this.paused = false;
    this.finish('game-over');
  }

  private checkFlag() {
    if (this.flagX < 0 || this.exiting) return;
    const poleX = this.flagX * TILE;
    if (this.px + this.playerW >= poleX && this.px <= poleX + 10) {
      this.score += 2000;
      audio.sfx('flag');
      this.particles.burst(poleX + TILE / 2, 10 * TILE, 24, ['#2bb673', '#fbd000', '#ffffff'], 4, {gravity: 0.2, life: 44, size: 3});
      if (this.levelIndex + 1 >= LEVEL_COUNT) {
        this.levelsUnlocked = LEVEL_COUNT;
        this.finish('won');
      } else {
        this.levelsUnlocked = Math.max(this.levelsUnlocked, this.levelIndex + 2);
        this.checkpoints.delete(this.levelIndex + 1);
        this.loadLevel(this.levelIndex + 1);
        this.resetPlayer();
        this.pushHud();
      }
    }
  }

  private finish(outcome: 'won' | 'game-over') {
    if (this.exiting) return;
    this.exiting = true;
    this.pushHud();
    this.onExit({
      outcome,
      score: this.score,
      coins: this.coins,
      level: this.levelIndex + 1,
      levelsUnlocked: this.levelsUnlocked,
      durationSec: Math.round((Date.now() - this.startedAt) / 1000),
    });
  }

  private puffDust(x: number, y: number) {
    for (let i = 0; i < 4; i++) {
      this.particles.emit(x + (Math.random() - 0.5) * 12, y - 2, {
        vx: (Math.random() - 0.5) * 1.4,
        vy: -0.6 - Math.random() * 0.8,
        color: 'rgba(255,255,255,0.8)',
        life: 16 + Math.random() * 10,
        size: 2 + Math.random() * 2,
        gravity: 0.02,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Rendering: 2.5D pseudo-3D style with parallax, bevels and bloom
  // -------------------------------------------------------------------------
  private render() {
    const ctx = this.ctx;
    const camX = this.cameraX();

    this.drawBackground(camX);

    ctx.save();
    ctx.translate(-Math.round(camX), 0);
    this.drawTiles(camX);
    this.drawFlag();
    for (const e of this.entities) this.drawEntity(e);
    this.drawPlayer();
    this.particles.render(ctx);
    ctx.restore();

    this.drawBloom();
  }

  private cameraX() {
    const levelPx = this.level.width * TILE;
    return Math.max(0, Math.min(this.px - VIEW_W * 0.4, levelPx - VIEW_W));
  }

  // Pre-rendered tile sprites: drawn once per theme into offscreen canvases,
  // then blitted (keeps the per-frame cost at one drawImage per tile).
  private tileSprite(key: string, draw: (c: CanvasRenderingContext2D) => void): HTMLCanvasElement {
    const cacheKey = `${this.level.theme}:${key}`;
    let sprite = this.tileSpriteCache.get(cacheKey);
    if (!sprite) {
      sprite = document.createElement('canvas');
      sprite.width = TILE;
      sprite.height = TILE;
      const c = sprite.getContext('2d')!;
      draw(c);
      this.tileSpriteCache.set(cacheKey, sprite);
    }
    return sprite;
  }

  private palette() {
    const theme = this.level.theme;
    switch (theme) {
      case 'cave':
        return {top: '#5d6b9e', topDark: '#3a4470', body: '#41496f', bodyDark: '#2c3354', brick: '#7d89b8', accent: '#8fa2d8'};
      case 'castle':
        return {top: '#8a8f9c', topDark: '#5a5f6e', body: '#62687a', bodyDark: '#444a5c', brick: '#9c6a6a', accent: '#c87f5a'};
      case 'sky':
        return {top: '#6cc95e', topDark: '#3f9a35', body: '#b07a3a', bodyDark: '#7d5326', brick: '#c84c0c', accent: '#e07438'};
      default:
        return {top: '#4fc455', topDark: '#2e8f36', body: '#9c5a1c', bodyDark: '#6e3d10', brick: '#c84c0c', accent: '#e07438'};
    }
  }

  private drawTiles(camX: number) {
    const ctx = this.ctx;
    const tx0 = Math.max(0, Math.floor(camX / TILE));
    const tx1 = Math.min(this.level.width - 1, Math.ceil((camX + VIEW_W) / TILE));
    const pal = this.palette();
    const groundTop = this.tileSprite('groundTop', (c) => this.paintGround(c, pal, true));
    const groundFill = this.tileSprite('groundFill', (c) => this.paintGround(c, pal, false));
    const brick = this.tileSprite('brick', (c) => this.paintBrick(c, pal));
    const used = this.tileSprite('used', (c) => this.paintUsed(c, pal));
    const mysteryA = this.tileSprite('mysteryA', (c) => this.paintMystery(c, true));
    const mysteryB = this.tileSprite('mysteryB', (c) => this.paintMystery(c, false));
    const pipeTop = this.tileSprite('pipeTop', (c) => this.paintPipe(c, true));
    const pipeBody = this.tileSprite('pipeBody', (c) => this.paintPipe(c, false));
    const platform = this.tileSprite('platform', (c) => this.paintPlatform(c, pal));
    const mystery = Math.floor(this.animTimer / 20) % 2 === 0 ? mysteryA : mysteryB;

    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const ch = this.level.grid[ty][tx];
        if (ch === '.') continue;
        const bump = this.bumps.get(`${tx},${ty}`) || 0;
        const x = tx * TILE;
        const y = ty * TILE - bump;
        switch (ch) {
          case '#':
            ctx.drawImage(this.tileAt(tx, ty - 1) !== '#' ? groundTop : groundFill, x, y);
            break;
          case 'B':
            ctx.drawImage(brick, x, y);
            break;
          case 'U':
            ctx.drawImage(used, x, y);
            break;
          case '?':
          case 'M':
          case 'S':
          case 'I':
            this.drawTileShadow(x, y);
            ctx.drawImage(mystery, x, y);
            if (ch !== '?') {
              // Tint power-up blocks: green for mushroom, red for star, orange for flower.
              ctx.fillStyle = ch === 'M' ? 'rgba(67,176,71,0.28)' : ch === 'S' ? 'rgba(229,37,33,0.26)' : 'rgba(255,123,28,0.3)';
              ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
              ctx.fillStyle = '#7a4a00';
              ctx.font = 'bold 15px monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(ch === 'M' ? '↑' : ch === 'S' ? '★' : '♥', x + TILE / 2, y + TILE / 2 + 1);
            }
            break;
          case 'p':
            ctx.drawImage(this.tileAt(tx, ty - 1) !== 'p' ? pipeTop : pipeBody, x, y);
            break;
          case '=':
            ctx.drawImage(platform, x, y);
            break;
          case 'C':
            this.drawCoin(x + 4, y + 4, 24);
            break;
          case 'K':
          case 'k':
            this.drawCheckpoint(x, y, ch === 'k');
            break;
        }
      }
    }
  }

  // Directional drop shadow beneath raised blocks (2.5D depth cue).
  private drawTileShadow(x: number, y: number) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(x + 4, y + 5, TILE, TILE);
  }

  private paintGround(c: CanvasRenderingContext2D, pal: ReturnType<MarioGame['palette']>, top: boolean) {
    // Body
    const grad = c.createLinearGradient(0, 0, TILE, TILE);
    grad.addColorStop(0, top ? pal.top : pal.body);
    grad.addColorStop(1, top ? pal.topDark : pal.bodyDark);
    c.fillStyle = grad;
    c.fillRect(0, 0, TILE, TILE);
    // Bevel: light top-left, dark bottom-right
    c.fillStyle = 'rgba(255,255,255,0.28)';
    c.fillRect(0, 0, TILE, 3);
    c.fillRect(0, 0, 3, TILE);
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.fillRect(0, TILE - 3, TILE, 3);
    c.fillRect(TILE - 3, 0, 3, TILE);
    if (top) {
      // Grass/stone lip overhanging the dirt body
      c.fillStyle = pal.top;
      c.fillRect(0, 0, TILE, 8);
      c.fillStyle = 'rgba(255,255,255,0.35)';
      c.fillRect(0, 0, TILE, 2);
      c.fillStyle = pal.topDark;
      c.fillRect(0, 8, TILE, 2);
    }
    // Speckles for texture
    c.fillStyle = 'rgba(0,0,0,0.14)';
    for (let i = 0; i < 4; i++) c.fillRect(4 + ((i * 9 + 5) % 24), 12 + i * 5, 5, 3);
  }

  private paintBrick(c: CanvasRenderingContext2D, pal: ReturnType<MarioGame['palette']>) {
    const grad = c.createLinearGradient(0, 0, 0, TILE);
    grad.addColorStop(0, pal.brick);
    grad.addColorStop(1, pal.bodyDark);
    c.fillStyle = grad;
    c.fillRect(0, 0, TILE, TILE);
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.fillRect(0, 15, TILE, 2);
    c.fillRect(15, 0, 2, 15);
    c.fillRect(7, 17, 2, 15);
    c.fillStyle = 'rgba(255,255,255,0.25)';
    c.fillRect(0, 0, TILE, 2);
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(0, TILE - 2, TILE, 2);
  }

  private paintUsed(c: CanvasRenderingContext2D, pal: ReturnType<MarioGame['palette']>) {
    const grad = c.createLinearGradient(0, 0, 0, TILE);
    grad.addColorStop(0, pal.body);
    grad.addColorStop(1, pal.bodyDark);
    c.fillStyle = grad;
    c.fillRect(0, 0, TILE, TILE);
    c.strokeStyle = 'rgba(0,0,0,0.45)';
    c.lineWidth = 2;
    c.strokeRect(2, 2, TILE - 4, TILE - 4);
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.fillRect(2, 2, TILE - 4, 2);
  }

  private paintMystery(c: CanvasRenderingContext2D, bright: boolean) {
    const grad = c.createLinearGradient(0, 0, 0, TILE);
    grad.addColorStop(0, bright ? '#ffe45c' : '#f0b400');
    grad.addColorStop(1, bright ? '#e8a400' : '#c88800');
    c.fillStyle = grad;
    c.fillRect(0, 0, TILE, TILE);
    c.strokeStyle = '#7a4a00';
    c.lineWidth = 2;
    c.strokeRect(1, 1, TILE - 2, TILE - 2);
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.fillRect(2, 2, TILE - 4, 2);
    c.fillStyle = '#7a4a00';
    c.font = 'bold 18px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('?', TILE / 2, TILE / 2 + 1);
  }

  private paintPipe(c: CanvasRenderingContext2D, top: boolean) {
    const grad = c.createLinearGradient(0, 0, TILE, 0);
    grad.addColorStop(0, '#0a8f24');
    grad.addColorStop(0.35, '#4fdc62');
    grad.addColorStop(0.6, '#0aa02a');
    grad.addColorStop(1, '#056318');
    c.fillStyle = grad;
    c.fillRect(0, 0, TILE, TILE);
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.fillRect(TILE - 3, 0, 3, TILE);
    if (top) {
      c.fillStyle = grad;
      c.fillRect(-3, 0, TILE + 6, 12);
      c.fillStyle = 'rgba(255,255,255,0.4)';
      c.fillRect(-3, 0, TILE + 6, 3);
      c.fillStyle = 'rgba(0,0,0,0.35)';
      c.fillRect(-3, 10, TILE + 6, 3);
    }
  }

  private paintPlatform(c: CanvasRenderingContext2D, pal: ReturnType<MarioGame['palette']>) {
    const grad = c.createLinearGradient(0, 0, 0, 14);
    grad.addColorStop(0, pal.accent);
    grad.addColorStop(1, pal.bodyDark);
    c.fillStyle = grad;
    c.fillRect(0, 0, TILE, 14);
    c.fillStyle = 'rgba(255,255,255,0.3)';
    c.fillRect(0, 0, TILE, 2);
    c.fillStyle = 'rgba(0,0,0,0.4)';
    c.fillRect(0, 12, TILE, 3);
  }

  private drawCoin(x: number, y: number, size: number) {
    const ctx = this.ctx;
    const phase = Math.floor(this.animTimer / 10) % 4;
    const widths = [size, size * 0.6, size * 0.25, size * 0.6];
    const w = widths[phase];
    const cx = x + size / 2;
    const cy = y + size / 2;
    // Glow
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(251,208,0,0.16)';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    const grad = ctx.createLinearGradient(x, y, x, y + size);
    grad.addColorStop(0, '#ffe45c');
    grad.addColorStop(1, '#c89400');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(w / 2, 3), size / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c89400';
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(w / 6, 1.5), size / 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawCheckpoint(x: number, y: number, activated: boolean) {
    const ctx = this.ctx;
    const baseY = y + TILE;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + TILE / 2, baseY - 2, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c8c8d8';
    ctx.fillRect(x + TILE / 2 - 2, y - TILE * 1.4, 4, TILE * 2.4);
    ctx.fillStyle = activated ? '#fbd000' : '#7d89b8';
    const wave = activated ? Math.sin(this.animTimer / 10) * 3 : 0;
    ctx.beginPath();
    ctx.moveTo(x + TILE / 2 + 2, y - TILE * 1.4);
    ctx.lineTo(x + TILE / 2 + 26 + wave, y - TILE * 1.4 + 9);
    ctx.lineTo(x + TILE / 2 + 2, y - TILE * 1.4 + 18);
    ctx.closePath();
    ctx.fill();
    if (activated) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(251,208,0,0.22)';
      ctx.beginPath();
      ctx.arc(x + TILE / 2, y - TILE * 0.6, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  private drawFlag() {
    if (this.flagX < 0) return;
    const ctx = this.ctx;
    const x = this.flagX * TILE;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + 5, 15 * TILE - 2, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8d8d8';
    ctx.fillRect(x + 2, 9 * TILE, 6, 6 * TILE);
    ctx.fillStyle = '#2bb673';
    const wave = Math.sin(this.animTimer / 12) * 3;
    ctx.beginPath();
    ctx.moveTo(x + 8, 9 * TILE + 6);
    ctx.lineTo(x + 44 + wave, 9 * TILE + 22);
    ctx.lineTo(x + 8, 9 * TILE + 38);
    ctx.fill();
    ctx.fillStyle = '#fbd000';
    ctx.beginPath();
    ctx.arc(x + 5, 9 * TILE - 4, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawGroundShadow(x: number, y: number, w: number, h: number) {
    const ctx = this.ctx;
    // Raycast down to the first solid tile to place a soft contact shadow.
    const tx = Math.floor((x + w / 2) / TILE);
    const tyStart = Math.floor((y + h) / TILE);
    for (let ty = tyStart; ty < ROWS; ty++) {
      if (isSolidTile(this.tileAt(tx, ty))) {
        const dist = ty * TILE - (y + h);
        const strength = Math.max(0.06, 0.3 - dist / 220);
        const shrink = Math.min(10, dist / 8);
        ctx.fillStyle = `rgba(0,0,0,${strength.toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, ty * TILE + 3, w / 2 + 2 - shrink / 2, 4.5 - shrink / 6, 0, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      if (ty > tyStart + 6) break; // too far below: skip
    }
  }

  private drawEntity(e: Entity) {
    const ctx = this.ctx;
    if (e.type === 'coinpop') {
      this.drawCoin(e.x, e.y, 24);
      return;
    }
    if (e.type === 'squash') {
      ctx.fillStyle = '#8a4b1e';
      ctx.fillRect(e.x, e.y, e.w, e.h);
      return;
    }
    if (e.type === 'fireball') {
      const cx = e.x + e.w / 2;
      const cy = e.y + e.h / 2;
      ctx.globalCompositeOperation = 'lighter';
      const glow = ctx.createRadialGradient(cx, cy, 1, cx, cy, 14);
      glow.addColorStop(0, 'rgba(255,220,120,0.9)');
      glow.addColorStop(0.5, 'rgba(255,123,28,0.55)');
      glow.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(cx - 14, cy - 14, 28, 28);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#ff9b2f';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff3b0';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      if (this.simFrame % 2 === 0) {
        this.particles.emit(cx, cy, {vx: -e.vx * 0.1, vy: -0.4, color: '#ff7b1c', life: 12, size: 3, gravity: -0.02, glow: true});
      }
      return;
    }
    this.drawGroundShadow(e.x, e.y, e.w, e.h);
    if (e.type === 'goomba') {
      const wob = Math.floor(this.animTimer / 14) % 2;
      // Dome body with bevel
      const grad = ctx.createLinearGradient(e.x, e.y, e.x, e.y + e.h);
      grad.addColorStop(0, '#a05c28');
      grad.addColorStop(1, '#6e3d14');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2 - 3, e.w / 2 - 1, e.h / 2 - 4, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(e.x + 2, e.y + e.h / 2 - 3, e.w - 4, e.h / 2 - 5);
      // Feet
      ctx.fillStyle = '#5a2f10';
      ctx.fillRect(e.x + (wob ? 0 : 2), e.y + e.h - 8, 10, 8);
      ctx.fillRect(e.x + e.w - (wob ? 10 : 12), e.y + e.h - 8, 10, 8);
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(e.x + 5, e.y + 7, 6, 7);
      ctx.fillRect(e.x + e.w - 11, e.y + 7, 6, 7);
      ctx.fillStyle = '#000';
      const blink = Math.floor(this.animTimer / 30) % 2;
      ctx.fillRect(e.x + 7 + blink, e.y + 9, 3, 4);
      ctx.fillRect(e.x + e.w - 9 - blink, e.y + 9, 3, 4);
      return;
    }
    if (e.type === 'mushroom') {
      const grad = ctx.createLinearGradient(e.x, e.y, e.x, e.y + e.h);
      grad.addColorStop(0, '#ff5b57');
      grad.addColorStop(1, '#c81f1c');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2 - 2, e.w / 2 - 1, e.h / 2 - 5, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(e.x + 2, e.y + e.h / 2 - 2, e.w - 4, 6);
      ctx.fillStyle = '#fff';
      ctx.fillRect(e.x + 4, e.y + 3, 7, 7);
      ctx.fillRect(e.x + e.w - 11, e.y + 3, 7, 7);
      ctx.fillStyle = '#ffe6c8';
      ctx.fillRect(e.x + 6, e.y + e.h - 9, e.w - 12, 9);
      return;
    }
    if (e.type === 'flower') {
      const cx = e.x + e.w / 2;
      const cy = e.y + e.h / 2 - 2;
      ctx.fillStyle = '#2bb673';
      ctx.fillRect(cx - 2, cy + 5, 4, 10);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,150,40,0.3)';
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + this.animTimer / 40;
        ctx.fillStyle = i % 2 ? '#ff7b1c' : '#fbd000';
        ctx.beginPath();
        ctx.ellipse(cx + Math.cos(a) * 7, cy + Math.sin(a) * 7, 5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fff3b0';
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (e.type === 'star') {
      const cx = e.x + e.w / 2;
      const cy = e.y + e.h / 2;
      const pulse = Math.floor(this.animTimer / 8) % 2 === 0 ? '#fbd000' : '#fff350';
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(251,208,0,0.3)';
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = pulse;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 15 : 6.5;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(cx - 5, cy - 2, 3, 4);
      ctx.fillRect(cx + 2, cy - 2, 3, 4);
      return;
    }
    if (e.type === 'boss') {
      const wob = Math.floor(this.animTimer / 12) % 2;
      const grad = ctx.createLinearGradient(e.x, e.y, e.x, e.y + e.h);
      grad.addColorStop(0, '#3ed17f');
      grad.addColorStop(1, '#157a45');
      ctx.fillStyle = e.flash && e.flash > 0 ? '#ffffff' : grad;
      // Body
      ctx.beginPath();
      ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2, e.w / 2, e.h / 2 - 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Spikes
      ctx.fillStyle = e.flash && e.flash > 0 ? '#dddddd' : '#0f5c33';
      for (let i = 0; i < 3; i++) {
        const sx = e.x + 10 + i * 14;
        ctx.beginPath();
        ctx.moveTo(sx, e.y + 4);
        ctx.lineTo(sx + 5, e.y - 6);
        ctx.lineTo(sx + 10, e.y + 4);
        ctx.closePath();
        ctx.fill();
      }
      // Feet
      ctx.fillStyle = '#0f5c33';
      ctx.fillRect(e.x + (wob ? 0 : 3), e.y + e.h - 6, 14, 6);
      ctx.fillRect(e.x + e.w - (wob ? 14 : 17), e.y + e.h - 6, 14, 6);
      // Eyes + brow
      ctx.fillStyle = '#fff';
      ctx.fillRect(e.x + 10, e.y + 12, 9, 10);
      ctx.fillRect(e.x + e.w - 19, e.y + 12, 9, 10);
      ctx.fillStyle = '#000';
      ctx.fillRect(e.x + 13, e.y + 15, 4, 6);
      ctx.fillRect(e.x + e.w - 16, e.y + 15, 4, 6);
      // HP pips
      for (let i = 0; i < (e.hp ?? 0); i++) {
        ctx.fillStyle = '#fbd000';
        ctx.fillRect(e.x + 4 + i * 9, e.y - 12, 7, 5);
      }
    }
  }

  private drawPlayer() {
    if (this.invulnTimer > 0 && Math.floor(this.animTimer / 4) % 2 === 0) return;
    const ctx = this.ctx;
    const w = this.playerW;
    const h = this.playerH;
    const x = this.px;
    const y = this.py;
    const star = this.starTimer > 0;
    this.drawGroundShadow(x, y, w, h);
    const cycle = Math.floor(this.animTimer / 6) % 4;
    const step = this.onGround && Math.abs(this.pvx) > 0.5 ? cycle : 0;

    const cap = star ? (Math.floor(this.animTimer / 4) % 2 ? '#fff350' : '#fbd000') : this.fire ? '#ffffff' : '#e52521';
    const skin = '#ffc8a0';
    const outfit = star ? cap : this.fire ? '#e52521' : '#2b4bd7';

    // Bevel-lit body: main fill + highlight strip
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, outfit);
    grad.addColorStop(1, star ? cap : this.fire ? '#b81d1a' : '#1c359e');
    // Cap
    ctx.fillStyle = cap;
    ctx.fillRect(x + 2, y, w - 4, 7);
    ctx.fillRect(this.facing === 1 ? x + w - 8 : x, y + 2, 10, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x + 2, y, w - 4, 2);
    // Face
    ctx.fillStyle = skin;
    ctx.fillRect(x + 3, y + 7, w - 6, 9);
    // Eye
    ctx.fillStyle = '#000';
    ctx.fillRect(this.facing === 1 ? x + w - 9 : x + 6, y + 8, 3, 5);
    // Mustache
    ctx.fillRect(this.facing === 1 ? x + w - 12 : x + 7, y + 13, 6, 3);
    // Body
    ctx.fillStyle = grad;
    ctx.fillRect(x + 2, y + 16, w - 4, h - (this.big ? 30 : 22));
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(x + 2, y + 16, 3, h - (this.big ? 30 : 22));
    // Arms
    ctx.fillStyle = skin;
    ctx.fillRect(this.facing === 1 ? x - 1 : x + w - 4, y + 18, 5, 8);
    // Legs
    ctx.fillStyle = outfit;
    if (step === 1) {
      ctx.fillRect(x + 1, y + h - 7, 9, 7);
      ctx.fillRect(x + w - 10, y + h - 9, 9, 9);
    } else if (step === 3) {
      ctx.fillRect(x + 1, y + h - 9, 9, 9);
      ctx.fillRect(x + w - 10, y + h - 7, 9, 7);
    } else {
      ctx.fillRect(x + 1, y + h - 8, 9, 8);
      ctx.fillRect(x + w - 10, y + h - 8, 9, 8);
    }
    if (this.crouching) {
      ctx.fillStyle = cap;
      ctx.fillRect(x + 2, y + h - 6, w - 4, 6);
    }
  }

  // -------------------------------------------------------------------------
  // Background: parallax layers, celestial glow, atmospheric dust
  // -------------------------------------------------------------------------
  private drawBackground(camX: number) {
    const ctx = this.ctx;
    const theme = this.level.theme;
    if (!this.skyGrad || this.skyGradTheme !== theme) {
      const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      if (theme === 'cave') {
        sky.addColorStop(0, '#070a1c');
        sky.addColorStop(0.7, '#141034');
        sky.addColorStop(1, '#1d1445');
      } else if (theme === 'castle') {
        sky.addColorStop(0, '#1a0d14');
        sky.addColorStop(0.65, '#3a1420');
        sky.addColorStop(1, '#57201a');
      } else if (theme === 'sky') {
        sky.addColorStop(0, '#7ec8ff');
        sky.addColorStop(1, '#c8ecff');
      } else {
        sky.addColorStop(0, '#4a86f0');
        sky.addColorStop(0.7, '#7fb2fc');
        sky.addColorStop(1, '#a8ccff');
      }
      this.skyGrad = sky;
      this.skyGradTheme = theme;
    }
    ctx.fillStyle = this.skyGrad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // Celestial body + bloom
    if (theme === 'grass' || theme === 'sky') {
      const sx = 800 - (camX * 0.03) % 1600;
      const sun = ctx.createRadialGradient(sx, 90, 8, sx, 90, 150);
      sun.addColorStop(0, 'rgba(255,246,200,0.95)');
      sun.addColorStop(0.25, 'rgba(255,230,150,0.4)');
      sun.addColorStop(1, 'rgba(255,220,120,0)');
      ctx.fillStyle = sun;
      ctx.fillRect(sx - 150, -60, 300, 300);
    } else if (theme === 'cave') {
      // Moonlit crack + glowing crystals
      const glow = ctx.createRadialGradient(720, 80, 6, 720, 80, 120);
      glow.addColorStop(0, 'rgba(140,170,255,0.5)');
      glow.addColorStop(1, 'rgba(140,170,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(600, -40, 240, 240);
    } else {
      // Fiery castle glow from below
      const glow = ctx.createLinearGradient(0, VIEW_H, 0, VIEW_H - 260);
      glow.addColorStop(0, 'rgba(255,90,30,0.4)');
      glow.addColorStop(1, 'rgba(255,90,30,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, VIEW_H - 260, VIEW_W, 260);
    }

    this.drawFarLayer(camX, theme);
    this.drawClouds(camX, theme);
    this.drawNearLayer(camX, theme);
    this.drawDust(camX);
  }

  private drawFarLayer(camX: number, theme: Theme) {
    const ctx = this.ctx;
    const p = camX * 0.12;
    if (theme === 'cave') {
      // Hanging stalactites / rising stalagmites silhouettes
      ctx.fillStyle = 'rgba(20,16,52,0.85)';
      for (let i = -1; i < 10; i++) {
        const x = i * 140 - (p % 1400);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 45, 0);
        ctx.lineTo(x + 22, 90 + (i % 3) * 30);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 70, VIEW_H);
        ctx.lineTo(x + 115, VIEW_H);
        ctx.lineTo(x + 92, VIEW_H - 80 - (i % 4) * 25);
        ctx.closePath();
        ctx.fill();
      }
    } else if (theme === 'castle') {
      // Distant towers with battlements
      ctx.fillStyle = 'rgba(26,13,20,0.9)';
      for (let i = -1; i < 8; i++) {
        const x = i * 200 - (p % 1600);
        const h = 150 + ((i * 53) % 90);
        ctx.fillRect(x, VIEW_H - h, 70, h);
        for (let b = 0; b < 4; b++) ctx.fillRect(x + b * 20, VIEW_H - h - 12, 12, 12);
        ctx.fillStyle = 'rgba(255,140,60,0.25)';
        ctx.fillRect(x + 28, VIEW_H - h + 30, 14, 22);
        ctx.fillStyle = 'rgba(26,13,20,0.9)';
      }
    } else {
      // Mountain ranges
      ctx.fillStyle = theme === 'sky' ? 'rgba(90,140,200,0.5)' : 'rgba(40,80,160,0.45)';
      for (let i = -1; i < 9; i++) {
        const x = i * 260 - (p % 2340);
        const h = 130 + ((i * 67) % 80);
        ctx.beginPath();
        ctx.moveTo(x - 160, VIEW_H - 64);
        ctx.lineTo(x, VIEW_H - 64 - h);
        ctx.lineTo(x + 160, VIEW_H - 64);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.moveTo(x - 24, VIEW_H - 64 - h + 42);
        ctx.lineTo(x, VIEW_H - 64 - h);
        ctx.lineTo(x + 24, VIEW_H - 64 - h + 42);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = theme === 'sky' ? 'rgba(90,140,200,0.5)' : 'rgba(40,80,160,0.45)';
      }
    }
  }

  private drawClouds(camX: number, theme: Theme) {
    const ctx = this.ctx;
    const cloudColor = theme === 'cave' ? 'rgba(160,180,255,0.08)' : theme === 'castle' ? 'rgba(255,140,90,0.1)' : 'rgba(255,255,255,0.9)';
    const puffs = (x: number, y: number, s: number) => {
      ctx.beginPath();
      ctx.arc(x, y, 16 * s, 0, Math.PI * 2);
      ctx.arc(x + 20 * s, y - 9 * s, 21 * s, 0, Math.PI * 2);
      ctx.arc(x + 43 * s, y, 17 * s, 0, Math.PI * 2);
      ctx.fill();
    };
    ctx.fillStyle = cloudColor;
    for (let i = 0; i < 7; i++) {
      const x = i * 360 - (camX * 0.07) % 2520;
      puffs(x, 46 + ((i * 37) % 70), 0.8);
    }
    ctx.fillStyle = theme === 'cave' ? 'rgba(200,215,255,0.05)' : theme === 'castle' ? 'rgba(255,160,110,0.14)' : 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 6; i++) {
      const x = i * 420 + 130 - (camX * 0.18) % 2520;
      puffs(x, 120 + ((i * 53) % 80), 1.15);
    }
  }

  private drawNearLayer(camX: number, theme: Theme) {
    const ctx = this.ctx;
    const p = camX * 0.35;
    if (theme === 'cave') {
      ctx.fillStyle = 'rgba(30,25,70,0.9)';
      for (let i = -1; i < 12; i++) {
        const x = i * 180 - (p % 2160);
        ctx.fillRect(x, VIEW_H - 70 - (i % 3) * 22, 90, 90);
        ctx.beginPath();
        ctx.moveTo(x, VIEW_H - 70 - (i % 3) * 22);
        ctx.lineTo(x + 45, VIEW_H - 130 - (i % 3) * 22);
        ctx.lineTo(x + 90, VIEW_H - 70 - (i % 3) * 22);
        ctx.closePath();
        ctx.fill();
      }
    } else if (theme === 'castle') {
      ctx.fillStyle = 'rgba(46,20,26,0.95)';
      for (let i = -1; i < 12; i++) {
        const x = i * 200 - (p % 2400);
        ctx.fillRect(x, VIEW_H - 60, 110, 70);
        ctx.beginPath();
        ctx.moveTo(x - 8, VIEW_H - 60);
        ctx.lineTo(x + 55, VIEW_H - 110);
        ctx.lineTo(x + 118, VIEW_H - 60);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      ctx.fillStyle = theme === 'sky' ? 'rgba(110,190,110,0.85)' : '#2f8f36';
      for (let i = -1; i < 12; i++) {
        const x = i * 320 - (p % 3840);
        ctx.beginPath();
        ctx.moveTo(x - 110, 15 * TILE);
        ctx.quadraticCurveTo(x, 15 * TILE - 130 - (i % 3) * 24, x + 110, 15 * TILE);
        ctx.fill();
      }
    }
  }

  private drawDust(camX: number) {
    const ctx = this.ctx;
    const t = this.animTimer;
    ctx.globalCompositeOperation = 'lighter';
    for (const m of this.dustMotes) {
      const x = (((m.x - camX * m.spd - t * 0.12 * m.spd) % VIEW_W) + VIEW_W) % VIEW_W;
      const y = (m.y + Math.sin((t + m.phase * 40) / 90) * 22 + VIEW_H) % VIEW_H;
      ctx.globalAlpha = m.alpha * (0.6 + 0.4 * Math.sin((t + m.phase * 70) / 50));
      ctx.fillStyle = this.level.theme === 'castle' ? '#ffb070' : '#dfe8ff';
      ctx.fillRect(x, y, m.size, m.size);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  // Vignette + subtle top bloom for a lit, dimensional feel.
  private drawBloom() {
    const ctx = this.ctx;
    const vig = ctx.createRadialGradient(VIEW_W / 2, VIEW_H * 0.42, VIEW_H * 0.45, VIEW_W / 2, VIEW_H * 0.55, VIEW_H * 1.05);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,10,0.32)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}
