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

function course(
  g: Graphics,
  rivers: Array<Array<Point>>,
  extra: number,
  color: number,
) {
  for (const river of rivers) {
    const n = river.length
    for (let i = 0; i < n - 1; i++)
      g.moveTo(river[i][0], river[i][1])
        .lineTo(river[i + 1][0], river[i + 1][1])
        .stroke({ width: widthAt(i, n) + extra, color, cap: 'round' })
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
      if (Math.abs(bank / drawn - 1) < 0.1) return
      drawn = bank
      banks.clear()
      course(banks, rivers, bank, BANK)
    },
  }
}
