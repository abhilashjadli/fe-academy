/**
 * The one clock. Figures 1–5 share a single scrubber position (an index into the 2,679 real days); dragging the
 * picture in any figure moves it for all of them. In memory only — no persistence, no progress system.
 */
import { useSyncExternalStore } from "react";
import { N } from "./a5";

let clock = N - 1; // start on the last real day
const listeners = new Set<() => void>();

export function setClock(i: number) {
  const k = Math.max(0, Math.min(N - 1, Math.round(i)));
  if (k === clock) return;
  clock = k;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useClock(): number {
  return useSyncExternalStore(subscribe, () => clock, () => clock);
}
