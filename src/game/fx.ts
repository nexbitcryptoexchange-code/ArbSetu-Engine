// Mobile haptic feedback via the Vibration API (no-op on unsupported devices).
export function haptic(pattern: number | readonly number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const p: number | number[] = typeof pattern === 'number' ? pattern : [...pattern];
      navigator.vibrate(p);
    }
  } catch {
    /* vibration unavailable */
  }
}

export const HAPTICS = {
  jump: 10,
  doubleJump: 16,
  coin: 12,
  stomp: 18,
  fireball: 8,
  hurt: [24, 40, 24],
  checkpoint: [10, 30, 10],
  gameover: [40, 60, 40, 60, 80],
  powerup: [10, 20, 10, 20, 20],
} as const;

// ---------------------------------------------------------------------------
// Pooled particle system (fixed-capacity, zero allocations per frame)
// ---------------------------------------------------------------------------
export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  glow: boolean;
}

export class ParticlePool {
  readonly particles: Particle[];
  private cursor = 0;

  constructor(readonly capacity = 420) {
    this.particles = Array.from({length: capacity}, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 3,
      color: '#fff',
      gravity: 0.3,
      glow: false,
    }));
  }

  private next(): Particle | null {
    for (let i = 0; i < this.capacity; i++) {
      const p = this.particles[this.cursor];
      this.cursor = (this.cursor + 1) % this.capacity;
      if (!p.active) return p;
    }
    return null; // pool exhausted: oldest slot semantics would cost more than skipping
  }

  emit(x: number, y: number, opts: Partial<Omit<Particle, 'active' | 'life' | 'maxLife'>> & {life?: number} = {}) {
    const p = this.next();
    if (!p) return;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = opts.vx ?? 0;
    p.vy = opts.vy ?? 0;
    p.maxLife = opts.life ?? 30;
    p.life = p.maxLife;
    p.size = opts.size ?? 3;
    p.color = opts.color ?? '#fff';
    p.gravity = opts.gravity ?? 0.3;
    p.glow = opts.glow ?? false;
  }

  burst(x: number, y: number, count: number, colors: string[], speed = 3, opts: {life?: number; gravity?: number; size?: number; glow?: boolean} = {}) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const v = speed * (0.4 + Math.random() * 0.8);
      this.emit(x, y, {
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - speed * 0.3,
        color: colors[i % colors.length],
        life: (opts.life ?? 34) * (0.7 + Math.random() * 0.6),
        gravity: opts.gravity ?? 0.28,
        size: opts.size ?? 3 + Math.random() * 2,
        glow: opts.glow ?? false,
      });
    }
  }

  update() {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      if (--p.life <= 0) p.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      if (!p.active) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      if (p.glow) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife) * 0.35;
        ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    for (const p of this.particles) p.active = false;
  }
}
