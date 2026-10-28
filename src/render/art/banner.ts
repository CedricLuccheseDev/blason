import { TONE } from '../palette'
import type { Graphics } from 'pixi.js'

// A lord's banner on its pole: a cloth of his colour, the light chevron of
// his arms across its head, ending in two tails, hung from a crossbar under
// a gold finial. Its foot at (0, 0); `s` the size of a screen pixel.

export const LIGHT = 0xfbf4e2
const POLE = 0x65492f
/** On screen, in pixels: the pole's height, the cloth's height, its tails. */
export const HIGH = 50
export const CLOTH = 30
const TAIL = 7

export function drawBanner(
  pole: Graphics,
  cloth: Graphics,
  color: number,
  width: number,
  s: number,
) {
  const top = -HIGH * s
  const [left, right] = [-width / 2, width / 2]
  pole
    .clear()
    .moveTo(0, 0)
    .lineTo(0, top - 4 * s)
    .moveTo(left - 2 * s, top)
    .lineTo(right + 2 * s, top)
    .stroke({ width: 2 * s, color: POLE, cap: 'round' })
    .circle(0, top - 5 * s, 2.2 * s)
    .fill(TONE.gold)
    .stroke({ width: 0.8 * s, color: TONE.ink })
  const bottom = top + CLOTH * s
  cloth
    .clear()
    .poly([
      left,
      top,
      right,
      top,
      right,
      bottom + TAIL * s,
      right / 2,
      bottom,
      left / 2,
      bottom,
      left,
      bottom + TAIL * s,
    ])
    .fill(color)
    .stroke({ width: 1.4 * s, color: TONE.ink, join: 'round' })
    .moveTo(left + 4 * s, top + 9 * s)
    .lineTo(0, top + 4 * s)
    .lineTo(right - 4 * s, top + 9 * s)
    .stroke({ width: 2.4 * s, color: LIGHT, cap: 'round', join: 'round' })
}
