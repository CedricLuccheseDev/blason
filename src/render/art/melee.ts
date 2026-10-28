// The trembling of the fights at the borders (layers/melee.ts).

/** A deterministic jitter in [-1, 1], changing every frame for the trembling. */
export const jitter = (seed: number, now: number) =>
  Math.sin(seed * 12.9898 + Math.floor(now * 20) * 78.233) % 1
