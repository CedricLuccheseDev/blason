import { Container, Graphics } from 'pixi.js'
import { around, isAllied, isFelon } from '../../engine'
import { drawIcon } from './art/icons'
import type { GameState } from '../../engine'
import type { Placement } from './layers/labels'

// Where each lord is written, and the marks beside his name: an ally's
// links, a traitor's broken shield, as OpenFront shows its alliances by an
// icon beside a player's troops. Sized on screen.

/**
 * Each lord written at the centre of his land as it stands now: the middle
 * of its largest piece, which moves on smoothly as the land grows or
 * shrinks; the bigger the land, the bigger the words.
 */
export function tilePlaces(state: GameState): Placement {
  const { width, size: tile } = state.grid
  const seen = new Uint8Array(state.owner.length)
  /** The largest piece of each lord: its tile count and the sums of its columns and rows. */
  const largest = new Map<number, { n: number; x: number; y: number }>()
  state.owner.forEach((o, start) => {
    if (o < 0 || seen[start]) return
    seen[start] = 1
    const piece = { n: 0, x: 0, y: 0 }
    const queue = [start]
    for (const t of queue) {
      piece.n += 1
      piece.x += t % width
      piece.y += Math.floor(t / width)
      for (const n of around(state.grid, t))
        if (!seen[n] && state.owner[n] === o) {
          seen[n] = 1
          queue.push(n)
        }
    }
    if (piece.n > (largest.get(o)?.n ?? 0)) largest.set(o, piece)
  })
  const places: Placement = new Map()
  for (const [lord, piece] of largest) {
    const tiles = state.players[lord].tiles
    places.set(lord, {
      x: (piece.x / piece.n + 0.5) * tile,
      y: (piece.y / piece.n + 0.5) * tile,
      size: Math.min(46, 24 + 4 * Math.sqrt(tiles / 25)),
    })
  }
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
