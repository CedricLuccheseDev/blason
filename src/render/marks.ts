import { Container, Graphics, Sprite } from 'pixi.js'
import { standing } from '../../engine'
import { drawVillage } from './art/settlements'
import { BOX, WORK_SPAN, workLod, workScale, workTexture } from './art/works'
import { playerColor } from './palette'
import type { Box } from './camera'
import type { GameState, Grid } from '../../engine'

// What stands on the land, drawn at its scale as on the boards: the free
// villages, houses on the parchment, and the lords' works, each at the
// level of detail its size on screen allows (art/works.ts): from afar a
// silhouette never under thirty pixels, cut out of the wash by a halo of
// parchment; at mid distance the drawing; up close the illustration. The
// land a castle holds is not ringed here: the territory tints it with
// stone. Laid again when a work is built or changes hands; pale while it is
// being built.

export function makeMarks(state: GameState) {
  const container = new Container()
  const villages = container.addChild(new Container())
  const works = container.addChild(new Container())
  const at = (tile: number) => siteOf(state, tile)
  let key = ''

  function redraw() {
    villages.removeChildren().forEach((c) => c.destroy())
    works.removeChildren().forEach((c) => c.destroy())
    for (const tile of state.villages) {
      const g = villages.addChild(new Graphics())
      drawVillage(g, tile)
      const { x, y } = at(tile)
      g.position.set(x, y)
      g.scale.set(0.8)
    }
    for (const work of state.works) {
      const { x, y } = at(work.tile)
      const drawn = works.addChild(new Sprite())
      drawn.anchor.set(-BOX.left / BOX.width, -BOX.top / BOX.height)
      drawn.position.set(x, y)
    }
  }

  return {
    container,
    /** At so many pixels per map unit. */
    update(zoom: number) {
      const built = state.works.map((w) => [w.tile, w.owner].join(':'))
      const now = [state.villages.length, ...built].join(',')
      if (now !== key) {
        key = now
        redraw()
      }
      const k = workScale(zoom)
      const lod = workLod(WORK_SPAN * zoom * k)
      // A work being built stands pale until it is done (layers/building.ts).
      state.works.forEach((work, i) => {
        const drawn = works.children.at(i)
        if (!(drawn instanceof Sprite)) return
        drawn.texture = workTexture(work.work, playerColor(work.owner), lod)
        drawn.scale.set((k * BOX.width) / drawn.texture.width)
        drawn.alpha = standing(state, work) ? 1 : 0.4
      })
    },
  }
}

/** A tile's middle, in map units. */
export function siteOf(state: GameState, tile: number) {
  const { grid } = state
  return {
    x: ((tile % grid.width) + 0.5) * grid.size,
    y: (Math.floor(tile / grid.width) + 0.5) * grid.size,
  }
}

/** The tile at a point of the map, or -1 off the land. */
export function tileAt(grid: Grid, x: number, y: number): number {
  const c = Math.floor(x / grid.size)
  const r = Math.floor(y / grid.size)
  if (c < 0 || r < 0 || c >= grid.width || r >= grid.height) return -1
  const tile = r * grid.width + c
  return grid.land[tile] ? tile : -1
}

/** The box round a lord's land, in map units, or none before he holds any. */
export function landBox(state: GameState, lord: number): Box | null {
  let box: Box | null = null
  state.owner.forEach((o, t) => {
    if (o !== lord) return
    const { x, y } = siteOf(state, t)
    box = box
      ? {
          left: Math.min(box.left, x),
          top: Math.min(box.top, y),
          right: Math.max(box.right, x),
          bottom: Math.max(box.bottom, y),
        }
      : { left: x, top: y, right: x, bottom: y }
  })
  return box
}
