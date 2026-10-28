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
 * of its largest piece, or the nearest place to it clear of his works, so
 * that his name never lies over a village or a castle; it moves on smoothly
 * as the land grows or shrinks; the bigger the land, the bigger the words.
 */
export function tilePlaces(state: GameState): Placement {
  const { width, size: tile } = state.grid
  const seen = new Uint8Array(state.owner.length)
  /** The largest piece of each lord: its tiles, and the sums of their columns and rows. */
  const largest = new Map<number, Piece>()
  state.owner.forEach((o, start) => {
    if (o < 0 || seen[start]) return
    seen[start] = 1
    const piece: Piece = { tiles: [], x: 0, y: 0 }
    const queue = [start]
    for (const t of queue) {
      piece.tiles.push(t)
      piece.x += t % width
      piece.y += Math.floor(t / width)
      for (const n of around(state.grid, t))
        if (!seen[n] && state.owner[n] === o) {
          seen[n] = 1
          queue.push(n)
        }
    }
    if (piece.tiles.length > (largest.get(o)?.tiles.length ?? 0))
      largest.set(o, piece)
  })
  const places: Placement = new Map()
  for (const [lord, piece] of largest) {
    const at = clearOf(state, lord, piece)
    places.set(lord, {
      x: (at.x + 0.5) * tile,
      y: (at.y + 0.5) * tile,
      size: Math.min(46, 24 + 4 * Math.sqrt(state.players[lord].tiles / 25)),
    })
  }
  return places
}

type Piece = { tiles: Array<number>; x: number; y: number }

/** Tiles kept between a name and any work, so that it never lies over one. */
const CLEAR = 5

/** The tile of a piece nearest its middle that lies clear of the lord's works; its middle if none does. */
function clearOf(state: GameState, lord: number, piece: Piece) {
  const { width } = state.grid
  const n = piece.tiles.length
  const mid = { x: piece.x / n, y: piece.y / n }
  const works = state.works
    .filter((w) => w.owner === lord)
    .map((w) => ({ x: w.tile % width, y: Math.floor(w.tile / width) }))
  let best = mid
  let near = Infinity
  for (const t of piece.tiles) {
    const x = t % width
    const y = Math.floor(t / width)
    const d = (x - mid.x) ** 2 + (y - mid.y) ** 2
    if (d >= near) continue
    if (works.some((w) => (w.x - x) ** 2 + (w.y - y) ** 2 < CLEAR * CLEAR))
      continue
    best = { x, y }
    near = d
  }
  return best
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
