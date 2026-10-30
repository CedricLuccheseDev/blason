import { createGame } from '../../engine'
import { makeMirror } from './mirror'
import type { Online } from './online'
import type { Session } from './session'
import type { FromThread, ToThread } from './sim.worker'
import type { GameSetup, Grid } from '../../engine'

// A session whose game is played in its own thread (sim.worker.ts) and
// drawn here from its mirror (mirror.ts), the same contract as the others
// (session.ts): the page's state, my orders, the clock advanced each frame,
// a hosted game's launch. The page keeps the clock and the relay's line;
// the steps come back a frame later, each laid on the mirror then told to
// whoever listens, as a step played here would be. None where the browser
// gives no thread: the game is then played in the page, as before.

/** The game asked to be played in the page (`?thread=off`), to tell whether a fault lies in the thread. */
const inPage = () =>
  new URLSearchParams(globalThis.location?.search ?? '').get('thread') ===
  'off'

export function startThreadedSession(
  grid: Grid,
  setup: GameSetup,
  me: number,
  { held = false, online }: { held?: boolean; online?: Online } = {},
): Session | null {
  if (typeof Worker === 'undefined' || inPage()) return null
  let worker: Worker
  try {
    worker = new Worker(new URL('./sim.worker.ts', import.meta.url), {
      type: 'module',
    })
  } catch {
    return null
  }
  const post = (message: ToThread) => worker.postMessage(message)
  // The mirror begins as the thread's game does: made from the same setup.
  const state = createGame(grid, setup)
  const mirror = makeMirror(state)
  let each: (() => void) | undefined
  let between = 0
  worker.onmessage = (event: MessageEvent<FromThread>) => {
    const message = event.data
    if (message.t === 'relay') {
      online?.link.send(message.message)
      return
    }
    for (const delta of message.deltas) {
      mirror.apply(delta)
      each?.()
    }
    between = message.between
  }
  const unhear = online?.link.listen((message) => post({ t: 'relay', message }))
  post({ t: 'start', grid, setup, me, held, online: online !== undefined })

  return {
    state,
    me,
    // Online, my orders go to the relay, as ever; alone, to the thread.
    send: online
      ? (order) => online.link.send({ t: 'order', move: order })
      : (order) => post({ t: 'order', order }),
    advance(ms, then, most = Infinity) {
      each = then
      post({ t: 'advance', ms, most })
      return between
    },
    ...(online
      ? {}
      : {
          launch(next: GameSetup) {
            Object.assign(state, createGame(grid, next))
            post({ t: 'launch', setup: next })
          },
        }),
    stop() {
      unhear?.()
      worker.terminate()
    },
  }
}
