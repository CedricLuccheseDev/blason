import {
  NO_ONE,
  TICKS_PER_SECOND,
  createBot,
  createGame,
  step,
} from '../../engine'
import { PLAYERS } from './palette'
import type { GameState, Grid, Level, Order } from '../../engine'

// The game, stepped in the page ten times a second: the player
// in his seat, a bot of the level chosen in every other.

const TICK_MS = 1000 / TICKS_PER_SECOND

export type Session = {
  state: GameState
  me: number
  send: (order: Order) => void
  /** Advance the clock; returns how far into the next tick we are, 0 to 1. */
  advance: (ms: number) => number
}

export function startSession(
  grid: Grid,
  seed: string,
  me: number,
  level: Level = 'normal',
): Session {
  const state = createGame(grid, PLAYERS.length, seed)
  const bots = PLAYERS.map((_, id) =>
    id === me ? null : createBot(id, seed, level),
  )
  let pending: Array<Order> = []
  let clock = 0
  return {
    state,
    me,
    send: (order) => pending.push(order),
    advance(ms) {
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
      }
      return Math.min(1, clock / TICK_MS)
    },
  }
}
