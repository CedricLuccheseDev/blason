import { TONE } from '../palette'
import type { Graphics } from 'pixi.js'

// An army at sea as a pen draws it small on an old map, sailing right, its
// keel on (0, 0) (« les armées qui traversent l'eau »): a long open boat,
// its oars out, a square sail in its lord's colour on the mast; its wake
// is drawn as it sails (layers/wakes.ts). Drawn once per colour.

const WOOD = 0x8a6440
const OARS = 0x6b4c30
const CLOTH = 0xefe3c4

export function drawBoat(g: Graphics, color: number): void {
  const ink = { color: TONE.ink, join: 'round', cap: 'round' } as const
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

/** A warship sailing right, its keel on (0, 0): a long dark hull with a castle raised at each end, two masts, the great sail in its lord's colour with a pale cross, a pennant at the top; larger than a cog, at a glance a ship of war. */
export function drawWarship(g: Graphics, color: number): void {
  const ink = { color: TONE.ink, join: 'round', cap: 'round' } as const
  // The hull, its castles fore and aft.
  g.moveTo(-14, -6)
    .lineTo(-13, 0.2)
    .quadraticCurveTo(-6, 1.4, 0, 1.4)
    .quadraticCurveTo(9, 1.4, 14.5, -5)
    .lineTo(15.5, -8.6)
    .lineTo(9.6, -8.6)
    .lineTo(9.6, -5)
    .lineTo(-8.6, -5)
    .lineTo(-8.6, -9.4)
    .lineTo(-14.4, -9.4)
    .closePath()
    .fill(OARS)
    .stroke({ ...ink, width: 0.8 })
  g.moveTo(-12.6, -2.2)
    .lineTo(12.6, -2.2)
    .stroke({ ...ink, width: 0.4 })
  // The guns' ports along the side.
  for (const x of [-6, -2, 2, 6]) g.rect(x - 0.7, -4.2, 1.4, 1.2).fill(TONE.ink)
  // The masts.
  g.moveTo(-1, -5)
    .lineTo(-1, -22)
    .moveTo(8, -8.6)
    .lineTo(8, -16)
    .stroke({ ...ink, width: 0.8 })
  // The great sail, the lord's colour, a pale cross on it.
  g.moveTo(-7, -20.4)
    .quadraticCurveTo(-1, -19, 5, -20.4)
    .lineTo(5.6, -8.2)
    .quadraticCurveTo(-1, -6.6, -7.6, -8.2)
    .closePath()
    .fill(color)
    .stroke({ ...ink, width: 0.7 })
  g.moveTo(-1, -19.6)
    .lineTo(-1, -7.4)
    .moveTo(-7.2, -14)
    .lineTo(5.2, -14)
    .stroke({ color: CLOTH, width: 1.4, alpha: 0.9 })
  // The fore sail, small, and the pennant flying.
  g.moveTo(8, -15.6)
    .lineTo(12, -14.8)
    .lineTo(11.6, -9.6)
    .lineTo(8, -10)
    .closePath()
    .fill(CLOTH)
    .stroke({ ...ink, width: 0.5 })
  g.moveTo(-1, -22)
    .lineTo(-7, -23)
    .lineTo(-1, -24.4)
    .closePath()
    .fill(color)
    .stroke({ ...ink, width: 0.5 })
}
