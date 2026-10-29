import {
  NO_ONE,
  TICKS_PER_SECOND,
  createBot,
  createGame,
  step,
} from '../../engine'
import type { GameSetup, GameState, Grid, Order } from '../../engine'

// The game, stepped in the page ten times a second: the player in his
// seat, a bot in every other its setup gives one.

const TICK_MS = 1000 / TICKS_PER_SECOND

export type Session = {
  state: GameState
  me: number
  send: (order: Order) => void
  /**
   * Advance the clock, calling `each` after every tick played, `most` ticks
   * at most (the rest at the next call); returns how far into the next tick
   * we are, 0 to 1.
   */
  advance: (ms: number, each?: () => void, most?: number) => number
}

export function startSession(
  grid: Grid,
  setup: GameSetup,
  me: number,
): Session {
  const state = createGame(grid, setup)
  const bots = setup.seats.map(
    (seat, id) => seat.bot && createBot(id, setup.seed, seat.bot),
  )
  let pending: Array<Order> = []
  let clock = 0
  return {
    state,
    me,
    send: (order) => pending.push(order),
    advance(ms, each) {
      clock += ms
      while (clock >= TICK_MS && state.winner === NO_ONE) {
        clock -= TICK_MS
        const orders = [
          ...pending,
          ...state.players.flatMap((p, id) => {
            const bot = bots[id]
            return p.alive && bot ? bot(state, id) : []
          }),
        ]
        pending = []
        step(state, orders)
        each?.()
      }
      return Math.min(1, clock / TICK_MS)
    },
  }
}
