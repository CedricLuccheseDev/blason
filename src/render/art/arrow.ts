import { TONE } from '../palette'
import type { Graphics } from 'pixi.js'

// An army's way as the map draws it (« des pointillés avec une flèche qui
// deviennent transparents petit à petit … une croix de cible rouge pour
// dire où attaquer, mais pas de bannière », 31/10): dashes from where it
// enters, fading out as they go until they are gone where its men will be
// spent, an arrowhead on them where it is aimed, and a red target's cross
// there. Sized on screen.

type At = { x: number; y: number }

/** The dashes' period and their part drawn, in pixels; the most drawn. */
const [PERIOD, DASHES] = [7, 600]

/**
 * Dashes along a path, each as opaque as it is near its start: gone at
 * `fade` map units along, none drawn past it.
 */
export function fadingDashes(
  g: Graphics,
  points: Array<At>,
  zoom: number,
  color: number,
  fade: number,
) {
  const period = PERIOD / zoom
  let along = 0
  let drawn = 0
  for (let i = 1; i < points.length && drawn < DASHES; i++) {
    const [a, b] = [points[i - 1], points[i]]
    const d = Math.hypot(b.x - a.x, b.y - a.y)
    if (d <= 0) continue
    const at = (k: number) =>
      [a.x + ((b.x - a.x) * k) / d, a.y + ((b.y - a.y) * k) / d] as const
    for (let j = Math.ceil(along / period); j * period < along + d; j++) {
      const start = j * period - along
      const end = Math.min(start + period / 2, d)
      const alpha = 1 - (j * period) / fade
      if (alpha <= 0) return
      g.moveTo(...at(start))
        .lineTo(...at(end))
        .stroke({ width: 2.4 / zoom, color, alpha, cap: 'round' })
      if (++drawn >= DASHES) return
    }
    along += d
  }
}

/** An arrowhead at a point, pointing the way from `from`, so opaque. */
export function arrowHead(
  g: Graphics,
  from: At,
  to: At,
  zoom: number,
  color: number,
  alpha: number,
) {
  const d = Math.hypot(to.x - from.x, to.y - from.y) || 1
  const [ux, uy] = [(to.x - from.x) / d, (to.y - from.y) / d]
  const [size, half] = [10 / zoom, 6 / zoom]
  // Its tip just short of the target's cross, so that both are seen.
  const tip = {
    x: to.x - (ux * (CROSS + 3)) / zoom,
    y: to.y - (uy * (CROSS + 3)) / zoom,
  }
  const back = { x: tip.x - ux * size, y: tip.y - uy * size }
  g.poly([
    tip.x,
    tip.y,
    back.x - uy * half,
    back.y + ux * half,
    back.x + uy * half,
    back.y - ux * half,
  ])
    .fill({ color, alpha })
    .stroke({ width: 1.2 / zoom, color: TONE.ink, alpha })
}

/** The target's cross's radius, in pixels. */
const CROSS = 9

/** A target's cross, red where the army strikes, gold where a work may be built from the right click's menu: a ring, four ticks across it, a dot at its heart. */
export function targetCross(
  g: Graphics,
  at: At,
  zoom: number,
  tone: number = TONE.fight,
) {
  const [r, tick] = [CROSS / zoom, 5 / zoom]
  g.circle(at.x, at.y, r)
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ])
    g.moveTo(at.x + dx * (r - tick / 2), at.y + dy * (r - tick / 2)).lineTo(
      at.x + dx * (r + tick),
      at.y + dy * (r + tick),
    )
  g.stroke({ width: 3.8 / zoom, color: TONE.ink, cap: 'round' }).stroke({
    width: 2.8 / zoom,
    color: tone,
    cap: 'round',
  })
  g.circle(at.x, at.y, 2.4 / zoom)
    .fill(tone)
    .stroke({
      width: 1 / zoom,
      color: TONE.ink,
    })
}
