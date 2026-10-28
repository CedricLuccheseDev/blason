import { TONE } from '../palette'
import type { Graphics } from 'pixi.js'

// A soldier of the battles, as a pen draws him small on an old map, facing
// right, his feet at (0, 0): a helmet of iron, a tunic and a shield in his
// lord's colour, a spear held high. Drawn once per colour into a texture.

const SKIN = 0xe8d9c0
const IRON = 0x8a8f96
const SHAFT = 0x65492f

export function drawSoldier(g: Graphics, color: number): void {
  const ink = { color: TONE.ink, join: 'round', cap: 'round' } as const
  g.moveTo(-1.3, -0.4).lineTo(-1.9, 2.6).moveTo(1.2, -0.4).lineTo(1.8, 2.6)
  g.stroke({ ...ink, width: 1.1 })
  g.moveTo(-1.2, 1.5)
    .lineTo(5.2, -11.5)
    .stroke({ color: SHAFT, width: 0.7, cap: 'round' })
  g.poly([5.2, -11.5, 4.4, -9.6, 6.1, -10.4])
    .fill(IRON)
    .stroke({ ...ink, width: 0.35 })
  g.roundRect(-2.3, -5.6, 4.6, 5.6, 1.3)
    .fill(color)
    .stroke({ ...ink, width: 0.7 })
  g.circle(0, -7.2, 1.75)
    .fill(SKIN)
    .stroke({ ...ink, width: 0.55 })
  g.moveTo(-2, -7.3)
    .quadraticCurveTo(0, -10.3, 2, -7.3)
    .closePath()
    .fill(IRON)
    .stroke({ ...ink, width: 0.5 })
  g.moveTo(1.6, -5.4)
    .lineTo(4.6, -5.4)
    .lineTo(4.6, -3)
    .quadraticCurveTo(4.6, -1.1, 3.1, -0.4)
    .quadraticCurveTo(1.6, -1.1, 1.6, -3)
    .closePath()
    .fill(color)
    .stroke({ ...ink, width: 0.6 })
  g.moveTo(3.1, -5.2)
    .lineTo(3.1, -0.8)
    .stroke({ color: TONE.parchment, width: 0.6, cap: 'round' })
}
