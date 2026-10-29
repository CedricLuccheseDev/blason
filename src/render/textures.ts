import { Graphics } from 'pixi.js'
import { drawCart } from './art/cart'
import type { Renderer, Texture } from 'pixi.js'

// Everything drawn many times is drawn once into a texture, sharp enough for
// the closest zoom, then laid as sprites: the graphics card does the rest.
// The men have their own sheets (figures.ts).

/** How much sharper than the map's units a stamp is drawn. */
const SHARP = 8

type Stamp = { texture: Texture; anchor: { x: number; y: number } }

export type Stamps = {
  /** A caravan under a lord's pennant, drawn the first time it is needed. */
  cart: (color: number) => Stamp
}

function stamp(renderer: Renderer, draw: (g: Graphics) => void): Stamp {
  const g = new Graphics()
  draw(g)
  const bounds = g.getLocalBounds()
  const texture = renderer.generateTexture({
    target: g,
    resolution: SHARP,
    antialias: true,
  })
  g.destroy()
  return {
    texture,
    anchor: { x: -bounds.x / bounds.width, y: -bounds.y / bounds.height },
  }
}

/** Stamps drawn in a lord's colour, each the first time it is asked for. */
function byColor(
  renderer: Renderer,
  draw: (g: Graphics, color: number) => void,
) {
  const made = new Map<number, Stamp>()
  return (color: number) => {
    let found = made.get(color)
    if (!found) {
      found = stamp(renderer, (g) => draw(g, color))
      made.set(color, found)
    }
    return found
  }
}

export function makeStamps(renderer: Renderer): Stamps {
  return {
    cart: byColor(renderer, drawCart),
  }
}
