import { Delaunay } from 'd3-delaunay'
import { drawInt } from '../numbers'

export type Point = readonly [number, number]

/** So many darts thrown for each point the frame could hold at that spacing. */
const DARTS = 14

/**
 * A stream of numbers in [0, 1) from a seed (mulberry32): whole-number
 * operations only, the same on every machine, and far quicker than a draw
 * by name when the points are counted in tens of thousands.
 */
export function stream(seed: string, key: string): () => number {
  let a = drawInt(seed, 4294967296, 'stream', key)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Points thrown at random, each kept only if no other lies too close: an even
 * scatter with no grid in it (Poisson disc sampling). The darts grow with
 * the frame, so a map twice as large is as evenly filled.
 */
export function scatter(
  seed: string,
  width: number,
  height: number,
  spacing: number,
): Array<Point> {
  const cell = spacing / 2
  const cols = Math.ceil(width / cell)
  const rows = Math.ceil(height / cell)
  // At most one point a square of the grid: its side is under the spacing.
  const grid = new Int32Array(cols * rows).fill(-1)
  const points: Array<Point> = []
  const far = spacing * spacing
  const next = stream(seed, 'scatter')
  const darts = Math.floor((DARTS * width * height) / far)
  for (let dart = 0; dart < darts; dart++) {
    const x = next() * width
    const y = next() * height
    const gx = Math.floor(x / cell)
    const gy = Math.floor(y / cell)
    if (crowded(grid, points, cols, rows, gx, gy, x, y, far)) continue
    grid[gy * cols + gx] = points.length
    points.push([x, y])
  }
  return points
}

function crowded(
  grid: Int32Array,
  points: Array<Point>,
  cols: number,
  rows: number,
  gx: number,
  gy: number,
  x: number,
  y: number,
  far: number,
): boolean {
  for (let iy = Math.max(0, gy - 2); iy <= Math.min(rows - 1, gy + 2); iy++)
    for (let ix = Math.max(0, gx - 2); ix <= Math.min(cols - 1, gx + 2); ix++) {
      const q = grid[iy * cols + ix]
      if (q < 0) continue
      const dx = x - points[q][0]
      const dy = y - points[q][1]
      if (dx * dx + dy * dy < far) return true
    }
  return false
}

/** Each point moves to the centre of its cell: the cells even out (Lloyd). */
export function relax(
  points: Array<Point>,
  width: number,
  height: number,
): Array<Point> {
  const voronoi = Delaunay.from(
    points,
    (p) => p[0],
    (p) => p[1],
  ).voronoi([0, 0, width, height])
  return points.map((p, i) => {
    const polygon = voronoi.cellPolygon(i)
    return polygon.length ? centroid(polygon) : p
  })
}

function centroid(ring: ArrayLike<ArrayLike<number>>): Point {
  let area = 0
  let cx = 0
  let cy = 0
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = [ring[i][0], ring[i][1]]
    const next = ring[(i + 1) % ring.length]
    const cross = x1 * next[1] - next[0] * y1
    area += cross
    cx += (x1 + next[0]) * cross
    cy += (y1 + next[1]) * cross
  }
  return [cx / (3 * area), cy / (3 * area)]
}
