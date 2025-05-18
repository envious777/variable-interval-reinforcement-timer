import { useEffect, useRef } from 'react';

/**
 * useTimeout - React hook for running a callback after a delay (like setTimeout, but cleans up on unmount or delay/callback change).
 *
 * @param callback Function to run after the delay
 * @param delay Delay in ms (number) or null/undefined to disable
 */
export function useTimeout(callback: () => void, delay: number | null | undefined) {
  const savedCallback = useRef(callback);
  // Always keep latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (typeof delay !== 'number' || delay < 0) return;
    const id = setTimeout(() => savedCallback.current(), delay);
    return () => clearTimeout(id);
  }, [delay]);
}
