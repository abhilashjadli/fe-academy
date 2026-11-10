import { useEffect, useState } from "react";

/** 0 → 1 (smoothstep) over `ms` once `on` turns true; 0 while off. Restarts when `nonce` changes. */
export function useProgress(on: boolean, ms = 1100, nonce: unknown = 0): number {
  const [t, setT] = useState(on ? 1 : 0);
  useEffect(() => {
    if (!on) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const u = Math.min(1, (now - t0) / ms);
      setT(u < 1 ? u * u * (3 - 2 * u) : 1);
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      setT(0);
    };
  }, [on, ms, nonce]);
  return on ? t : 0;
}

/** Counts 0 → n one tick every `ms` once `on`; resets when off. */
export function useTicker(on: boolean, n: number, ms: number, nonce: unknown = 0): number {
  const [k, setK] = useState(0);
  useEffect(() => {
    if (!on) {
      setK(0);
      return;
    }
    setK(0);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setK(i);
      if (i >= n) clearInterval(id);
    }, ms);
    return () => clearInterval(id);
  }, [on, n, ms, nonce]);
  return on ? k : 0;
}
