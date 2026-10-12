export const TILE = 32;
export const ROWS = 17;

export type Theme = 'grass' | 'cave' | 'sky' | 'castle';

export interface LevelData {
  name: string;
  theme: Theme;
  width: number; // in tiles
  grid: string[][]; // [row][col], chars: '.' '#' 'B' '?' 'M' 'S' 'I' 'U' 'p' '=' 'F' 'C' 'K'
  goombas: {x: number; y: number}[];
  boss: {x: number; y: number} | null;
  spawn: {x: number; y: number};
}

class LevelBuilder {
  grid: string[][];
  goombas: {x: number; y: number}[] = [];
  boss: {x: number; y: number} | null = null;
  spawn = {x: 2, y: 13};

  constructor(public width: number) {
    this.grid = Array.from({length: ROWS}, () => Array.from({length: width}, () => '.'));
  }

  set(x: number, y: number, ch: string) {
    if (x >= 0 && x < this.width && y >= 0 && y < ROWS) this.grid[y][x] = ch;
    return this;
  }

  ground(x0: number, x1: number) {
    for (let x = x0; x <= x1; x++) {
      this.set(x, 15, '#');
      this.set(x, 16, '#');
    }
    return this;
  }

  pipe(x: number, height: number) {
    for (let i = 0; i < height; i++) this.set(x, 14 - i, 'p');
    return this;
  }

  platform(x0: number, x1: number, y: number, ch = '=') {
    for (let x = x0; x <= x1; x++) this.set(x, y, ch);
    return this;
  }

  coins(x0: number, x1: number, y: number) {
    for (let x = x0; x <= x1; x++) this.set(x, y, 'C');
    return this;
  }

  stairs(x: number, h: number, dir: 1 | -1) {
    for (let i = 0; i < h; i++) {
      for (let j = 0; j <= i; j++) this.set(x + i * dir, 14 - j, '#');
    }
    return this;
  }

  goomba(x: number, y = 14) {
    this.goombas.push({x, y});
    return this;
  }

  at(x: number, y: number) {
    this.boss = {x, y};
    return this;
  }

  checkpoint(x: number) {
    this.set(x, 14, 'K');
    return this;
  }

  flag(x: number) {
    this.set(x, 9, 'F');
    return this;
  }

  data(name: string, theme: Theme): LevelData {
    return {name, theme, width: this.width, grid: this.grid, goombas: this.goombas, boss: this.boss, spawn: this.spawn};
  }
}

function level1(): LevelData {
  const b = new LevelBuilder(150);
  b.spawn = {x: 2, y: 13};
  b.ground(0, 69);
  b.ground(73, 90);
  b.ground(94, 149);

  // Opening blocks
  b.set(16, 11, '?');
  b.set(20, 11, 'B').set(21, 11, '?').set(22, 11, 'B').set(21, 7, 'I');
  b.goomba(32);
  b.coins(26, 28, 11);

  // Pipes
  b.pipe(30, 2).pipe(38, 3).pipe(46, 4);
  b.goomba(35).goomba(43);

  // Mystery power-ups
  b.set(52, 11, 'M');
  b.set(54, 11, '?').set(55, 11, 'B');
  b.goomba(57).goomba(59);
  b.checkpoint(62);

  // First gap (3 tiles) with floating platform
  b.platform(70, 72, 11);
  b.coins(70, 72, 10);

  // Section after gap
  b.set(78, 11, '?').set(80, 11, 'S');
  b.goomba(84).goomba(86);

  // Second gap (3 tiles)
  b.platform(91, 93, 12);
  b.coins(91, 93, 11);

  // Staircase & brick corridor
  b.stairs(96, 4, 1);
  b.platform(104, 112, 10, 'B');
  b.set(106, 10, '?').set(110, 10, 'M');
  b.goomba(108);
  b.coins(104, 112, 7);
  b.stairs(114, 4, -1);

  // Final stretch
  b.goomba(124).goomba(127);
  b.set(126, 11, '?');
  b.pipe(134, 2);
  b.flag(143);

  return b.data('1-1 Grassland Gateway', 'grass');
}

function level2(): LevelData {
  const b = new LevelBuilder(160);
  b.spawn = {x: 2, y: 13};
  b.ground(0, 40);
  b.ground(44, 78);
  b.ground(82, 118);
  b.ground(122, 159);

  b.set(12, 11, '?').set(14, 11, 'B').set(16, 11, 'I');
  b.goomba(18).goomba(22);

  b.platform(24, 28, 10);
  b.coins(24, 28, 9);
  b.set(26, 6, '?');

  b.pipe(32, 3).pipe(37, 2);
  b.goomba(35);
  b.checkpoint(39);

  // gap 41-43
  b.platform(41, 43, 12);
  b.coins(41, 43, 11);

  b.set(48, 11, 'S');
  b.goomba(52).goomba(54).goomba(56);

  b.platform(58, 62, 9, 'B');
  b.set(60, 9, '?');
  b.coins(58, 62, 6);

  b.pipe(66, 4);
  b.goomba(70).goomba(72);
  b.set(74, 11, '?').set(76, 11, 'M');

  // gap 79-81
  b.platform(79, 81, 11);
  b.coins(79, 81, 10);

  b.stairs(84, 3, 1);
  b.platform(90, 100, 10, 'B');
  b.set(93, 10, 'M').set(97, 10, '?');
  b.goomba(94).goomba(98);
  b.coins(90, 100, 7);
  b.stairs(102, 3, -1);
  b.checkpoint(106);

  b.goomba(108).goomba(111).goomba(114);
  b.set(110, 11, '?').set(112, 11, '?');

  // gap 119-121
  b.platform(119, 121, 12);

  b.stairs(126, 5, 1);
  b.coins(132, 138, 9);
  b.goomba(134).goomba(138);
  b.set(140, 11, 'I');
  b.pipe(146, 2);
  b.flag(153);

  return b.data('2-1 Underground Depths', 'cave');
}

function level3(): LevelData {
  const b = new LevelBuilder(170);
  b.spawn = {x: 2, y: 13};
  b.ground(0, 30);
  b.ground(36, 60);
  b.ground(66, 92);
  b.ground(98, 126);
  b.ground(132, 169);

  b.set(10, 11, '?').set(12, 11, 'M');
  b.goomba(14).goomba(16);

  // Platforms over first gap (31-35)
  b.platform(31, 32, 12).platform(34, 35, 10);
  b.coins(34, 35, 9);

  b.set(40, 11, 'I');
  b.goomba(44).goomba(47);
  b.checkpoint(49);

  b.platform(50, 52, 9).platform(54, 56, 7);
  b.set(55, 3, '?');
  b.coins(54, 56, 6);

  b.pipe(58, 2);

  // gap 61-65 (wide, use two platforms)
  b.platform(61, 62, 11).platform(64, 65, 9);
  b.coins(64, 65, 8);

  b.goomba(70).goomba(73).goomba(76);
  b.set(72, 11, '?').set(74, 11, '?');

  b.platform(80, 86, 10, 'B');
  b.set(82, 10, 'M').set(84, 10, '?');
  b.coins(80, 86, 7);

  // gap 93-97
  b.platform(93, 94, 11).platform(96, 97, 9);
  b.coins(96, 97, 8);
  b.checkpoint(99);

  b.goomba(102).goomba(105).goomba(108).goomba(111);
  b.set(104, 11, '?').set(108, 11, 'S');

  b.platform(114, 120, 8, 'B');
  b.coins(114, 120, 5);
  b.goomba(117);

  // gap 127-131
  b.platform(127, 128, 10).platform(130, 131, 8);
  b.coins(130, 131, 7);

  b.stairs(136, 5, 1);
  b.goomba(146).goomba(150);
  b.set(148, 11, 'I');
  b.pipe(154, 2);
  // Boss guards the approach to the flag.
  b.at(160, 12);
  b.flag(166);

  return b.data('3-1 Castle Havoc', 'castle');
}

export const LEVEL_BUILDERS = [level1, level2, level3];
export const LEVEL_COUNT = LEVEL_BUILDERS.length;
export const LEVEL_NAMES = ['GRASSLAND', 'UNDERGROUND', 'CASTLE'];
