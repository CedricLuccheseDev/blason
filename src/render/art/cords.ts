import { TONE } from '../palette'
import { lengthOf, pointOn } from '../cord'
import type { Cord } from '../cord'
import type { Graphics } from 'pixi.js'

// The alliances drawn between the capitals (layers/pacts.ts): the player's
// own as a ribbon of green silk hemmed in gold, an ink edge under it and a
// paper thread stitched down its middle; the others' as a thin dotted cord
// of ink, a tiny seal at its middle parted in both lords' colours, so that
// one reads who holds with whom. `k`: map units to a pixel on screen, every
// width given in pixels.

/** The ribbon's layers, outermost first: their width in pixels, colour and strength. */
const SILK = [
  { width: 8, color: TONE.ink, alpha: 0.55 },
  { width: 6.6, color: TONE.gold, alpha: 1 },
  { width: 4, color: TONE.pact, alpha: 1 },
]
/** The thread down its middle: a stitch so long every so many pixels. */
const [STITCH, EVERY] = [2, 7]
/** The others' cord: a dot every so many pixels, so big; its seal's radius. */
const [DOT_EVERY, DOT, TINY] = [6, 1.1, 6]

function trace(g: Graphics, cord: Cord) {
  const { from, control, to } = cord
  return g
    .moveTo(from.x, from.y)
    .quadraticCurveTo(control.x, control.y, to.x, to.y)
}

/** The player's alliance: green silk hemmed in gold, stitched down its middle. */
export function drawRibbon(g: Graphics, cord: Cord, k: number, alpha = 1) {
  for (const silk of SILK) {
    trace(g, cord).stroke({
      width: silk.width * k,
      color: silk.color,
      alpha: silk.alpha * alpha,
      cap: 'round',
    })
  }
  const steps = Math.floor(lengthOf(cord) / (EVERY * k))
  for (let i = 1; i < steps; i++) {
    const a = pointOn(cord, i / steps)
    const b = pointOn(cord, (i + STITCH / EVERY) / steps)
    g.moveTo(a.x, a.y).lineTo(b.x, b.y)
  }
  if (steps > 1)
    g.stroke({
      width: k,
      color: TONE.parchment,
      alpha: 0.45 * alpha,
      cap: 'round',
    })
}

/** Another's alliance: a dotted cord of ink, its tiny seal parted in both lords' colours. */
export function drawCord(
  g: Graphics,
  cord: Cord,
  k: number,
  colors: [number, number],
  alpha = 1,
) {
  const steps = Math.floor(lengthOf(cord) / (DOT_EVERY * k))
  for (let i = 0; i <= steps; i++) {
    const p = pointOn(cord, steps > 0 ? i / steps : 0.5)
    g.circle(p.x, p.y, DOT * k)
  }
  g.fill({ color: TONE.ink, alpha: 0.55 * alpha })
  drawPairSeal(g, cord.middle.x, cord.middle.y, TINY * k, colors, k, alpha)
}

/** A small seal of two lords, parted down its middle in their colours, ringed in ink. */
function drawPairSeal(
  g: Graphics,
  x: number,
  y: number,
  r: number,
  [left, right]: [number, number],
  k: number,
  alpha = 1,
) {
  const half = Math.PI / 2
  g.moveTo(x, y - r)
    .arc(x, y, r, -half, half, true)
    .closePath()
  g.fill({ color: left, alpha })
  g.moveTo(x, y - r)
    .arc(x, y, r, -half, half)
    .closePath()
  g.fill({ color: right, alpha })
  g.moveTo(x, y - r).lineTo(x, y + r)
  g.circle(x, y, r).stroke({
    width: 1.2 * k,
    color: TONE.ink,
    alpha: 0.8 * alpha,
  })
}
