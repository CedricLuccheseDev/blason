import type { GameState, Grid, Point } from '../../engine'

// Tracing the grid's regions as lines, as the boards do: the outline of a
// set of tiles round its corners, its steps rounded off into a soft edge.

/** A tile's four sides, as the grid's corners: from, to, with the tile on the right. */
export function corners(
  width: number,
  height: number,
  is: (t: number) => boolean,
  tiles: Iterable<number>,
): Array<Array<Point>> {
  const V = width + 1
  const edges = new Map<number, Array<number>>()
  const add = (ax: number, ay: number, bx: number, by: number) => {
    const k = ay * V + ax
    const list = edges.get(k)
    if (list) list.push(by * V + bx)
    else edges.set(k, [by * V + bx])
  }
  const at = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < width && y < height && is(y * width + x)
  for (const t of tiles) {
    const x = t % width
    const y = Math.floor(t / width)
    if (!at(x, y - 1)) add(x, y, x + 1, y)
    if (!at(x + 1, y)) add(x + 1, y, x + 1, y + 1)
    if (!at(x, y + 1)) add(x + 1, y + 1, x, y + 1)
    if (!at(x - 1, y)) add(x, y + 1, x, y)
  }
  return loopsOf(edges, V)
}

/** Of the edges leaving a corner, the one to follow: right first, then on, then left. */
function turn(options: Array<number>, from: number, to: number, V: number) {
  const dx = (to % V) - (from % V)
  const dy = Math.floor(to / V) - Math.floor(from / V)
  for (const [ex, ey] of [
    [-dy, dx],
    [dx, dy],
    [dy, -dx],
  ]) {
    const pick = options.findIndex(
      (o) =>
        (o % V) - (to % V) === ex &&
        Math.floor(o / V) - Math.floor(to / V) === ey,
    )
    if (pick >= 0) return pick
  }
  return -1
}

/** One loop followed from a corner, the edges it uses taken away. */
function follow(
  edges: Map<number, Array<number>>,
  start: number,
  first: number,
  V: number,
) {
  const loop: Array<Point> = []
  let from = start
  let to = first
  for (let guard = 0; guard < 400000; guard++) {
    loop.push([from % V, Math.floor(from / V)])
    if (to === start) break
    const options = edges.get(to) ?? []
    const pick = turn(options, from, to, V)
    if (pick < 0) break
    from = to
    to = options.splice(pick, 1)[0]
  }
  return loop
}

/** The edges chained into loops; where two tiles touch at a corner, turn right: each keeps its own outline. */
function loopsOf(edges: Map<number, Array<number>>, V: number) {
  const loops: Array<Array<Point>> = []
  for (const start of [...edges.keys()]) {
    for (;;) {
      const first = edges.get(start)?.shift()
      if (first === undefined) break
      loops.push(follow(edges, start, first, V))
    }
  }
  return loops
}

/** A loop of corners as a wash's soft edge: the middles of its steps, smoothed twice, in map units. */
export function smooth(loop: Array<Point>, size: number): Array<Point> {
  let pts: Array<Point> = loop.map((p, i) => {
    const q = loop[(i + 1) % loop.length]
    return [((p[0] + q[0]) / 2) * size, ((p[1] + q[1]) / 2) * size]
  })
  for (let round = 0; round < 2; round++)
    pts = pts.flatMap((p, i) => {
      const q = pts[(i + 1) % pts.length]
      return [
        [0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]] as Point,
        [0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]] as Point,
      ]
    })
  return pts
}

/** A loop moved a little inside its region, which lies on the right of its course. */
export function inside(loop: Array<Point>, by: number): Array<Point> {
  return loop.map((p, i) => {
    const a = loop[(i + loop.length - 1) % loop.length]
    const b = loop[(i + 1) % loop.length]
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const d = Math.hypot(dx, dy) || 1
    return [p[0] - (dy / d) * by, p[1] + (dx / d) * by]
  })
}

/** A stretch of a loop's line facing what was looked for: an open line, and the tiles just across it. */
export type Stretch = { line: Array<Point>; across: Array<number> }

/** How far across a line its far side is read, in tiles. */
const ACROSS = 0.6

/** The tile just across a loop at one of its points, from the region on the right of its course; -1 off the grid. */
function across(loop: Array<Point>, i: number, grid: Grid): number {
  const [x, y] = loop[i]
  const a = loop[(i + loop.length - 1) % loop.length]
  const b = loop[(i + 1) % loop.length]
  const d = (Math.hypot(b[0] - a[0], b[1] - a[1]) || 1) / (grid.size * ACROSS)
  const tx = Math.floor((x + (b[1] - a[1]) / d) / grid.size)
  const ty = Math.floor((y - (b[0] - a[0]) / d) / grid.size)
  const off = tx < 0 || ty < 0 || tx >= grid.width || ty >= grid.height
  return off ? -1 : ty * grid.width + tx
}

/** The stretches of a loop whose far side the test picks, each reaching a point beyond, so that it meets the borders on either side. */
export function facing(
  loop: Array<Point>,
  grid: Grid,
  test: (t: number) => boolean,
): Array<Stretch> {
  const n = loop.length
  const tiles = loop.map((_, i) => across(loop, i, grid))
  const picked = tiles.map((t) => t >= 0 && test(t))
  const start = picked.indexOf(false)
  if (start < 0) return [{ line: [...loop, loop[0]], across: tiles }]
  const stretches: Array<Stretch> = []
  let run: Array<number> = []
  for (let k = 1; k <= n; k++) {
    const i = (start + k) % n
    if (picked[i]) run.push(i)
    else if (run.length > 0) {
      const ends = [(run[0] + n - 1) % n, ...run, i]
      stretches.push({
        line: ends.map((j) => loop[j]),
        across: run.map((j) => tiles[j]),
      })
      run = []
    }
  }
  return stretches
}

/** The area a loop's box covers: the larger regions drawn first, the ones they enclose over them. */
export function spread(loops: Array<Array<Point>>): number {
  let area = 0
  for (const loop of loops) {
    const xs = loop.map((p) => p[0])
    const ys = loop.map((p) => p[1])
    const box =
      (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))
    area = Math.max(area, box)
  }
  return area
}

/** The tiles each lord's castles hold: within their reach, of his land. */
export function castleLand(state: GameState, keys: Int32Array) {
  const { width, height } = state.grid
  const r = state.rules.castleRadius
  const byLord = new Map<number, Set<number>>()
  for (const work of state.works) {
    if (work.work !== 'castle') continue
    const cx = work.tile % width
    const cy = Math.floor(work.tile / width)
    const set = byLord.get(work.owner) ?? new Set<number>()
    const top = Math.max(0, cy - r)
    const left = Math.max(0, cx - r)
    for (let y = top; y <= Math.min(height - 1, cy + r); y++)
      for (let x = left; x <= Math.min(width - 1, cx + r); x++) {
        const t = y * width + x
        const d = (x - cx) * (x - cx) + (y - cy) * (y - cy)
        if (d <= r * r && keys[t] === work.owner) set.add(t)
      }
    byLord.set(work.owner, set)
  }
  return [...byLord.values()]
}
