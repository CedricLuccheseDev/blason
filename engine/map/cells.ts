import { Delaunay } from 'd3-delaunay'
import type { Point } from './points'

export type Cells = {
  sites: Array<Point>
  /** Each cell's outline, without the closing point. */
  polygons: Array<Array<Point>>
  /** For each side of each outline: the cell across it, or -1 on the frame. */
  across: Array<Array<number>>
  neighbors: Array<Array<number>>
}

const NEAR = 1e-9

function same(p: Point, q: Point): boolean {
  const dx = p[0] - q[0]
  const dy = p[1] - q[1]
  return dx * dx + dy * dy < NEAR
}

/**
 * The Voronoi cells of the sites, cut to the frame. Two cells are neighbours
 * when they share a side; the frame borders no one.
 */
export function buildCells(
  sites: Array<Point>,
  width: number,
  height: number,
): Cells {
  const voronoi = Delaunay.from(
    sites,
    (p) => p[0],
    (p) => p[1],
  ).voronoi([0, 0, width, height])
  const polygons = sites.map((_, i) =>
    voronoi
      .cellPolygon(i)
      .slice(0, -1)
      .map((p): Point => [p[0], p[1]]),
  )
  const across = polygons.map((ring, i) => {
    const candidates = [...voronoi.neighbors(i)]
    return ring.map((a, k) => {
      const b = ring[(k + 1) % ring.length]
      const other = candidates.find((j) => shares(polygons[j], a, b))
      return other ?? -1
    })
  })
  const neighbors = across.map((sides) =>
    [...new Set(sides.filter((j) => j >= 0))].sort((p, q) => p - q),
  )
  return { sites, polygons, across, neighbors }
}

function shares(ring: Array<Point>, a: Point, b: Point): boolean {
  return ring.some((p) => same(p, a)) && ring.some((p) => same(p, b))
}
