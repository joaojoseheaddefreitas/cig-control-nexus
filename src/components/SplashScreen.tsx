import { useState, useEffect, useCallback } from 'react';
import heroImg from '@/assets/cig-hero.png';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false);

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
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black cursor-pointer select-none transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
        exiting && 'scale-[2.5] opacity-0 pointer-events-none'
      )}
    >
      {/* Glow background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-amber-500/15 via-transparent to-transparent blur-3xl animate-pulse" />
      </div>

      {/* Hero image */}
      <img
        src={heroImg}
        alt="CIG CONTROL"
        className={cn(
          'relative z-10 w-[340px] md:w-[440px] lg:w-[520px] object-contain drop-shadow-[0_0_60px_rgba(245,158,11,0.35)] transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          exiting && 'scale-150'
        )}
      />

      {/* Call to action */}
      <p className={cn(
        'relative z-10 mt-8 text-sm tracking-[0.35em] uppercase text-amber-400/70 animate-pulse transition-opacity duration-500',
        exiting && 'opacity-0'
      )}>
        Pressione Enter ou clique para iniciar
      </p>
    </div>
  );
}
