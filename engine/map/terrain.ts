import { makeNoise } from './noise'
import { makeRelief } from './shapes'
import type { Cells } from './cells'
import type { Noise } from './noise'
import type { Shape } from './shapes'

export type Biome = 'plain' | 'forest' | 'hills'

export type Terrain = {
  /** Below 0 the sea, up to about 2 on the highest ground. */
  elevation: (x: number, y: number) => number
  moisture: Noise
  hills: Noise
}

/**
 * The ground of the map: the shape's relief, with the sea level set so that
 * the shape's share of the cells lies under it.
 */
export function makeTerrain(
  seed: string,
  shape: Shape,
  cells: Cells,
  width: number,
  height: number,
): Terrain {
  const relief = makeRelief(seed, shape, width, height)
  const raw = cells.sites.map(([x, y]) => relief(x, y))
  const level = seaLevel(cells, raw, shape.seaShare)
  const scale = 2 / (Math.max(...raw) - level)
  const wet = makeNoise(`${seed}|moisture`)
  const high = makeNoise(`${seed}|hills`)
  return {
    elevation: (x, y) => (relief(x, y) - level) * scale,
    moisture: (x, y) => wet(40 + (x / width) * 4.5, 17 + (y / height) * 3),
    hills: (x, y) => high(80 + (x / width) * 3, 60 + (y / height) * 2.2),
  }
}

/**
 * The height the sea rises to: the share of the lowest cells, or less if
 * the sea would cut the land in pieces and leave too much of it out.
 */
function seaLevel(cells: Cells, raw: Array<number>, share: number): number {
  const sorted = [...raw].sort((a, b) => a - b)
  for (let s = share; s > 100; s -= 30) {
    const level = sorted[Math.floor((sorted.length * s) / 1000)]
    const sea = raw.map((h) => h < level)
    const land = sea.filter((wet) => !wet).length
    const kept = largestLand(cells.neighbors, sea).size
    if (kept * 100 >= land * 92) return level
  }
  return sorted[Math.floor(sorted.length / 10)]
}

/**
 * Which cells are sea: low ground, without enclosed seas or islets, and one
 * single land, so that every cell can be reached on foot.
 */
export function findSea(cells: Cells, terrain: Terrain): Array<boolean> {
  const { sites, neighbors } = cells
  const sea = sites.map(([x, y]) => terrain.elevation(x, y) < 0)
  sites.forEach((_, i) => {
    if (sea[i] && neighbors[i].every((j) => !sea[j])) sea[i] = false
  })
  const land = largestLand(neighbors, sea)
  return sea.map((_, i) => !land.has(i))
}

function largestLand(
  neighbors: Array<Array<number>>,
  sea: Array<boolean>,
): Set<number> {
  const seen = new Set<number>()
  let best = new Set<number>()
  neighbors.forEach((_, start) => {
    if (sea[start] || seen.has(start)) return
    const part = new Set([start])
    const queue = [start]
    for (const at of queue) {
      for (const next of neighbors[at]) {
        if (sea[next] || part.has(next)) continue
        part.add(next)
        queue.push(next)
      }
    }
    part.forEach((i) => seen.add(i))
    if (part.size > best.size) best = part
  })
  return best
}

export function biomeAt(terrain: Terrain, x: number, y: number): Biome {
  if (terrain.moisture(x, y) > 0.07) return 'forest'
  if (terrain.hills(x, y) > 0.12) return 'hills'
  return 'plain'
}
