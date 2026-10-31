import { mixColor } from '../ease'
import { TONE } from '../palette'
import {
  WOOD,
  WOOD_DARK,
  css,
  ellipse,
  fillInk,
  halo,
  lw,
  poly,
  scaled,
} from './ink'
import { crates, goldHeap } from './gold'
import type { Detail } from './house'
import type { Pen, Pt } from './ink'

// A lord's port, a market laid on the coast (« sur la cote ça devient un
// port »): a quay of planks over a little water, a hoist leaning over it, the
// crates and the gold of the trade on it, and a cog moored alongside under a
// sail in its lord's colour; from afar the cog alone, the port's tell. Local
// units, some 24 across, as the other works.

/** The cog: its hull, its mast, its sail in the lord's colour. */
function cog(p: Pen, x: number, y: number, k: number, color: number) {
  const g = p.g
  const hull: ReadonlyArray<Pt> = [
    [x - 5 * k, y - 1.6 * k],
    [x + 5.4 * k, y - 1.6 * k],
    [x + 4 * k, y + 1 * k],
    [x - 3.8 * k, y + 1 * k],
  ]
  poly(p, hull)
  halo(p)
  poly(p, hull)
  fillInk(p, WOOD, 1.2)
  g.beginPath()
  g.moveTo(x + 0.2 * k, y - 1.6 * k)
  g.lineTo(x + 0.2 * k, y - 9 * k)
  g.lineWidth = lw(p, 0.9)
  g.strokeStyle = css(TONE.ink)
  g.stroke()
  const sail: ReadonlyArray<Pt> = [
    [x - 3 * k, y - 8.4 * k],
    [x + 3.4 * k, y - 8.4 * k],
    [x + 3.8 * k, y - 3 * k],
    [x - 3.4 * k, y - 3 * k],
  ]
  poly(p, sail)
  fillInk(p, color, 1)
  g.beginPath()
  g.moveTo(x - 3.2 * k, y - 5.7 * k)
  g.lineTo(x + 3.6 * k, y - 5.7 * k)
  g.lineWidth = lw(p, 0.8)
  g.strokeStyle = css(TONE.parchment, 0.8)
  g.stroke()
}

/** The port drawn, at mid distance (1) or up close (2). */
export function portNear(p: Pen, color: number, lod: Detail) {
  const g = p.g
  // The water it lies on, and its ripples.
  ellipse(p, 5, 3.4, 8, 3.6)
  g.fillStyle = css(TONE.seaWash, 0.95)
  g.fill()
  g.lineWidth = lw(p, 0.6)
  g.strokeStyle = css(TONE.seaLine, 0.7)
  g.stroke()
  // The quay, its planks.
  const quay: ReadonlyArray<Pt> = [
    [-10, -1],
    [3, -1],
    [3, 2.6],
    [-10, 2.6],
  ]
  poly(p, quay)
  halo(p)
  poly(p, quay)
  fillInk(p, mixColor(WOOD, TONE.page, 0.25), 1.2)
  if (lod === 2) {
    g.beginPath()
    for (let x = -8.4; x < 3; x += 1.6) {
      g.moveTo(x, -1)
      g.lineTo(x, 2.6)
    }
    g.lineWidth = lw(p, 0.45)
    g.strokeStyle = css(WOOD_DARK, 0.6)
    g.stroke()
  }
  // The hoist leaning over the water.
  g.beginPath()
  g.moveTo(-1.5, 1)
  g.lineTo(1.2, -9)
  g.lineTo(6.5, -6.5)
  g.moveTo(5.8, -6.8)
  g.lineTo(5.8, -2.5)
  g.lineWidth = lw(p, 1)
  g.strokeStyle = css(WOOD_DARK)
  g.stroke()
  crates(p, -7, 0.8, lod)
  goldHeap(p, -3.6, 1.6, 2.6, lod)
  cog(p, 6.4, 4.6, 0.62, color)
}

/** From afar: the cog alone, under its lord's sail. */
export function portFar(base: Pen, color: number) {
  const p = scaled(base, 1.15)
  ellipse(p, 0, 3.2, 8.6, 2.6)
  p.g.fillStyle = css(TONE.seaWash)
  p.g.fill()
  cog(p, 0, 2.8, 1, color)
}
