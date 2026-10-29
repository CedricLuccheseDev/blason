import { Container, Graphics } from 'pixi.js'
import { flatten } from '../geometry'
import { TONE } from '../palette'
import type { Point } from '../../../engine'

// The land of the lord pointed at in the HUD's list of lords, lit on the
// map (« sur la liste des seigneurs quand on hover highlight sur la map le
// territoire du seigneur qu'on hover »): a faint gold wash over it and its
// outline ruled in gold, on the line of its border as last traced
// (regions.ts), so that a name in the list is found on the map at a glance.

/** The wash's strength, and the outline's width on screen in pixels. */
const WASH = 0.22
const LINE = 3

/** A lord's outline as last traced, his land on the right of its course. */
type Outline = (lord: number) => Array<Array<Point>>

export function makeLit(outline: Outline) {
  const container = new Container()
  const g = container.addChild(new Graphics())
  let lord: number | null = null
  /** What was drawn: the lord and the zoom, drawn again when either changes or his land is traced again. */
  let drawn = ''

  return {
    container,
    /** The lord to light, or none. */
    light(next: number | null) {
      lord = next
    },
    draw(zoom: number, traced: Set<number> | null) {
      const key = `${lord}:${zoom}`
      if (key === drawn && !(lord !== null && traced?.has(lord))) return
      drawn = key
      g.clear()
      if (lord === null) return
      const loops = outline(lord)
      for (const loop of loops) g.poly(flatten(loop))
      g.fill({ color: TONE.goldLight, alpha: WASH })
      for (const loop of loops) g.poly(flatten(loop))
      g.stroke({ width: LINE / zoom, color: TONE.gold, join: 'round' })
    },
  }
}
