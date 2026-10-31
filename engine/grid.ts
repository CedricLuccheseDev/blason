import { riverTiles } from './map/streams'
import type { GameMap } from './map/types'
import type { Point } from './map/points'
import type { Grid } from './types'

// The land cut into a fine grid of tiles, as OpenFront's map is cut in
// pixels: a tile is land when the cell of the map nearest its middle is
// land, so the grid follows the same coast as the drawing; a tile of the
// high mountains is not, as the sea's, nor the dead land's (another's on a
// map of some lands only), but only the sea's, the lakes' and the rivers'
// is water, which the boats sail (crossing.ts), a river as wide as it is
// drawn (map/streams.ts). Made from the map's whole positions alone: the
// same on every machine.

/** The grid of a map so many units wide and high, tiles so many units a side. */
export function makeGrid(
  map: GameMap,
  width: number,
  height: number,
  size: number,
  /** The rivers' courses, from spring to mouth, made water. */
  rivers: ReadonlyArray<ReadonlyArray<Point>> = [],
): Grid {
  const cols = Math.ceil(width / size)
  const rows = Math.ceil(height / size)
  // The sites of the map in buckets of the grid, to find the nearest fast.
  const sites = [
    ...map.land.map((c) => ({
      x: c.x,
      y: c.y,
      land: true,
      water: false,
      wood: c.wood === true,
    })),
    ...map.sea.map((s) => ({ x: s.x, y: s.y, land: false, water: true })),
    ...map.peaks.map((p) => ({ x: p.x, y: p.y, land: false, water: false })),
    ...map.dead.map((d) => ({ x: d.x, y: d.y, land: false, water: false })),
  ]
  const bucket = 8 * size
  const bw = Math.ceil(width / bucket) + 1
  const buckets = new Map<number, Array<number>>()
  sites.forEach((s, i) => {
    const key = Math.floor(s.y / bucket) * bw + Math.floor(s.x / bucket)
    buckets.set(key, [...(buckets.get(key) ?? []), i])
  })
  /** The site nearest a point, among the buckets round it. */
  function siteAt(x: number, y: number) {
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
    return best >= 0 ? sites[best] : null
  }
  const half = Math.floor(size / 2)
  const land: Array<boolean> = []
  const water: Array<boolean> = []
  const wood: Array<boolean> = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const site = siteAt(c * size + half, r * size + half)
      land.push(site?.land ?? false)
      water.push(site?.water ?? false)
      wood.push(site !== null && 'wood' in site && site.wood === true)
    }
  const river = land.map(() => false)
  for (const t of riverTiles(rivers, cols, rows, size))
    if (land[t])
      [land[t], water[t], wood[t], river[t]] = [false, true, false, true]
  return {
    width: cols,
    height: rows,
    size,
    land,
    water,
    wood,
    river,
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

/** Each tile beside one, in the order of `around`, with no list made: for the searches that walk many tiles. */
export function eachAround(
  grid: Grid,
  tile: number,
  visit: (next: number) => void,
): void {
  const { width, height } = grid
  const x = tile % width
  if (x > 0) visit(tile - 1)
  if (x < width - 1) visit(tile + 1)
  if (tile >= width) visit(tile - width)
  if (tile < (height - 1) * width) visit(tile + width)
}

/** The square of the distance between two tiles, in tiles. */
export function apart(grid: Grid, a: number, b: number): number {
  const dx = (a % grid.width) - (b % grid.width)
  const dy = Math.floor(a / grid.width) - Math.floor(b / grid.width)
  return dx * dx + dy * dy
}

/**
 * Whether the straight line between the middles of two tiles crosses no sea:
 * every tile it passes through on the way is land, a corner of one as much
 * as its middle, and both tiles beside a corner it goes through. Walked
 * tile by tile in whole numbers, the same on every machine.
 */
export function overLand(grid: Grid, a: number, b: number): boolean {
  const { width, land } = grid
  let [x, y] = [a % width, Math.floor(a / width)]
  const [dx, dy] = [(b % width) - x, Math.floor(b / width) - y]
  const [sx, sy] = [Math.sign(dx), Math.sign(dy)]
  const [nx, ny] = [Math.abs(dx), Math.abs(dy)]
  for (let i = 0, j = 0; i < nx || j < ny;) {
    // The line leaves the tile by the side it reaches first: below zero by its left or right, above zero by its top or bottom, at zero by a corner.
    const side = (1 + 2 * i) * ny - (1 + 2 * j) * nx
    if (side === 0 && !(land[y * width + x + sx] && land[(y + sy) * width + x]))
      return false
    if (side <= 0) [x, i] = [x + sx, i + 1]
    if (side >= 0) [y, j] = [y + sy, j + 1]
    const tile = y * width + x
    if (tile !== b && !land[tile]) return false
  }
  return true
}
