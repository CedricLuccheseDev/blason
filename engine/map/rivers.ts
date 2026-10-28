import { drawInt } from '../numbers'
import type { Borders } from './borders'
import type { Cells } from './cells'
import type { Point } from './points'
import type { Terrain } from './terrain'

type Corner = { at: Point; cells: Set<number> }
type Link = { to: string; i: number; j: number }

const keyOf = (p: Point) =>
  `${Math.round(p[0] * 1000)},${Math.round(p[1] * 1000)}`

/**
 * Rivers run along the borders, from high ground down to the sea: a border
 * drawn by water, as on old maps. At most three, none crossing another.
 */
export function makeRivers(
  seed: string,
  cells: Cells,
  sea: Array<boolean>,
  terrain: Terrain,
  borders: Borders,
): Array<Array<Point>> {
  const { corners, links } = cornersOf(cells, sea)
  const height = (k: string) => {
    const [x, y] = corners.get(k)?.at ?? [0, 0]
    return terrain.elevation(x, y)
  }
  const wet = (k: string) =>
    [...(corners.get(k)?.cells ?? [])].some((i) => sea[i])
  const sources = [...corners.keys()]
    .filter((k) => height(k) > 0.9 && !wet(k))
    .sort(
      (a, b) => drawInt(seed, 1e6, 'river', a) - drawInt(seed, 1e6, 'river', b),
    )
  const taken = new Set<string>()
  const rivers: Array<Array<Point>> = []
  for (const source of sources) {
    if (rivers.length >= 3) break
    const walk = downhill(source, links, height, wet, taken)
    if (!walk || walk.length < 8) continue
    walk.forEach((k) => taken.add(k))
    rivers.push(trace(walk, links, corners, borders))
  }
  return rivers
}

function cornersOf(cells: Cells, sea: Array<boolean>) {
  const corners = new Map<string, Corner>()
  const links = new Map<string, Array<Link>>()
  cells.polygons.forEach((ring, i) => {
    ring.forEach((a, k) => {
      const b = ring[(k + 1) % ring.length]
      const j = cells.across[i][k]
      for (const p of [a, b]) {
        const corner = corners.get(keyOf(p)) ?? { at: p, cells: new Set() }
        corner.cells.add(i)
        if (j >= 0) corner.cells.add(j)
        corners.set(keyOf(p), corner)
      }
      if (j > i && !sea[i] && !sea[j]) {
        links.set(keyOf(a), [
          ...(links.get(keyOf(a)) ?? []),
          { to: keyOf(b), i, j },
        ])
        links.set(keyOf(b), [
          ...(links.get(keyOf(b)) ?? []),
          { to: keyOf(a), i, j },
        ])
      }
    })
  })
  return { corners, links }
}

function downhill(
  source: string,
  links: Map<string, Array<Link>>,
  height: (k: string) => number,
  wet: (k: string) => boolean,
  taken: Set<string>,
): Array<string> | undefined {
  const walk = [source]
  for (let at = source; walk.length < 80;) {
    if (wet(at) || taken.has(at)) return walk
    const next = (links.get(at) ?? [])
      .map((link) => link.to)
      .filter((k) => !walk.includes(k))
      .sort((a, b) => height(a) - height(b))
      .at(0)
    if (next === undefined || height(next) > height(at) + 0.03) return undefined
    walk.push(next)
    at = next
  }
  return undefined
}

function trace(
  walk: Array<string>,
  links: Map<string, Array<Link>>,
  corners: Map<string, Corner>,
  borders: Borders,
): Array<Point> {
  const points: Array<Point> = []
  for (let n = 1; n < walk.length; n++) {
    const link = (links.get(walk[n - 1]) ?? []).find((l) => l.to === walk[n])
    const from = corners.get(walk[n - 1])?.at
    const to = corners.get(walk[n])?.at
    if (!link || !from || !to) continue
    const leg = borders.between(link.i, link.j, from, to)
    points.push(...(points.length ? leg.slice(1) : leg))
  }
  return points
}
