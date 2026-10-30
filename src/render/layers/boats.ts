import { Container, Graphics } from 'pixi.js'
import { drawBoat } from '../art/boat'
import { playerColor } from '../palette'
import type { GraphicsContext } from 'pixi.js'
import type { Front, Spot } from '../fronts'
import type { Host } from '../../../engine'

// The armies at sea, each a boat where its head is on its road over the
// water (crossing.ts), turned the way it sails; its men, gone aboard, are
// not drawn, its standard flies over it (armies.ts). One drawing per colour,
// shared by every boat of it.

/** A boat as it is drawn this frame: whose, where, which way, how much it shows. */
export type Afloat = {
  key: object
  at: Spot
  /** Right (1) or left (-1). */
  facing: number
  color: number
  alpha: number
}

export function makeBoats() {
  const container = new Container()
  const drawings = new Map<number, GraphicsContext>()
  const boats = new Map<object, Graphics>()

  const drawingOf = (color: number) => {
    let drawing = drawings.get(color)
    if (!drawing) {
      const g = new Graphics()
      drawBoat(g, color)
      drawing = g.context
      drawings.set(color, drawing)
    }
    return drawing
  }

  return {
    container,
    draw(afloat: Array<Afloat>) {
      const seen = new Set<object>()
      for (const { key, at, facing, color, alpha } of afloat) {
        seen.add(key)
        let boat = boats.get(key)
        if (!boat) {
          boat = container.addChild(new Graphics(drawingOf(color)))
          boats.set(key, boat)
        }
        boat.position.set(at.x, at.y)
        boat.scale.set(facing, 1)
        boat.alpha = alpha
      }
      for (const [key, boat] of boats)
        if (!seen.has(key)) {
          boat.destroy()
          boats.delete(key)
        }
    },
  }
}

/** The armies at sea, each its boat where its head is, the way it sails. */
export function afloatOf(
  armies: Map<Host, { afloat: number; front: Front | null }>,
): Array<Afloat> {
  return [...armies].flatMap(([host, army]) =>
    army.afloat > 0 && army.front
      ? [
          {
            key: army,
            at: army.front.at,
            facing: army.front.facing.x < 0 ? -1 : 1,
            color: playerColor(host.owner),
            alpha: army.afloat,
          },
        ]
      : [],
  )
}
