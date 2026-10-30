/// <reference lib="webworker" />
import { makeDiffer } from './mirror'
import { startRemoteSession } from './remote'
import { startSession } from './session'
import type { Delta } from './mirror'
import type { Session } from './session'
import type { GameSetup, Grid, Order } from '../../engine'
import type { FromRelay, ToRelay } from '../../net/protocol'

// The game's own thread (« go la simulation dans un fil a part »): the
// session the page ran, alone against the bots (session.ts) or online at
// the relay's turns (remote.ts), stepped here, its moves sent back after
// each step (mirror.ts), so that no step however heavy, nor a bot thinking
// long, ever holds a frame of the page back. The page keeps the clock and
// the line to the relay: it says how long has passed, hands on the relay's
// messages, and sends my orders.

/** What the page tells the thread. */
export type ToThread =
  | {
      t: 'start'
      grid: Grid
      setup: GameSetup
      me: number
      held: boolean
      /** Online: the seat the relay gave, the game stepped at its turns. */
      online: boolean
    }
  | { t: 'order'; order: Order }
  | { t: 'advance'; ms: number; most: number }
  | { t: 'launch'; setup: GameSetup }
  | { t: 'relay'; message: FromRelay }

/** What the thread tells the page: the steps played and how far into the next, or a message for the relay. */
export type FromThread =
  | { t: 'steps'; deltas: Array<Delta>; between: number }
  | { t: 'relay'; message: ToRelay }

const scope = self as unknown as DedicatedWorkerGlobalScope
let session: Session | null = null
let differ: ReturnType<typeof makeDiffer> | null = null
let hear: ((message: FromRelay) => void) | null = null

const tell = (message: FromThread) => scope.postMessage(message)

function start(message: Extract<ToThread, { t: 'start' }>) {
  const { grid, setup, me, held, online } = message
  session = online
    ? startRemoteSession(grid, {
        setup,
        seat: me,
        // The relay's line is the page's: its messages come through it.
        link: {
          send: (m) => tell({ t: 'relay', message: m }),
          listen: (h) => {
            hear = h
            return () => (hear = null)
          },
          close: () => undefined,
        },
      })
    : startSession(grid, setup, me, held)
  differ = makeDiffer(session.state)
}

scope.onmessage = (event: MessageEvent<ToThread>) => {
  const message = event.data
  if (message.t === 'start') return start(message)
  if (!session || !differ) return
  if (message.t === 'order') session.send(message.order)
  else if (message.t === 'relay') hear?.(message.message)
  else if (message.t === 'launch') {
    session.launch?.(message.setup)
    differ.reset()
  } else {
    const deltas: Array<Delta> = []
    const d = differ
    const between = session.advance(
      message.ms,
      () => deltas.push(d.delta()),
      message.most,
    )
    tell({ t: 'steps', deltas, between })
  }
}
