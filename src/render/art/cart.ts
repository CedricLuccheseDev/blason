import { TONE } from '../palette'
import type { Graphics } from 'pixi.js'

// A caravan as a pen draws it small on an old map, going right, its wheels
// on (0, 0): a mule pulls a covered wagon heavy with sacks of gold, a pennant
// in its lord's colour on a pole above the cover. Drawn once per colour.

const MULE = 0x7a5a3c
const WOOD = 0x8a6440
const CLOTH = 0xefe3c4
const GOLD = 0xe0b23a

export function drawCart(g: Graphics, color: number): void {
  const ink = { color: TONE.ink, join: 'round', cap: 'round' } as const
  g.moveTo(9, -3)
    .lineTo(8.6, 0.6)
    .moveTo(12.6, -3)
    .lineTo(13, 0.6)
    .stroke({ ...ink, width: 0.9 })
  g.ellipse(10.8, -4.2, 3.2, 1.9)
    .fill(MULE)
    .stroke({ ...ink, width: 0.6 })
  g.poly([13.2, -5.2, 15.6, -7.6, 16.6, -6.4, 14.4, -3.8])
    .fill(MULE)
    .stroke({ ...ink, width: 0.6 })
  g.moveTo(5.4, -3.4)
    .lineTo(8.2, -4.4)
    .stroke({ ...ink, width: 0.6 })
  g.roundRect(-6, -5.4, 11.6, 3.6, 0.6)
    .fill(WOOD)
    .stroke({ ...ink, width: 0.7 })
  g.moveTo(-5.4, -5.4)
    .quadraticCurveTo(-0.2, -12.6, 5, -5.4)
    .closePath()
    .fill(CLOTH)
    .stroke({ ...ink, width: 0.7 })
  g.circle(-2.6, -6.8, 1.2)
    .circle(0.4, -7.2, 1.3)
    .fill(GOLD)
    .stroke({ ...ink, width: 0.45 })
  g.moveTo(-0.2, -9.8)
    .lineTo(-0.2, -15.4)
    .stroke({ ...ink, width: 0.6 })
  g.poly([-0.2, -15.4, 4.6, -14.2, -0.2, -12.6])
    .fill(color)
    .stroke({ ...ink, width: 0.45 })
  for (const x of [-3.4, 3]) {
    g.circle(x, -1.6, 1.8)
      .fill(WOOD)
      .stroke({ ...ink, width: 0.7 })
    g.moveTo(x - 1.6, -1.6)
      .lineTo(x + 1.6, -1.6)
      .moveTo(x, -3.2)
      .lineTo(x, 0)
      .stroke({ ...ink, width: 0.35 })
  }
}
