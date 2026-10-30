import { Container, Graphics } from 'pixi.js'
import { mixColor } from '../ease'
import { TONE } from '../palette'
import type { Point } from '../../../engine'

// The rivers of the land (engine/map/rivers.ts), from mid distance: water
// in the sea's wash between banks of muted ink, widening downstream. The
// banks keep about a pixel on screen; drawn again only when the zoom moved
// enough to change them.

const BANK = mixColor(TONE.seaLine, TONE.ink, 0.3)

/** A river's width at a point so far down its course, in map units. */
const widthAt = (i: number, n: number) => 0.55 + 1.5 * (i / n)

/** A river's course in so many stretches, each one stroke as wide as its middle: a few strokes a river, not one a step (a map of the Earth has some hundred and sixty). */
const STRETCHES = 3

function course(
  g: Graphics,
  rivers: Array<Array<Point>>,
  extra: number,
  color: number,
) {
  for (const river of rivers) {
    const n = river.length
    const step = Math.max(1, Math.ceil((n - 1) / STRETCHES))
    for (let from = 0; from < n - 1; from += step) {
      const to = Math.min(n - 1, from + step)
      g.moveTo(river[from][0], river[from][1])
      for (let i = from + 1; i <= to; i++) g.lineTo(river[i][0], river[i][1])
      g.stroke({
        width: widthAt((from + to) / 2, n) + extra,
        color,
        cap: 'round',
        join: 'round',
      })
    }
  }
}

export function makeRivers(rivers: Array<Array<Point>>) {
  const container = new Container()
  const banks = container.addChild(new Graphics())
  banks.alpha = 0.85
  const water = container.addChild(new Graphics())
  course(water, rivers, 0, TONE.seaWash)
  let drawn = 0

  return {
    container,
    /** At so many pixels per map unit, the rivers showing so much. */
    draw(zoom: number, shown: number) {
      container.visible = shown > 0
      container.alpha = shown
      if (shown <= 0) return
      const bank = Math.max(0.35, 1.1 / zoom)
      // Drawn again only once the zoom moved a good deal: the banks are a line.
      if (Math.abs(bank / drawn - 1) < 0.3) return
      drawn = bank
      banks.clear()
      course(banks, rivers, bank, BANK)
    },
  }
}
