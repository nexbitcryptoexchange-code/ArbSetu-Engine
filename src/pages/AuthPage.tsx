import {FormEvent, useState} from 'react';
import {useAuth} from '@/context/AuthContext';

type Mode = 'login' | 'signup' | 'reset';

export default function AuthPage() {
  const {login, signup, resetPassword} = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setNotice('');
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'signup') {
        await signup(name, email, password);
      } else {
        await resetPassword(email, password);
        switchMode('login');
        setNotice('Password reset successful — you can sign in now.');
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-arcade-bg px-4 py-10">
      {/* Floating pixel clouds for retro flavor */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-40" aria-hidden>
        <div className="absolute left-[8%] top-[12%] h-8 w-24 rounded-full bg-arcade-sky/30" />
        <div className="absolute right-[10%] top-[22%] h-6 w-20 rounded-full bg-arcade-sky/20" />
        <div className="absolute bottom-[14%] left-[16%] h-6 w-16 rounded-full bg-arcade-sky/20" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-retro text-2xl text-arcade-gold drop-shadow-[3px_3px_0_rgba(0,0,0,0.6)] sm:text-3xl">
            BITQUEST BROS
          </h1>
          <p className="mt-3 font-retro text-[10px] text-arcade-cyan">RETRO PLATFORM ARCADE</p>
        </div>

        <div className="pixel-panel rounded-lg bg-arcade-panel p-6 sm:p-8">
          <div className="mb-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`pixel-btn rounded px-3 py-2 font-retro text-[10px] ${
                mode === 'login' ? 'bg-arcade-red text-white' : 'bg-arcade-border text-slate-300'
              }`}
            >
              LOGIN
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`pixel-btn rounded px-3 py-2 font-retro text-[10px] ${
                mode === 'signup' ? 'bg-arcade-green text-white' : 'bg-arcade-border text-slate-300'
              }`}
            >
              SIGN UP
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'signup' && (
              <label className="block">
                <span className="mb-1 block font-retro text-[9px] text-slate-300">PLAYER NAME</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Mario"
                  className="w-full rounded border-2 border-arcade-border bg-arcade-bg px-3 py-2.5 text-sm outline-none focus:border-arcade-gold"
                />
              </label>
            )}
            <label className="block">
              <span className="mb-1 block font-retro text-[9px] text-slate-300">EMAIL</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded border-2 border-arcade-border bg-arcade-bg px-3 py-2.5 text-sm outline-none focus:border-arcade-gold"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-retro text-[9px] text-slate-300">
                {mode === 'reset' ? 'NEW PASSWORD' : 'PASSWORD'}
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder={mode === 'reset' ? 'New password (min 6 chars)' : '••••••••'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full rounded border-2 border-arcade-border bg-arcade-bg px-3 py-2.5 text-sm outline-none focus:border-arcade-gold"
              />
            </label>

            {error && (
              <p className="rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-300" role="alert">
                {error}
              </p>
            )}
            {notice && (
              <p className="rounded border border-arcade-green/50 bg-arcade-green/10 px-3 py-2 text-xs text-green-300" role="status">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="pixel-btn w-full rounded bg-arcade-gold py-3 font-retro text-[11px] text-[#3b2a00] disabled:opacity-60"
            >
              {busy ? 'PLEASE WAIT…' : mode === 'login' ? 'START GAME' : mode === 'signup' ? 'CREATE ACCOUNT' : 'RESET PASSWORD'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => switchMode(mode === 'reset' ? 'login' : 'reset')}
            className="mt-4 w-full text-center text-xs text-arcade-cyan underline-offset-2 hover:underline"
          >
            {mode === 'reset' ? '← Back to login' : 'Forgot your password?'}
          </button>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-500">
          Demo admin: <span className="font-mono text-slate-400">admin@bitquest.game / admin123</span>
        </p>
      </div>
    </div>
  );
}
