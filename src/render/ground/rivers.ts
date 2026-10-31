import { Container, Graphics } from 'pixi.js'
import { mixColor } from '../ease'
import { TONE } from '../palette'
import { RULES, halfWidthAt } from '../../../engine'
import type { GraphicsContext } from 'pixi.js'
import type { Point } from '../../../engine'

// The rivers of the land (engine/map/rivers.ts), water as the sea is since
// 31/10 (« de la vraie eau », engine/map/streams.ts), so drawn at every
// distance, as the sea is (« fais le même design que la mer »): the sea's
// wash between banks in the coast's own ink and width, the banks clipped to
// the land so that at the mouth each runs into the coast's line and turns
// with it, the water laid over that line across the mouth (« ça fait une
// coupure bizarre »); as
// wide as their tiles of water, a tile at the spring and three at the
// mouth, a little wider so that the lands' edges along them are under the
// water. Drawn again only when the zoom moved enough to change the banks.

/** The coast's ink width at so many pixels per map unit, in map units (layers/borders.ts). */
const bankWidth = (zoom: number) =>
  Math.min(2.6, Math.max(1.3, 1.5 * zoom)) / zoom

/** The sea's first shore line, which runs along each bank as along the coast (layers/lands.ts): how far in, in map units, how wide, how strong. */
const [SHORE, LINE, STRENGTH] = [2.2, 0.6, 0.95]

/** How much wider than its tiles of water a river is drawn, in tiles. */
const OVER = 0.4

/** A river's width at a point so far down its course, in map units: its tiles of water's. */
const widthAt = (i: number, n: number) =>
  (2 * halfWidthAt(i, n) + OVER) * RULES.tileSize

/** A river's course in so many stretches, each one stroke as wide as its middle: a few strokes a river, not one a step (a map of the Earth has some hundred and sixty). */
const STRETCHES = 3

/** How far past its mouth a river runs on under the land's clip, in map units: enough to meet a slanting coast. */
const PAST = 3 * RULES.tileSize

/** A river run on a little past its last point, the way it was going. */
function onward(river: Array<Point>): Array<Point> {
  const n = river.length
  if (n < 2) return river
  const [[ax, ay], [bx, by]] = [river[n - 2], river[n - 1]]
  const on = PAST / (Math.hypot(bx - ax, by - ay) || 1)
  return [...river, [bx + (bx - ax) * on, by + (by - ay) * on]]
}

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

export function makeRivers(
  rivers: Array<Array<Point>>,
  /** The land's shape: the rivers are not drawn past the coast. */
  land: GraphicsContext,
) {
  const container = new Container()
  // Each river run on past its mouth and cut by the land's shape: at the
  // coast its banks meet the coast's line and its water the sea's. All the
  // banks under all the water, so that a river joining another opens into it.
  const shore = container.addChild(new Container())
  shore.mask = shore.addChild(new Graphics(land))
  const courses = rivers.map(onward)
  const banks = shore.addChild(new Graphics())
  // As the coast's ribbon.
  banks.alpha = 0.85
  const water = shore.addChild(new Graphics())
  course(water, courses, 0, TONE.seaWash)
  // A line along each bank, as the sea's along its shore, meeting it at the mouth.
  course(
    water,
    courses,
    LINE - 2 * SHORE,
    mixColor(TONE.seaWash, TONE.seaLine, STRENGTH),
  )
  course(water, courses, -LINE - 2 * SHORE, TONE.seaWash)
  // Where the rivers' water runs, as far as past their mouths: the scene
  // leaves the coast's line out there, so that a mouth is open water.
  const cut = new Graphics()
  course(cut, courses, 0, TONE.seaWash)
  let drawn = 0

  return {
    container,
    /** The rivers' water, past their mouths: the coast's line is not drawn there. */
    cut,
    /** At so many pixels per map unit, the rivers showing so much. */
    draw(zoom: number, shown: number) {
      container.visible = shown > 0
      container.alpha = shown
      if (shown <= 0) return
      const bank = 2 * bankWidth(zoom)
      // Drawn again only once the zoom moved a good deal: the banks are a line.
      if (Math.abs(bank / drawn - 1) < 0.3) return
      drawn = bank
      banks.clear()
      course(banks, courses, bank, TONE.ink)
    },
  }
}
