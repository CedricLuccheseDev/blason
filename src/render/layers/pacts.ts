import { Container, Graphics } from 'pixi.js'
import { cordBetween } from '../cord'
import { drawSnap, snapped } from '../art/snap'
import { playerColor } from '../palette'
import type { GameState } from '../../../engine'
import type { Snap } from '../art/snap'
import type { Spot } from '../cord'

// The alliances on the map. In ordinary times nothing is drawn between the
// lords: the green border between allies (allies.ts), the badge beside an
// ally's name (places.ts) and the lords' list already say who holds with
// whom, and a web of cords over the land hid it. An alliance broken, its
// breaker marked a traitor for it, snaps before all: for its moment a cord
// is drawn between the two capitals, where their names are written
// (places.ts), the player's own a ribbon of green silk, and it snaps at its
// middle (art/snap.ts), drawn each frame while it does. One left to run out
// goes without a sound.

/** A lord's name as drawn, in map units (layers/labels.ts). */
type Name = { x: number; y: number; half: number; tall: number }
type End = { at: Spot; clear: number }

/** Pixels kept between a name and the cord that snaps. */
const CLEAR = 10

export function makePacts(me: number, nameOf: (lord: number) => Name | null) {
  const container = new Container()
  const snapping = container.addChild(new Graphics())
  let snaps: Array<Snap> = []
  /** The alliances a frame ago, by their two lords, and when each lord stopped being a traitor then. */
  let held = ''
  let felons: Array<number> = []

  /** Where a lord's capital is, under his name, and how far a cord keeps from it. */
  function endOf(lord: number, k: number): End | null {
    const name = nameOf(lord)
    if (!name) return null
    return {
      at: { x: name.x, y: name.y + name.tall * 0.6 },
      clear: Math.max(name.half, name.tall * 1.4) + CLEAR * k,
    }
  }

  /** A cord from one lord's capital to the other's, mine from me to my ally. */
  function snapOf(a: number, b: number, k: number, now: number): Snap | null {
    const [from, to] = b === me ? [b, a] : [a, b]
    const [p, q] = [endOf(from, k), endOf(to, k)]
    if (!p || !q) return null
    const cord = cordBetween(p.at, q.at, p.clear, q.clear)
    if (!cord) return null
    const colors: [number, number] = [playerColor(from), playerColor(to)]
    return { cord, mine: from === me, colors, born: now }
  }

  /** The alliances gone since the last frame whose breaker was just marked a traitor: they snap. */
  function broken(
    state: GameState,
    holding: Array<string>,
    k: number,
    now: number,
  ) {
    for (const pair of held.split(',')) {
      if (!pair || holding.includes(pair)) continue
      const [a, b] = pair.split(':').map(Number)
      const traitor = [a, b].some(
        (lord) => state.players[lord].felonUntil > (felons[lord] ?? 0),
      )
      const snap = traitor ? snapOf(a, b, k, now) : null
      if (snap) snaps.push(snap)
    }
  }

  return {
    container,
    /** `now` in seconds. */
    draw(state: GameState, zoom: number, now: number) {
      const k = 1 / zoom
      const holding = state.alliances.map((x) => `${x.a}:${x.b}`)
      const key = holding.join()
      if (key !== held) broken(state, holding, k, now)
      held = key
      felons = state.players.map((p) => p.felonUntil)
      if (snaps.length === 0) return
      snaps = snaps.filter((s) => !snapped(now - s.born))
      snapping.clear()
      for (const s of snaps) drawSnap(snapping, s, now - s.born, k)
    },
  }
}
