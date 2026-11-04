/**
 * The risk line's tiles light up as later figures explain them — purely cosmetic, in memory only, no persistence,
 * no progress system. A figure calls `useLightOnView(ref, [...])` and the tiles light the first time it scrolls into view.
 */
import { useEffect, useSyncExternalStore, type RefObject } from "react";

export type Tile = "price" | "delta" | "gamma" | "theta" | "vega";

let lit: ReadonlySet<Tile> = new Set();
const listeners = new Set<() => void>();

export function light(...tiles: Tile[]) {
  if (tiles.every((t) => lit.has(t))) return;
  const next = new Set(lit);
  for (const t of tiles) next.add(t);
  lit = next;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useLit(): ReadonlySet<Tile> {
  return useSyncExternalStore(subscribe, () => lit, () => lit);
}

/** Light the given tiles the first time the element is mostly on screen. */
export function useLightOnView(ref: RefObject<HTMLElement | null>, tiles: Tile[]) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          light(...tiles);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, tiles.join()]);
}
