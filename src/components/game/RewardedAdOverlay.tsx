import {useEffect, useState} from 'react';
import {api} from '@/lib/api';
import type {AdSettings} from '@/types';

interface Props {
  settings: AdSettings;
  onComplete: () => void;
  onClose: () => void;
}

// Optional native AdMob bridge (e.g. Capacitor/WebView host). When absent the
// overlay falls back to a simulated rewarded ad so the flow is testable on the
// web and in Test Mode.
declare global {
  interface Window {
    AdMob?: {showRewardedAd?: (opts: {adUnitId: string}, cb: (rewarded: boolean) => void) => void};
  }
}

const AD_DURATION_SEC = 5;

export default function RewardedAdOverlay({settings, onComplete, onClose}: Props) {
  const [sim, setSim] = useState(false);
  const [remaining, setRemaining] = useState(AD_DURATION_SEC);

  useEffect(() => {
    api.trackAdEvent('rewarded', 'shown').catch(() => {});
    const bridge = window.AdMob;
    if (bridge?.showRewardedAd && !settings.testMode && settings.rewardedUnitId) {
      bridge.showRewardedAd({adUnitId: settings.rewardedUnitId}, (rewarded) => {
        api.trackAdEvent('rewarded', rewarded ? 'completed' : 'abandoned').catch(() => {});
        if (rewarded) onComplete();
        else onClose();
      });
      return;
    }
    setSim(true);
  }, [settings, onComplete, onClose]);

  useEffect(() => {
    if (!sim || remaining <= 0) return;
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [sim, remaining]);

  const claim = () => {
    api.trackAdEvent('rewarded', 'completed').catch(() => {});
    onComplete();
  };

  const skip = () => {
    api.trackAdEvent('rewarded', 'abandoned').catch(() => {});
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/90 px-4 text-center">
      {remaining > 0 ? (
        <>
          <p className="font-retro text-sm text-arcade-gold">{settings.testMode ? 'TEST REWARDED AD' : 'SPONSORED AD'}</p>
          <div className="flex h-40 w-full max-w-sm flex-col items-center justify-center gap-2 rounded-lg border-4 border-arcade-border bg-arcade-panel">
            <p className="font-retro animate-pulse text-3xl text-white">{remaining}</p>
            <p className="text-xs text-slate-400">Watch the ad to earn 3 extra lives…</p>
          </div>
          <div className="h-2 w-full max-w-sm overflow-hidden rounded bg-arcade-border">
            <div
              className="h-full bg-arcade-gold transition-all duration-1000 ease-linear"
              style={{width: `${((AD_DURATION_SEC - remaining) / AD_DURATION_SEC) * 100}%`}}
            />
          </div>
          <button onClick={skip} className="pixel-btn rounded bg-arcade-border px-4 py-2 font-retro text-[9px] text-slate-300">
            SKIP (NO REWARD)
          </button>
        </>
      ) : (
        <>
          <p className="font-retro text-lg text-arcade-gold">REWARD EARNED!</p>
          <button onClick={claim} className="pixel-btn rounded bg-arcade-green px-6 py-3 font-retro text-[10px] text-white">
            CLAIM 3 LIVES
          </button>
        </>
      )}
    </div>
  );
}
