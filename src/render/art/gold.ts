import { hash } from '../pen'
import { TONE } from '../palette'
import {
  WOOD,
  WOOD_DARK,
  css,
  ellipse,
  fillInk,
  light,
  line,
  lw,
  wob,
} from './ink'
import type { Detail } from './house'
import type { Pen, Pt } from './ink'

// The market's riches: a heap of gold with its stacks of coins, up close
// the coins in it; crates and a sack. Local units.

/** The heap's dome, its foot an ellipse. */
function dome(p: Pen, x: number, y: number, r: number) {
  const g = p.g
  g.beginPath()
  g.moveTo(x - r, y)
  g.bezierCurveTo(x - r * 0.8, y - r * 0.9, x + r * 0.7, y - r, x + r, y)
  g.ellipse(x, y, r, r * 0.3, 0, 0, Math.PI)
}

/** A heap of gold, a mound of coins with stacks beside it; returns where its glints shine. */
export function goldHeap(
  p: Pen,
  x: number,
  y: number,
  r: number,
  lod: Detail,
): Array<Pt> {
  const g = p.g
  ellipse(p, x + 0.4, y + 0.2, r * 1.25, r * 0.38)
  g.fillStyle = css(TONE.ink, 0.18)
  g.fill()
  dome(p, x, y, r)
  fillInk(p, TONE.gold, lod === 2 ? 0.8 : 1.1)
  g.save()
  dome(p, x, y, r)
  g.clip()
  ellipse(p, x + r * 0.55, y - r * 0.1, r * 0.6, r * 0.7)
  g.fillStyle = css(TONE.goldDeep, 0.3)
  g.fill()
  ellipse(p, x - r * 0.35, y - r * 0.5, r * 0.32, r * 0.18)
  g.fillStyle = css(TONE.goldLight, 0.9)
  g.fill()
  for (let k = 0; lod === 2 && k < 16; k++) {
    const cx = x - r + 0.3 + hash(k, 1, 4) * (2 * r - 0.6)
    const top = y - r * 0.95 * (1 - ((cx - x) / r) ** 2)
    ellipse(p, cx, top + hash(k, 2, 4) * (y - top) + 0.2, 0.42, 0.18)
    g.lineWidth = lw(p, 0.6)
    g.strokeStyle = css(TONE.goldDeep, 0.8)
    g.stroke()
  }
  g.restore()
  for (const [sx, n] of [
    [x + r + 0.9, 4],
    [x - r - 0.8, 3],
  ])
    for (let k = 0; k < n; k++) {
      ellipse(p, sx, y + 0.3 - k * 0.42, 0.7, 0.28)
      fillInk(
        p,
        k === n - 1 ? TONE.goldLight : TONE.gold,
        lod === 2 ? 0.6 : 0.8,
      )
    }
  return [
    [x - r * 0.3, y - r * 0.75],
    [x + r * 0.35, y - r * 0.45],
    [x + r + 0.9, y - 1.3],
  ]
}

/** Three crates and a sack, their foot at (x, y). */
export function crates(p: Pen, x: number, y: number, lod: Detail) {
  const ink = lod === 2 ? 0.7 : 0.9
  for (const [dx, dy, s] of [
    [0, 0, 1.6],
    [1.8, 0.3, 1.4],
    [0.8, -1.4, 1.3],
  ]) {
    const [X, Y] = [x + dx, y + dy]
    wob(
      p,
      [
        [X, Y],
        [X + s, Y],
        [X + s, Y - s * 0.8],
        [X, Y - s * 0.8],
      ],
      0.03,
      X * 3,
    )
    fillInk(p, WOOD, ink)
    wob(
      p,
      [
        [X, Y - s * 0.8],
        [X + s, Y - s * 0.8],
        [X + s * 1.3, Y - s * 1.1],
        [X + s * 0.3, Y - s * 1.1],
      ],
      0.03,
      X * 5,
    )
    fillInk(p, light(WOOD, 0.25), ink)
    if (lod === 2)
      line(
        p,
        [
          [X, Y],
          [X + s, Y - s * 0.8],
        ],
        0.5,
        WOOD_DARK,
        0.8,
      )
  }
  const g = p.g
  g.beginPath()
  g.moveTo(x - 1.6, y + 0.2)
  g.quadraticCurveTo(x - 2.6, y - 0.8, x - 1.8, y - 1.7)
  g.lineTo(x - 1.4, y - 2.1)
  g.lineTo(x - 1.0, y - 1.7)
  g.quadraticCurveTo(x - 0.2, y - 0.8, x - 0.8, y + 0.2)
  g.closePath()
  fillInk(p, 0xd9c49a, ink)
}
