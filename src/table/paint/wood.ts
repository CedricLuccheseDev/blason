import { paint } from './canvas'

// The table: walnut planks, their rings and their fibre, drawn once pixel by
// pixel from three tiling noises.

type Noise = (x: number, y: number, px: number, py: number) => number

/** A smooth value noise that tiles every px by py cells. */
function makeNoise(seed: number, size = 512): Noise {
  const cells = new Float32Array(size * size)
  let s = seed * 9301 + 49297
  for (let i = 0; i < cells.length; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    cells[i] = s / 0x7fffffff
  }
  const at = (x: number, y: number) => cells[(y % size) * size + (x % size)]
  return (x, y, px, py) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const fx = x - xi
    const fy = y - yi
    const u = fx * fx * (3 - 2 * fx)
    const v = fy * fy * (3 - 2 * fy)
    const x0 = ((xi % px) + px) % px
    const x1 = (x0 + 1) % px
    const y0 = ((yi % py) + py) % py
    const y1 = (y0 + 1) % py
    return (
      (at(x0, y0) * (1 - u) + at(x1, y0) * u) * (1 - v) +
      (at(x0, y1) * (1 - u) + at(x1, y1) * u) * v
    )
  }
}

const PLANKS = 6
const DARK = [52, 29, 14]
const LIGHT = [150, 98, 56]

/** How light the wood is at a pixel, 0 (dark) to about 1. */
function shade(
  [n1, n2, n3]: [Noise, Noise, Noise],
  x: number,
  y: number,
  size: number,
): number {
  const ph = size / PLANKS
  const plank = Math.floor(y / ph)
  const yl = y - plank * ph
  const tone = (((plank * 0.6180339) % 1) - 0.5) * 0.16
  const X = x / size
  const Y = y / size
  const warp =
    (n1(X * 4 + plank * 1.48, Y * 30, 4, 30) - 0.5) * 2 +
    (n1(X * 12, Y * 60 + 7, 12, 60) - 0.5)
  const ring = (yl / ph) * 9 + warp * 1.6 + plank * 1.7
  const late =
    Math.max(0, 1 - Math.abs(ring - Math.floor(ring) - 0.5) * 2.4) ** 3
  const fibre = n2(X * 16, Y * 420, 16, 420)
  const broad = n3(X * 3, Y * 12, 3, 12)
  let k =
    0.58 + tone + (broad - 0.5) * 0.22 - late * 0.22 - (fibre - 0.5) * 0.14
  // The seam between two planks, its lit lip, and their butt ends.
  if (yl < 2.2) k *= 0.38
  else if (yl < 3.4) k *= 1.12
  if ((x + plank * 389) % size < 2) k *= 0.45
  return Math.max(0, Math.min(1.15, k))
}

/** The walnut of the table, a square tile. */
export function woodCanvas(size = 1024): HTMLCanvasElement {
  const noises: [Noise, Noise, Noise] = [
    makeNoise(3),
    makeNoise(7),
    makeNoise(11),
  ]
  return paint(size, size, (g) => {
    const img = g.createImageData(size, size)
    const d = img.data
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const k = shade(noises, x, y, size)
        const i = (y * size + x) * 4
        for (let c = 0; c < 3; c++)
          d[i + c] = DARK[c] + (LIGHT[c] - DARK[c]) * k
        d[i + 3] = 255
      }
    g.putImageData(img, 0, 0)
  })
}
