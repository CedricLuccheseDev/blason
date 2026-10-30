import type { GameState } from '../../engine'
import type { Anchor } from './heralds'
import type { Spot } from './cord'

// Where each herald stands with his letter, an offer of alliance made to
// the player (Heralds.tsx draws it): midway between the two lords' names,
// where the alliance would join them (« la popup alliance accepter met la
// entre le lien au milieu »), so that it is read at once as between him and
// the player. Sought again once a second, as the lands move.

export function makeEnvoys(
  state: GameState,
  me: number,
  capitalOf: (lord: number) => Spot | null,
) {
  /** Where each herald stands, and the second it was sought. */
  const stands = new Map<number, { at: Spot; second: number }>()

  /** Midway between my name and the offering lord's; none while either is not written. */
  function between(lord: number): Spot | null {
    const mine = capitalOf(me)
    const theirs = capitalOf(lord)
    if (!mine || !theirs) return null
    return { x: (mine.x + theirs.x) / 2, y: (mine.y + theirs.y) / 2 }
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
          const at = between(r.from)
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
