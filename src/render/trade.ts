import { Container, Graphics, Sprite } from 'pixi.js'
import { tradeLinks } from '../../engine'
import { drawPaving } from './art/paving'
import { playerColor } from './palette'
import { drawRoad, pointOn } from './roads'
import type { Spot } from './roads'
import type { Stamps } from './textures'
import type { Caravan, GameState, Link } from '../../engine'

// The merchants on their roads. The trade network (engine/network.ts) is
// paved once, a road of old from each market to its neighbours within range
// (art/paving.ts), near straight and rounding the sea in soft bends
// (roads.ts), mine a little darker, and paved again only when the markets
// change. A wagon under its lord's pennant rolls along it from market to
// market, smoothly between two ticks and jolting a little; one taken by an
// enemy leaves it for his market by a track of its own. The wagon and the
// roads at the land's scale, as the armies.

/** A wagon's height on the land, in map units (a man stands some four), and as drawn in its stamp. */
const TALL = 5
const DRAWN = 16

/** How many times a road's corners are smoothed, and how far it wanders aside, in map units. */
const ROUNDS = 3
const STRAY = 5

/** A road's key: its two markets, whichever way it is walked. */
const keyOf = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`)

/** A caravan's way as drawn, and the length of its road it was drawn for. */
type Way = { length: number; path: Array<Spot> }

export function makeTrade(stamps: Stamps, me: number) {
  const container = new Container()
  /** The roads lie under the works; the wagons roll over them. */
  const roads = new Container()
  const sprites: Array<Sprite> = []
  /** The network's roads as drawn, by their two markets. */
  let paved = new Map<string, Array<Spot>>()
  let laid: Array<Link> | null = null
  const ways = new WeakMap<Caravan, Way>()

  /** The network paved again, when its roads changed. */
  function pave(state: GameState) {
    const links = tradeLinks(state)
    if (links === laid) return
    laid = links
    roads.removeChildren().forEach((child) => child.destroy())
    paved = new Map()
    const land = (t: number) => state.grid.land[t]
    for (const { a, b, road } of links) {
      const path = drawRoad(state, road, land, ROUNDS, STRAY)
      const owners = state.works
        .filter((w) => w.tile === a || w.tile === b)
        .map((w) => w.owner)
      drawPaving(roads.addChild(new Graphics()), path, owners.includes(me))
      paved.set(keyOf(a, b), path)
    }
  }

  /** A stretch of a caravan's road as drawn: the network's road between two markets, else a track of its own. */
  function stretch(state: GameState, road: Array<number>): Array<Spot> {
    const [a, b] = [road[0], road[road.length - 1]]
    const path = paved.get(keyOf(a, b))
    if (path) return a < b ? path : [...path].reverse()
    return drawRoad(state, road, (t) => state.grid.land[t], 0)
  }

  /** A caravan's way, stretch by stretch from market to market, drawn once (again if it was taken). */
  function wayOf(state: GameState, caravan: Caravan): Array<Spot> {
    const known = ways.get(caravan)
    if (known?.length === caravan.road.length) return known.path
    const markets = new Set(
      state.works.filter((w) => w.work === 'market').map((w) => w.tile),
    )
    const path: Array<Spot> = []
    let from = 0
    caravan.road.forEach((tile, i) => {
      if (i === 0 || (!markets.has(tile) && i < caravan.road.length - 1)) return
      const part = stretch(state, caravan.road.slice(from, i + 1))
      path.push(...(path.length ? part.slice(1) : part))
      from = i
    })
    ways.set(caravan, { length: caravan.road.length, path })
    return path
  }

  /** Where a caravan is on its way now, so far into the next tick, and which way it goes. */
  function along(state: GameState, caravan: Caravan, between: number) {
    const path = wayOf(state, caravan)
    const moved = caravan.along + state.rules.caravanPace * between
    const share = Math.min(
      1,
      moved / 1000 / Math.max(1, caravan.road.length - 1),
    )
    return pointOn(path, share * (path.length - 1))
  }

  return {
    container,
    roads,
    draw(state: GameState, between = 0) {
      const seconds = performance.now() / 1000
      if (state.tick % 10 === 0) pave(state)
      state.caravans.forEach((caravan, n) => {
        sprites[n] ??= container.addChild(new Sprite())
        const sprite = sprites[n]
        const stamp = stamps.cart(playerColor(caravan.owner))
        const { x, y, right } = along(state, caravan, between)
        const k = TALL / DRAWN
        sprite.texture = stamp.texture
        sprite.anchor.set(stamp.anchor.x, stamp.anchor.y)
        sprite.position.set(x, y - Math.abs(Math.sin(seconds * 7 + n)) * 0.25)
        sprite.scale.set(right ? k : -k, k)
        sprite.alpha = caravan.owner === me ? 1 : 0.72
        sprite.visible = true
      })
      for (let i = state.caravans.length; i < sprites.length; i++)
        sprites[i].visible = false
    },
  }
}
