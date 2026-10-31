import { Container, Graphics } from 'pixi.js'
import { NEUTRAL } from '../../engine'
import { mixColor } from './ease'
import { flatten, simplifyLoop, straighten } from './geometry'
import { TONE, playerColor } from './palette'
import { castleLand, corners, smooth, spread } from './trace'
import type { GameState, Point } from '../../engine'

// The lands drawn as the boards draw them (design/mockups/cells.ts): each
// region of the grid, a lord's land or the free land, traced round its
// tiles, its steps rounded off, filled with its wash, clipped to the coast.
// The land a castle holds is tinted with stone and walled, one tint for all
// of a lord's castles. A region is traced again only when its land changed,
// a few times a second; its outline as last traced lends its line to the
// borders' ink (layers/borders.ts), the green of the allies and the red of
// the wars, and its keys to the ground's decoration (ground/decor.ts).

const WASH = 0.64
const MY_WASH = 0.84
const FREE = 0xdccb9e
const FREE_WASH = 0.42
/** How much stone tints the land a castle holds. */
const STONE_ALPHA = 0.3
/** Points of a rampart's line between two of its merlons. */
const MERLON = 6
/** How far a wash's edge may stray from its outline, in map units: less than the border's ink covers. */
const UNDER_INK = 0.08
/** How often the lands are traced again, in ms. */
const EVERY_MS = 200
/** How often the free land is traced again, in ms: one region for the whole of it, the greatest and the most often changed, holes and all (« le jeu n'est pas très fluide sur la map europe avec 20 joueurs ça sacade »); its edges are the lords' borders, traced as often as the lords. */
const FREE_EVERY_MS = 1000
const FREE_KEY = -3

/** The key of a region: a lord, or the free land (-3); -2 the open sea; never yet drawn. */
const SEA_KEY = -2
const UNSET = 1 << 30

export function makeRegions(state: GameState, me: number) {
  const { grid } = state
  const { width, height } = grid
  const container = new Container()
  // Under the smoothed washes, each region's tiles as they are: where three
  // regions meet, their rounded corners leave a gap, filled from here.
  const under = container.addChild(new Container())
  under.sortableChildren = true
  const washes = container.addChild(new Container())
  washes.sortableChildren = true
  /** The castles' stone, laid over the ground's decoration with the borders. */
  const stone = new Graphics()
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
    // The free land is one, in the opening too: only the standards planted are drawn.
    return owner !== NEUTRAL ? owner : FREE_KEY
  }
  let keys = new Int32Array(shore.length).fill(UNSET)
  const drawn = new Map<number, Array<Graphics>>()
  /** Each region's outline as last traced, for the lines laid along its border. */
  const outlines = new Map<number, Array<Array<Point>>>()
  let traced = -Infinity
  /** When the free land was last traced, and whether it changed since. */
  let freeTraced = -Infinity
  let freeDue = false
  let built = ''

  function washOf(key: number): number {
    if (key < 0) return mixColor(TONE.page, FREE, FREE_WASH)
    return mixColor(TONE.page, playerColor(key), key === me ? MY_WASH : WASH)
  }

  function draw(key: number, tiles: Array<number>, now: Int32Array) {
    for (const g of drawn.get(key) ?? []) g.destroy()
    drawn.delete(key)
    outlines.delete(key)
    if (tiles.length === 0) return
    const raw = corners(width, height, (t) => now[t] === key, tiles)
    const loops = raw.map((l) => smooth(l, grid.size))
    const color = washOf(key)
    const base = under.addChild(new Graphics())
    // Filled with fewer points: a straight run is one edge, and a curve's
    // smallest turns lie under the border's ink.
    for (const loop of raw)
      base
        .poly(
          flatten(
            straighten(loop).map(([x, y]): Point => [
              x * grid.size,
              y * grid.size,
            ]),
          ),
        )
        .fill(color)
    const wash = washes.addChild(new Graphics())
    for (const loop of loops)
      wash.poly(flatten(simplifyLoop(loop, UNDER_INK))).fill(color)
    wash.zIndex = -spread(loops)
    base.zIndex = wash.zIndex
    drawn.set(key, [base, wash])
    outlines.set(key, loops)
  }

  /** The land each lord's castles hold, tinted with stone. */
  function wall(now: Int32Array) {
    stone.clear()
    const walls: Array<Array<Point>> = []
    for (const set of castleLand(state, now))
      for (const loop of corners(width, height, (t) => set.has(t), set)) {
        const round = smooth(loop, grid.size)
        stone.poly(flatten(simplifyLoop(round, UNDER_INK)))
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
    stone,
    /** A region's outline as last traced: loops in map units, its land on the right of their course. */
    outline: (key: number) => outlines.get(key) ?? [],
    /** Each tile's region as last traced: a lord, the free land (-3), the open sea (-2). */
    keys: () => keys,
    /** Traces again the regions whose land changed, a few times a second; the regions traced, if any. */
    update(now: number): Set<number> | null {
      if (now - traced < EVERY_MS) return null
      traced = now
      const { next, dirty } = changes()
      // The free land waits its turn, the rest is traced now.
      if (dirty.delete(FREE_KEY)) freeDue = true
      if (freeDue && now - freeTraced >= FREE_EVERY_MS) {
        dirty.add(FREE_KEY)
        freeDue = false
        freeTraced = now
      }
      const works = state.works.map((w) => [w.tile, w.owner].join(':')).join()
      if (dirty.size === 0 && works === built) return null
      const tiles = tilesOf(next, dirty)
      for (const key of dirty)
        if (key !== SEA_KEY && key !== UNSET)
          draw(key, tiles.get(key) ?? [], next)
      keys = next
      // The castles' stone only when a castle's lord's land or the works moved.
      const castled = state.works.some(
        (w) => w.work === 'castle' && dirty.has(w.owner),
      )
      if (works !== built || castled) wall(next)
      built = works
      dirty.delete(SEA_KEY)
      dirty.delete(UNSET)
      return dirty
    },
  }
}
