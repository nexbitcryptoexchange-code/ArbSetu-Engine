import {useEffect, useState} from 'react';
import {useAuth} from '@/context/AuthContext';
import {api} from '@/lib/api';
import type {LeaderboardEntry, Run} from '@/types';

const Card = ({label, value, accent}: {label: string; value: string | number; accent: string}) => (
  <div className="pixel-panel rounded-lg bg-arcade-panel p-4">
    <p className="font-retro text-[8px] text-slate-400">{label}</p>
    <p className={`font-retro mt-2 text-base sm:text-lg ${accent}`}>{value}</p>
  </div>
);

export default function DashboardPage() {
  const {user, logout} = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);

  useEffect(() => {
    api.leaderboard().then((r) => setLeaderboard(r.leaderboard)).catch(() => undefined);
    api.myRuns().then((r) => setRuns(r.runs)).catch(() => undefined);
  }, [user?.stats.gamesPlayed, user?.stats.highScore]);

  const stats = user!.stats;

  return (
    <div className="min-h-screen bg-arcade-bg">
      {/* Header */}
      <header className="border-b-4 border-arcade-border bg-arcade-panel/70">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded bg-arcade-red font-retro text-sm text-white">
              {user!.name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <p className="font-retro text-[11px] text-white">{user!.name}</p>
              <p className="text-xs text-slate-400">{user!.email}</p>
            </div>
            {user!.role === 'admin' && (
              <span className="rounded bg-arcade-gold px-2 py-0.5 font-retro text-[8px] text-[#3b2a00]">ADMIN</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {user!.role === 'admin' && (
              <a
                href="#/admin"
                className="pixel-btn rounded bg-arcade-cyan px-4 py-2 font-retro text-[9px] text-[#00344d]"
              >
                ADMIN PANEL
              </a>
            )}
            <button
              onClick={logout}
              className="pixel-btn rounded bg-arcade-border px-4 py-2 font-retro text-[9px] text-slate-200"
            >
              LOG OUT
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        {/* Hero / play */}
        <section className="pixel-panel flex flex-col items-center gap-4 rounded-lg bg-gradient-to-b from-[#5c94fc] to-[#3a6fd8] p-6 text-center sm:p-10">
          <h1 className="font-retro text-lg text-white drop-shadow-[3px_3px_0_rgba(0,0,0,0.5)] sm:text-2xl">
            BITQUEST BROS
          </h1>
          <p className="max-w-md text-sm text-white/90">
            Run, jump and stomp through {stats.levelsUnlocked} unlocked level{stats.levelsUnlocked === 1 ? '' : 's'}. Grab coins,
            dodge goombas and reach the flag!
          </p>
          <a
            href="#/play"
            className="pixel-btn rounded-lg bg-arcade-gold px-8 py-4 font-retro text-xs text-[#3b2a00] sm:text-sm"
          >
            ▶ PLAY GAME
          </a>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Card label="HIGH SCORE" value={stats.highScore} accent="text-arcade-gold" />
          <Card label="TOTAL SCORE" value={stats.totalScore} accent="text-white" />
          <Card label="COINS" value={stats.coins} accent="text-arcade-gold" />
          <Card label="LEVELS UNLOCKED" value={stats.levelsUnlocked} accent="text-arcade-cyan" />
          <Card label="GAMES PLAYED" value={stats.gamesPlayed} accent="text-white" />
          <Card
            label="LAST PLAYED"
            value={stats.lastPlayedAt ? new Date(stats.lastPlayedAt).toLocaleDateString() : '—'}
            accent="text-slate-300"
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Leaderboard */}
          <section className="pixel-panel rounded-lg bg-arcade-panel p-4 sm:p-5">
            <h2 className="font-retro mb-4 text-[11px] text-arcade-gold">🏆 GLOBAL LEADERBOARD — TOP 10</h2>
            {leaderboard.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No scores yet — be the first champion!</p>
            ) : (
              <ol className="space-y-1.5">
                {leaderboard.map((entry, i) => (
                  <li
                    key={entry.id}
                    className={`flex items-center gap-3 rounded px-3 py-2 text-sm ${
                      entry.id === user!.id ? 'bg-arcade-gold/15 ring-1 ring-arcade-gold/50' : 'bg-arcade-bg/60'
                    }`}
                  >
                    <span className={`font-retro w-7 text-[10px] ${i < 3 ? 'text-arcade-gold' : 'text-slate-500'}`}>
                      {i + 1}.
                    </span>
                    <span className="flex-1 truncate font-medium">{entry.name}</span>
                    <span className="text-xs text-arcade-gold">🪙 {entry.coins}</span>
                    <span className="font-retro w-20 text-right text-[10px] text-white">{entry.highScore}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Recent runs */}
          <section className="pixel-panel rounded-lg bg-arcade-panel p-4 sm:p-5">
            <h2 className="font-retro mb-4 text-[11px] text-arcade-cyan">🕹️ YOUR RECENT RUNS</h2>
            {runs.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">Play your first game to see run history here.</p>
            ) : (
              <ul className="space-y-1.5">
                {runs.map((run) => (
                  <li key={run.id} className="flex items-center gap-3 rounded bg-arcade-bg/60 px-3 py-2 text-sm">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        run.outcome === 'won' ? 'bg-arcade-green/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {run.outcome === 'won' ? 'WON' : 'OVER'}
                    </span>
                    <span className="flex-1 text-slate-300">Level {run.level}</span>
                    <span className="text-arcade-gold">🪙 {run.coins}</span>
                    <span className="font-mono text-xs text-white">{run.score} pts</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
