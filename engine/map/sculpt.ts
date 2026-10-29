import type { Cells } from './cells'
import type { Point } from './points'

// The tools the relief is shaped with, over the cells of the map, as a
// sculptor works clay: a hill raised round a cell and fading away from it, a
// range raised along a winding line, a trough dug along one, a pit, and a
// smoothing that rounds what they leave. Each spreads from cell to cell, a
// little more or less at each step as the stream draws, so that no slope is
// a perfect cone: their edges, once the sea comes up, are true coasts, with
// their capes and coves. The ranges are also kept apart, as the crests the
// high mountains will stand on. Pure: the stream is seeded, and only + − × ÷
// touch the heights, so every machine raises the same land.

/** Numbers in [0, 1), drawn in turn from the seed (points.ts). */
type Draw = () => number

/** A height for each cell, raised and dug by the tools below. */
export type Clay = {
  cells: Cells
  heights: Float64Array
  /** What the ranges alone raised: their crests. */
  ridges: Float64Array
  draw: Draw
}

/** Of a slope, what is left after a step: it fades to a tenth over its reach. */
function decayOver(reach: number): number {
  return Math.max(0.3, 1 - 2.3 / Math.max(1, reach))
}

/** The cell whose site lies nearest a point. */
function cellAt(cells: Cells, [x, y]: Point): number {
  let best = 0
  let gap = Infinity
  cells.sites.forEach(([sx, sy], c) => {
    const d = (sx - x) * (sx - x) + (sy - y) * (sy - y)
    if (d < gap) [best, gap] = [c, d]
  })
  return best
}

/**
 * How much the ground rises (or sinks, below 0) round some cells: the cells
 * given the most, each step away a little less, so many cells out before it
 * fades to a tenth; each step draws its own share, so the slope is rough.
 */
function spread(
  clay: Clay,
  from: Array<{ cell: number; lift: number }>,
  reach: number,
): Float64Array {
  const { cells, draw } = clay
  const decay = decayOver(reach)
  const lift = new Float64Array(cells.sites.length)
  const seen = new Uint8Array(cells.sites.length)
  const queue: Array<number> = []
  for (const { cell, lift: l } of from) {
    if (seen[cell]) continue
    seen[cell] = 1
    lift[cell] = l
    queue.push(cell)
  }
  const top = from.reduce((m, f) => Math.max(m, Math.abs(f.lift)), 0)
  for (const at of queue)
    for (const next of cells.neighbors[at]) {
      if (seen[next]) continue
      seen[next] = 1
      const l = lift[at] * decay * (0.88 + 0.24 * draw())
      if (Math.abs(l) < top * 0.02) continue
      lift[next] = l
      queue.push(next)
    }
  return lift
}

function add(field: Float64Array, lift: Float64Array) {
  for (let c = 0; c < field.length; c++) field[c] += lift[c]
}

/** A hill round a point (a pit, below 0), fading out over so many cells. */
export function hill(clay: Clay, at: Point, lift: number, reach: number) {
  add(
    clay.heights,
    spread(clay, [{ cell: cellAt(clay.cells, at), lift }], reach),
  )
}

/**
 * A winding line of cells from one point to another: each step goes to the
 * neighbour nearest the end, or now and then to another, so that no line is
 * straight.
 */
function wind(clay: Clay, from: Point, to: Point): Array<number> {
  const { cells, draw } = clay
  const end = cellAt(cells, to)
  const near = (c: number) => {
    const [x, y] = cells.sites[c]
    return (x - to[0]) * (x - to[0]) + (y - to[1]) * (y - to[1])
  }
  const line = [cellAt(cells, from)]
  const on = new Set(line)
  for (let at = line[0]; at !== end && line.length < 4000;) {
    const free = cells.neighbors[at].filter((n) => !on.has(n))
    if (free.length === 0) break
    const closest = free.reduce((b, n) => (near(n) < near(b) ? n : b), free[0])
    at = draw() < 0.18 ? free[Math.floor(draw() * free.length)] : closest
    line.push(at)
    on.add(at)
  }
  return line
}

/**
 * A range along a winding line (a trough, below 0): its crest along the
 * line, a little higher or lower at each cell, falling away on both sides
 * over so many cells. A range's crest is kept as a ridge, where the high
 * mountains may stand, unless it is only the spine of a low land.
 */
export function range(
  clay: Clay,
  from: Point,
  to: Point,
  lift: number,
  reach: number,
  crest = true,
) {
  const line = wind(clay, from, to).map((cell) => ({
    cell,
    lift: lift * (0.8 + 0.4 * clay.draw()),
  }))
  const raised = spread(clay, line, reach)
  add(clay.heights, raised)
  if (lift > 0 && crest) add(clay.ridges, raised)
}

/** Rounds the ground: each cell moves towards the mean of its neighbours, so many times. */
export function smooth(clay: Clay, times: number, weight = 0.5) {
  const { cells, heights } = clay
  for (let t = 0; t < times; t++) {
    const before = Float64Array.from(heights)
    cells.neighbors.forEach((around, c) => {
      if (around.length === 0) return
      let sum = 0
      for (const n of around) sum += before[n]
      heights[c] = before[c] * (1 - weight) + (sum / around.length) * weight
    })
  }
}
