import { Container, Graphics } from 'pixi.js'
import { around, canRenew, isFelon, isTeammate } from '../../engine'
import { drawIcon } from './art/icons'
import { TONE } from './palette'
import type { GameState } from '../../engine'
import type { Placement } from './layers/labels'
import type { Spot } from './cord'

// Where each lord is written, and the marks beside his name: an ally's
// links, a traitor's broken shield, as OpenFront shows its alliances by an
// icon beside a player's troops, each in a gauge of the time it has left.
// Sized on screen. In an alliance's last moments its links give way to its
// seal, which asks to renew it (components/game/PactSeal.tsx), laid past
// the name, the figure under it and its marks (`besideOf`).

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
      reach: Math.sqrt(piece.tiles.length) * tile,
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

/** A badge's size on screen, its ring round it, in pixels. */
const BADGE = 34

/** The radius of the ring round an ally's badge, the time left to the alliance, in the badge's units. */
const RING = 21.5

type Name = {
  x: number
  y: number
  half: number
  tall: number
  right: number
  alpha: number
}

/** The gauge's band round a badge's disc (art/icons.ts, 17.3 round), in the badge's units. */
const [INNER, OUTER] = [18.6, 25]

/**
 * The time left round a badge at `x`, as a gauge: the band round it filled
 * from the bottom up to the share still to run, sinking as it runs out
 * (« fais une jauge dans un rond mais vertical comme openfront »).
 */
function gaugeRound(g: Graphics, x: number, share: number, color: number) {
  g.circle(x, 0, OUTER)
    .fill({ color: TONE.parchment })
    .circle(x, 0, INNER)
    .cut()
  if (share > 0) {
    // The part of the disc under the level, as a polygon along its edge.
    const level = OUTER - 2 * OUTER * Math.min(1, share)
    const from = Math.asin(Math.max(-1, Math.min(1, level / OUTER)))
    const to = Math.PI - from
    const points: Array<number> = []
    for (let i = 0; i <= 24; i++) {
      const a = from + ((to - from) * i) / 24
      points.push(x + Math.cos(a) * OUTER, Math.sin(a) * OUTER)
    }
    g.poly(points).fill({ color }).circle(x, 0, INNER).cut()
  }
  g.circle(x, 0, OUTER).stroke({ width: 1.4, color: TONE.ink })
}

/** The marks beside the lords' names, gliding with them: my allies' links, a traitor's broken shield. */
export function makeBadges(state: GameState, me: number) {
  const container = new Container()
  /** Each lord's marks, by the icons they show, drawn again only when these change; their rings, when they moved. */
  const drawn = new Map<
    number,
    { icons: string; g: Container; ring: Graphics; rings: string }
  >()

  /** The share of a traitor's mark still to run, 0 to 1. */
  function shame(lord: number): number {
    const rest = state.players[lord].felonUntil - state.tick
    return Math.max(0, Math.min(1, rest / state.rules.felonTicks))
  }

  /** My alliance with a lord, if we are allied. */
  const pactWith = (lord: number) =>
    state.alliances.find(
      (x) => (x.a === me && x.b === lord) || (x.b === me && x.a === lord),
    )

  /** The share of my alliance with a lord still to run, 0 to 1. */
  function left(lord: number): number {
    const pact = pactWith(lord)
    if (!pact) return 0
    const share = (pact.expires - state.tick) / state.rules.allianceTicks
    return Math.max(0, Math.min(1, share))
  }

  /** My ally's links, but in our alliance's last moments, when its seal stands for them; my teammate's, for good; a traitor's broken shield. */
  function marksOf(lord: number): Array<'links' | 'felon'> {
    const icons: Array<'links' | 'felon'> = []
    const pact = me >= 0 && lord !== me ? pactWith(lord) : undefined
    if ((pact && !canRenew(state, pact)) || isTeammate(state, me, lord))
      icons.push('links')
    if (isFelon(state, lord)) icons.push('felon')
    return icons
  }

  /** Past each lord's name, its figure and its marks, at the marks' height, in map units. */
  const beside = new Map<number, Spot>()

  return {
    container,
    /** Where a seal laid beside a lord's name begins, clear of his name, figure and marks; none while he is not written. */
    besideOf: (lord: number): Spot | null => beside.get(lord) ?? null,
    update(nameOf: (lord: number) => Name | null, zoom: number) {
      beside.clear()
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
            one.position.set(k * 50, 0)
          })
          const ring = g.addChild(new Graphics())
          mark = { icons: key, g, ring, rings: '' }
          drawn.set(lord, mark)
        }
        // With the name, faded where his land is too small to carry it.
        const name = nameOf(lord)
        mark.g.visible = name !== null && name.alpha > 0 && icons.length > 0
        if (!name) return
        mark.g.alpha = name.alpha
        const s = BADGE / (2 * RING) / zoom
        mark.g.scale.set(s)
        const [x, y] = [
          name.x + name.half + (BADGE / 2 - 6) / zoom,
          name.y - 12 / zoom,
        ]
        mark.g.position.set(x, y)
        const marks = x + ((icons.length - 1) * 50 + RING) * s
        beside.set(lord, {
          x: icons.length > 0 ? Math.max(name.right, marks) : name.right,
          y,
        })
        // Round the links, the time left to the alliance, sinking as it
        // runs out; round the broken shield, the time he stays a traitor:
        // drawn again only when they moved.
        // A teammate's links, for good, have no time running round them.
        const team = isTeammate(state, me, lord)
        const linked = team ? -1 : left(lord)
        const shares = icons.map((icon) =>
          icon === 'links' ? linked : shame(lord),
        )
        const rings = shares.join()
        if (rings === mark.rings) return
        mark.rings = rings
        mark.ring.clear()
        icons.forEach((icon, k) => {
          const color = icon === 'links' ? TONE.pact : TONE.gules
          if (shares[k] >= 0) gaugeRound(mark.ring, k * 50, shares[k], color)
        })
      })
    },
  }
}
