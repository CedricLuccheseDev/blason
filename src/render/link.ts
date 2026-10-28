import { parse } from '../../net/protocol'
import type { FromRelay, ToRelay } from '../../net/protocol'

// The line to the relay (server/relay.ts): a WebSocket that sends the
// player's words and hands each word of the relay to whoever listens. Its
// address is built in (VITE_RELAY_URL); on a developer's machine, the relay
// run beside the site (npm run relay).

export type Link = {
  send: (message: ToRelay) => void
  /** Listen to the relay; returns how to stop. */
  listen: (hear: (message: FromRelay) => void) => () => void
  close: () => void
}

/** The relay's address, or none: no game online is offered then. */
export function relayUrl(): string | null {
  const built = import.meta.env.VITE_RELAY_URL as string | undefined
  if (built) return built
  return import.meta.env.DEV ? 'ws://localhost:8787/ws' : null
}

/** A line opened to the relay, once it answers. */
export function connect(url: string): Promise<Link> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url)
    const listeners = new Set<(message: FromRelay) => void>()
    // What came while no one listened (the first turns, while the game is
    // being made) waits for the next listener, so that no turn is lost.
    const waiting: Array<FromRelay> = []
    socket.addEventListener('message', (event) => {
      const message = parse<FromRelay>(event.data)
      if (!message) return
      if (listeners.size === 0) waiting.push(message)
      for (const hear of listeners) hear(message)
    })
    socket.addEventListener('error', () => reject(new Error('relay')))
    socket.addEventListener('open', () =>
      resolve({
        send: (message) => {
          if (socket.readyState === WebSocket.OPEN)
            socket.send(JSON.stringify(message))
        },
        listen: (hear) => {
          listeners.add(hear)
          for (const message of waiting.splice(0)) hear(message)
          return () => listeners.delete(hear)
        },
        close: () => socket.close(),
      }),
    )
  })
}
