import { Container, Graphics, GraphicsContext } from 'pixi.js'
import { drawCog } from '../art/boat'
import { playerColor } from '../palette'
import { siteOf } from '../marks'
import { pointOn } from '../roads'
import type { Spot } from '../roads'
import type { GameState, Ship } from '../../../engine'

// The merchant ships on the water (« il faut faire les bateaux marchands
// comme sur openfront »): each a cog under its lord's sail, along its way
// from port to port (ships.ts), so far into the next tick, turned the way it
// sails. One drawing per colour, shared by every ship of it.

export function makeFleets(me: number) {
  const container = new Container()
  const drawings = new Map<number, GraphicsContext>()
  const ships = new Map<Ship, Graphics>()
  const ways = new WeakMap<Ship, Array<Spot>>()

  const drawingOf = (color: number) => {
    let drawing = drawings.get(color)
    if (!drawing) {
      const g = new Graphics()
      drawCog(g, color)
      drawing = g.context
      drawings.set(color, drawing)
    }
    return drawing
  }

  const wayOf = (state: GameState, ship: Ship) => {
    let way = ways.get(ship)
    if (!way) {
      way = ship.way.map((t) => siteOf(state, t))
      ways.set(ship, way)
    }
    return way
  }

  return {
    container,
    draw(state: GameState, between: number) {
      const seen = new Set<Ship>()
      for (const ship of state.ships) {
        seen.add(ship)
        let g = ships.get(ship)
        if (!g) {
          g = container.addChild(
            new Graphics(drawingOf(playerColor(ship.owner))),
          )
          ships.set(ship, g)
        }
        const way = wayOf(state, ship)
        const at = Math.min(
          way.length - 1,
          (ship.along + state.rules.shipPace * between) / 1000,
        )
        const here = pointOn(way, at)
        const ahead = pointOn(way, Math.min(way.length - 1, at + 1))
        g.position.set(here.x, here.y)
        g.scale.set(ahead.x < here.x ? -0.8 : 0.8, 0.8)
        g.alpha = ship.owner === me ? 1 : 0.8
      }
      for (const [ship, g] of ships)
        if (!seen.has(ship)) {
          g.destroy()
          ships.delete(ship)
        }
    },
  }
}
