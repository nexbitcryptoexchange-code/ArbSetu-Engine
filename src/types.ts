export type Role = 'user' | 'admin';

export interface UserStats {
  highScore: number;
  totalScore: number;
  coins: number;
  levelsUnlocked: number;
  gamesPlayed: number;
  lastPlayedAt: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  blocked: boolean;
  createdAt: string;
  stats: UserStats;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  highScore: number;
  coins: number;
  gamesPlayed: number;
}

export interface Run {
  id: string;
  userId: string;
  userName?: string;
  score: number;
  coins: number;
  level: number;
  levelsUnlocked: number;
  durationSec: number;
  outcome: 'won' | 'game-over';
  playedAt: string;
}

export interface GameConfig {
  initialLives: number;
  coinPoints: number;
  goombaStompPoints: number;
  timeLimitSec: number;
  playerSpeed: number;
  jumpVelocity: number;
  gravity: number;
  goombaSpeed: number;
}

export interface AdSettings {
  enabled: boolean;
  testMode: boolean;
  appId: string;
  rewardedUnitId: string;
  bannerUnitId: string;
  interstitialUnitId: string;
}

export interface AdminMetrics {
  totalPlayers: number;
  activePlayers: number;
  blockedUsers: number;
  totalRuns: number;
  runsLast24h: number;
  globalHighScore: number;
  coinsCollected: number;
  adViews: number;
  adCompletions: number;
  adsLast24h: number;
  levelCompletionRates: {level: number; reached: number; rate: number}[];
  estRevenueUsd: number;
  topScores: {id: string; name: string; highScore: number}[];
  recentRuns: Run[];
}

export interface AuthPayload {
  token: string;
  user: User;
}
