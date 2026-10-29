import { Container, Graphics } from 'pixi.js'
import { makeFigure, pixel, sheetOf } from '../figures'
import { traits } from './troops'
import type { Look } from '../figures'

// The dead of a fight: where men fall, a figure of their side topples over,
// a dark stain spreads under him, and both fade into the parchment a few
// seconds later; a horse sinks on its legs rather than tipping on its tail.
// One figure for many men, so that a battle leaves its field strewn without
// ever hiding the land. At the land's scale, as the battles.

/** Seconds to topple, to lie, and to fade. */
const FALL = 0.45
const LIE = 4
const FADE = 1.5
/** Bodies lying at once at most: the oldest go first. */
const MOST = 160
const STAIN = 0x6e1a12
/** How a fallen figure lies: how far it turns over, how low it sinks. */
const TOPPLE: Record<Look, { turn: number; sink: number }> = {
  raid: { turn: 0.28, sink: 0.5 },
  host: { turn: Math.PI / 2, sink: 1 },
  ban: { turn: Math.PI / 2, sink: 1 },
  peasant: { turn: Math.PI / 2, sink: 1 },
}

type Body = {
  figure: ReturnType<typeof makeFigure>
  stain: Graphics
  born: number
  look: Look
  size: number
  /** Which way he falls: back from the fight. */
  side: 1 | -1
}

export function makeFallen(scale: number) {
  const container = new Container()
  const stains = container.addChild(new Container())
  const bodies = container.addChild(new Container())
  const lying: Array<Body> = []

  function remove(body: Body) {
    body.figure.box.destroy({ children: true })
    body.stain.destroy()
  }

  return {
    container,
    /** A man of this colour and look falls here, facing the way he fought, as he looked. */
    fall(
      x: number,
      y: number,
      color: number,
      look: Look,
      facing: 1 | -1,
      seed: number,
    ) {
      const figures = sheetOf(look)
      const t = traits(look, seed, figures.men)
      const figure = makeFigure()
      figure.show(figures, t.man, facing, 0, color)
      figure.tone(t.tint)
      figure.box.position.set(x, y)
      bodies.addChild(figure.box)
      const stain = stains.addChild(new Graphics())
      stain
        .ellipse(0, 0, 5 * scale, 2 * scale)
        .fill({ color: STAIN, alpha: 0.55 })
      stain.position.set(x - facing * 4 * scale, y)
      stain.scale.set(0)
      lying.push({
        figure,
        stain,
        born: performance.now() / 1000,
        look,
        size: pixel(t.size),
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
        const fell = toppled * toppled
        // He falls back, faster as he goes, then lies still.
        const { turn, sink } = TOPPLE[body.look]
        const box = body.figure.box
        box.rotation = body.side * turn * fell
        box.scale.set(body.size, body.size * (1 - (1 - sink) * fell))
        body.stain.scale.set(Math.min(1, age / (FALL * 3)))
        const fade = Math.max(0, (age - FALL - LIE) / FADE)
        box.alpha = 1 - fade
        body.stain.alpha = 1 - fade
      }
    },
  }
}
