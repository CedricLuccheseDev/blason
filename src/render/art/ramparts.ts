import { mixColor } from '../ease'
import { TONE } from '../palette'
import {
  EARTH,
  WOOD_DARK,
  css,
  ellipse,
  fillInk,
  lerp,
  line,
  lw,
  poly,
  wob,
} from './ink'
import type { Detail } from './house'
import type { Pen, Pt } from './ink'

// The parts of a castle: a round tower under its cone of slate and its
// pennon, a run of curtain wall crowned with merlons, the lord's banner.
// Up close the stones are coursed. Local units.

const ink = (lod: Detail) => (lod === 2 ? 0.9 : 1)

/** A drum's outline, its foot an ellipse. */
function drum(p: Pen, x: number, y: number, r: number, top: number) {
  const g = p.g
  g.beginPath()
  g.moveTo(x - r, top)
  g.lineTo(x - r, y)
  g.ellipse(x, y, r, r * 0.35, 0, Math.PI, 0, true)
  g.lineTo(x + r, top)
  g.closePath()
}

/** A round tower, its foot centred at (x, y), so wide and tall, its pennon in the lord's colour. */
export function tower(
  p: Pen,
  [x, y, r, h]: readonly [number, number, number, number],
  lod: Detail,
  seed: number,
  color: number,
) {
  const g = p.g
  const top = y - h
  drum(p, x, y, r, top)
  fillInk(p, TONE.rampart, ink(lod))
  // Shade on the right half of the drum.
  g.save()
  g.beginPath()
  g.rect(x + r * 0.15, top - 1, r, h + 2)
  g.clip()
  drum(p, x, y, r, top)
  g.fillStyle = css(TONE.ink, 0.13)
  g.fill()
  g.restore()
  if (lod === 2) {
    g.beginPath()
    for (let k = 1; k < h / 1.1; k++) {
      const yy = top + k * 1.1
      for (let s = -r + 0.3 + (k % 2) * 0.5; s < r - 0.4; s += 1.1) {
        g.moveTo(x + s, yy)
        g.lineTo(x + s + 0.6, yy)
      }
    }
    g.lineWidth = lw(p, 0.5)
    g.strokeStyle = css(TONE.ink, 0.22)
    g.stroke()
    g.beginPath()
    g.rect(x - 0.18, top + h * 0.35, 0.36, 0.9)
    fillInk(p, TONE.door, 0)
  }
  const tip: Pt = [x, top - r * 2.3]
  const cone: ReadonlyArray<Pt> = [
    [x - r - 0.35, top + 0.2],
    [x + r + 0.35, top + 0.2],
    tip,
  ]
  wob(p, cone, 0.03, seed)
  fillInk(p, TONE.slate, ink(lod))
  g.save()
  wob(p, cone, 0.03, seed)
  g.clip()
  poly(p, [[x + 0.1, top + 0.4], [x + r + 0.5, top + 0.4], tip])
  g.fillStyle = css(TONE.ink, 0.18)
  g.fill()
  g.restore()
  line(p, [tip, [tip[0], tip[1] - 1.4]], 0.8, TONE.ink)
  poly(p, [
    [tip[0], tip[1] - 1.4],
    [tip[0] + 1.6, tip[1] - 1.05],
    [tip[0], tip[1] - 0.7],
  ])
  fillInk(p, color, 0.6)
}

/** Up close, a wall's stones coursed along it. */
function coursed(p: Pen, a: Pt, b: Pt, h: number, n: number) {
  const g = p.g
  const slope = (b[1] - a[1]) / (b[0] - a[0] || 1)
  g.beginPath()
  for (let r = 1; r < h; r++)
    for (let s = (r % 2) * 0.55; s < 1; s += 1 / Math.max(2, n)) {
      const q = lerp([a[0], a[1] - r], [b[0], b[1] - r], s)
      g.moveTo(q[0], q[1])
      g.lineTo(q[0] + 0.55, q[1] + slope * 0.55)
    }
  g.lineWidth = lw(p, 0.5)
  g.strokeStyle = css(TONE.ink, 0.2)
  g.stroke()
}

/** A run of curtain wall from a to b, so tall, its merlons along the top. */
export function wallRun(
  p: Pen,
  a: Pt,
  b: Pt,
  h: number,
  lod: Detail,
  seed: number,
) {
  const [ax, ay] = a
  const [bx, by] = b
  wob(
    p,
    [
      [ax, ay],
      [bx, by],
      [bx, by - h],
      [ax, ay - h],
    ],
    0.04,
    seed,
  )
  fillInk(p, TONE.rampart, ink(lod))
  const n = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay) / 1.1))
  const g = p.g
  g.beginPath()
  for (let k = 0; k < n; k += 2) {
    const s = lerp([ax, ay - h], [bx, by - h], k / n)
    const e = lerp([ax, ay - h], [bx, by - h], Math.min(1, (k + 1) / n))
    g.moveTo(s[0], s[1])
    g.lineTo(s[0], s[1] - 0.7)
    g.lineTo(e[0], e[1] - 0.7)
    g.lineTo(e[0], e[1])
    g.closePath()
  }
  fillInk(p, TONE.rampart, lod === 2 ? 0.7 : 0.9)
  if (lod === 2) coursed(p, a, b, h, n)
}

/** The lord's banner on its pole, its foot at (x, y); a chevron on it. */
export function banner(
  p: Pen,
  x: number,
  y: number,
  color: number,
  lod: Detail,
) {
  line(
    p,
    [
      [x, y],
      [x, y - 5.2],
    ],
    1.1,
    WOOD_DARK,
  )
  const top = y - 5.1
  const g = p.g
  g.beginPath()
  g.moveTo(x, top)
  g.bezierCurveTo(x + 1.2, top - 0.5, x + 2.4, top + 0.4, x + 3.6, top + 0.1)
  g.lineTo(x + 3.0, top + 1.2)
  g.lineTo(x + 3.7, top + 2.3)
  g.bezierCurveTo(x + 2.4, top + 2.6, x + 1.2, top + 1.7, x, top + 2.3)
  g.closePath()
  fillInk(p, color, lod === 2 ? 0.8 : 1.1)
  line(
    p,
    [
      [x + 0.6, top + 1.6],
      [x + 1.6, top + 0.6],
      [x + 2.6, top + 1.5],
    ],
    1.2,
    0xfbf4e2,
  )
}

/** The moat round the castle, and the bailey's ground inside it. */
export function moat(p: Pen, lod: Detail) {
  const g = p.g
  ellipse(p, 0, 2.6, 13, 6.6)
  fillInk(p, TONE.seaWash, lod === 2 ? 0.8 : 1, 0.85, TONE.seaLine)
  if (lod === 2) {
    g.beginPath()
    for (let k = 0; k < 9; k++) {
      const a = 0.3 + k * 0.33
      const [x, y] = [Math.cos(a) * 12.2, 2.6 + Math.sin(a) * 6]
      g.moveTo(x - 0.6, y)
      g.quadraticCurveTo(x, y - 0.3, x + 0.6, y)
    }
    g.lineWidth = lw(p, 0.6)
    g.strokeStyle = css(TONE.seaLine, 0.9)
    g.stroke()
  }
  ellipse(p, 0, 2.2, 11, 5.2)
  fillInk(p, mixColor(EARTH, TONE.page, 0.4), lod === 2 ? 0.6 : 0.8, 0.6)
}

/** Points from a flat list of their coordinates. */
export function pairs(flat: Array<number>): Array<Pt> {
  const out: Array<Pt> = []
  for (let i = 0; i < flat.length; i += 2) out.push([flat[i], flat[i + 1]])
  return out
}
