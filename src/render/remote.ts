import { NO_ONE, createBot, createGame, stateHash, step } from '../../engine'
import { HASH_EVERY, TURN_MS } from '../../net/protocol'
import { PLAYERS } from './palette'
import type { Link } from './link'
import type { Session } from './session'
import type { Grid, Level, Order } from '../../engine'

// A game online, stepped by the relay's turns rather than by the clock: each
// turn holds the orders of every player, mine with them, and is played as it
// comes, with the bots' orders, on every browser alike. My orders go to the
// relay, never straight into my game. The seats of the players are theirs;
// every other seat is a bot, and so becomes a player's who leaves, at the
// turn the relay says. Every so many turns, the fingerprint of my state goes
// back to the relay, which names a turn where two browsers parted.

export function startRemoteSession(
  grid: Grid,
  seed: string,
  me: number,
  level: Level,
  players: number,
  link: Link,
): Session {
  const state = createGame(grid, PLAYERS.length, seed)
  const bots = PLAYERS.map((_, id) =>
    id < players ? null : createBot(id, seed, level),
  )
  const turns: Array<{ n: number; orders: Array<Order>; left: Array<number> }> =
    []
  link.listen((message) => {
    if (message.t === 'turn') turns.push(message)
  })
  let since = 0
  return {
    state,
    me,
    // The relay signs each order with my seat, whatever it says.
    send: (order) => link.send({ t: 'order', move: order }),
    advance(ms, each, most = Infinity) {
      since += ms
      // Every turn come is played, several at once to catch up after a
      // pause, so many at most: the rest at the next call.
      let played = 0
      for (let turn = turns.shift(); turn; turn = turns.shift()) {
        if (state.winner !== NO_ONE) break
        played++
        for (const seat of turn.left) bots[seat] = createBot(seat, seed, level)
        const orders = [
          ...turn.orders,
          ...state.players.flatMap((p, id) => {
            const bot = bots[id]
            return p.alive && bot ? bot(state, id) : []
          }),
        ]
        step(state, orders)
        if (turn.n % HASH_EVERY === 0)
          link.send({ t: 'hash', turn: turn.n, hash: stateHash(state) })
        each?.()
        since = 0
        if (played >= most) break
      }
      return Math.min(1, since / TURN_MS)
    },
  }
}
