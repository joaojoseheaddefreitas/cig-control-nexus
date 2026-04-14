import { useState, useEffect, useCallback } from 'react';
import heroImg from '@/assets/cig-hero.png';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false);
  const [pressed, setPressed] = useState(false);

  const dismiss = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setTimeout(onComplete, 900);
  }, [exiting, onComplete]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') dismiss();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dismiss]);

  return (
    <div
      onClick={dismiss}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black cursor-pointer select-none transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
        exiting && 'scale-[2.5] opacity-0 pointer-events-none'
      )}
    >
      {/* Animated energy overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Rotating gradient ring 1 */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vmax] h-[120vmax]"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, hsla(215, 75%, 48%, 0.08) 25%, transparent 50%, hsla(30, 90%, 50%, 0.06) 75%, transparent 100%)',
            animation: 'spin-slow 20s linear infinite',
          }}
        />
        {/* Rotating gradient ring 2 (counter) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vmax] h-[100vmax]"
          style={{
            background: 'conic-gradient(from 180deg, transparent 0%, hsla(145, 70%, 42%, 0.06) 30%, transparent 50%, hsla(200, 75%, 50%, 0.05) 80%, transparent 100%)',
            animation: 'spin-slow 30s linear infinite reverse',
          }}
        />
        {/* Central ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-amber-500/10 via-transparent to-transparent blur-3xl animate-pulse" />
      </div>

      {/* Hero image with press scale */}
      <img
        src={heroImg}
        alt="CIG CONTROL"
        className={cn(
          'relative z-10 w-full h-full object-contain drop-shadow-[0_0_60px_rgba(245,158,11,0.35)] transition-transform ease-[cubic-bezier(0.22,1,0.36,1)] p-4',
          exiting ? 'scale-150 duration-[900ms]' : pressed ? 'scale-[0.97] duration-150' : 'scale-100 duration-300'
        )}
      />

      {/* Call to action */}
      <p className={cn(
        'absolute bottom-8 z-10 text-sm tracking-[0.35em] uppercase text-amber-400/70 animate-pulse transition-opacity duration-500',
        exiting && 'opacity-0'
      )}>
        Toque para iniciar
      </p>

      <style>{`
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
