import { Container, Graphics } from 'pixi.js'
import { isAllied, isFelon } from '../../engine'
import { drawIcon } from './art/icons'
import { siteOf } from './marks'
import type { GameState } from '../../engine'
import type { Placement } from './layers/labels'

// Where each lord is written, and the marks beside his name: an ally's
// links, a traitor's broken shield, as OpenFront shows its alliances by an
// icon beside a player's troops. Sized on screen.

/**
 * Each lord written on the tile deepest inside his land, farthest from any
 * edge, the bigger the land the bigger the words: a walk inward from every
 * edge. A name already written keeps its tile while it stays deep enough.
 */
export function tilePlaces(state: GameState, before?: Placement): Placement {
  const { width } = state.grid
  const depth = state.owner.map(() => -1)
  const queue: Array<number> = []
  const sides = (t: number) => {
    const x = t % width
    return [
      x > 0 ? t - 1 : -1,
      x < width - 1 ? t + 1 : -1,
      t - width,
      t + width,
    ].filter((n) => n >= 0 && n < state.owner.length)
  }
  state.owner.forEach((o, t) => {
    if (o < 0) return
    // The frame's edge counts as a border: a name is never written against it.
    const around = sides(t)
    if (around.length < 4 || around.some((n) => state.owner[n] !== o)) {
      depth[t] = 0
      queue.push(t)
    }
  })
  // The queue grows as it is walked: each tile is reached once.
  for (const t of queue) {
    for (const n of sides(t)) {
      if (depth[n] >= 0 || state.owner[n] !== state.owner[t]) continue
      depth[n] = depth[t] + 1
      queue.push(n)
    }
  }
  const best = state.players.map(() => -1)
  state.owner.forEach((o, t) => {
    if (o >= 0 && (best[o] < 0 || depth[t] > depth[best[o]])) best[o] = t
  })
  const places: Placement = new Map()
  best.forEach((deepest, lord) => {
    if (deepest < 0) return
    // A name keeps its place while that stays nearly as deep: it moves only
    // when its land has really changed shape.
    const kept = before?.get(lord)?.tile
    const tile =
      kept !== undefined &&
      state.owner[kept] === lord &&
      depth[kept] * 10 >= depth[deepest] * 7
        ? kept
        : deepest
    const { x, y } = siteOf(state, tile)
    const tiles = state.players[lord].tiles
    const size = Math.min(46, 24 + 4 * Math.sqrt(tiles / 25))
    places.set(lord, { x, y, size, tile })
  })
  return places
}

/** A badge's size on screen, in pixels. */
const BADGE = 20

/** The marks beside the lords' names: my allies, the traitors. */
export function makeBadges(state: GameState, me: number) {
  const container = new Container()
  return {
    container,
    update(places: Placement, zoom: number) {
      container.removeChildren().forEach((c) => c.destroy())
      for (const [lord, { x, y, size }] of places) {
        const icons: Array<'links' | 'felon'> = []
        if (me >= 0 && isAllied(state, me, lord)) icons.push('links')
        if (isFelon(state, lord)) icons.push('felon')
        icons.forEach((icon, k) => {
          const g = container.addChild(new Graphics())
          drawIcon(g, icon)
          const s = BADGE / 35 / zoom
          g.scale.set(s)
          g.position.set(
            x + ((k - (icons.length - 1) / 2) * (BADGE + 4)) / zoom,
            y - (size * 1.25) / zoom,
          )
        })
      }
    },
  }
}
