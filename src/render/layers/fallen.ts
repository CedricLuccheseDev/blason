import { Container, Graphics, Sprite } from 'pixi.js'
import type { Kind } from '../squads'
import type { Stamps } from '../textures'

// The dead of a fight: where men fall, a figure of their side topples over,
// a dark stain spreads under him, and both fade into the parchment a few
// seconds later. One figure for many men, so that a battle leaves its field
// strewn without ever hiding the land. At the land's scale, as the battles.

/** A soldier's height, and as drawn in his stamp, as in the battles. */
const TALL = 22
const DRAWN = 13
/** Seconds to topple, to lie, and to fade. */
const FALL = 0.45
const LIE = 4
const FADE = 1.5
/** Bodies lying at once at most: the oldest go first. */
const MOST = 160
const STAIN = 0x6e1a12

type Body = {
  sprite: Sprite
  stain: Graphics
  born: number
  /** Which way he falls: back from the fight. */
  side: 1 | -1
}

export function makeFallen(stamps: Stamps, scale: number) {
  const container = new Container()
  const stains = container.addChild(new Container())
  const bodies = container.addChild(new Container())
  const lying: Array<Body> = []

  function remove(body: Body) {
    body.sprite.destroy()
    body.stain.destroy()
  }

  return {
    container,
    /** A man of this colour and kind falls here, facing the way he fought. */
    fall(x: number, y: number, color: number, kind: Kind, facing: 1 | -1) {
      const stamp = stamps[kind](color)
      const sprite = bodies.addChild(new Sprite(stamp.texture))
      sprite.anchor.set(stamp.anchor.x, stamp.anchor.y)
      sprite.position.set(x, y)
      sprite.scale.set((facing * TALL * scale) / DRAWN, (TALL * scale) / DRAWN)
      const stain = stains.addChild(new Graphics())
      stain
        .ellipse(0, 0, 5 * scale, 2 * scale)
        .fill({ color: STAIN, alpha: 0.55 })
      stain.position.set(x - facing * 4 * scale, y)
      stain.scale.set(0)
      lying.push({
        sprite,
        stain,
        born: performance.now() / 1000,
        side: facing === 1 ? -1 : 1,
      })
      while (lying.length > MOST) remove(lying.shift() as Body)
    },
    draw(seconds: number) {
      for (let i = lying.length - 1; i >= 0; i--) {
        const body = lying[i]
        const age = seconds - body.born
        if (age > FALL + LIE + FADE) {
          remove(body)
          lying.splice(i, 1)
          continue
        }
        const toppled = Math.min(1, age / FALL)
        // He falls back, faster as he goes, then lies still.
        body.sprite.rotation = body.side * (Math.PI / 2) * toppled * toppled
        body.stain.scale.set(Math.min(1, age / (FALL * 3)))
        const fade = Math.max(0, (age - FALL - LIE) / FADE)
        body.sprite.alpha = 1 - fade
        body.stain.alpha = 1 - fade
      }
    },
  }
}
