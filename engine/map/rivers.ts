import { drawInt } from '../numbers'
import { pop, push } from '../heap'
import type { Borders } from './borders'
import type { Cells } from './cells'
import type { Point } from './points'

// Rivers run along the borders of the cells, from the high ground down to
// the sea or a lake: a border drawn by water, as on old maps. The water's
// way is found once for the whole land, from the shores upwards, always
// over the lowest corner first (a priority flood): every corner of the land
// knows the next one down, and no river is caught in a hollow. A river
// ends at the water, or where it meets another, as its tributary.

type Corner = { at: Point; cells: Array<number> }
type Link = { to: number; i: number; j: number }

/** The fewest corners a river runs along, so that none is a mere stub. */
const SHORTEST = 9
/** Of the dry corners, the highest so many in a thousand may be a spring. */
const SPRINGS = 250
/** Two rivers keep so many map units apart, but for the last corners of one, where it joins the other or the sea. */
const APART = 60
const JOIN = 7

const keyOf = (p: Point) =>
  `${Math.round(p[0] * 1000)},${Math.round(p[1] * 1000)}`

/** So many rivers at most, and the cells along their banks. */
export function makeRivers(
  seed: string,
  cells: Cells,
  water: Array<boolean>,
  height: Array<number>,
  borders: Borders,
  count: number,
): { courses: Array<Array<Point>>; banks: Set<number> } {
  const { corners, links } = cornersOf(cells, water)
  const wet = corners.map((k) => k.cells.some((c) => water[c]))
  const level = corners.map((k, n) => {
    if (wet[n]) return -1
    return k.cells.reduce((sum, c) => sum + height[c], 0) / k.cells.length
  })
  const down = flood(links, wet, level)
  const dry = level.flatMap((_, n) => (wet[n] ? [] : [n]))
  const high = [...dry].sort((a, b) => level[b] - level[a] || a - b)
  const springs = high
    .slice(0, Math.floor((high.length * SPRINGS) / 1000))
    .map((n) => ({ n, key: drawInt(seed, 1_000_000, 'spring', n) }))
    .sort((a, b) => a.key - b.key || a.n - b.n)
  const taken = new Set<number>()
  const near = makeNear()
  const courses: Array<Array<Point>> = []
  const banks = new Set<number>()
  for (const { n } of springs) {
    if (courses.length >= count) break
    if (taken.has(n)) continue
    const walk = [n]
    for (let at = n; !wet[at] && down[at] >= 0 && !taken.has(at);) {
      at = down[at]
      walk.push(at)
    }
    if (walk.length < SHORTEST) continue
    // No river runs beside another: only its last few corners, where it
    // meets the other or the shore, may come near the rivers drawn.
    const head = walk.slice(0, -JOIN).map((k) => corners[k].at)
    if (head.some((p) => near.has(p))) continue
    walk.forEach((k) => {
      taken.add(k)
      near.add(corners[k].at)
    })
    courses.push(trace(walk, links, corners, borders, banks))
  }
  return { courses, banks }
}

/** The points of the rivers drawn, in buckets, to tell fast whether a point lies near one. */
function makeNear() {
  const buckets = new Map<number, Array<Point>>()
  const keyAt = (bx: number, by: number) => by * 100_000 + bx
  return {
    add(p: Point) {
      const key = keyAt(Math.floor(p[0] / APART), Math.floor(p[1] / APART))
      const list = buckets.get(key)
      if (list) list.push(p)
      else buckets.set(key, [p])
    },
    has([x, y]: Point): boolean {
      const [bx, by] = [Math.floor(x / APART), Math.floor(y / APART)]
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          for (const [qx, qy] of buckets.get(keyAt(bx + dx, by + dy)) ?? [])
            if ((qx - x) * (qx - x) + (qy - y) * (qy - y) < APART * APART)
              return true
      return false
    },
  }
}

/** The corners of the cells, and the links between them along borders of two cells of land. */
function cornersOf(cells: Cells, water: Array<boolean>) {
  const index = new Map<string, number>()
  const corners: Array<Corner> = []
  const links: Array<Array<Link>> = []
  const cornerOf = (p: Point) => {
    const key = keyOf(p)
    let n = index.get(key)
    if (n === undefined) {
      n = corners.length
      index.set(key, n)
      corners.push({ at: p, cells: [] })
      links.push([])
    }
    return n
  }
  cells.polygons.forEach((ring, i) => {
    ring.forEach((a, k) => {
      const b = ring[(k + 1) % ring.length]
      const j = cells.across[i][k]
      const [na, nb] = [cornerOf(a), cornerOf(b)]
      for (const n of [na, nb]) {
        if (!corners[n].cells.includes(i)) corners[n].cells.push(i)
        if (j >= 0 && !corners[n].cells.includes(j)) corners[n].cells.push(j)
      }
      if (j > i && !water[i] && !water[j]) {
        links[na].push({ to: nb, i, j })
        links[nb].push({ to: na, i, j })
      }
    })
  })
  return { corners, links }
}

/** For each corner, the next one down to the water (−1 for the water's own, or a corner it never reaches). */
function flood(
  links: Array<Array<Link>>,
  wet: Array<boolean>,
  level: Array<number>,
): Array<number> {
  const down = level.map(() => -1)
  const seen = wet.map((w) => w)
  const heap: Array<[number, number]> = []
  const rank = (h: number) => Math.round(h * 1_000_000)
  wet.forEach((w, n) => w && push(heap, [rank(-1), n]))
  for (let item = pop(heap); item; item = pop(heap)) {
    const [floor, at] = item
    for (const { to } of links[at]) {
      if (seen[to]) continue
      seen[to] = true
      down[to] = at
      push(heap, [Math.max(floor, rank(level[to])), to])
    }
  }
  return down
}

function trace(
  walk: Array<number>,
  links: Array<Array<Link>>,
  corners: Array<Corner>,
  borders: Borders,
  banks: Set<number>,
): Array<Point> {
  const points: Array<Point> = []
  for (let n = 1; n < walk.length; n++) {
    const link = links[walk[n - 1]].find((l) => l.to === walk[n])
    if (!link) continue
    banks.add(link.i).add(link.j)
    const from = corners[walk[n - 1]].at
    const to = corners[walk[n]].at
    const leg = borders.between(link.i, link.j, from, to)
    points.push(...(points.length ? leg.slice(1) : leg))
  }
  return points
}
