import {useCallback, useEffect, useRef, useState} from 'react';
import {useAuth} from '@/context/AuthContext';
import {api} from '@/lib/api';
import {MarioGame, VIEW_H, VIEW_W, type HudState, type RunResult} from '@/game/engine';
import TouchControls from '@/components/game/TouchControls';
import type {GameConfig} from '@/types';

export default function GamePage() {
  const {user, setUser} = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<MarioGame | null>(null);
  const [hud, setHud] = useState<HudState>({score: 0, coins: 0, lives: 3, level: 1, timeLeft: 300, power: 'small'});
  const [result, setResult] = useState<(RunResult & {saved: boolean}) | null>(null);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [error, setError] = useState('');
  const [levelBanner, setLevelBanner] = useState<string | null>(null);

  const submitRun = useCallback(
    async (run: RunResult) => {
      try {
        const res = await api.submitRun(run);
        setUser(res.user);
        setResult({...run, saved: true});
      } catch {
        setResult({...run, saved: false});
      }
    },
    [setUser],
  );

  useEffect(() => {
    let cancelled = false;
    api
      .config()
      .then(({config}) => {
        if (cancelled || !canvasRef.current) return;
        setConfig(config);
        const game = new MarioGame({
          canvas: canvasRef.current,
          config,
          onHud: setHud,
          onExit: (run) => submitRun(run),
        });
        gameRef.current = game;
        game.start();
      })
      .catch(() => setError('Could not load game configuration. Is the server running?'));
    return () => {
      cancelled = true;
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, [submitRun]);

  // Show a banner when the level changes.
  useEffect(() => {
    setLevelBanner(`LEVEL ${hud.level}`);
    const t = setTimeout(() => setLevelBanner(null), 1800);
    return () => clearTimeout(t);
  }, [hud.level]);

  const restart = () => {
    setResult(null);
    gameRef.current?.destroy();
    gameRef.current = null;
    const canvas = canvasRef.current;
    if (!config || !canvas) return;
    const game = new MarioGame({canvas, config, onHud: setHud, onExit: (run) => submitRun(run)});
    gameRef.current = game;
    game.start();
  };

  const exitToDashboard = () => {
    window.location.hash = '#/dashboard';
  };

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-arcade-bg px-4 text-center">
        <p className="font-retro text-sm text-red-400">{error}</p>
        <button onClick={exitToDashboard} className="pixel-btn rounded bg-arcade-gold px-6 py-3 font-retro text-[10px] text-[#3b2a00]">
          BACK TO DASHBOARD
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-arcade-bg">
      {/* HUD */}
      <div className="font-retro flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2 text-[9px] text-white sm:px-6 sm:text-[11px]">
        <span className="text-arcade-gold">
          MARIO <span className="text-white">{String(hud.score).padStart(6, '0')}</span>
        </span>
        <span className="coin-blink text-arcade-gold">
          ×{String(hud.coins).padStart(2, '0')}
        </span>
        <span className="text-arcade-cyan">
          WORLD <span className="text-white">1-{hud.level}</span>
        </span>
        <span className="text-arcade-green">
          LIVES <span className="text-white">{'♥'.repeat(Math.max(0, Math.min(hud.lives, 5)))}</span>
        </span>
        <span className={hud.timeLeft <= 60 ? 'text-red-400' : 'text-white'}>
          TIME <span className={hud.timeLeft <= 60 ? 'text-red-400' : 'text-white'}>{hud.timeLeft}</span>
        </span>
        <span className="text-arcade-cyan">{user?.name}</span>
        <button
          onClick={exitToDashboard}
          className="pixel-btn rounded bg-arcade-red px-3 py-1.5 text-[8px] text-white sm:text-[9px]"
        >
          EXIT
        </button>
      </div>

      {/* Game canvas */}
      <div className="relative mx-auto w-full max-w-[1100px] flex-1 px-1 pb-2 sm:px-4">
        <div className="relative w-full overflow-hidden rounded-lg border-4 border-arcade-border bg-black shadow-2xl" style={{aspectRatio: `${VIEW_W} / ${VIEW_H}`}}>
          <canvas
            ref={canvasRef}
            width={VIEW_W}
            height={VIEW_H}
            className="game-canvas h-full w-full"
          />

          {levelBanner && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <p className="font-retro animate-pulse rounded-lg bg-black/60 px-6 py-4 text-lg text-arcade-gold sm:text-2xl">
                {levelBanner}
              </p>
            </div>
          )}

          {result ? (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/75 px-4 text-center">
              <p className={`font-retro text-xl sm:text-3xl ${result.outcome === 'won' ? 'text-arcade-gold' : 'text-arcade-red'}`}>
                {result.outcome === 'won' ? 'YOU WIN!' : 'GAME OVER'}
              </p>
              <div className="font-retro space-y-1 text-[10px] text-white sm:text-xs">
                <p>SCORE: {result.score}</p>
                <p>COINS: {result.coins}</p>
                <p>REACHED: LEVEL {result.level}</p>
                {!result.saved && <p className="text-red-400">Score could not be saved — check your connection.</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={restart} className="pixel-btn rounded bg-arcade-green px-5 py-3 font-retro text-[10px] text-white">
                  PLAY AGAIN
                </button>
                <button onClick={exitToDashboard} className="pixel-btn rounded bg-arcade-gold px-5 py-3 font-retro text-[10px] text-[#3b2a00]">
                  DASHBOARD
                </button>
              </div>
            </div>
          ) : (
            <TouchControls
              input={gameRef.current?.input ?? {left: false, right: false, down: false, jumpHeld: false}}
              onPressJump={() => gameRef.current?.pressJump()}
              onReleaseJump={() => gameRef.current?.releaseJump()}
            />
          )}
        </div>

        {/* Desktop keyboard hint */}
        <p className="mt-2 hidden text-center text-xs text-slate-400 md:block">
          Controls: ← → move · ↓ crouch · SPACE / ↑ jump (hold for higher, double-tap for double jump)
        </p>
      </div>
    </div>
  );
}
