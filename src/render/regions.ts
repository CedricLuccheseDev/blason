import { Container, Graphics } from 'pixi.js'
import { NEUTRAL, isAllied } from '../../engine'
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
const STONE_ALPHA = 0.22
/** The border shared with an ally, in green as the heralds' vert. */
const ALLY = 0x2f7d3f
/** How often the lands are traced again, in ms. */
const EVERY_MS = 200

/** The key of a region: a lord, or a free domain (-3 and down); -2 the open sea; never yet drawn. */
const SEA_KEY = -2
const UNSET = 1 << 30

export function makeRegions(state: GameState, land: World, me: number) {
  const { grid } = state
  const { width, height } = grid
  const container = new Container()
  const washes = container.addChild(new Container())
  washes.sortableChildren = true
  const stone = container.addChild(new Graphics())
  const rims = container.addChild(new Container())
  const inks = container.addChild(new Container())
  const friends = container.addChild(new Graphics())
  let mine: Array<Array<Point>> = []
  let pacts = ''
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
    return owner === NEUTRAL ? -3 - state.realm[s] : owner
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
    const loops = corners(width, height, (t) => now[t] === key, tiles).map(
      (l) => smooth(l, grid.size),
    )
    const color = washOf(key)
    const wash = washes.addChild(new Graphics())
    for (const loop of loops) wash.poly(flatten(loop)).fill(color)
    wash.zIndex = -spread(loops)
    const ink = inks.addChild(new Graphics())
    for (const loop of loops)
      ink.poly(flatten(penned([...loop, loop[0]], 0.35, 3)), false)
    ink.stroke({
      width: 1.1,
      color: TONE.ink,
      alpha: key < 0 ? 0.4 : 0.8,
      join: 'round',
    })
    const parts = [wash, ink]
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
    if (key === me) mine = loops
  }

  /** Where my land meets an ally's, its border in green: the points of my outline whose outside is his. */
  function befriend() {
    friends.clear()
    for (const loop of mine) {
      let run: Array<Point> = []
      loop.forEach((p, i) => {
        const a = loop[(i + loop.length - 1) % loop.length]
        const b = loop[(i + 1) % loop.length]
        const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
        const out: Point = [
          p[0] + ((b[1] - a[1]) / d) * 2.5,
          p[1] - ((b[0] - a[0]) / d) * 2.5,
        ]
        const t =
          Math.floor(out[1] / grid.size) * width +
          Math.floor(out[0] / grid.size)
        const other = t >= 0 && t < state.owner.length ? state.owner[t] : -1
        if (other >= 0 && isAllied(state, me, other)) run.push(p)
        else {
          if (run.length > 1) friends.poly(flatten(run), false)
          run = []
        }
      })
      if (run.length > 1) friends.poly(flatten(run), false)
    }
    friends.stroke({
      width: 2.6,
      color: ALLY,
      alpha: 0.9,
      join: 'round',
      cap: 'round',
    })
  }

  /** The land each lord's castles hold, tinted with stone. */
  function wall(now: Int32Array) {
    stone.clear()
    for (const set of castleLand(state, now))
      for (const loop of corners(width, height, (t) => set.has(t), set))
        stone.poly(flatten(smooth(loop, grid.size)))
    stone.fill({ color: TONE.stoneDark, alpha: STONE_ALPHA })
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
      const allied = state.alliances.map((x) => [x.a, x.b].join(':')).join()
      if (dirty.size === 0 && works === built && allied === pacts) return
      pacts = allied
      const tiles = tilesOf(next, dirty)
      for (const key of dirty)
        if (key !== SEA_KEY && key !== UNSET)
          draw(key, tiles.get(key) ?? [], next)
      keys = next
      built = works
      wall(next)
      befriend()
    },
  }
}
