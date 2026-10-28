import { TONE } from '../palette'
import type { Graphics } from 'pixi.js'

// A peasant defending his land, as a pen draws him small on an old map,
// facing right, his feet at (0, 0): no iron, a straw hat, a smock in his
// lord's colour and a pitchfork. He stands as plainly apart from a soldier
// as the combat table sets him: two of them for one soldier. Drawn once per
// colour into a texture.

const SKIN = 0xe8d9c0
const STRAW = 0xd8b45a
const SHAFT = 0x65492f
const TINE = 0x8a8f96

export function drawPeasant(g: Graphics, color: number): void {
  const ink = { color: TONE.ink, join: 'round', cap: 'round' } as const
  g.moveTo(-1.2, -0.4).lineTo(-1.6, 2.6).moveTo(1.1, -0.4).lineTo(1.4, 2.6)
  g.stroke({ ...ink, width: 1.1 })
  // The pitchfork, held low before him.
  g.moveTo(-2, -1.2)
    .lineTo(6.4, -7)
    .stroke({ color: SHAFT, width: 0.7, cap: 'round' })
  g.moveTo(5.6, -8.2)
    .lineTo(7.4, -5.6)
    .moveTo(5.9, -8)
    .lineTo(7.9, -9.6)
    .moveTo(6.6, -7)
    .lineTo(8.6, -8.4)
    .moveTo(7.2, -6.1)
    .lineTo(9.1, -7.2)
    .stroke({ color: TINE, width: 0.45, cap: 'round' })
  // A loose smock, wider at the hem.
  g.poly([-1.7, -5.4, 1.7, -5.4, 2.6, 0, -2.6, 0])
    .fill(color)
    .stroke({ ...ink, width: 0.7 })
  g.moveTo(-2.2, -2.2)
    .lineTo(2.2, -2.2)
    .stroke({ color: TONE.ink, width: 0.4, alpha: 0.6 })
  g.circle(0, -7, 1.7)
    .fill(SKIN)
    .stroke({ ...ink, width: 0.55 })
  // A wide straw hat.
  g.ellipse(0, -8.3, 3.1, 0.8)
    .fill(STRAW)
    .stroke({ ...ink, width: 0.45 })
  g.moveTo(-1.4, -8.4)
    .quadraticCurveTo(0, -10.6, 1.4, -8.4)
    .closePath()
    .fill(STRAW)
    .stroke({ ...ink, width: 0.45 })
}
