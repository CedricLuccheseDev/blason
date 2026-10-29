import {
  NO_ONE,
  createBot,
  createGame,
  stateHash,
  step,
} from '../../engine'
import { HASH_EVERY, TURN_MS } from '../../net/protocol'
import type { Online } from './online'
import type { Session } from './session'
import type { Grid } from '../../engine'
import type { Turn } from '../../net/protocol'

// A game online, stepped by the relay's turns rather than by the clock: each
// turn holds the orders of every player, mine with them, and is played as it
// comes, with the bots' orders, on every browser alike. My orders go to the
// relay, never straight into my game. Every seat begins a bot's; a turn says
// the seats a person took, whose bots stop from that turn on, and those left,
// bots again. Who comes in during the opening is handed every turn played so
// far and plays them as they come, a few a frame, to catch up. Every so many
// turns, the fingerprint of my state goes back to the relay, which names a
// turn where two browsers parted.

export function startRemoteSession(grid: Grid, online: Online): Session {
  const { setup, seat, link } = online
  // The game travels whole from the relay: the same on every browser.
  const state = createGame(grid, setup)
  /** A seat's bot, as its setup gives it. */
  const botOf = (id: number) => {
    const level = setup.seats[id]?.bot
    return level ? createBot(id, setup.seed, level) : null
  }
  const bots = setup.seats.map((_, id) => botOf(id))
  const turns: Array<Turn> = []
  link.listen((message) => {
    if (message.t === 'turn') turns.push(message)
  })
  let since = 0
  return {
    state,
    me: seat,
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
        for (const id of turn.joined) bots[id] = null
        for (const id of turn.left) bots[id] = botOf(id)
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
