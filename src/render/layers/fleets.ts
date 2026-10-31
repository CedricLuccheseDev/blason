import { Container, Graphics } from 'pixi.js'
import { drawCog, drawWarship } from '../art/boat'
import { TONE, playerColor } from '../palette'
import { siteOf } from '../marks'
import { pointOn } from '../roads'
import type { GraphicsContext } from 'pixi.js'
import type { Spot } from '../roads'
import type { makeWakes } from './wakes'
import type { GameState, Ship, Warship } from '../../../engine'

// The ships on the water: the merchant ships (« il faut faire les bateaux
// marchands comme sur openfront »), each a cog under its lord's sail, along
// its way from port to port (ships.ts); the warships, larger, patrolling
// round their point (warships.ts). Each so far into the next tick, turned the
// way it sails, its wake behind it (wakes.ts). My warship picked to be sent
// is ringed in gold, the point it patrols round marked. One drawing per kind
// and colour, shared by every ship of it.

type Afloat = Ship | Warship

/** A warship's drawing against a cog's. */
const WARSHIP = 1

export function makeFleets(me: number, wakes: ReturnType<typeof makeWakes>) {
  const container = new Container()
  const picked = new Graphics()
  const drawings = new Map<number, GraphicsContext>()
  const ships = new Map<Afloat, Graphics>()
  const ways = new WeakMap<Array<number>, Array<Spot>>()

  const drawingOf = (color: number, kind: number) => {
    const key = color * 2 + kind
    let drawing = drawings.get(key)
    if (!drawing) {
      const g = new Graphics()
      if (kind === WARSHIP) drawWarship(g, color)
      else drawCog(g, color)
      drawing = g.context
      drawings.set(key, drawing)
    }
    return drawing
  }

  const wayOf = (state: GameState, tiles: Array<number>) => {
    let way = ways.get(tiles)
    if (!way) {
      way = tiles.map((t) => siteOf(state, t))
      ways.set(tiles, way)
    }
    return way
  }

  /** A ship where it is this frame, turned the way it sails, and its wake. */
  const place = (
    state: GameState,
    ship: Afloat,
    kind: number,
    pace: number,
    between: number,
    now: number,
  ) => {
    let g = ships.get(ship)
    if (!g) {
      g = container.addChild(
        new Graphics(drawingOf(playerColor(ship.owner), kind)),
      )
      ships.set(ship, g)
    }
    const way = wayOf(state, ship.way)
    const at = Math.min(way.length - 1, (ship.along + pace * between) / 1000)
    const here = pointOn(way, at)
    const ahead = pointOn(way, Math.min(way.length - 1, at + 1))
    g.position.set(here.x, here.y)
    // Come to its point, it keeps the way it faced.
    if (ahead.x !== here.x) g.scale.set(ahead.x < here.x ? -0.8 : 0.8, 0.8)
    g.alpha = ship.owner === me ? 1 : 0.85
    wakes.pass(ship, here.x, here.y, now)
    return here
  }

  container.addChild(picked)

  return {
    container,
    draw(state: GameState, between: number, chosen: number | null) {
      const now = performance.now()
      const seen = new Set<Afloat>()
      const { shipPace, warshipPace } = state.rules
      for (const ship of state.ships) {
        seen.add(ship)
        place(state, ship, 0, shipPace, between, now)
      }
      picked.clear()
      for (const ship of state.warships) {
        seen.add(ship)
        const here = place(state, ship, WARSHIP, warshipPace, between, now)
        if (ship.id !== chosen || ship.owner !== me) continue
        const post = siteOf(state, ship.post)
        picked
          .circle(here.x, here.y - 8, 16)
          .stroke({ color: TONE.gold, width: 1.6, alpha: 0.95 })
          .circle(post.x, post.y, 5)
          .stroke({ color: TONE.gold, width: 1.2, alpha: 0.8 })
      }
      for (const [ship, g] of ships)
        if (!seen.has(ship)) {
          g.destroy()
          ships.delete(ship)
        }
      container.addChild(picked)
      wakes.draw(now)
    },
  }
}
