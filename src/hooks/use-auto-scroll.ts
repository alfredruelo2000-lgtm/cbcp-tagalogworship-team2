import { useEffect, useRef, useState } from 'react';

const SPEEDS = [8, 14, 22, 32, 44]; // pixels per second

/**
 * Auto-scroll that never fights the reader: a manual swipe or wheel gesture
 * yields immediately, then scrolling resumes from wherever the user landed.
 */
export function useAutoScroll(active: boolean, speed: number, resumeDelay = 1600) {
  const [yielding, setYielding] = useState(false);
  const yieldUntil = useRef(0);
  const frame = useRef<number | null>(null);
  const last = useRef<number | null>(null);
  const expected = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setYielding(false);
      return;
    }

    const nudge = () => {
      yieldUntil.current = performance.now() + resumeDelay;
      setYielding(true);
    };

    // Any input that moves the page hands control back to the user.
    const onWheel = () => nudge();
    const onTouch = () => nudge();
    const onKey = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) nudge();
    };
    // A scroll we did not cause (native momentum, scrollbar drag) also yields.
    const onScroll = () => {
      if (expected.current === null) return;
      if (Math.abs(window.scrollY - expected.current) > 6) nudge();
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });

    const tick = (time: number) => {
      const previous = last.current ?? time;
      last.current = time;
      const paused = time < yieldUntil.current || document.hidden;
      if (paused) {
        expected.current = null;
        if (!yielding) setYielding(true);
      } else {
        if (yielding) setYielding(false);
        const pxPerSecond = SPEEDS[Math.min(5, Math.max(1, speed)) - 1] ?? 22;
        const delta = Math.min(120, time - previous);
        const target = window.scrollY + (pxPerSecond * delta) / 1000;
        window.scrollTo({ top: target, behavior: 'auto' });
        expected.current = window.scrollY;
      }
      frame.current = requestAnimationFrame(tick);
    };

    last.current = null;
    expected.current = null;
    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      last.current = null;
      expected.current = null;
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
    };
    // `yielding` is intentionally excluded: it is an output of the loop, not an input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, speed, resumeDelay]);

  return { yielding };
}
