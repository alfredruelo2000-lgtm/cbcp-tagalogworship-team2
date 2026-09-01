import { useCallback, useEffect, useRef, useState } from 'react';

/** Pixels per second for speeds 1–5. All five move visibly. */
export const SCROLL_SPEEDS = [10, 18, 30, 46, 68];

/**
 * One continuous rAF engine with a sub-pixel accumulator, so even speed 1 moves
 * steadily and every speed behaves the same on 60 Hz and 120 Hz screens.
 *
 * Any manual gesture pauses immediately and stays paused until Resume, unless
 * the reader opted into automatic resume after a few seconds.
 */
export function useAutoScroll(active: boolean, speed: number, autoResumeSeconds = 0) {
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const resumeAt = useRef<number | null>(null);
  const frame = useRef<number | null>(null);
  const last = useRef<number | null>(null);
  const remainder = useRef(0);
  const expected = useRef<number | null>(null);
  const tolerance = useRef(6);

  const resume = useCallback(() => {
    pausedRef.current = false;
    resumeAt.current = null;
    remainder.current = 0;
    last.current = null;
    expected.current = null;
    setPaused(false);
  }, []);

  useEffect(() => {
    if (!active) {
      pausedRef.current = false;
      resumeAt.current = null;
      setPaused(false);
      return;
    }

    const pause = () => {
      if (!pausedRef.current) {
        pausedRef.current = true;
        setPaused(true);
      }
      expected.current = null;
      remainder.current = 0;
      resumeAt.current = autoResumeSeconds > 0 ? performance.now() + autoResumeSeconds * 1000 : null;
    };

    const onKey = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) pause();
    };
    // A scroll we did not cause (momentum, scrollbar drag) also hands control back.
    // Tolerance covers one engine step so a fast speed never mistakes itself for the user.
    const onScroll = () => {
      if (pausedRef.current || expected.current === null) return;
      if (Math.abs(window.scrollY - expected.current) > tolerance.current) pause();
    };

    // The site scrolls smoothly for anchor jumps; during autoscroll each frame must
    // land immediately or the animated lag looks like a manual scroll and self-pauses.
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';

    window.addEventListener('wheel', pause, { passive: true });
    window.addEventListener('touchstart', pause, { passive: true });
    window.addEventListener('touchmove', pause, { passive: true });
    window.addEventListener('mousedown', pause);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });

    const tick = (time: number) => {
      frame.current = requestAnimationFrame(tick);
      const previous = last.current ?? time;
      last.current = time;

      if (pausedRef.current) {
        if (resumeAt.current !== null && time >= resumeAt.current) resume();
        return;
      }
      if (document.hidden) return;

      const pxPerSecond = SCROLL_SPEEDS[Math.min(5, Math.max(1, Math.round(speed))) - 1] ?? 30;
      const delta = Math.min(100, time - previous);
      remainder.current += (pxPerSecond * delta) / 1000;
      const step = Math.floor(remainder.current);
      if (step >= 1) {
        remainder.current -= step;
        window.scrollBy(0, step);
        expected.current = window.scrollY;
      }
    };

    last.current = null;
    remainder.current = 0;
    expected.current = null;
    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      last.current = null;
      expected.current = null;
      window.removeEventListener('wheel', pause);
      window.removeEventListener('touchstart', pause);
      window.removeEventListener('touchmove', pause);
      window.removeEventListener('mousedown', pause);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
    };
  }, [active, speed, autoResumeSeconds, resume]);

  return { paused, resume };
}
