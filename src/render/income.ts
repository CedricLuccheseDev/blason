import { TICKS_PER_SECOND } from '../../engine'
import type { GameState } from '../../engine'

// What the player's gold brings in, as the HUD tells it beside the purse:
// the gold he gained, caravans and free land taken, over the last half
// minute, in gold a second. Gold comes in bursts, a caravan at a time, so a
// rate read over a while says more than the last second; what he spends is
// not counted against it.

/** Ticks the rate is read over. */
const WINDOW = 300

export function makeIncome(me: number) {
  /** The gold gained each tick of the window, in thousandths, the oldest first. */
  const gains: Array<number> = []
  let gold = -1
  let tick = -1

  return {
    /** The gold gained since the tick last read. */
    watch(state: GameState) {
      if (me < 0 || state.tick === tick) return
      // Ticks played between two frames count as ticks, the gain on the last.
      for (let t = tick + 1; t < state.tick && tick >= 0; t++) gains.push(0)
      tick = state.tick
      const now = state.players[me].gold
      gains.push(gold < 0 ? 0 : Math.max(0, now - gold))
      gains.splice(0, Math.max(0, gains.length - WINDOW))
      gold = now
    },
    /** Gold a second, in thousandths. */
    rate(): number {
      const sum = gains.reduce((a, b) => a + b, 0)
      return Math.floor((sum * TICKS_PER_SECOND) / WINDOW)
    },
  }
}
