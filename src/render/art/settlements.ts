import { TONE } from '../palette'
import type { Graphics } from 'pixi.js'

// The settlements, drawn by the code in a three-quarter view, around their
// base at (0, 0). A village is a few houses and a church.

const LINE = { width: 0.3, color: TONE.outline }

function house(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  n: number,
) {
  const roof = TONE.roofs[n % TONE.roofs.length]
  const rh = h * 0.9
  g.rect(x - w / 2, y - h, w, h)
    .fill(TONE.wall)
    .stroke(LINE)
  g.poly([
    x - w / 2 - 0.4,
    y - h,
    x - w / 2 + 0.8,
    y - h - rh,
    x + w / 2 - 0.8,
    y - h - rh,
    x + w / 2 + 0.4,
    y - h,
  ])
    .fill(roof)
    .stroke(LINE)
  g.rect(x - 0.4, y - 1.25, 0.8, 1.25).fill(TONE.door)
}

function church(g: Graphics, x: number, y: number, k: number) {
  house(g, x + 0.6 * k, y, 4.4 * k, 3 * k, 1)
  g.rect(x - 3.4 * k, y - 6.4 * k, 2.2 * k, 6.4 * k)
    .fill(TONE.stone)
    .stroke(LINE)
  g.poly([
    x - 3.7 * k,
    y - 6.4 * k,
    x - 2.3 * k,
    y - 9.8 * k,
    x - 0.9 * k,
    y - 6.4 * k,
  ])
    .fill(TONE.slate)
    .stroke(LINE)
}

/** A house (width, height) or a church (its scale). */
type Item = readonly [
  kind: 'h' | 'c',
  x: number,
  y: number,
  a?: number,
  b?: number,
]

/** Back to front, so the nearer houses cover the farther ones. */
function place(g: Graphics, items: ReadonlyArray<Item>, shadow: number) {
  g.ellipse(0, 1, shadow, shadow * 0.28).fill({ color: TONE.ink, alpha: 0.16 })
  ;[...items]
    .sort((p, q) => p[2] - q[2])
    .forEach(([kind, x, y, a, b], n) => {
      if (kind === 'h') house(g, x, y, a ?? 3.6, b ?? 2.4, n)
      else church(g, x, y, a ?? 1)
    })
}

const VILLAGES: ReadonlyArray<ReadonlyArray<Item>> = [
  [
    ['h', -4.6, -2.6, 3.4, 2.3],
    ['c', 1.8, -2.2],
    ['h', 5.6, -1.2, 3.2, 2.2],
    ['h', -6.2, 1, 3.8, 2.5],
    ['h', -1.6, 1.4, 3.9, 2.6],
    ['h', 3.4, 1.9, 3.5, 2.4],
  ],
  [
    ['h', -2.8, -3, 3.6, 2.4],
    ['h', 3.2, -2.6, 3.2, 2.3],
    ['c', -3, 0.6],
    ['h', 1.6, 0.9, 4, 2.6],
    ['h', 6, 1.3, 3.4, 2.3],
  ],
  [
    ['c', 0.4, -2.8],
    ['h', 5, -2, 3.6, 2.4],
    ['h', -5.6, -0.6, 3.4, 2.3],
    ['h', -2.4, 1.8, 3.8, 2.5],
    ['h', 2.8, 1.6, 3.6, 2.5],
  ],
]

export function drawVillage(g: Graphics, variant: number): void {
  place(g, VILLAGES[variant % VILLAGES.length], 9.5)
}
