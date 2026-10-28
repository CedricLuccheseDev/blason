import { Delaunay } from 'd3-delaunay'
import { drawInt } from '../numbers'

export type Point = readonly [number, number]

/**
 * Points thrown at random, each kept only if no other lies too close: an even
 * scatter with no grid in it (Poisson disc sampling).
 */
export function scatter(
  seed: string,
  width: number,
  height: number,
  spacing: number,
): Array<Point> {
  const cell = spacing / 2
  const grid = new Map<string, Point>()
  const points: Array<Point> = []
  const far = spacing * spacing
  for (let dart = 0; dart < 60000; dart++) {
    const x = (drawInt(seed, 1e9, 'x', dart) / 1e9) * width
    const y = (drawInt(seed, 1e9, 'y', dart) / 1e9) * height
    const gx = Math.floor(x / cell)
    const gy = Math.floor(y / cell)
    if (crowded(grid, gx, gy, x, y, far)) continue
    grid.set(`${gx},${gy}`, [x, y])
    points.push([x, y])
  }
  return points
}

function crowded(
  grid: Map<string, Point>,
  gx: number,
  gy: number,
  x: number,
  y: number,
  far: number,
): boolean {
  for (let ix = gx - 2; ix <= gx + 2; ix++) {
    for (let iy = gy - 2; iy <= gy + 2; iy++) {
      const q = grid.get(`${ix},${iy}`)
      if (!q) continue
      const dx = x - q[0]
      const dy = y - q[1]
      if (dx * dx + dy * dy < far) return true
    }
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
