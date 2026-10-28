import { Container, Graphics } from 'pixi.js'
import { NEUTRAL } from '../../engine'
import { mixColor } from './ease'
import { flatten } from './geometry'
import { drawLand } from './layers/lands'
import { penned } from './pen'
import { TONE, playerColor } from './palette'
import { castleLand, corners, inside, smooth, spread } from './trace'
import type { GameState, Point, World } from '../../engine'

// The lands drawn as the boards draw them (design/mockups/cells.ts): each
// region of the grid, a lord's land or a free domain, traced round its
// tiles, its steps rounded off, filled with its wash; a rim of its lord's
// colour just inside a lord's border; every border in a trembling pen line;
// all of it clipped to the coast. The land a castle holds is tinted with
// stone, one tint for all of a lord's castles. A region is traced again
// only when its land changed, a few times a second.

const WASH = 0.5
const MY_WASH = 0.74
const FREE = 0xdccb9e
const FREE_WASH = 0.42
/** The rim's width inside a lord's border, and its strength. */
const RIM = 3
const RIM_ALPHA = 0.55
/** How much stone tints the land a castle holds. */
const STONE_ALPHA = 0.3
/** Points of a rampart's line between two of its merlons. */
const MERLON = 6
/** How often the lands are traced again, in ms. */
const EVERY_MS = 200

/** The key of a region: a lord, or a free domain (-3 and down); -2 the open sea; never yet drawn. */
const SEA_KEY = -2
const UNSET = 1 << 30

export function makeRegions(state: GameState, land: World, me: number) {
  const { grid } = state
  const { width, height } = grid
  const container = new Container()
  // Under the smoothed washes, each region's tiles as they are: where three
  // regions meet, their rounded corners leave a gap, filled from here.
  const under = container.addChild(new Container())
  under.sortableChildren = true
  const washes = container.addChild(new Container())
  washes.sortableChildren = true
  const stone = container.addChild(new Graphics())
  const rims = container.addChild(new Container())
  const inks = container.addChild(new Container())
  const mask = container.addChild(drawLand(land))
  container.mask = mask
  // Each tile under the sea near a shore takes the nearest land's region, so the washes reach the coast and the coast clips them.
  const shore = grid.land.map((l, t) => (l ? t : -1))
  let ring = shore.flatMap((s, t) => (s >= 0 ? [t] : []))
  for (let depth = 0; depth < 4; depth++) {
    const next: Array<number> = []
    for (const t of ring)
      for (const n of [t - 1, t + 1, t - width, t + width]) {
        if (n < 0 || n >= shore.length || shore[n] >= 0) continue
        shore[n] = shore[t]
        next.push(n)
      }
    ring = next
  }
  const keyOf = (t: number) => {
    const s = shore[t]
    if (s < 0) return SEA_KEY
    const owner = state.owner[s]
    if (owner !== NEUTRAL) return owner
    // The free domains are drawn during the opening only: then the free land is one.
    return state.tick < state.rules.openingTicks ? -3 - state.realm[s] : -3
  }
  let keys = new Int32Array(shore.length).fill(UNSET)
  const drawn = new Map<number, Array<Graphics>>()
  let traced = -Infinity
  let built = ''

  function washOf(key: number): number {
    if (key < 0) return mixColor(TONE.page, FREE, FREE_WASH)
    return mixColor(TONE.page, playerColor(key), key === me ? MY_WASH : WASH)
  }

  function draw(key: number, tiles: Array<number>, now: Int32Array) {
    for (const g of drawn.get(key) ?? []) g.destroy()
    drawn.delete(key)
    if (tiles.length === 0) return
    const raw = corners(width, height, (t) => now[t] === key, tiles)
    const loops = raw.map((l) => smooth(l, grid.size))
    const color = washOf(key)
    const base = under.addChild(new Graphics())
    for (const loop of raw)
      base
        .poly(
          flatten(loop.map(([x, y]): Point => [x * grid.size, y * grid.size])),
        )
        .fill(color)
    const wash = washes.addChild(new Graphics())
    for (const loop of loops) wash.poly(flatten(loop)).fill(color)
    wash.zIndex = -spread(loops)
    base.zIndex = wash.zIndex
    const ink = inks.addChild(new Graphics())
    for (const loop of loops)
      ink.poly(flatten(penned([...loop, loop[0]], 0.35, 3)), false)
    ink.stroke({
      width: 1.1,
      color: TONE.ink,
      alpha: key < 0 ? 0.4 : 0.8,
      join: 'round',
    })
    const parts = [base, wash, ink]
    if (key >= 0) {
      const rim = rims.addChild(new Graphics())
      for (const loop of loops) rim.poly(flatten(inside(loop, RIM / 2)))
      rim.stroke({
        width: RIM,
        color: playerColor(key),
        alpha: RIM_ALPHA,
        join: 'round',
      })
      parts.push(rim)
    }
    drawn.set(key, parts)
  }

  /** The land each lord's castles hold, tinted with stone. */
  function wall(now: Int32Array) {
    stone.clear()
    const walls: Array<Array<Point>> = []
    for (const set of castleLand(state, now))
      for (const loop of corners(width, height, (t) => set.has(t), set)) {
        const round = smooth(loop, grid.size)
        stone.poly(flatten(round))
        walls.push(round)
      }
    stone.fill({ color: TONE.stoneDark, alpha: STONE_ALPHA })
    // Its rampart all round: a line of stone, merlons along it.
    for (const round of walls) {
      stone.poly(flatten(round))
      stone.stroke({ width: 1.6, color: TONE.lead, alpha: 0.85, join: 'round' })
      for (const [x, y] of round.filter((_, i) => i % MERLON === 0))
        stone.rect(x - 0.9, y - 0.9, 1.8, 1.8)
      stone.fill({ color: TONE.lead, alpha: 0.85 })
    }
  }

  /** The keys of the land now, and the regions whose land changed. */
  function changes() {
    const next = new Int32Array(shore.length)
    const dirty = new Set<number>()
    for (let t = 0; t < next.length; t++) {
      next[t] = keyOf(t)
      if (next[t] === keys[t]) continue
      dirty.add(next[t])
      dirty.add(keys[t])
    }
    return { next, dirty }
  }

  /** The tiles of each region that changed. */
  function tilesOf(next: Int32Array, dirty: Set<number>) {
    const tiles = new Map<number, Array<number>>()
    for (let t = 0; t < next.length; t++) {
      if (!dirty.has(next[t]) || next[t] === SEA_KEY) continue
      const list = tiles.get(next[t])
      if (list) list.push(t)
      else tiles.set(next[t], [t])
    }
    return tiles
  }

  return {
    container,
    /** Traces again the regions whose land changed, a few times a second. */
    update(now: number) {
      if (now - traced < EVERY_MS) return
      traced = now
      const { next, dirty } = changes()
      const works = state.works.map((w) => [w.tile, w.owner].join(':')).join()
      if (dirty.size === 0 && works === built) return
      const tiles = tilesOf(next, dirty)
      for (const key of dirty)
        if (key !== SEA_KEY && key !== UNSET)
          draw(key, tiles.get(key) ?? [], next)
      keys = next
      built = works
      wall(next)
    },
  }
}
