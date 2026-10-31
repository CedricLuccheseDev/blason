import { Container, Graphics, Sprite } from 'pixi.js'
import { tradeLinks } from '../../engine'
import { STONE, drawPaving } from './art/paving'
import { TONE, playerColor } from './palette'
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

/** How many times a road's corners are smoothed, and how far it wanders aside, in map units: within its own tile, so that it keeps to it. */
const ROUNDS = 3
const STRAY = 1.6
/** A road's width on the strategist's map, in pixels on screen. */
const BOLD = 2.6

/** A road's key: its two markets, whichever way it is walked. */
const keyOf = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`)

/** A caravan's way as drawn, and the length of its road it was drawn for. */
type Way = {
  length: number
  path: Array<Spot>
  paved: Map<string, Array<Spot>>
}

export function makeTrade(stamps: Stamps, me: number) {
  const container = new Container()
  /** The roads lie under the works; the wagons roll over them. Their stones, under a pixel each from afar, are laid only closer. */
  const roads = new Container()
  const bands = roads.addChild(new Container())
  const stones = roads.addChild(new Container())
  /** The roads on the strategist's map: a bold line each, as wide on screen at any zoom (« les chemins des marchands + visibles »). */
  const bold = roads.addChild(new Graphics())
  let boldAt: { zoom: number; paved: Map<string, Array<Spot>> | null } = {
    zoom: 0,
    paved: null,
  }
  const sprites: Array<Sprite> = []
  /** The network's roads as drawn, by their two markets. */
  let paved = new Map<string, Array<Spot>>()
  let laid: Array<Link> | null = null
  let paveTick = -Infinity
  const ways = new WeakMap<Caravan, Way>()

  /** The network paved again, when its roads changed. */
  function pave(state: GameState) {
    const links = tradeLinks(state)
    if (links === laid) return
    laid = links
    for (const layer of [bands, stones])
      layer.removeChildren().forEach((child) => child.destroy())
    paved = new Map()
    const land = (t: number) => state.grid.land[t]
    for (const { a, b, road } of links) {
      const path = drawRoad(state, road, land, ROUNDS, STRAY)
      const owners = state.works
        .filter((w) => w.tile === a || w.tile === b)
        .map((w) => w.owner)
      drawPaving(
        bands.addChild(new Graphics()),
        stones.addChild(new Graphics()),
        path,
        owners.includes(me),
      )
      paved.set(keyOf(a, b), path)
    }
  }

  /** The bold roads, drawn again only when the zoom moved or the network changed. */
  function boldRoads(zoom: number, strategic: number) {
    bold.visible = strategic > 0
    if (!bold.visible) return
    bold.alpha = strategic
    const moved = Math.abs(zoom - boldAt.zoom) > boldAt.zoom * 0.04
    if (!moved && boldAt.paved === paved) return
    boldAt = { zoom, paved }
    bold.clear()
    for (const path of paved.values()) {
      path.forEach(({ x, y }, i) =>
        i === 0 ? bold.moveTo(x, y) : bold.lineTo(x, y),
      )
    }
    bold.stroke({
      width: BOLD / zoom,
      color: TONE.goldDeep,
      join: 'round',
      cap: 'round',
    })
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
    // Drawn again once the network is paved anew: a caravan never keeps a
    // track of its own beside the road it takes (« bug des caravanes qui
    // prennent pas la route »).
    if (known?.length === caravan.road.length && known.paved === paved)
      return known.path
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
    ways.set(caravan, { length: caravan.road.length, path, paved })
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
    /** At so many pixels per map unit; `strategic`, how much the map is the strategist's (ground/detail.ts). */
    draw(state: GameState, zoom: number, between = 0, strategic = 0) {
      stones.visible = STONE * zoom >= 1
      boldRoads(zoom, strategic)
      const seconds = performance.now() / 1000
      // Once a second, or as soon after as a frame comes: a slow frame
      // steps over several ticks, and the network fell behind its caravans.
      if (state.tick < paveTick || state.tick - paveTick >= 10) {
        paveTick = state.tick
        pave(state)
      }
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
