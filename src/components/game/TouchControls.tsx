import type {MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent} from 'react';
import type {InputState} from '@/game/engine';

interface Props {
  input: InputState;
  onPressJump: () => void;
  onReleaseJump: () => void;
  onPressAttack: () => void;
  onReleaseAttack: () => void;
}

export default function TouchControls({input, onPressJump, onReleaseJump, onPressAttack, onReleaseAttack}: Props) {

  const bind = (key: keyof InputState | 'jump' | 'attack') => ({
    onPointerDown: (e: ReactPointerEvent) => {
      e.preventDefault();
      try {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch {
        /* pointer may already be released */
      }
      if (key === 'jump') onPressJump();
      else if (key === 'attack') onPressAttack();
      else input[key] = true;
    },
    onPointerUp: (e: ReactPointerEvent) => {
      e.preventDefault();
      if (key === 'jump') onReleaseJump();
      else if (key === 'attack') onReleaseAttack();
      else input[key] = false;
    },
    onPointerCancel: () => {
      if (key === 'jump') onReleaseJump();
      else if (key === 'attack') onReleaseAttack();
      else input[key] = false;
    },
    onLostPointerCapture: () => {
      if (key === 'jump') onReleaseJump();
      else if (key === 'attack') onReleaseAttack();
      else input[key] = false;
    },
    onContextMenu: (e: ReactMouseEvent) => e.preventDefault(),
  });

  const cls =
    'touch-btn flex items-center justify-center rounded-2xl border-4 border-black/40 bg-white/85 shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:bg-arcade-gold select-none';
  const arrow = (rotate: number) => (
    <svg width="22" height="22" viewBox="0 0 20 20" style={{transform: `rotate(${rotate}deg)`}} aria-hidden>
      <path d="M10 2 L18 17 L2 17 Z" fill="currentColor" />
    </svg>
  );

  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 flex items-end justify-between px-3 pb-3 sm:px-6 sm:pb-5"
      style={{touchAction: 'none'}}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* D-Pad */}
      <div className="grid grid-cols-3 grid-rows-2 gap-1.5">
        <div />
        <button aria-label="Jump" {...bind('jump')} className={`${cls} h-14 w-14 text-[#1a2140] sm:h-16 sm:w-16`}>
          {arrow(0)}
        </button>
        <div />
        <button aria-label="Move left" {...bind('left')} className={`${cls} h-14 w-14 text-[#1a2140] sm:h-16 sm:w-16`}>
          {arrow(-90)}
        </button>
        <button aria-label="Crouch" {...bind('down')} className={`${cls} h-14 w-14 text-[#1a2140] sm:h-16 sm:w-16`}>
          {arrow(180)}
        </button>
        <button aria-label="Move right" {...bind('right')} className={`${cls} h-14 w-14 text-[#1a2140] sm:h-16 sm:w-16`}>
          {arrow(90)}
        </button>
      </div>

      <p className="pointer-events-none mb-2 hidden text-center text-[10px] text-white/70 sm:block">
        Hold ▲ for a higher jump · double-tap ▲ for a double jump
      </p>

      {/* Action buttons: attack (fireball / run) + jump */}
      <div className="flex items-end gap-2">
        <button
          aria-label="Attack"
          {...bind('attack')}
          className={`${cls} h-14 w-14 font-retro text-[9px] text-[#7a2000] sm:h-16 sm:w-16 sm:text-[10px]`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="13" r="7" fill="#ff7b1c" />
            <circle cx="10" cy="11" r="3" fill="#fff3b0" />
          </svg>
        </button>
        <button
          aria-label="Jump action"
          {...bind('jump')}
          className={`${cls} h-20 w-20 font-retro text-[10px] sm:h-24 sm:w-24`}
        >
          JUMP
        </button>
      </div>
    </div>
  );
}
