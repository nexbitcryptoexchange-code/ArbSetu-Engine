import {useCallback, useEffect, useState} from 'react';
import {api} from '@/lib/api';
import type {AdSettings, AdminMetrics, GameConfig, User} from '@/types';

type AdminTab = 'overview' | 'ads';

const EMPTY_AD_FORM: AdSettings = {enabled: false, testMode: true, appId: '', rewardedUnitId: '', bannerUnitId: '', interstitialUnitId: ''};

export default function AdminPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [adSettings, setAdSettings] = useState<AdSettings>(EMPTY_AD_FORM);
  const [adForm, setAdForm] = useState<AdSettings>(EMPTY_AD_FORM);
  const [tab, setTab] = useState<AdminTab>('overview');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }, []);

  const reload = useCallback(async () => {
    try {
      const [m, u, c, a] = await Promise.all([api.adminMetrics(), api.adminUsers(), api.config(), api.adsConfig()]);
      setMetrics(m.metrics);
      setUsers(u.users);
      setConfig(c.config);
      setAdSettings(a.adSettings);
      setAdForm(a.adSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const updateUser = async (id: string, patch: {blocked?: boolean; role?: 'user' | 'admin'}, msg: string) => {
    try {
      await api.adminUpdateUser(id, patch);
      await reload();
      flash(msg);
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const resetScores = async (id: string) => {
    try {
      await api.adminResetScores(id);
      await reload();
      flash('Scores reset');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Reset failed');
    }
  };

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    try {
      const res = await api.adminUpdateConfig(config);
      setConfig(res.config);
      flash('Game configuration saved');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const setCfg = (key: keyof GameConfig, value: string) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return;
    setConfig((c) => (c ? {...c, [key]: num} : c));
  };

  const saveAdSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.adminUpdateAds(adForm);
      setAdSettings(res.adSettings);
      setAdForm(res.adSettings);
      flash('Ad settings saved');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const toggleSwitch = (checked: boolean, onChange: () => void, label: string, hint: string) => (
    <div className="flex items-center justify-between gap-4 rounded bg-arcade-bg/60 px-3 py-2.5">
      <div>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-arcade-green' : 'bg-arcade-border'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`}
        />
      </button>
    </div>
  );

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arcade-bg px-4 text-center">
        <p className="font-retro text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!metrics || !config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arcade-bg">
        <p className="font-retro animate-pulse text-sm text-arcade-gold">LOADING…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-arcade-bg">
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-arcade-green/50 bg-arcade-green/20 px-4 py-2 text-xs text-green-200">
          {toast}
        </div>
      )}

      <header className="border-b-4 border-arcade-border bg-arcade-panel/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <h1 className="font-retro text-[12px] text-arcade-gold sm:text-sm">⚙️ ADMIN CONTROL DECK</h1>
          <a href="#/dashboard" className="pixel-btn rounded bg-arcade-border px-4 py-2 font-retro text-[9px] text-slate-200">
            ← DASHBOARD
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        {/* Tabs */}
        <div className="flex gap-2">
          {(
            [
              ['overview', '📊 OVERVIEW'],
              ['ads', '📺 AD SETTINGS'],
            ] as [AdminTab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`pixel-btn rounded px-4 py-2 font-retro text-[9px] ${
                tab === id ? 'bg-arcade-gold text-[#3b2a00]' : 'bg-arcade-panel text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
        <>
        {/* Metrics */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            {label: 'REGISTERED PLAYERS', value: metrics.totalPlayers, accent: 'text-arcade-gold'},
            {label: 'ACTIVE PLAYERS (7D)', value: metrics.activePlayers, accent: 'text-arcade-green'},
            {label: 'GAMES PLAYED (ALL)', value: metrics.totalRuns, accent: 'text-white'},
            {label: 'RUNS LAST 24H', value: metrics.runsLast24h, accent: 'text-arcade-cyan'},
            {label: 'GLOBAL HIGH SCORE', value: metrics.globalHighScore, accent: 'text-arcade-gold'},
            {label: 'COINS COLLECTED', value: metrics.coinsCollected, accent: 'text-arcade-gold'},
            {label: 'AD VIEWS', value: metrics.adViews, accent: 'text-arcade-cyan'},
            {label: 'AD COMPLETIONS', value: metrics.adCompletions, accent: 'text-arcade-green'},
            {label: 'EST. AD REVENUE', value: `$${metrics.estRevenueUsd.toFixed(2)}`, accent: 'text-arcade-gold'},
            {label: 'BLOCKED ACCOUNTS', value: metrics.blockedUsers, accent: 'text-red-400'},
            {label: 'CONFIG: LIVES', value: config.initialLives, accent: 'text-white'},
          ].map((m) => (
            <div key={m.label} className="pixel-panel rounded-lg bg-arcade-panel p-4">
              <p className="font-retro text-[8px] text-slate-400">{m.label}</p>
              <p className={`font-retro mt-2 text-base sm:text-lg ${m.accent}`}>{m.value}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          {/* User management */}
          <section className="pixel-panel rounded-lg bg-arcade-panel p-4 sm:p-5">
            <h2 className="font-retro mb-4 text-[11px] text-arcade-cyan">👥 USER MANAGEMENT</h2>
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="font-retro border-b-2 border-arcade-border text-[8px] text-slate-400">
                    <th className="px-2 py-2">PLAYER</th>
                    <th className="px-2 py-2">HIGH SCORE</th>
                    <th className="px-2 py-2">GAMES</th>
                    <th className="px-2 py-2">STATUS</th>
                    <th className="px-2 py-2 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-arcade-border/50">
                      <td className="px-2 py-2.5">
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="px-2 py-2.5 font-mono text-arcade-gold">{u.stats.highScore}</td>
                      <td className="px-2 py-2.5 text-slate-300">{u.stats.gamesPlayed}</td>
                      <td className="px-2 py-2.5">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            u.blocked ? 'bg-red-500/20 text-red-300' : 'bg-arcade-green/20 text-green-300'
                          }`}
                        >
                          {u.blocked ? 'BLOCKED' : 'ACTIVE'}
                        </span>
                        <span
                          className={`ml-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                            u.role === 'admin' ? 'bg-arcade-gold/20 text-arcade-gold' : 'bg-arcade-border text-slate-300'
                          }`}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button
                            onClick={() => updateUser(u.id, {blocked: !u.blocked}, u.blocked ? 'Account unblocked' : 'Account blocked')}
                            className={`rounded px-2.5 py-1 text-[10px] font-bold ${
                              u.blocked ? 'bg-arcade-green text-white' : 'bg-arcade-red text-white'
                            }`}
                          >
                            {u.blocked ? 'UNBLOCK' : 'BLOCK'}
                          </button>
                          <button
                            onClick={() =>
                              updateUser(
                                u.id,
                                {role: u.role === 'admin' ? 'user' : 'admin'},
                                u.role === 'admin' ? 'Demoted to user' : 'Promoted to admin',
                              )
                            }
                            className="rounded bg-arcade-cyan px-2.5 py-1 text-[10px] font-bold text-[#00344d]"
                          >
                            {u.role === 'admin' ? 'MAKE USER' : 'MAKE ADMIN'}
                          </button>
                          <button
                            onClick={() => resetScores(u.id)}
                            className="rounded bg-arcade-border px-2.5 py-1 text-[10px] font-bold text-slate-200"
                          >
                            RESET SCORES
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Game configurator + top scores */}
          <div className="space-y-6">
            <section className="pixel-panel rounded-lg bg-arcade-panel p-4 sm:p-5">
              <h2 className="font-retro mb-4 text-[11px] text-arcade-gold">🎮 GAME CONFIGURATOR</h2>
              <form onSubmit={saveConfig} className="space-y-3">
                {(
                  [
                    ['initialLives', 'Initial Lives', 1, 10],
                    ['coinPoints', 'Coin Points', 10, 5000],
                    ['goombaStompPoints', 'Stomp Points', 10, 5000],
                    ['timeLimitSec', 'Time Limit (sec)', 30, 900],
                    ['playerSpeed', 'Player Speed (px/f)', 1, 10],
                    ['jumpVelocity', 'Jump Power', 5, 25],
                    ['gravity', 'Gravity', 0.1, 3],
                    ['goombaSpeed', 'Goomba Speed (px/f)', 0.2, 8],
                  ] as [keyof GameConfig, string, number, number][]
                ).map(([key, label, min, max]) => (
                  <label key={key} className="block">
                    <span className="mb-1 flex justify-between text-xs text-slate-400">
                      {label}
                      <span className="font-mono text-slate-200">{config[key]}</span>
                    </span>
                    <input
                      type="number"
                      step="any"
                      min={min}
                      max={max}
                      value={config[key]}
                      onChange={(e) => setCfg(key, e.target.value)}
                      className="w-full rounded border-2 border-arcade-border bg-arcade-bg px-3 py-1.5 text-sm outline-none focus:border-arcade-gold"
                    />
                  </label>
                ))}
                <button type="submit" className="pixel-btn w-full rounded bg-arcade-gold py-2.5 font-retro text-[10px] text-[#3b2a00]">
                  SAVE CONFIGURATION
                </button>
              </form>
            </section>

            <section className="pixel-panel rounded-lg bg-arcade-panel p-4 sm:p-5">
              <h2 className="font-retro mb-4 text-[11px] text-arcade-cyan">🏅 TOP SCORES</h2>
              <ol className="space-y-1.5">
                {metrics.topScores.map((s, i) => (
                  <li key={s.id} className="flex items-center gap-2 rounded bg-arcade-bg/60 px-3 py-1.5 text-sm">
                    <span className="font-retro w-6 text-[10px] text-arcade-gold">{i + 1}.</span>
                    <span className="flex-1 truncate">{s.name}</span>
                    <span className="font-mono text-xs text-white">{s.highScore}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>

        {/* Level completion rates */}
        <section className="pixel-panel rounded-lg bg-arcade-panel p-4 sm:p-5">
          <h2 className="font-retro mb-4 text-[11px] text-arcade-green">📈 LEVEL COMPLETION RATES</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {metrics.levelCompletionRates.map((l) => (
              <div key={l.level} className="rounded bg-arcade-bg/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-retro text-[9px] text-slate-300">LEVEL {l.level}</p>
                  <p className="font-retro text-[10px] text-arcade-gold">{l.rate}%</p>
                </div>
                <div className="h-2.5 overflow-hidden rounded bg-arcade-border">
                  <div
                    className={`h-full rounded ${l.rate >= 66 ? 'bg-arcade-green' : l.rate >= 33 ? 'bg-arcade-gold' : 'bg-arcade-red'}`}
                    style={{width: `${Math.min(100, l.rate)}%`}}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">{l.reached} of {metrics.totalRuns} runs reached</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recent runs */}
        <section className="pixel-panel rounded-lg bg-arcade-panel p-4 sm:p-5">
          <h2 className="font-retro mb-4 text-[11px] text-white">📊 RECENT GAMES PLAYED</h2>
          {metrics.recentRuns.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">No games played yet.</p>
          ) : (
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="font-retro border-b-2 border-arcade-border text-[8px] text-slate-400">
                    <th className="px-2 py-2">PLAYER</th>
                    <th className="px-2 py-2">SCORE</th>
                    <th className="px-2 py-2">COINS</th>
                    <th className="px-2 py-2">LEVEL</th>
                    <th className="px-2 py-2">OUTCOME</th>
                    <th className="px-2 py-2">WHEN</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentRuns.map((r) => (
                    <tr key={r.id} className="border-b border-arcade-border/50">
                      <td className="px-2 py-2">{r.userName}</td>
                      <td className="px-2 py-2 font-mono text-arcade-gold">{r.score}</td>
                      <td className="px-2 py-2">{r.coins}</td>
                      <td className="px-2 py-2">{r.level}</td>
                      <td className="px-2 py-2">{r.outcome === 'won' ? 'Won' : 'Game over'}</td>
                      <td className="px-2 py-2 text-xs text-slate-500">{new Date(r.playedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        </>
        )}

        {tab === 'ads' && (
          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            {/* AdMob configurator */}
            <section className="pixel-panel rounded-lg bg-arcade-panel p-4 sm:p-5">
              <h2 className="font-retro mb-4 text-[11px] text-arcade-gold">📺 ADMOB MANAGEMENT</h2>
              <form onSubmit={saveAdSettings} className="space-y-3">
                {(
                  [
                    ['appId', 'AdMob App ID', 'ca-app-pub-XXXX~YYYY'],
                    ['rewardedUnitId', 'Rewarded Ad Unit ID', 'ca-app-pub-XXXX/RRRR'],
                    ['bannerUnitId', 'Banner Ad Unit ID', 'ca-app-pub-XXXX/BBBB'],
                    ['interstitialUnitId', 'Interstitial Ad Unit ID', 'ca-app-pub-XXXX/IIII'],
                  ] as [keyof AdSettings, string, string][]
                ).map(([key, label, placeholder]) => (
                  <label key={key} className="block">
                    <span className="mb-1 block text-xs text-slate-400">{label}</span>
                    <input
                      type="text"
                      value={adForm[key] as string}
                      placeholder={placeholder}
                      onChange={(e) => setAdForm((f) => ({...f, [key]: e.target.value}))}
                      className="w-full rounded border-2 border-arcade-border bg-arcade-bg px-3 py-1.5 font-mono text-xs outline-none focus:border-arcade-gold"
                    />
                  </label>
                ))}
                {toggleSwitch(adForm.enabled, () => setAdForm((f) => ({...f, enabled: !f.enabled})), 'Enable Ads', 'Show the Watch-Ad continue option in-game')}
                {toggleSwitch(adForm.testMode, () => setAdForm((f) => ({...f, testMode: !f.testMode})), 'Test Mode', 'Use simulated ads for development testing')}
                <button type="submit" className="pixel-btn w-full rounded bg-arcade-gold py-2.5 font-retro text-[10px] text-[#3b2a00]">
                  SAVE AD SETTINGS
                </button>
              </form>
            </section>

            {/* Ad analytics */}
            <section className="pixel-panel rounded-lg bg-arcade-panel p-4 sm:p-5">
              <h2 className="font-retro mb-4 text-[11px] text-arcade-cyan">📈 AD ANALYTICS</h2>
              <div className="space-y-3">
                {[
                  {label: 'TOTAL AD VIEWS', value: metrics.adViews, accent: 'text-arcade-cyan'},
                  {label: 'AD COMPLETIONS', value: metrics.adCompletions, accent: 'text-arcade-green'},
                  {
                    label: 'COMPLETION RATE',
                    value: metrics.adViews > 0 ? `${Math.round((metrics.adCompletions / metrics.adViews) * 100)}%` : '—',
                    accent: 'text-arcade-gold',
                  },
                  {label: 'AD EVENTS (24H)', value: metrics.adsLast24h, accent: 'text-white'},
                  {label: 'EST. REVENUE', value: `$${metrics.estRevenueUsd.toFixed(2)}`, accent: 'text-arcade-gold'},
                ].map((m) => (
                  <div key={m.label} className="flex items-center justify-between rounded bg-arcade-bg/60 px-3 py-2.5">
                    <p className="font-retro text-[8px] text-slate-400">{m.label}</p>
                    <p className={`font-retro text-sm ${m.accent}`}>{m.value}</p>
                  </div>
                ))}
                <p className="text-xs text-slate-500">
                  Ads are currently{' '}
                  <span className={adSettings.enabled ? 'text-green-300' : 'text-red-300'}>{adSettings.enabled ? 'ENABLED' : 'DISABLED'}</span>
                  {adSettings.enabled && adSettings.testMode ? ' (test mode)' : ''}.
                </p>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
