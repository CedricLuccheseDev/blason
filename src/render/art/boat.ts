import { TONE } from '../palette'
import type { Graphics } from 'pixi.js'

// An army at sea as a pen draws it small on an old map, sailing right, its
// keel on (0, 0) (« les armées qui traversent l'eau »): a long open boat,
// its oars out, a square sail in its lord's colour on the mast and a white
// wake behind. Drawn once per colour.

const WOOD = 0x8a6440
const OARS = 0x6b4c30
const CLOTH = 0xefe3c4

export function drawBoat(g: Graphics, color: number): void {
  const ink = { color: TONE.ink, join: 'round', cap: 'round' } as const
  // The wake, two strokes trailing from the stern.
  g.moveTo(-11, 0.4)
    .quadraticCurveTo(-15, 1.2, -19, 0.6)
    .moveTo(-10.6, 1.4)
    .quadraticCurveTo(-14, 2.6, -17, 2.4)
    .stroke({ color: CLOTH, width: 0.8, cap: 'round', alpha: 0.9 })
  // The oars, dipping into the water.
  for (const x of [-6, -2, 2, 6]) g.moveTo(x, -2).lineTo(x - 2.4, 2.2)
  g.stroke({ ...ink, width: 0.7 }).stroke({ color: OARS, width: 0.35 })
  // The hull, its stem and stern raised.
  g.moveTo(-11, -3.6)
    .quadraticCurveTo(-10, 0, -5, 0.4)
    .lineTo(6, 0.4)
    .quadraticCurveTo(11, 0, 12.4, -4.4)
    .lineTo(10.4, -3)
    .lineTo(-9.4, -3)
    .closePath()
    .fill(WOOD)
    .stroke({ ...ink, width: 0.7 })
  g.moveTo(-9, -1.6)
    .lineTo(9.6, -1.6)
    .stroke({ ...ink, width: 0.35 })
  // The mast and its sail, the lord's colour.
  g.moveTo(0, -3)
    .lineTo(0, -15)
    .stroke({ ...ink, width: 0.7 })
  g.moveTo(-4.6, -13.6)
    .quadraticCurveTo(-0.4, -12.2, 4.2, -13.6)
    .lineTo(4.6, -5.6)
    .quadraticCurveTo(0, -4.2, -5, -5.6)
    .closePath()
    .fill(color)
    .stroke({ ...ink, width: 0.6 })
  g.moveTo(-4.8, -9.6)
    .quadraticCurveTo(0, -8.4, 4.4, -9.6)
    .stroke({ color: CLOTH, width: 0.9, alpha: 0.8 })
}

/** A merchant cog sailing right, its keel on (0, 0) (« les bateaux marchands comme sur openfront »): a round hull, crates on its deck, a broad sail striped in its lord's colour, no oars. */
export function drawCog(g: Graphics, color: number): void {
  const ink = { color: TONE.ink, join: 'round', cap: 'round' } as const
  g.moveTo(-10, 0.6)
    .quadraticCurveTo(-14, 1.6, -18, 1)
    .stroke({ color: CLOTH, width: 0.8, cap: 'round', alpha: 0.9 })
  g.moveTo(-9.5, -4)
    .quadraticCurveTo(-9, 0.4, -4, 0.6)
    .lineTo(5, 0.6)
    .quadraticCurveTo(10, 0.4, 11, -4.6)
    .lineTo(-9.5, -4)
    .closePath()
    .fill(WOOD)
    .stroke({ ...ink, width: 0.7 })
  for (const x of [-6.5, -3.5])
    g.rect(x, -6.6, 2.6, 2.4)
      .fill(OARS)
      .stroke({ ...ink, width: 0.45 })
  g.moveTo(1, -4.2)
    .lineTo(1, -16)
    .stroke({ ...ink, width: 0.7 })
  g.moveTo(-4.4, -14.6)
    .lineTo(6.4, -14.6)
    .lineTo(6.8, -6.2)
    .lineTo(-4.8, -6.2)
    .closePath()
    .fill(CLOTH)
    .stroke({ ...ink, width: 0.6 })
  for (const x of [-2.6, 1.2, 5]) g.rect(x - 0.9, -14.4, 1.8, 8).fill(color)
  g.moveTo(-4.4, -14.6)
    .lineTo(6.4, -14.6)
    .lineTo(6.8, -6.2)
    .lineTo(-4.8, -6.2)
    .closePath()
    .stroke({ ...ink, width: 0.6 })
}
