import { hash } from '../pen'
import { mixColor } from '../ease'
import { TONE } from '../palette'
import {
  WOOD,
  css,
  ellipse,
  fillInk,
  halo,
  lerp,
  lw,
  poly,
  scaled,
} from './ink'
import { crates, goldHeap } from './gold'
import { MARKET } from './plans'
import { workShadows } from './shadows'
import { stall } from './stall'
import type { Detail } from './house'
import type { Pen, Pt } from './ink'

// A lord's market: three stalls under awnings striped in his colour round a
// heap of gold, on a paved square; up close the cobbles, the crates and the
// sacks, and the coins that glint (ground/life.ts); all standing in the
// map's one light, casting their shadows on the square (art/shadows.ts).
// From afar, an awning
// over a counter and the gold heap before it: the gold the tell, the only
// gilt heap of the map. Local units, some 24 across.

/** Where the heap's glints shine, in local units. */
export const GLINTS: ReadonlyArray<Pt> = [
  [-1.1, 0.35],
  [0.85, 1.25],
  [3.7, 1.3],
]

/** The market drawn, at mid distance (1) or up close (2). */
export function marketNear(p: Pen, color: number, lod: Detail) {
  const g = p.g
  ellipse(p, 0, 1.8, 12, 5.6)
  g.fillStyle = css(mixColor(TONE.stone, TONE.page, 0.3), 0.85)
  g.fill()
  g.lineWidth = lw(p, 0.7)
  g.strokeStyle = css(TONE.ink, 0.35)
  g.stroke()
  if (lod === 2) {
    g.beginPath()
    for (let k = 0; k < 90; k++) {
      const a = hash(k, 3, 9) * Math.PI * 2
      const rr = Math.sqrt(hash(k, 4, 9))
      const [x, y] = [Math.cos(a) * rr * 11.2, 1.8 + Math.sin(a) * rr * 5]
      g.moveTo(x + 0.3, y)
      g.ellipse(x, y, 0.3, 0.16, 0, 0, Math.PI * 2)
    }
    g.lineWidth = lw(p, 0.5)
    g.strokeStyle = css(TONE.ink, 0.22)
    g.stroke()
  }
  workShadows(p, 'market', lod)
  const [a, b, c] = MARKET.stalls
  stall(p, a, color, lod, 81)
  stall(p, b, color, lod, 82)
  goldHeap(p, ...MARKET.heap, lod)
  crates(p, ...MARKET.crates, lod)
  stall(p, c, color, lod, 83)
}

/** From afar: an awning striped in the lord's colour over a counter, a gold heap before it. */
export function marketFar(base: Pen, color: number) {
  const g = base.g
  g.save()
  const p = scaled(base, 1.25)
  g.translate(0.8, 0)
  const aw: ReadonlyArray<Pt> = [
    [-8.2, -2.6],
    [5.4, -2.6],
    [6.6, -6.8],
    [-7, -6.8],
  ]
  const counter: ReadonlyArray<Pt> = [
    [-7.2, 1.6],
    [4.4, 1.6],
    [4.4, -2.6],
    [-7.2, -2.6],
  ]
  for (const s of [aw, counter]) {
    poly(p, s)
    halo(p)
  }
  ellipse(p, 3.4, 2.6, 4.6, 3.4)
  halo(p)
  poly(p, counter)
  fillInk(p, WOOD, 1.4)
  poly(p, aw)
  g.fillStyle = css(TONE.parchment)
  g.fill()
  g.save()
  poly(p, aw)
  g.clip()
  for (let k = 0; k < 5; k += 2) {
    poly(p, [
      lerp(aw[0], aw[1], k / 5),
      lerp(aw[0], aw[1], (k + 1) / 5),
      lerp(aw[3], aw[2], (k + 1) / 5),
      lerp(aw[3], aw[2], k / 5),
    ])
    g.fillStyle = css(color)
    g.fill()
  }
  g.restore()
  poly(p, aw)
  fillInk(p, null, 1.4)
  g.beginPath()
  g.moveTo(0, 5)
  g.bezierCurveTo(0.4, -0.6, 6.4, -0.6, 6.8, 5)
  g.closePath()
  fillInk(p, TONE.gold, 1.4)
  ellipse(p, 2.6, 2.2, 1.1, 0.6)
  g.fillStyle = css(TONE.goldLight)
  g.fill()
  g.restore()
}
