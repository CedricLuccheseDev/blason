import {
  NO_ONE,
  TICKS_PER_SECOND,
  createBot,
  createGame,
  step,
} from '../../engine'
import type { GameSetup, GameState, Grid, Order } from '../../engine'

// The game, stepped in the page ten times a second: the player in his
// seat, a bot in every other its setup gives one. A hosted game waits, its
// land drawn, while the host sets it in his book, and starts when he
// launches it, with the setup the book filled (launch).

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
  /** A game waiting for its host: made again from the setup his book filled, on the same land, then started. */
  launch?: (setup: GameSetup) => void
  /** The session let go: its thread, if it has one, stopped (threaded.ts). */
  stop?: () => void
}

export function startSession(
  grid: Grid,
  setup: GameSetup,
  me: number,
  /** Held until launched: the host's game, waiting while he sets it. */
  held = false,
): Session {
  const state = createGame(grid, setup)
  const botsOf = (s: GameSetup) =>
    s.seats.map((seat, id) => seat.bot && createBot(id, s.seed, seat.bot))
  let bots = botsOf(setup)
  let pending: Array<Order> = []
  let clock = 0
  let running = !held
  return {
    state,
    me,
    send: (order) => {
      if (running) pending.push(order)
    },
    launch(next) {
      // Made again in place: the screen keeps the state it was given.
      Object.assign(state, createGame(grid, next))
      bots = botsOf(next)
      running = true
    },
    advance(ms, each) {
      if (!running) return 0
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
