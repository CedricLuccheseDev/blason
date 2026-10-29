import { drawInt } from '../numbers'
import { largestLand } from './terrain'
import type { Cells } from './cells'

// Lakes: a few hollows of the inland filled with water, a handful of cells
// each, as the armies must walk round. A lake lies in the lowest ground
// round it, a few cells from any other water, and only where the land
// stays one piece around it: every cell may still be reached on foot.

/** The least and the most cells a lake takes. */
const [SMALLEST, LARGEST] = [2, 7]
/** A lake stands so many cells from the sea at least. */
const INLAND = 3

/**
 * The water once so many lakes are dug in the land (fewer if the land has
 * no room): the sea's cells and the lakes'.
 */
export function digLakes(
  seed: string,
  cells: Cells,
  sea: Array<boolean>,
  height: Array<number>,
  steps: Array<number>,
  count: number,
): Array<boolean> {
  const { neighbors } = cells
  const water = [...sea]
  let land = water.filter((wet) => !wet).length
  const hollow = (c: number) =>
    neighbors[c].every((n) => water[n] || height[n] >= height[c])
  const sites = cells.sites
    .flatMap((_, c) => (!sea[c] && steps[c] >= INLAND && hollow(c) ? [c] : []))
    .map((c) => ({ c, key: drawInt(seed, 1_000_000, 'lake', c) }))
    .sort((a, b) => a.key - b.key || a.c - b.c)
  let dug = 0
  for (const { c } of sites) {
    if (dug >= count) break
    const size =
      SMALLEST + drawInt(seed, LARGEST - SMALLEST + 1, 'lake size', c)
    const lake = grow(c, size, neighbors, water, height, steps)
    // Away from the other water, so that two lakes never run together.
    const apart = lake.every((l) => neighbors[l].every((n) => !water[n]))
    if (!apart) continue
    const trial = [...water]
    lake.forEach((l) => (trial[l] = true))
    if (largestLand(neighbors, trial).size !== land - lake.length) continue
    lake.forEach((l) => (water[l] = true))
    land -= lake.length
    dug++
  }
  return water
}

/** From a hollow, the lake rises over the lowest cell along its shore, then the next, up to its size. */
function grow(
  start: number,
  size: number,
  neighbors: Array<Array<number>>,
  water: Array<boolean>,
  height: Array<number>,
  steps: Array<number>,
): Array<number> {
  const lake = [start]
  const lower = (a: number, b: number) =>
    b < 0 || height[a] < height[b] || (height[a] === height[b] && a < b)
  while (lake.length < size) {
    const shore = lake.flatMap((l) =>
      neighbors[l].filter(
        (n) => !water[n] && !lake.includes(n) && steps[n] >= INLAND - 1,
      ),
    )
    const next = shore.reduce((best, n) => (lower(n, best) ? n : best), -1)
    if (next < 0) break
    lake.push(next)
  }
  return lake
}
