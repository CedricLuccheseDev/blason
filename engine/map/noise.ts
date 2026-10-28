import { drawInt } from '../numbers'

// Perlin noise built only from + − × ÷: sin and cos may round differently from
// one browser to the next, so the sixteen directions are written out.

const C1 = 0.9238795325112867
const C2 = 0.7071067811865476
const C3 = 0.3826834323650898

/** Sixteen unit vectors, every 22.5 degrees. */
export const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [C1, C3],
  [C2, C2],
  [C3, C1],
  [0, 1],
  [-C3, C1],
  [-C2, C2],
  [-C1, C3],
  [-1, 0],
  [-C1, -C3],
  [-C2, -C2],
  [-C3, -C1],
  [0, -1],
  [C3, -C1],
  [C2, -C2],
  [C1, -C3],
]

export type Noise = (x: number, y: number) => number

/** Fractal noise of four octaves, roughly in [-0.5, 0.5], from a seed. */
export function makeNoise(seed: string): Noise {
  const perm = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    const j = drawInt(seed, i + 1, 'perm', i)
    ;[perm[i], perm[j]] = [perm[j], perm[i]]
  }
  const table = [...perm, ...perm]

  function grad(ix: number, iy: number, dx: number, dy: number): number {
    const [gx, gy] = DIRECTIONS[table[table[ix] + iy] & 15]
    return gx * dx + gy * dy
  }

  function perlin(x: number, y: number): number {
    const fx = Math.floor(x)
    const fy = Math.floor(y)
    const xf = x - fx
    const yf = y - fy
    const xi = fx & 255
    const yi = fy & 255
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10)
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10)
    const a = grad(xi, yi, xf, yf)
    const b = grad(xi + 1, yi, xf - 1, yf)
    const c = grad(xi, yi + 1, xf, yf - 1)
    const d = grad(xi + 1, yi + 1, xf - 1, yf - 1)
    const top = a + u * (b - a)
    return top + v * (c + u * (d - c) - top)
  }

  return (x, y) => {
    let sum = 0
    let amplitude = 1
    let frequency = 1
    let norm = 0
    for (let octave = 0; octave < 4; octave++) {
      sum += amplitude * perlin(x * frequency, y * frequency)
      norm += amplitude
      amplitude /= 2
      frequency *= 2
    }
    return sum / norm
  }
}
