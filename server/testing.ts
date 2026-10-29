import type { FromRelay, Turn } from '../net/protocol'

// What the relay's tests share: players who keep every word of the relay,
// and what they heard.

/** A player who keeps every word of the relay. */
export function player(name = '') {
  const heard: Array<FromRelay> = []
  return { name, send: (message: FromRelay) => heard.push(message), heard }
}

export const begun = (heard: Array<FromRelay>) =>
  heard.find((m) => m.t === 'begin')
export const turns = (heard: Array<FromRelay>) =>
  heard.filter((m): m is Turn => m.t === 'turn')
