import type { Grid, World } from '../../../engine'

// The ground under each tile, read once when a game is mounted: its biome,
// the biome of the map's land cell nearest the tile's middle (0 a plain, 1
// a forest, 2 hills, the sea none), and how far it lies from the shore. The
// simulation knows nothing of it: it is only drawn.

export const PLAIN = 0
export const FOREST = 1
export const HILLS = 2
const SEA = 255
const BIOMES = { plain: PLAIN, forest: FOREST, hills: HILLS } as const

export type Terrain = {
  biome: Uint8Array
  /** Tiles to the nearest tile of the other side of the shore (sea for land, land for sea), up to FAR. */
  shore: Uint8Array
}

/** How far the shore's distance is counted, in tiles. */
const FAR = 6

/** The land cell nearest each point, found among buckets of the map. */
function nearestCell(world: World) {
  const cells = world.map.land
  const bucket = 32
  const bw = Math.ceil(world.width / bucket) + 1
  const buckets = new Map<number, Array<number>>()
  cells.forEach((c, i) => {
    const key = Math.floor(c.y / bucket) * bw + Math.floor(c.x / bucket)
    const list = buckets.get(key)
    if (list) list.push(i)
    else buckets.set(key, [i])
  })
  return (x: number, y: number) => {
    const [bx, by] = [Math.floor(x / bucket), Math.floor(y / bucket)]
    let [best, gap] = [0, Infinity]
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++)
        for (const i of buckets.get((by + dy) * bw + bx + dx) ?? []) {
          const d = (cells[i].x - x) ** 2 + (cells[i].y - y) ** 2
          if (d < gap) [best, gap] = [i, d]
        }
    return best
  }
}

/** The tiles that touch the other side of the shore, up, down, left or right. */
function shoreline(grid: Grid): Array<number> {
  const { width, height, land } = grid
  const line: Array<number> = []
  for (let t = 0; t < land.length; t++) {
    const [c, r] = [t % width, Math.floor(t / width)]
    const across = [
      c > 0 ? t - 1 : -1,
      c < width - 1 ? t + 1 : -1,
      r > 0 ? t - width : -1,
      r < height - 1 ? t + width : -1,
    ]
    if (across.some((n) => n >= 0 && land[n] !== land[t])) line.push(t)
  }
  return line
}

/** The tiles round one, all eight, on the grid and on its side of the shore. */
function beside(grid: Grid, t: number): Array<number> {
  const { width, height, land } = grid
  const out: Array<number> = []
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const [c, r] = [(t % width) + dx, Math.floor(t / width) + dy]
      const n = r * width + c
      if (c >= 0 && r >= 0 && c < width && r < height && land[n] === land[t])
        out.push(n)
    }
  return out
}

/** Tiles from the shore, counted out from the tiles that touch the other side. */
function shoreDistance(grid: Grid): Uint8Array {
  const d = new Uint8Array(grid.land.length).fill(FAR)
  let ring = shoreline(grid)
  for (const t of ring) d[t] = 0
  for (let step = 1; step < FAR && ring.length; step++) {
    const next: Array<number> = []
    for (const t of ring)
      for (const n of beside(grid, t)) {
        if (d[n] <= step) continue
        d[n] = step
        next.push(n)
      }
    ring = next
  }
  return d
}

export function readTerrain(world: World, grid: Grid): Terrain {
  const nearest = nearestCell(world)
  const biome = new Uint8Array(grid.land.length).fill(SEA)
  for (let t = 0; t < biome.length; t++) {
    if (!grid.land[t]) continue
    const cell = nearest(
      ((t % grid.width) + 0.5) * grid.size,
      (Math.floor(t / grid.width) + 0.5) * grid.size,
    )
    biome[t] = BIOMES[world.land[cell].biome]
  }
  return { biome, shore: shoreDistance(grid) }
}
