import {useCallback, useEffect, useRef, useState} from 'react';
import {useAuth} from '@/context/AuthContext';
import {api} from '@/lib/api';
import {MarioGame, VIEW_H, VIEW_W, type HudState, type RunResult} from '@/game/engine';
import {audio} from '@/game/audio';
import TouchControls from '@/components/game/TouchControls';
import RewardedAdOverlay from '@/components/game/RewardedAdOverlay';
import type {AdSettings, GameConfig} from '@/types';

const CONTINUE_LIVES = 3;

const EMPTY_INPUT = {left: false, right: false, down: false, jumpHeld: false, attackHeld: false};

export default function GamePage() {
  const {user, setUser} = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<MarioGame | null>(null);
  const configRef = useRef<GameConfig | null>(null);
  const restartPendingRef = useRef(false);
  const submitRunRef = useRef<(run: RunResult) => void>(() => {});
  const [hud, setHud] = useState<HudState>({score: 0, coins: 0, lives: 3, level: 1, timeLeft: 300, power: 'small'});
  const [result, setResult] = useState<(RunResult & {saved: boolean}) | null>(null);
  const [adSettings, setAdSettings] = useState<AdSettings | null>(null);
  const [overPrompt, setOverPrompt] = useState(false);
  const [adOpen, setAdOpen] = useState(false);
  const [error, setError] = useState('');
  const [levelBanner, setLevelBanner] = useState<string | null>(null);
  const [muted, setMuted] = useState(audio.muted);

  const startGame = useCallback((cfg: GameConfig) => {
    gameRef.current?.destroy();
    gameRef.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setResult(null);
    setOverPrompt(false);
    setAdOpen(false);
    const game = new MarioGame({
      canvas,
      config: cfg,
      onHud: setHud,
      onExit: (run) => submitRunRef.current(run),
      onGameOverPrompt: () => setOverPrompt(true),
    });
    gameRef.current = game;
    game.start();
  }, []);

  const submitRun = async (run: RunResult) => {
    const andRestart = restartPendingRef.current;
    restartPendingRef.current = false;
    let saved = true;
    try {
      const res = await api.submitRun(run);
      setUser(res.user);
    } catch {
      saved = false;
    }
    if (andRestart && configRef.current) {
      startGame(configRef.current);
    } else {
      setResult({...run, saved});
    }
  };
  submitRunRef.current = submitRun;

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.config(), api.adsConfig()])
      .then(([{config: cfg}, {adSettings: ads}]) => {
        if (cancelled || !canvasRef.current) return;
        configRef.current = cfg;
        setAdSettings(ads);
        startGame(cfg);
      })
      .catch(() => setError('Could not load game configuration. Is the server running?'));
    return () => {
      cancelled = true;
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, [startGame]);

  // Browsers only allow audio after a user gesture — unlock on first input.
  useEffect(() => {
    const unlock = () => audio.ensure();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Show a banner when the level changes.
  useEffect(() => {
    setLevelBanner(`LEVEL ${hud.level}`);
    const t = setTimeout(() => setLevelBanner(null), 1800);
    return () => clearTimeout(t);
  }, [hud.level]);

  const restart = () => {
    if (configRef.current) startGame(configRef.current);
  };

  const exitToDashboard = () => {
    audio.stopBgm();
    window.location.hash = '#/dashboard';
  };

  const toggleMute = () => {
    audio.ensure();
    setMuted(audio.toggleMuted());
  };

  const handleAdComplete = useCallback(() => {
    setAdOpen(false);
    gameRef.current?.grantContinue(CONTINUE_LIVES);
    setOverPrompt(false);
  }, []);

  const handleAdClose = useCallback(() => {
    setAdOpen(false);
  }, []);

  const restartFromModal = () => {
    restartPendingRef.current = true;
    gameRef.current?.endGame();
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
        {hud.power === 'fire' && <span className="text-orange-400">FIRE!</span>}
        <span className={hud.timeLeft <= 60 ? 'text-red-400' : 'text-white'}>
          TIME <span className={hud.timeLeft <= 60 ? 'text-red-400' : 'text-white'}>{hud.timeLeft}</span>
        </span>
        <span className="text-arcade-cyan">{user?.name}</span>
        <button
          onClick={toggleMute}
          aria-label={muted ? 'Unmute sound' : 'Mute sound'}
          className={`pixel-btn rounded px-3 py-1.5 text-[8px] sm:text-[9px] ${muted ? 'bg-arcade-red text-white' : 'bg-arcade-green text-white'}`}
        >
          {muted ? '🔇 SOUND OFF' : '🔊 SOUND ON'}
        </button>
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

          {overPrompt && !result && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-black/80 px-4 text-center">
              <p className="font-retro text-xl text-arcade-red sm:text-3xl">GAME OVER</p>
              <p className="font-retro text-[10px] text-white sm:text-xs">OUT OF LIVES — CONTINUE?</p>
              {adSettings?.enabled && (
                <button
                  onClick={() => setAdOpen(true)}
                  className="pixel-btn rounded bg-arcade-green px-5 py-3 font-retro text-[10px] text-white"
                >
                  ▶ WATCH VIDEO AD
                  <span className="mt-1 block text-[8px] text-green-200">GET {CONTINUE_LIVES} EXTRA LIVES &amp; CONTINUE</span>
                </button>
              )}
              <div className="flex gap-3">
                <button onClick={restartFromModal} className="pixel-btn rounded bg-arcade-gold px-5 py-3 font-retro text-[10px] text-[#3b2a00]">
                  RESTART GAME
                </button>
                <button onClick={exitToDashboard} className="pixel-btn rounded bg-arcade-border px-5 py-3 font-retro text-[10px] text-slate-200">
                  DASHBOARD
                </button>
              </div>
            </div>
          )}

          {adOpen && adSettings && (
            <RewardedAdOverlay settings={adSettings} onComplete={handleAdComplete} onClose={handleAdClose} />
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
            !overPrompt &&
            !adOpen && (
              <TouchControls
                input={gameRef.current?.input ?? EMPTY_INPUT}
                onPressJump={() => gameRef.current?.pressJump()}
                onReleaseJump={() => gameRef.current?.releaseJump()}
                onPressAttack={() => gameRef.current?.pressAttack()}
                onReleaseAttack={() => gameRef.current?.releaseAttack()}
              />
            )
          )}
        </div>

        {/* Desktop keyboard hint */}
        <p className="mt-2 hidden text-center text-xs text-slate-400 md:block">
          Controls: ← → move · ↓ crouch · SPACE / ↑ jump (hold = higher, double-tap = double jump) · X / SHIFT throw fireball &amp; run
        </p>
      </div>
    </div>
  );
}
