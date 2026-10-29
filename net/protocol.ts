import type { Level, MapSize, Order } from '../engine'

// The words between the players and the relay (docs/ARCHITECTURE.md): the
// relay computes nothing, as OpenFront's. It gathers the players of a room,
// gives each a seat and the game's seed, then every 100 ms sends everyone
// one numbered turn: the orders it received since the last, in the order it
// received them. Every browser plays the whole game from the same seed and
// the same turns, bots included, so they all play the same game; each tells
// now and then the fingerprint of its state, and the relay names a turn
// where they differ. The messages are JSON.

/** The turn's length, in ms: one tick of the game. */
export const TURN_MS = 100
/** Turns between two fingerprints a player tells. */
export const HASH_EVERY = 50
/** Seats at most in a room: the rest of the twenty are bots. */
export const SEATS = 8

/** An order as a player sends it: its seat is the relay's to set. */
export type Move = Order extends infer O
  ? O extends Order
    ? Omit<O, 'player'>
    : never
  : never

export type ToRelay =
  /** Join the public room, or a private one by its code, or open a new private one (code 'new'). */
  | { t: 'join'; room: string | null; name: string }
  /** The host starts the game now, without waiting for the room to fill. */
  | { t: 'start' }
  | { t: 'order'; move: Move }
  | { t: 'hash'; turn: number; hash: string }

export type Lobby = {
  room: string
  /** Private rooms are joined by their code; the public one by anyone. */
  open: boolean
  /** The game's land, drawn as the room opened. */
  seed: string
  size: MapSize
  names: Array<string>
  /** The seat that may start the game. */
  host: number
  /** Ms before the public room starts by itself, or none. */
  startsIn: number | null
}

/** The next public game, as anyone may see it without sitting at it. */
export type Upcoming = {
  seed: string
  size: MapSize
  /** Ms before it starts, or gives way to another if no one sits. */
  startsIn: number
  /** Seats taken, of `seats`. */
  taken: number
  seats: number
}

export type FromRelay =
  /** The room as it stands, and my seat in it. */
  | { t: 'lobby'; seat: number; lobby: Lobby }
  /** The game begins: its land, the bots' level, the players by seat (the rest bots). */
  | {
      t: 'begin'
      seed: string
      size: MapSize
      level: Level
      names: Array<string>
    }
  /** One turn: its number, the orders in it, the seats that left (bots from this turn on). */
  | { t: 'turn'; n: number; orders: Array<Order>; left: Array<number> }
  /** The players' states parted at this turn: a bug, not a cheat to punish. */
  | { t: 'desync'; turn: number }
  | { t: 'error'; reason: 'full' | 'unknown' | 'started' }

/** A message read from the wire, or null if it is not one. */
export function parse<T extends { t: string }>(data: unknown): T | null {
  try {
    const value: unknown = JSON.parse(String(data))
    return typeof value === 'object' && value !== null && 't' in value
      ? (value as T)
      : null
  } catch {
    return null
  }
}
