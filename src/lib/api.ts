import type {AdminMetrics, AuthPayload, GameConfig, LeaderboardEntry, Run, User} from '@/types';

const TOKEN_KEY = 'bitquest.token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {'Content-Type': 'application/json'};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, {...options, headers});
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`);
  return body as T;
}

export const api = {
  signup: (name: string, email: string, password: string) =>
    request<AuthPayload>('/api/auth/signup', {method: 'POST', body: JSON.stringify({name, email, password})}),
  login: (email: string, password: string) =>
    request<AuthPayload>('/api/auth/login', {method: 'POST', body: JSON.stringify({email, password})}),
  logout: () => request<{ok: boolean}>('/api/auth/logout', {method: 'POST'}),
  me: () => request<{user: User}>('/api/auth/me'),
  resetPassword: (email: string, newPassword: string) =>
    request<{ok: boolean}>('/api/auth/reset-password', {method: 'POST', body: JSON.stringify({email, newPassword})}),

  leaderboard: () => request<{leaderboard: LeaderboardEntry[]}>('/api/leaderboard'),
  config: () => request<{config: GameConfig}>('/api/config'),
  submitRun: (run: {score: number; coins: number; level: number; levelsUnlocked: number; durationSec: number; outcome: 'won' | 'game-over'}) =>
    request<{run: Run; user: User}>('/api/runs', {method: 'POST', body: JSON.stringify(run)}),
  myRuns: () => request<{runs: Run[]}>('/api/me/runs'),

  adminMetrics: () => request<{metrics: AdminMetrics}>('/api/admin/metrics'),
  adminUsers: () => request<{users: User[]}>('/api/admin/users'),
  adminUpdateUser: (id: string, patch: {blocked?: boolean; role?: 'user' | 'admin'}) =>
    request<{user: User}>(`/api/admin/users/${id}`, {method: 'PATCH', body: JSON.stringify(patch)}),
  adminResetScores: (id: string) =>
    request<{user: User}>(`/api/admin/users/${id}/reset-scores`, {method: 'POST'}),
  adminUpdateConfig: (patch: Partial<GameConfig>) =>
    request<{config: GameConfig}>('/api/admin/config', {method: 'PATCH', body: JSON.stringify(patch)}),
};
