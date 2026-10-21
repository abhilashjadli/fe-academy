/** Seeded PRNG (mulberry32): deterministic, reversible playback for every simulation. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sample an index from a discrete pmf (weights need not be normalised). */
export function sampleIndex(weights: number[], u: number): number {
  const total = weights.reduce((s, w) => s + w, 0);
  let acc = 0;
  const r = u * total;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (r < acc) return i;
  }
  return weights.length - 1;
}

/** Standard normal sample by Box–Muller (uses two uniforms). */
export function normalSample(next: () => number): number {
  const u1 = Math.max(next(), 1e-12);
  const u2 = next();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
