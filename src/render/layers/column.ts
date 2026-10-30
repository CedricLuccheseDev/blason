import { Container, Graphics } from 'pixi.js'
import { isFriendly, paceOf } from '../../../engine'
import { playerColor } from '../palette'
import { siteOf } from '../marks'
import { drawRoad } from '../roads'
import type { GameState, Host } from '../../../engine'
import type { Spot } from '../roads'

// An army's road from its village to the front. The road the simulation
// walks goes from tile to tile, in steps; it is drawn as a man would walk it,
// in straight lines over his lord's land (roads.ts), and its men walk it so
// (squads.ts). What is left of it is dotted before the army, then on to
// the tile clicked, so that the lord it marches on sees it coming.

/** Tiles between two dots of the road. */
const DOTS = 2

const paths = new WeakMap<Host, Array<Spot>>()

/** An army's road as it is drawn, in straight lines over its lord's land, made once: its land may change under it, the drawing does not. */
export function pathOf(state: GameState, host: Host): Array<Spot> {
  let path = paths.get(host)
  // A road cut short under the army is drawn again, as far as it goes now.
  if (!path || path.length !== host.road.length) {
    // Straight over the land it marches, its lord's and his allies', and the water it sails.
    const open = (t: number) =>
      isFriendly(state, host.owner, state.owner[t]) || state.grid.water[t]
    path = drawRoad(state, host.road, open, 0)
    paths.set(host, path)
  }
  return path
}

/** How far along its road an army's head is, in tiles, so far into the next tick. */
export function headOf(state: GameState, host: Host, between: number) {
  const end = host.road.length - 1
  const moved = host.fighting ? 0 : paceOf(state, host) * between
  return Math.min(end, (host.along + moved) / 1000)
}

/** A road to draw: its army, how far along its head is, how much it has faded in. */
export type Marching = { host: Host; head: number; alpha: number }

/** The roads of the armies on the march, dotted before them. */
export function makeRoads() {
  const container = new Container()
  const dots = container.addChild(new Graphics())

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

  return {
    container,
    draw(state: GameState, columns: Array<Marching>, zoom: number) {
      dots.clear()
      for (const column of columns)
        if (column.alpha > 0) dot(state, column, zoom)
    },
  }
}
