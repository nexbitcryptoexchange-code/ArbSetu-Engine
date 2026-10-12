import {LEVEL_BUILDERS, LEVEL_COUNT, ROWS, TILE, type LevelData} from '@/game/levels';
import type {GameConfig} from '@/types';

export const VIEW_W = 960;
export const VIEW_H = ROWS * TILE; // 544

export interface HudState {
  score: number;
  coins: number;
  lives: number;
  level: number;
  timeLeft: number;
  power: 'small' | 'big' | 'star';
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
}

type Entity = {
  type: 'goomba' | 'mushroom' | 'star' | 'coinpop' | 'squash';
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  timer: number;
  dead?: boolean;
  emerging?: number;
};

const SOLID = new Set(['#', 'B', '?', 'M', 'S', 'U', 'p', '=']);
const FRAMES_PER_SEC = 60;
const MAX_FALL = 15;

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

  // Player state
  private px = 64;
  private py = 0;
  private pvx = 0;
  private pvy = 0;
  private big = false;
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
  input: InputState = {left: false, right: false, down: false, jumpHeld: false};

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
  }

  // Called by the touch Jump button (and keyboard jump uses the same path).
  pressJump() {
    const now = performance.now();
    const isDoubleTap = now - this.lastJumpPressAt < 280;
    this.lastJumpPressAt = now;
    this.input.jumpHeld = true;

    if (this.onGround) {
      this.pvy = -this.config.jumpVelocity;
      this.onGround = false;
      this.jumpUsed = false;
    } else if (isDoubleTap && !this.jumpUsed) {
      // Rapid double-tap = mid-air second jump
      this.pvy = -this.config.jumpVelocity * 0.9;
      this.jumpUsed = true;
    }
  }

  releaseJump() {
    this.input.jumpHeld = false;
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
    this.timeLeft = this.config.timeLimitSec;
    this.bumps.clear();
  }

  private resetPlayer() {
    this.px = this.level.spawn.x * TILE;
    this.py = this.level.spawn.y * TILE;
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
  // Main loop
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
      power: this.starTimer > 0 ? 'star' : this.big ? 'big' : 'small',
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

    for (const [k, v] of this.bumps) {
      if (v <= 1) this.bumps.delete(k);
      else this.bumps.set(k, v - 2);
    }

    if (this.starTimer > 0) this.starTimer--;
    if (this.invulnTimer > 0) this.invulnTimer--;
  }

  private updatePlayer() {
    const speed = this.config.playerSpeed;
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

    // Collect loose coins
    this.collectCoins();

    // Invulnerability flicker handled in render
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
    if (ch === '?' || ch === 'M' || ch === 'S') {
      this.level.grid[ty][tx] = 'U';
      this.bumps.set(key, 8);
      if (ch === '?') {
        this.coins += 1;
        this.score += this.config.coinPoints;
        this.entities.push({type: 'coinpop', x: tx * TILE + 4, y: ty * TILE - 20, vx: 0, vy: -9, w: 24, h: 24, timer: 40});
      } else {
        const type = ch === 'M' ? 'mushroom' : 'star';
        this.entities.push({type, x: tx * TILE + 4, y: ty * TILE, vx: type === 'mushroom' ? 1.6 : 2, vy: -2, w: 26, h: 26, timer: 0, emerging: 26});
      }
    } else if (ch === 'B') {
      if (this.big) {
        this.level.grid[ty][tx] = '.';
        this.score += 50;
        this.bumps.set(key, 6);
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
        }
      }
    }
  }

  private updateEntities() {
    for (const e of this.entities) {
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

      if (e.type === 'goomba' || e.type === 'mushroom' || e.type === 'star') {
        this.playerEntityCollision(e);
      }
    }
    this.entities = this.entities.filter((e) => !e.dead);
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
      if (!this.big) {
        this.big = true;
        this.py -= 14; // grow upward
      }
      return;
    }
    if (e.type === 'star') {
      e.dead = true;
      this.score += 1000;
      this.starTimer = FRAMES_PER_SEC * 10; // 10 seconds of invincibility
      return;
    }
    if (e.type === 'goomba') {
      if (this.starTimer > 0) {
        e.dead = true;
        this.score += this.config.goombaStompPoints;
        this.entities.push({type: 'squash', x: e.x, y: e.y, vx: 0, vy: 0, w: e.w, h: 8, timer: 30});
        return;
      }
      const falling = this.pvy > 0;
      const above = py1 - e.y < e.h * 0.75;
      if (falling && above) {
        e.dead = true;
        this.score += this.config.goombaStompPoints;
        this.entities.push({type: 'squash', x: e.x, y: e.y + e.h - 8, vx: 0, vy: 0, w: e.w, h: 8, timer: 30});
        this.pvy = -8;
      } else if (this.invulnTimer <= 0) {
        this.hurt();
      }
    }
  }

  private hurt() {
    if (this.big) {
      this.big = false;
      this.invulnTimer = FRAMES_PER_SEC * 1.5;
      this.py += 14;
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
      this.pushHud();
      this.onGameOverPrompt();
      return;
    }
    this.big = false;
    this.starTimer = 0;
    this.invulnTimer = 0;
    this.loadLevel(this.levelIndex);
    this.resetPlayer();
    this.pushHud();
  }

  // Resume after a "game over / continue?" prompt: refill lives and restart
  // the current level (progress kept, run not yet submitted).
  grantContinue(extraLives: number) {
    if (this.destroyed) return;
    this.lives = Math.max(1, extraLives);
    this.big = false;
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
      this.coins += 0;
      if (this.levelIndex + 1 >= LEVEL_COUNT) {
        this.levelsUnlocked = LEVEL_COUNT;
        this.finish('won');
      } else {
        this.levelsUnlocked = Math.max(this.levelsUnlocked, this.levelIndex + 2);
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

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  private render() {
    const ctx = this.ctx;
    const camX = this.cameraX();

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    if (this.level.theme === 'cave') {
      sky.addColorStop(0, '#0b1026');
      sky.addColorStop(1, '#1a1440');
    } else if (this.level.theme === 'sky') {
      sky.addColorStop(0, '#7ec8ff');
      sky.addColorStop(1, '#c8ecff');
    } else {
      sky.addColorStop(0, '#5c94fc');
      sky.addColorStop(1, '#8fc4ff');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    this.drawClouds(camX);
    if (this.level.theme === 'grass') this.drawHills(camX);

    ctx.save();
    ctx.translate(-Math.round(camX), 0);
    this.drawTiles(camX);
    this.drawFlag();
    for (const e of this.entities) this.drawEntity(e);
    this.drawPlayer();
    ctx.restore();
  }

  private cameraX() {
    const levelPx = this.level.width * TILE;
    return Math.max(0, Math.min(this.px - VIEW_W * 0.4, levelPx - VIEW_W));
  }

  private drawClouds(camX: number) {
    const ctx = this.ctx;
    ctx.fillStyle = this.level.theme === 'cave' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)';
    const offsets = [0, 300, 700, 1100, 1500, 1900, 2300];
    for (const off of offsets) {
      const x = off - (camX * 0.3) % 2600;
      const y = 40 + ((off * 13) % 90);
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.arc(x + 20, y - 8, 22, 0, Math.PI * 2);
      ctx.arc(x + 42, y, 18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawHills(camX: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#3ba53a';
    for (let i = 0; i < 8; i++) {
      const x = i * 320 - (camX * 0.5) % 2560;
      ctx.beginPath();
      ctx.moveTo(x - 90, 15 * TILE);
      ctx.quadraticCurveTo(x, 15 * TILE - 120, x + 90, 15 * TILE);
      ctx.fill();
    }
  }

  private drawTiles(camX: number) {
    const ctx = this.ctx;
    const tx0 = Math.max(0, Math.floor(camX / TILE));
    const tx1 = Math.min(this.level.width - 1, Math.ceil((camX + VIEW_W) / TILE));
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const ch = this.level.grid[ty][tx];
        if (ch === '.') continue;
        const bump = this.bumps.get(`${tx},${ty}`) || 0;
        const x = tx * TILE;
        const y = ty * TILE - bump;
        switch (ch) {
          case '#':
            this.drawGround(x, y, tx, ty);
            break;
          case 'B':
            this.drawBrick(x, y);
            break;
          case 'U':
            this.drawUsedBlock(x, y);
            break;
          case '?':
          case 'M':
          case 'S':
            this.drawMysteryBlock(x, y);
            break;
          case 'p':
            this.drawPipe(x, y, ty);
            break;
          case '=':
            this.drawPlatform(x, y);
            break;
          case 'C':
            this.drawCoin(x + 4, y + 4, 24);
            break;
        }
      }
    }
  }

  private drawGround(x: number, y: number, tx: number, ty: number) {
    const ctx = this.ctx;
    const top = this.tileAt(tx, ty - 1) !== '#';
    ctx.fillStyle = top ? (this.level.theme === 'cave' ? '#3f8f3f' : '#43b047') : '#9c5a1c';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x, y, TILE, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < 4; i++) ctx.fillRect(x + 4 + ((tx * 7 + i * 9) % 24), y + 8 + i * 6, 5, 3);
  }

  private drawBrick(x: number, y: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#c84c0c';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x, y + 15, TILE, 2);
    ctx.fillRect(x + 15, y, 2, 15);
    ctx.fillRect(x + 7, y + 17, 2, 15);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(x, y, TILE, 2);
  }

  private drawUsedBlock(x: number, y: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#8a5a24';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = '#5a3a14';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
  }

  private drawMysteryBlock(x: number, y: number) {
    const ctx = this.ctx;
    const flash = Math.floor(this.animTimer / 20) % 2 === 0;
    ctx.fillStyle = flash ? '#fbd000' : '#e8a400';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = '#7a4a00';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
    ctx.fillStyle = '#7a4a00';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', x + TILE / 2, y + TILE / 2 + 1);
  }

  private drawPipe(x: number, y: number, ty: number) {
    const ctx = this.ctx;
    const isTop = this.tileAt(Math.round(x / TILE), ty - 1) !== 'p';
    ctx.fillStyle = '#0aa02a';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = '#4fdc62';
    ctx.fillRect(x + 4, y, 6, TILE);
    if (isTop) {
      ctx.fillStyle = '#0aa02a';
      ctx.fillRect(x - 3, y, TILE + 6, 12);
      ctx.fillStyle = '#4fdc62';
      ctx.fillRect(x - 3, y, TILE + 6, 4);
    }
  }

  private drawPlatform(x: number, y: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#d8a048';
    ctx.fillRect(x, y, TILE, 14);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x, y + 12, TILE, 3);
  }

  private drawCoin(x: number, y: number, size: number) {
    const ctx = this.ctx;
    const phase = Math.floor(this.animTimer / 10) % 4;
    const widths = [size, size * 0.6, size * 0.25, size * 0.6];
    const w = widths[phase];
    ctx.fillStyle = '#fbd000';
    ctx.beginPath();
    ctx.ellipse(x + size / 2, y + size / 2, Math.max(w / 2, 3), size / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c89400';
    ctx.beginPath();
    ctx.ellipse(x + size / 2, y + size / 2, Math.max(w / 6, 1.5), size / 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawFlag() {
    if (this.flagX < 0) return;
    const ctx = this.ctx;
    const x = this.flagX * TILE;
    ctx.fillStyle = '#d8d8d8';
    ctx.fillRect(x + 2, 9 * TILE, 6, 6 * TILE);
    ctx.fillStyle = '#2bb673';
    ctx.beginPath();
    ctx.moveTo(x + 8, 9 * TILE + 6);
    ctx.lineTo(x + 44, 9 * TILE + 22);
    ctx.lineTo(x + 8, 9 * TILE + 38);
    ctx.fill();
    ctx.fillStyle = '#fbd000';
    ctx.beginPath();
    ctx.arc(x + 5, 9 * TILE - 4, 7, 0, Math.PI * 2);
    ctx.fill();
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
    if (e.type === 'goomba') {
      ctx.fillStyle = '#8a4b1e';
      ctx.fillRect(e.x + 2, e.y, e.w - 4, e.h - 8);
      ctx.fillStyle = '#5a2f10';
      ctx.fillRect(e.x, e.y + e.h - 8, 10, 8);
      ctx.fillRect(e.x + e.w - 10, e.y + e.h - 8, 10, 8);
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
      ctx.fillStyle = '#e52521';
      ctx.fillRect(e.x + 2, e.y, e.w - 4, e.h - 10);
      ctx.fillStyle = '#fff';
      ctx.fillRect(e.x + 4, e.y + 3, 7, 7);
      ctx.fillRect(e.x + e.w - 11, e.y + 3, 7, 7);
      ctx.fillStyle = '#ffe6c8';
      ctx.fillRect(e.x + 6, e.y + e.h - 9, e.w - 12, 9);
      return;
    }
    if (e.type === 'star') {
      const cx = e.x + e.w / 2;
      const cy = e.y + e.h / 2;
      const pulse = Math.floor(this.animTimer / 8) % 2 === 0 ? '#fbd000' : '#fff350';
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
    const cycle = Math.floor(this.animTimer / 6) % 4;
    const step = this.onGround && Math.abs(this.pvx) > 0.5 ? cycle : 0;

    const cap = star ? (Math.floor(this.animTimer / 4) % 2 ? '#fff350' : '#fbd000') : '#e52521';
    const skin = '#ffc8a0';
    const outfit = star ? cap : '#2b4bd7';

    // Cap
    ctx.fillStyle = cap;
    ctx.fillRect(x + 2, y, w - 4, 7);
    ctx.fillRect(this.facing === 1 ? x + w - 8 : x, y + 2, 10, 5);
    // Face
    ctx.fillStyle = skin;
    ctx.fillRect(x + 3, y + 7, w - 6, 9);
    // Eye
    ctx.fillStyle = '#000';
    ctx.fillRect(this.facing === 1 ? x + w - 9 : x + 6, y + 8, 3, 5);
    // Mustache
    ctx.fillRect(this.facing === 1 ? x + w - 12 : x + 7, y + 13, 6, 3);
    // Body
    ctx.fillStyle = outfit;
    ctx.fillRect(x + 2, y + 16, w - 4, h - (this.big ? 30 : 22));
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
      // squat: draw body lower (simple visual squash)
      ctx.fillStyle = cap;
      ctx.fillRect(x + 2, y + h - 6, w - 4, 6);
    }
  }
}
