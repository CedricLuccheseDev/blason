import { Container, Graphics, Sprite } from 'pixi.js'
import { UNIT } from '../../../engine'
import { playerColor } from '../palette'
import { siteOf } from '../marks'
import { rankOf } from './melee'
import type { GameState, Host } from '../../../engine'
import type { Stamps } from '../textures'

// An army on its road: a column of soldiers in its lord's colour walks from
// its barracks to the front, smoothly between two ticks, and what is left of
// its road is dotted before it, then on to the tile clicked, so that the lord
// it marches on sees it coming. The road the simulation walks goes from tile
// to tile, in steps; it is drawn as a man would walk it, in straight lines
// over his lord's land, at an even pace. At the land's scale, as the battles.

/** World units for each size of a soldier, as in the battles. */
const WORLD = 0.2
/** A soldier's height, and as drawn in his stamp. */
const TALL = 22
const DRAWN = 13
/** Tiles between two men of the column, and between two dots of the road. */
const STRIDE = 1
const DOTS = 2

type Spot = { x: number; y: number }

/** Whether the straight line between two tiles stays on the lord's land. */
function clear(state: GameState, lord: number, a: number, b: number) {
  const { width } = state.grid
  const [ax, ay] = [a % width, Math.floor(a / width)]
  const [bx, by] = [b % width, Math.floor(b / width)]
  const steps = Math.ceil(Math.hypot(bx - ax, by - ay) * 2)
  for (let s = 1; s < steps; s++) {
    const x = Math.round(ax + ((bx - ax) * s) / steps)
    const y = Math.round(ay + ((by - ay) * s) / steps)
    if (state.owner[y * width + x] !== lord) return false
  }
  return true
}

/** The road pulled straight: from each turn, on to the farthest tile seen in a straight line. */
function straighten(state: GameState, host: Host): Array<Spot> {
  const { road, owner } = host
  const turns = [road[0]]
  let from = 0
  while (from < road.length - 1) {
    let to = from + 1
    for (let next = road.length - 1; next > from + 1; next--)
      if (clear(state, owner, road[from], road[next])) {
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

const paths = new WeakMap<Host, Array<Spot>>()

/** An army's road as it is drawn, made once: its land may change under it, the drawing does not. */
export function pathOf(state: GameState, host: Host): Array<Spot> {
  let path = paths.get(host)
  if (!path) {
    path =
      host.road.length > 1
        ? resample(straighten(state, host), host.road.length)
        : host.road.map((t) => siteOf(state, t))
    paths.set(host, path)
  }
  return path
}

/** How far along its road an army's head is, in tiles, so far into the next tick. */
export function headOf(state: GameState, host: Host, between: number) {
  const end = host.road.length - 1
  const moved = host.fighting ? 0 : state.rules.marchPace * between
  return Math.min(end, (host.along + moved) / 1000)
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

/** A column to draw: its army, how far along its head is, how much it has faded in. */
export type Marching = { host: Host; head: number; alpha: number }

export function makeColumns(stamps: Stamps) {
  const container = new Container()
  const dots = container.addChild(new Graphics())
  const troops = container.addChild(new Container())
  troops.sortableChildren = true
  const pool: Array<Sprite> = []
  let used = 0

  function man(color: number, alpha: number): Sprite {
    const sprite = pool[used] ?? troops.addChild(new Sprite())
    pool[used++] = sprite
    const stamp = stamps.soldier(color)
    sprite.texture = stamp.texture
    sprite.anchor.set(stamp.anchor.x, stamp.anchor.y)
    sprite.alpha = alpha
    sprite.visible = true
    return sprite
  }

  /** The road left before the army, then straight on to the tile clicked, dotted. */
  function dot(state: GameState, column: Marching, zoom: number) {
    const { host, head, alpha } = column
    const path = pathOf(state, host)
    const r = 0.9 / zoom + 0.3
    for (let at = Math.ceil(head + 1); at < path.length; at += DOTS)
      dots.circle(path[at].x, path[at].y, r)
    const from = path.at(-1) ?? siteOf(state, host.entry)
    const to = siteOf(state, host.aim)
    const tiles = Math.hypot(to.x - from.x, to.y - from.y) / state.grid.size
    for (let d = DOTS; d < tiles; d += DOTS) {
      const t = d / tiles
      dots.circle(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, r)
    }
    dots.fill({ color: playerColor(host.owner), alpha: 0.75 * alpha })
  }

  /** Its men one behind the other on the road, each stepping on his own beat. */
  function walk(state: GameState, column: Marching, seconds: number) {
    const { host, head, alpha } = column
    const path = pathOf(state, host)
    const n = rankOf(host.men / UNIT / 4)
    const k = WORLD
    for (let i = 0; i < n; i++) {
      const p = pointOn(path, head - i * STRIDE)
      const step = host.fighting
        ? 0
        : Math.abs(Math.sin(seconds * 9 + i * 1.3)) * 1.8 * k
      const sprite = man(playerColor(host.owner), alpha)
      sprite.position.set(p.x, p.y - step)
      const facing = p.right ? 1 : -1
      sprite.scale.set((facing * TALL * k) / DRAWN, (TALL * k) / DRAWN)
      sprite.zIndex = p.y
    }
  }

  return {
    container,
    draw(
      state: GameState,
      columns: Array<Marching>,
      zoom: number,
      seconds: number,
    ) {
      dots.clear()
      used = 0
      for (const column of columns) {
        if (column.alpha <= 0) continue
        dot(state, column, zoom)
        walk(state, column, seconds)
      }
      for (let i = used; i < pool.length; i++) pool[i].visible = false
    },
  }
}
