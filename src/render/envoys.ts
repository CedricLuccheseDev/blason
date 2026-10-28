import { siteOf } from './marks'
import type { GameState } from '../../engine'
import type { Anchor } from './heralds'
import type { Spot } from './cord'

// Where each herald stands with his letter, an offer of alliance made to
// the player (Heralds.tsx draws it): on the player's land, at its tile
// nearest the offering lord's capital, a few tiles in from the border, so
// that the letter is read as come from him and lies on the land it is
// addressed to. Sought again once a second, as the land moves.

/** Tiles in from the border the herald stands, at most. */
const IN = 4

export function makeEnvoys(
  state: GameState,
  me: number,
  capitalOf: (lord: number) => Spot | null,
) {
  /** Where each herald stands, and the second it was sought. */
  const stands = new Map<number, { at: Spot; second: number }>()

  /** My tile nearest a point, moved a few tiles towards my own capital. */
  function nearest(to: Spot): Spot | null {
    let best = -1
    let near = Infinity
    state.owner.forEach((owner, t) => {
      if (owner !== me) return
      const { x, y } = siteOf(state, t)
      const d = (x - to.x) ** 2 + (y - to.y) ** 2
      if (d < near) [best, near] = [t, d]
    })
    if (best < 0) return null
    const at = siteOf(state, best)
    const home = capitalOf(me)
    if (!home) return at
    const d = Math.hypot(home.x - at.x, home.y - at.y)
    const step = Math.min(d / 3, IN * state.grid.size)
    if (d === 0) return at
    return {
      x: at.x + ((home.x - at.x) / d) * step,
      y: at.y + ((home.y - at.y) / d) * step,
    }
  }

  return {
    /** The heralds of the offers standing now. */
    anchors(): Array<Anchor> {
      if (me < 0) return []
      const second = Math.floor(state.tick / 10)
      const offers = state.requests.filter(
        (r) => r.to === me && state.players[r.from].alive,
      )
      const from = new Set(offers.map((r) => r.from))
      for (const lord of stands.keys()) if (!from.has(lord)) stands.delete(lord)
      return offers.flatMap((r) => {
        let stand = stands.get(r.from)
        if (stand?.second !== second) {
          const capital = capitalOf(r.from)
          const at = capital && nearest(capital)
          if (!at) return []
          stand = { at, second }
          stands.set(r.from, stand)
        }
        return [
          { key: `offer:${r.from}`, kind: 'offer', lord: r.from, at: stand.at },
        ]
      })
    },
  }
}
