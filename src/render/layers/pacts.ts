import { Container, Graphics } from 'pixi.js'
import { cordBetween } from '../cord'
import { drawCord, drawRibbon } from '../art/cords'
import { playerColor } from '../palette'
import type { GameState } from '../../../engine'
import type { Spot } from '../cord'

// The alliances on the map, as the diplomacy board's direction A has them:
// between the player's capital and each ally's, a ribbon of green silk
// hemmed in gold, its seal at its middle (laid there by the HUD, which
// reads where from `middleOf`); between two other lords allied together, a
// thin dotted cord of ink and its tiny seal. A capital is where the lord's
// name is written, at the heart of his largest piece (places.ts), and the
// cords stop short of the names. Drawn again only when an alliance is made
// or ends, when the zoom moved, or when a name glided a few pixels away.

/** A lord's name as drawn, in map units (layers/labels.ts). */
type Name = { x: number; y: number; half: number; tall: number }
type End = { at: Spot; clear: number }

/** Pixels kept between a name and its cord; pixels a name may glide before the cords follow it. */
const [CLEAR, DRIFT] = [10, 4]

export function makePacts(me: number, nameOf: (lord: number) => Name | null) {
  const container = new Container()
  const theirs = container.addChild(new Graphics())
  const mine = container.addChild(new Graphics())
  /** Where the seal of each of my alliances sits, by my ally. */
  const middles = new Map<number, Spot>()
  let drawn = { key: '', zoom: 0, ends: new Map<number, End>() }

  /** Where a lord's capital is, under his name, and how far a cord keeps from it. */
  function endOf(lord: number, k: number): End | null {
    const name = nameOf(lord)
    if (!name) return null
    return {
      at: { x: name.x, y: name.y + name.tall * 0.6 },
      clear: Math.max(name.half, name.tall * 1.4) + CLEAR * k,
    }
  }

  function moved(ends: Map<number, End>, k: number): boolean {
    if (ends.size !== drawn.ends.size) return true
    for (const [lord, end] of ends) {
      const was = drawn.ends.get(lord)
      if (!was) return true
      const d = Math.hypot(end.at.x - was.at.x, end.at.y - was.at.y)
      if (d > DRIFT * k) return true
    }
    return false
  }

  function trace(state: GameState, ends: Map<number, End>, k: number) {
    theirs.clear()
    mine.clear()
    middles.clear()
    for (const { a, b } of state.alliances) {
      const [p, q] = [ends.get(a), ends.get(b)]
      if (!p || !q) continue
      if (a !== me && b !== me) {
        const cord = cordBetween(p.at, q.at, p.clear, q.clear)
        if (cord) drawCord(theirs, cord, k, [playerColor(a), playerColor(b)])
        continue
      }
      // Mine runs from me to my ally, my half of its seal on my side.
      const [from, to, ally] = a === me ? [p, q, b] : [q, p, a]
      const cord = cordBetween(from.at, to.at, from.clear, to.clear)
      middles.set(
        ally,
        cord?.middle ?? {
          x: (from.at.x + to.at.x) / 2,
          y: (from.at.y + to.at.y) / 2,
        },
      )
      if (cord) drawRibbon(mine, cord, k)
    }
  }

  return {
    container,
    /** Where the seal of my alliance with a lord sits, in map units; none while we are not allied. */
    middleOf: (ally: number): Spot | null => middles.get(ally) ?? null,
    draw(state: GameState, zoom: number) {
      const k = 1 / zoom
      const key = state.alliances.map((x) => `${x.a}:${x.b}`).join()
      const ends = new Map<number, End>()
      for (const { a, b } of state.alliances)
        for (const lord of [a, b]) {
          const end = ends.has(lord) ? null : endOf(lord, k)
          if (end) ends.set(lord, end)
        }
      const same =
        key === drawn.key &&
        Math.abs(zoom / drawn.zoom - 1) < 0.1 &&
        !moved(ends, k)
      if (same) return
      drawn = { key, zoom, ends }
      trace(state, ends, k)
    },
  }
}
