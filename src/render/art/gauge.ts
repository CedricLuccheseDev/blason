import { TONE } from '../palette'
import type { Graphics } from 'pixi.js'

// A timer on the map as a gauge (« fais une jauge dans un rond mais vertical
// comme openfront »): a round band between two circles, filled from the
// bottom up to a share, as a level in a glass; no arc drawn, so no path is
// ever left to join another. In map units, the ink's width given.

export function drawGauge(
  g: Graphics,
  x: number,
  y: number,
  [inner, outer]: readonly [number, number],
  share: number,
  color: number,
  ink: { width: number; alpha?: number },
) {
  const alpha = ink.alpha ?? 1
  g.circle(x, y, outer)
    .fill({ color: TONE.parchment, alpha })
    .circle(x, y, inner)
    .cut()
  if (share > 0) {
    // The part of the disc under the level, as a polygon along its edge.
    const level = outer - 2 * outer * Math.min(1, share)
    const from = Math.asin(Math.max(-1, Math.min(1, level / outer)))
    const to = Math.PI - from
    const points: Array<number> = []
    for (let i = 0; i <= 24; i++) {
      const a = from + ((to - from) * i) / 24
      points.push(x + Math.cos(a) * outer, y + Math.sin(a) * outer)
    }
    g.poly(points).fill({ color, alpha }).circle(x, y, inner).cut()
  }
  g.circle(x, y, outer).stroke({ width: ink.width, color: TONE.ink, alpha })
}
