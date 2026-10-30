import { Container, Sprite } from 'pixi.js'
import { standing } from '../../engine'
import {
  BOX,
  workLod,
  workPx,
  workScale,
  workShown,
  workTexture,
} from './art/works'
import { playerColor } from './palette'
import type { Box } from './camera'
import type { Lod } from './art/works'
import type { GameState, Grid, Work } from '../../engine'

// What stands on the land, drawn at its scale as on the boards: the lords'
// works, each at the level of detail its size on screen allows
// (art/works.ts): from afar a small silhouette cut out of the wash by a halo
// of parchment, another's market gone and another's work gone once a speck,
// the player's own kept; at mid distance the drawing; up close the
// illustration. The land a castle holds is not ringed here: the territory
// tints it with stone. Laid again when a work is built or changes hands; pale
// while it is being built.

export function makeMarks(state: GameState, me: number) {
  const container = new Container()
  const works = container.addChild(new Container())
  const at = (tile: number) => siteOf(state, tile)
  let key = ''
  let seen = { tick: -1, zoom: 0 }
  /** Each work's level of detail as drawn, changed only once the zoom has clearly crossed its threshold. */
  const levels = new WeakMap<Sprite, Lod>()
  /** The textures to draw ahead, by work and colour, one each time the page has a moment: none is drawn while zooming (« quand je zoom dezoom ça blink ça saute »). */
  const ahead: Array<[Work, number]> = []
  const warmed = new Set<string>()
  let warming = false
  function warm() {
    const next = ahead.shift()
    if (!next) {
      warming = false
      return
    }
    for (const lod of [0, 1, 2] as const) workTexture(next[0], next[1], lod)
    setTimeout(warm, 0)
  }

  function redraw() {
    works.removeChildren().forEach((c) => c.destroy())
    for (const work of state.works) {
      const known = `${work.work}:${work.owner}`
      if (!warmed.has(known)) {
        warmed.add(known)
        ahead.push([work.work, playerColor(work.owner)])
      }
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
      // Nothing changes between two ticks but the zoom.
      if (state.tick === seen.tick && zoom === seen.zoom) return
      seen = { tick: state.tick, zoom }
      const now = state.works.map((w) => [w.tile, w.owner].join(':')).join()
      if (now !== key) {
        key = now
        redraw()
        if (!warming && ahead.length) {
          warming = true
          setTimeout(warm, 0)
        }
      }
      // Another's work, from afar, as much as shows of it; a work being
      // built stands pale until it is done (layers/building.ts).
      const px = workPx(zoom)
      state.works.forEach((work, i) => {
        const drawn = works.children.at(i)
        if (!(drawn instanceof Sprite)) return
        const mine = work.owner === me
        const shown = mine ? 1 : workShown(work.work, px)
        drawn.visible = shown > 0
        if (!drawn.visible) return
        const lod = steady(levels.get(drawn), workPx(zoom, mine))
        levels.set(drawn, lod)
        drawn.texture = workTexture(work.work, playerColor(work.owner), lod)
        drawn.scale.set(
          (workScale(zoom, mine) * BOX.width) / drawn.texture.width,
        )
        drawn.alpha = (standing(state, work) ? 1 : 0.4) * shown
      })
    },
  }
}

/** A level of detail held until the size on screen has gone a tenth past the threshold, so that a work does not flip between two looks as the zoom glides by it. */
function steady(held: Lod | undefined, px: number): Lod {
  const wanted = workLod(px)
  if (held === undefined || wanted === held) return wanted
  const step = wanted > held ? 1.1 : 0.9
  return workLod(px / step) === wanted ? wanted : held
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
