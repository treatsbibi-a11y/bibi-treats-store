'use client';

import { useEffect, useRef } from 'react';

/**
 * Smart auto-polling hook:
 * - Polls every `intervalMs` (default 5000ms) only when the browser tab is visible.
 * - Immediately revalidates when the user focuses the window or switches back to the tab.
 */
export function useSmartPolling(
  callback: () => void | Promise<void>,
  intervalMs = 5000,
  enabled = true
) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void savedCallback.current();
      }
    };

    const id = setInterval(tick, intervalMs);
    const onFocusOrVisible = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        void savedCallback.current();
      }
    };

    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [intervalMs, enabled]);
}
