import { raiseLand, stepsFromWater } from './ground'
import { digLakes } from './lakes'
import { pickShape } from './shapes'
import { findSea, makeTerrain } from './terrain'
import type { Cells } from './cells'
import type { Ground, Plan } from './types'

// The first generator, the game's: the family's figure warped by noise and
// marked with its coast's features (shapes.ts), the sea up to its share
// (terrain.ts), the ground raised from it (ground.ts), a few lakes. Its
// mountains are drawn only: no cell of it is closed to the armies.

export function planClassic(seed: string): Plan {
  return { ...pickShape(seed), peakShare: 0 }
}

export function classicLand(
  seed: string,
  plan: Plan,
  cells: Cells,
  width: number,
  height: number,
  scale: number,
  lakes: number,
): Ground {
  const terrain = makeTerrain(seed, plan, cells, width, height, scale)
  const sea = findSea(cells, terrain)
  const steps = stepsFromWater(cells.neighbors, sea)
  const heights = raiseLand(seed, cells, sea, terrain, steps)
  const water = digLakes(seed, cells, sea, heights, steps, lakes)
  return { water, peaks: water.map(() => false), heights, passes: [] }
}
