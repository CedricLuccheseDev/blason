import { Container, Graphics } from 'pixi.js'
import { around, isAllied, isFelon } from '../../engine'
import { drawIcon } from './art/icons'
import { TONE } from './palette'
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

/** The alliance's green, as the heralds' vert. */
const ALLY = 0x2f7d3f

/** A badge's size on screen, in pixels. */
const BADGE = 24

type Name = { x: number; y: number; half: number; tall: number }

/** The marks beside the lords' names, gliding with them: my allies' links, a traitor's broken shield. */
export function makeBadges(state: GameState, me: number) {
  const container = new Container()
  /** Each lord's marks, by the icons they show, drawn again only when these change; the alliance's ring, every time. */
  const drawn = new Map<
    number,
    { icons: string; g: Container; ring: Graphics }
  >()

  /** The share of my alliance with a lord still to run, 0 to 1. */
  function left(lord: number): number {
    const pact = state.alliances.find(
      (x) => (x.a === me && x.b === lord) || (x.b === me && x.a === lord),
    )
    if (!pact) return 0
    const share = (pact.expires - state.tick) / state.rules.allianceTicks
    return Math.max(0, Math.min(1, share))
  }

  function marksOf(lord: number): Array<'links' | 'felon'> {
    const icons: Array<'links' | 'felon'> = []
    if (me >= 0 && lord !== me && isAllied(state, me, lord)) icons.push('links')
    if (isFelon(state, lord)) icons.push('felon')
    return icons
  }

  return {
    container,
    update(nameOf: (lord: number) => Name | null, zoom: number) {
      state.players.forEach((_, lord) => {
        const icons = marksOf(lord)
        const key = icons.join()
        let mark = drawn.get(lord)
        if (mark?.icons !== key) {
          mark?.g.destroy({ children: true })
          const g = container.addChild(new Container())
          icons.forEach((icon, k) => {
            const one = g.addChild(new Graphics())
            drawIcon(one, icon)
            one.position.set(k * 40, 0)
          })
          const ring = g.addChild(new Graphics())
          mark = { icons: key, g, ring }
          drawn.set(lord, mark)
        }
        const name = nameOf(lord)
        mark.g.visible = name !== null && icons.length > 0
        if (!name) return
        const s = BADGE / 35 / zoom
        mark.g.scale.set(s)
        mark.g.position.set(
          name.x + name.half + 6 / zoom,
          name.y - BADGE / 2 / zoom,
        )
        // Round the links, the time left to the alliance, emptying as it runs out.
        mark.ring.clear()
        if (!icons.includes('links')) return
        const end = -Math.PI / 2 + Math.PI * 2 * left(lord)
        mark.ring
          .circle(0, 0, 16)
          .stroke({ width: 3, color: TONE.ink, alpha: 0.25 })
          .moveTo(0, -16)
          .arc(0, 0, 16, -Math.PI / 2, end)
          .stroke({ width: 3.4, color: ALLY, cap: 'round' })
      })
    },
  }
}
