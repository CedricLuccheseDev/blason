import { NO_ONE, TICKS_PER_SECOND, UNIT, wonBy } from '../../engine'
import type { GameState } from '../../engine'

// The player's course through the game, kept as it goes and told at the end
// (« fais une vrai modal avec les stats de la partie », his course chosen):
// how long he played, his land at its widest, in tiles and in share of the
// land, his place among the lords, his peasants at their most, and all the
// gold he gained. Read once a second with the HUD's figures; his place
// fixed when he falls, or when the game ends.

export type Deeds = {
  /** Seconds played, from the end of the opening to his fall or the end. */
  seconds: number
  /** His land at its widest, in tiles, and its share of the land, in percent. */
  tiles: number
  share: number
  /** His place among the lords who played: first for a win. */
  place: number
  /** Of those who played. */
  lords: number
  /** His peasants at their most. */
  peasants: number
  /** All the gold he gained, in whole coins. */
  gold: number
}

export function makeRecord(state: GameState, me: number) {
  const record: Deeds = {
    seconds: 0,
    tiles: 0,
    share: 0,
    place: 0,
    lords: 0,
    peasants: 0,
    gold: 0,
  }
  let closed = false
  /** The seats that held a lord at some reading, a person's or a bot's: an empty one never does. */
  const lords = new Set<number>()

  /** The lords standing now, and those who played. */
  const standing = () => state.players.filter((p) => p.alive).length

  return {
    /** Read once a second, with what he gained (earnings.ts, in thousandths); the record as it stands. */
    read(earned: number): Deeds {
      if (me < 0 || closed) return record
      const lord = state.players[me]
      state.players.forEach((p, id) => p.alive && lords.add(id))
      record.lords = lords.size
      record.tiles = Math.max(record.tiles, lord.tiles)
      record.share = Math.max(
        record.share,
        Math.round((lord.tiles * 100) / Math.max(1, state.grid.area)),
      )
      record.peasants = Math.max(
        record.peasants,
        Math.floor(lord.peasants / UNIT),
      )
      record.gold = Math.floor(earned / UNIT)
      const opened = state.tick - state.rules.openingTicks
      record.seconds = Math.max(0, Math.floor(opened / TICKS_PER_SECOND))
      const over = state.winner !== NO_ONE
      if (!lord.alive || over) {
        // Fallen, behind all those still standing; the end, first for a win,
        // else behind the winner and those who held more land.
        const ahead = state.players.filter(
          (p, id) => id !== me && p.alive && p.tiles >= lord.tiles,
        ).length
        if (wonBy(state, me)) record.place = 1
        else record.place = lord.alive ? Math.max(2, ahead + 1) : standing() + 1
        closed = true
      }
      return record
    },
  }
}
