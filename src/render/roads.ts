import { siteOf } from './marks'
import type { GameState } from '../../engine'

// The roads as they are drawn. The simulation walks a road from tile to
// tile, in steps across and down; a man or a wagon walks it in straight
// lines, from each turn on to the farthest point of the road he can see
// without leaving the ground the road may cross; a built road wanders a
// little aside, as roads of old, and its corners are smoothed; at an even
// pace: as many points as the road has tiles,
// evenly spaced, so that what the simulation counts in tiles moves smoothly.

/** The tiles a road may be drawn over. */
type Open = (tile: number) => boolean

export type Spot = { x: number; y: number }

/** Whether the straight line between two tiles stays on open tiles. */
function clear(state: GameState, open: Open, a: number, b: number) {
  const { width } = state.grid
  const [ax, ay] = [a % width, Math.floor(a / width)]
  const [bx, by] = [b % width, Math.floor(b / width)]
  const steps = Math.ceil(Math.hypot(bx - ax, by - ay) * 2)
  for (let s = 1; s < steps; s++) {
    const x = Math.round(ax + ((bx - ax) * s) / steps)
    const y = Math.round(ay + ((by - ay) * s) / steps)
    if (!open(y * width + x)) return false
  }
  return true
}

/** The road pulled straight: from each turn, on to the farthest tile seen in a straight line. */
function straighten(state: GameState, road: Array<number>, open: Open) {
  const turns = [road[0]]
  let from = 0
  while (from < road.length - 1) {
    let to = from + 1
    for (let next = road.length - 1; next > from + 1; next--)
      if (clear(state, open, road[from], road[next])) {
        to = next
        break
      }
    turns.push(road[to])
    from = to
  }
  return turns.map((t) => siteOf(state, t))
}

/** As many points as the road has tiles, evenly spaced along its straight lines. */
function resample(turns: Array<Spot>, count: number): Array<Spot> {
  const lengths = [0]
  for (let i = 1; i < turns.length; i++)
    lengths.push(
      lengths[i - 1] +
        Math.hypot(turns[i].x - turns[i - 1].x, turns[i].y - turns[i - 1].y),
    )
  const total = lengths.at(-1) ?? 0
  const points: Array<Spot> = []
  let leg = 1
  for (let i = 0; i < count; i++) {
    const d = count > 1 ? (total * i) / (count - 1) : 0
    while (leg < turns.length - 1 && lengths[leg] < d) leg++
    const a = turns[Math.max(0, leg - 1)]
    const b = turns[Math.min(turns.length - 1, leg)]
    const span = lengths[leg] - lengths[leg - 1] || 1
    const t = Math.max(0, Math.min(1, (d - (lengths[leg - 1] ?? 0)) / span))
    points.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
  }
  return points
}

/** Corners smoothed, the ends kept where they are. */
function round(points: Array<Spot>, rounds: number): Array<Spot> {
  let pts = points
  for (let r = 0; r < rounds && pts.length > 2; r++) {
    const next: Array<Spot> = [pts[0]]
    for (let i = 0; i < pts.length - 1; i++) {
      const [a, b] = [pts[i], pts[i + 1]]
      next.push(
        { x: 0.75 * a.x + 0.25 * b.x, y: 0.75 * a.y + 0.25 * b.y },
        { x: 0.25 * a.x + 0.75 * b.x, y: 0.25 * a.y + 0.75 * b.y },
      )
    }
    next.push(pts[pts.length - 1])
    pts = next
  }
  return pts
}

/** Map units between two bends of a wandering road, and how far it strays at most. */
const BEND = 7

/**
 * A road that wanders as roads of old do, never quite straight: every few
 * steps it strays to one side or the other, by two waves of its own, less
 * near its ends, and never off the ground it may cross.
 */
function wander(
  state: GameState,
  line: Array<Spot>,
  open: Open,
  stray: number,
): Array<Spot> {
  const lengths = line.map((_, i) =>
    i === 0
      ? 0
      : Math.hypot(line[i].x - line[i - 1].x, line[i].y - line[i - 1].y),
  )
  const total = lengths.reduce((a, b) => a + b, 0)
  const count = Math.max(2, Math.round(total / BEND) + 1)
  const even = resample(line, count)
  const { size, width } = state.grid
  const phase = (line[0].x * 0.37 + line[0].y * 0.11) % 6.28
  return even.map((p, i) => {
    if (i === 0 || i === count - 1) return p
    const q = even[i + 1]
    const o = even[i - 1]
    const d = Math.hypot(q.x - o.x, q.y - o.y) || 1
    const across = { x: -(q.y - o.y) / d, y: (q.x - o.x) / d }
    const s = (i / (count - 1)) * total
    const ends = Math.min(1, s / 14, (total - s) / 14)
    let by =
      stray *
      ends *
      (0.65 * Math.sin(s / 11 + phase) + 0.35 * Math.sin(s / 4.3 + phase * 2))
    for (let tries = 0; tries < 3; tries++) {
      const x = Math.floor((p.x + across.x * by) / size)
      const y = Math.floor((p.y + across.y * by) / size)
      if (open(y * width + x)) break
      by /= 2
    }
    return { x: p.x + across.x * by, y: p.y + across.y * by }
  })
}

/** How far from the water a built road keeps when it may, in tiles; how far it is pushed aside at most. */
const [SHORE, PUSH] = [1.6, 0.9]

/** Where the water near a point pushes it, in tiles: away from each water tile within the shore's reach, the nearer the more. */
function pushOf(state: GameState, cx: number, cy: number): [number, number] {
  const { width, height, water } = state.grid
  const reach = Math.ceil(SHORE)
  let [px, py] = [0, 0]
  for (let y = Math.floor(cy) - reach; y <= Math.floor(cy) + reach; y++)
    for (let x = Math.floor(cx) - reach; x <= Math.floor(cx) + reach; x++) {
      const off = x < 0 || y < 0 || x >= width || y >= height
      if (off || !water[y * width + x]) continue
      const [dx, dy] = [cx - (x + 0.5), cy - (y + 0.5)]
      const d = Math.hypot(dx, dy) || 1
      if (d >= SHORE) continue
      px += (dx / d) * (SHORE - d)
      py += (dy / d) * (SHORE - d)
    }
  return [px, py]
}

/**
 * A built road kept off the water's edge (« les chemins des marchands
 * collent trop proche » of the rivers): the shortest way from tile to tile
 * runs along the bank, where the river's drawing covers it; each point
 * pushed away from the water tiles near it, the nearer the more, never onto
 * a tile the road may not cross.
 */
function ashore(state: GameState, line: Array<Spot>, open: Open): Array<Spot> {
  const { size, width } = state.grid
  return line.map((p, i) => {
    if (i === 0 || i === line.length - 1) return p
    const [cx, cy] = [p.x / size, p.y / size]
    const [px, py] = pushOf(state, cx, cy)
    const push = Math.hypot(px, py)
    if (push === 0) return p
    // As far as it may go, less if that would put it off its ground.
    for (let k = Math.min(PUSH, push) / push; k > 0.1; k /= 2) {
      const [x, y] = [cx + px * k, cy + py * k]
      if (open(Math.floor(y) * width + Math.floor(x)))
        return { x: x * size, y: y * size }
    }
    return p
  })
}

/** A road's tiles as it is drawn: straight over open tiles, wandering so far aside if it is a built road, smoothed so many times, as many points as it has tiles. */
export function drawRoad(
  state: GameState,
  road: Array<number>,
  open: Open,
  rounds: number,
  stray = 0,
): Array<Spot> {
  if (road.length < 2) return road.map((t) => siteOf(state, t))
  const line = straighten(state, road, open)
  const bent =
    stray > 0 ? ashore(state, wander(state, line, open, stray), open) : line
  return resample(round(bent, rounds), road.length)
}

/** A point of a drawn road, so many tiles along it, and whether it goes right there. */
export function pointOn(path: Array<Spot>, at: number) {
  const clamped = Math.max(0, Math.min(path.length - 1, at))
  const i = Math.min(path.length - 2, Math.floor(clamped))
  if (i < 0) return { ...path[0], right: true }
  const [a, b] = [path[i], path[i + 1]]
  const t = clamped - i
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    right: b.x >= a.x,
  }
}
