import type { GameState } from '../../engine'

// The gold the player has earned since the start, as the purse's "+" reads
// it: watched on his purse each tick, what it gained counted and what it lost
// left out, so that a work paid for does not hide a caravan arrived. Gold
// comes in bursts, a caravan at a time, free land taken a little at a time;
// the HUD reads the total once a second and shows what came in since.

export function makeEarnings(me: number) {
  let earned = 0
  let gold = -1

  return {
    /** The gold gained since the tick last watched: called after every tick. */
    watch(state: GameState) {
      if (me < 0) return
      const now = state.players[me].gold
      if (gold >= 0) earned += Math.max(0, now - gold)
      gold = now
    },
    /** All the gold gained, in thousandths. */
    total: () => earned,
  }
}
