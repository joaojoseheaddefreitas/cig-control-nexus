import { useEffect, useRef, useCallback } from 'react';

/**
 * Global keyboard listener for barcode/QR scanners.
 * Scanners typically type characters quickly and end with Enter.
 * This hook captures that pattern without needing a focused input.
 */
export function useBarcodeScanner(onScan: (code: string) => void) {
  const bufferRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if user is typing in an input/textarea
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (bufferRef.current.length >= 3) {
        onScan(bufferRef.current.trim());
      }
      bufferRef.current = '';
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Only accept printable characters
    if (e.key.length === 1) {
      bufferRef.current += e.key;
      // Reset buffer after 100ms of inactivity (human typing is slower)
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        bufferRef.current = '';
      }, 150);
    }
  }, [onScan]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handleKeyDown]);
}
