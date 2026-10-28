import type { GameMap } from './map/types'
import type { Grid } from './types'

// The land cut into a fine grid of tiles, as OpenFront's map is cut in
// pixels: a tile is land when the cell of the map nearest its middle is
// land, so the grid follows the same coast as the drawing. Made from the
// map's whole positions alone: the same on every machine.

/** The grid of a map so many units wide and high, tiles so many units a side. */
export function makeGrid(
  map: GameMap,
  width: number,
  height: number,
  size: number,
): Grid {
  const cols = Math.ceil(width / size)
  const rows = Math.ceil(height / size)
  // The sites of the map in buckets of the grid, to find the nearest fast.
  const sites = [
    ...map.land.map((c) => ({ x: c.x, y: c.y, land: true })),
    ...map.sea.map((s) => ({ x: s.x, y: s.y, land: false })),
  ]
  const bucket = 8 * size
  const bw = Math.ceil(width / bucket) + 1
  const buckets = new Map<number, Array<number>>()
  sites.forEach((s, i) => {
    const key = Math.floor(s.y / bucket) * bw + Math.floor(s.x / bucket)
    buckets.set(key, [...(buckets.get(key) ?? []), i])
  })
  /** Whether the site nearest a point is land, among the buckets round it. */
  function landAt(x: number, y: number): boolean {
    const bx = Math.floor(x / bucket)
    const by = Math.floor(y / bucket)
    let best = -1
    let gap = Infinity
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++)
        for (const i of buckets.get((by + dy) * bw + bx + dx) ?? []) {
          const ex = sites[i].x - x
          const ey = sites[i].y - y
          const d = ex * ex + ey * ey
          if (d < gap || (d === gap && i < best)) {
            gap = d
            best = i
          }
        }
    return best >= 0 && sites[best].land
  }
  const half = Math.floor(size / 2)
  const land: Array<boolean> = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      land.push(landAt(c * size + half, r * size + half))
  return {
    width: cols,
    height: rows,
    size,
    land,
    area: land.filter(Boolean).length,
  }
}

/** The tiles beside one, up, down, left and right, that are on the grid. */
export function around(grid: Grid, tile: number): Array<number> {
  const { width, height } = grid
  const x = tile % width
  const y = Math.floor(tile / width)
  const found: Array<number> = []
  if (x > 0) found.push(tile - 1)
  if (x < width - 1) found.push(tile + 1)
  if (y > 0) found.push(tile - width)
  if (y < height - 1) found.push(tile + width)
  return found
}

/** The square of the distance between two tiles, in tiles. */
export function apart(grid: Grid, a: number, b: number): number {
  const dx = (a % grid.width) - (b % grid.width)
  const dy = Math.floor(a / grid.width) - Math.floor(b / grid.width)
  return dx * dx + dy * dy
}

/** Whether the straight line between two tiles stays on land, crossing no sea. */
export function overLand(grid: Grid, a: number, b: number): boolean {
  const [ax, ay] = [a % grid.width, Math.floor(a / grid.width)]
  const [dx, dy] = [(b % grid.width) - ax, Math.floor(b / grid.width) - ay]
  const steps = Math.max(Math.abs(dx), Math.abs(dy))
  // Rounded to the nearest tile in whole numbers, the same on every machine.
  const near = (d: number, s: number) =>
    Math.floor((2 * d * s + steps) / (2 * steps))
  for (let s = 1; s < steps; s++)
    if (!grid.land[(ay + near(dy, s)) * grid.width + ax + near(dx, s)])
      return false
  return true
}
