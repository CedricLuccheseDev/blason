import { makeNoise } from './noise'
import type { Cells } from './cells'
import type { Terrain } from './terrain'

// The land's height and wetness, cell by cell, from which its lakes, its
// rivers and its biomes follow: the ground rises away from the shore and
// along a few ranges, where the mountains stand; the rain falls where its
// own noise says, more by the water and less up high. Both are measured in
// map units, not in the map's size, so a larger map has more ranges and
// more woods, not larger ones.

/** Map units across one turn of the noise that raises the ranges, and of the one that brings the rain. */
const RANGES = 700
const RAIN = 340

/** Each cell's distance from the nearest water, in cells: 0 for the water itself. */
export function stepsFromWater(
  neighbors: Array<Array<number>>,
  water: Array<boolean>,
): Array<number> {
  const steps: Array<number> = water.map((wet) => (wet ? 0 : -1))
  const queue = steps.flatMap((s, i) => (s === 0 ? [i] : []))
  for (const at of queue)
    for (const next of neighbors[at]) {
      if (steps[next] >= 0) continue
      steps[next] = steps[at] + 1
      queue.push(next)
    }
  return steps.map((s) => Math.max(0, s))
}

/**
 * The height of each cell of land, about 0 on the shore to 1 on the peaks
 * (the sea −1): the shape's own relief, the distance from the shore, and
 * the ranges, which stand back from the shore a few cells.
 */
export function raiseLand(
  seed: string,
  cells: Cells,
  sea: Array<boolean>,
  terrain: Terrain,
  steps: Array<number>,
): Array<number> {
  const ranges = makeNoise(`${seed}|ranges`)
  const deepest = steps.reduce((m, s) => (s > m ? s : m), 1)
  return cells.sites.map(([x, y], c) => {
    if (sea[c]) return -1
    const relief = Math.min(1, Math.max(0, terrain.elevation(x, y) / 2))
    const inland = Math.min(1, steps[c] / Math.max(4, deepest / 2))
    // Ridged noise: high along the lines where the noise crosses zero.
    const ridge = Math.max(0, 1 - Math.abs(ranges(x / RANGES, y / RANGES)) * 3)
    const foot = Math.min(1, steps[c] / 3)
    return 0.3 * relief + 0.25 * inland + 0.45 * ridge * ridge * ridge * foot
  })
}

/**
 * How wet each cell of land lies, roughly in [−0.6, 0.6]: the rain's noise,
 * more by the sea, the lakes and the rivers, less up high.
 */
export function wetness(
  seed: string,
  cells: Cells,
  water: Array<boolean>,
  height: Array<number>,
  banks: Set<number>,
): Array<number> {
  const rain = makeNoise(`${seed}|moisture`)
  const steps = stepsFromWater(cells.neighbors, water)
  return cells.sites.map(([x, y], c) => {
    if (water[c]) return 0
    const near = 0.12 / (1 + steps[c]) + (banks.has(c) ? 0.08 : 0)
    return rain(40 + x / RAIN, 17 + y / RAIN) + near - 0.15 * height[c]
  })
}
