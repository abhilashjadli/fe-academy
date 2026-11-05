/** The price surface V(F, days) for Figure 2, sampled once; shared by the 3-D view and the heat-map fallback. */
import { ROW, price } from "./row";

export const F_MIN = 21800;
export const F_MAX = 23400;
export const D_MAX = 11;
export const NX = 65;
export const NZ = 45;
/** vertical scale: price → scene units */
export const V_SCALE = 1 / 1000;

export interface Grid {
  nx: number;
  nz: number;
  /** V[j * nx + i], i over F, j over days (j = 0 is expiry) */
  v: Float32Array;
  vmax: number;
}

let cache: Grid | null = null;
export function surfaceGrid(): Grid {
  if (cache) return cache;
  const v = new Float32Array(NX * NZ);
  let vmax = 0;
  for (let j = 0; j < NZ; j++) {
    const days = (D_MAX * j) / (NZ - 1);
    for (let i = 0; i < NX; i++) {
      const F = F_MIN + ((F_MAX - F_MIN) * i) / (NX - 1);
      const val = days <= 0 ? Math.max(F - ROW.K, 0) : price(F, days);
      v[j * NX + i] = val;
      if (val > vmax) vmax = val;
    }
  }
  cache = { nx: NX, nz: NZ, v, vmax };
  return cache;
}

/** scene coordinates: x over F (−1 … 1), y up (price), z towards the viewer (days 11 at the front, 0 at the back) */
export const toX = (F: number) => ((F - ROW.K) / (F_MAX - F_MIN)) * 2;
export const toZ = (days: number) => 0.6 - ((D_MAX - days) / D_MAX) * 1.2;
export const toY = (V: number) => V * V_SCALE;
export const fromX = (x: number) => ROW.K + (x / 2) * (F_MAX - F_MIN);
export const fromZ = (z: number) => D_MAX - ((0.6 - z) / 1.2) * D_MAX;

export const clampF = (F: number) => Math.max(F_MIN, Math.min(F_MAX, F));
export const clampD = (d: number) => Math.max(0.05, Math.min(D_MAX, d));

/** snap the probe to a 1-point / 0.1-day lattice so readouts do not flicker */
export const snapF = (F: number) => Math.round(clampF(F));
export const snapD = (d: number) => Math.round(clampD(d) * 10) / 10;
