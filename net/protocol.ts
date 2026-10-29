import { MAP_SIZES } from '../engine'
import type { GameSetup, MapSize, Order } from '../engine'

// The words between the players and the relay (docs/ARCHITECTURE.md): the
// relay computes nothing, as OpenFront's. It runs each game as a list of
// numbered turns, one every 100 ms from the game's first tick: the orders it
// received since the last, in the order it received them, and the seats that
// became a person's or no one's again. Every seat begins as the game's setup
// says, a bot's or empty. Every browser plays the whole game from the same seed and the same turns, bots
// included, so they all play the same game; one who comes in during the
// opening is given the turns played so far and plays them again to catch up.
// Each tells now and then the fingerprint of its state, and the relay names a
// turn where two differ. The messages are JSON.

/** The turn's length, in ms: one tick of the game. */
export const TURN_MS = 100
/** Turns between two fingerprints a player tells. */
export const HASH_EVERY = 50
/** Seats at most for persons in a game: every one of the twenty lords (« tu affiches 8 joueurs partout mais ça a aucun sens »). */
export const SEATS = 20

/** An order as a player sends it: its seat is the relay's to set. */
export type Move = Order extends infer O
  ? O extends Order
    ? Omit<O, 'player'>
    : never
  : never

export type ToRelay =
  /** Play the public game in its opening (null), or join a private room by its code, or open a new one ('new'). */
  | { t: 'join'; room: string | null; name: string }
  /** The host starts the private game now. */
  | { t: 'start' }
  | { t: 'order'; move: Move }
  | { t: 'hash'; turn: number; hash: string }

/** A private room before its game, as its players see it. */
export type Lobby = {
  /** Its code, given to friends. */
  room: string
  names: Array<string>
  /** The seat that may start the game. */
  host: number
}

/** The public game in its opening, as anyone may see it without joining it. */
export type Upcoming = {
  seed: string
  size: MapSize
  /** Ms left to join it: then it goes on with whoever came, and the next opens. */
  closesIn: number
  /** Seats taken by persons, of `seats`. */
  taken: number
  seats: number
}

/** One turn: its number (the tick it is played at), its orders, the seats a person took (their bots stopped from this turn on, an empty one his lord's) and those left (the setup's bot again, or none: the lord idle). */
export type Turn = {
  t: 'turn'
  n: number
  orders: Array<Order>
  joined: Array<number>
  left: Array<number>
}

export type FromRelay =
  /** The private room as it stands, and my seat in it. */
  | { t: 'lobby'; seat: number; lobby: Lobby }
  /** The game, played from my seat: what it is made of, whole, as every browser makes it (the browser reads it with readSetup). Its turns follow, from the first. */
  | { t: 'begin'; seat: number; setup: GameSetup }
  | Turn
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

/** The public game in its opening as the relay answers it (GET /public), or null if it is not one. */
export function readUpcoming(value: unknown): Upcoming | null {
  if (typeof value !== 'object' || value === null) return null
  const { seed, size, closesIn, taken, seats } = value as Record<
    string,
    unknown
  >
  const known = (Object.keys(MAP_SIZES) as Array<MapSize>).find(
    (s) => s === size,
  )
  return typeof seed === 'string' &&
    known &&
    typeof closesIn === 'number' &&
    typeof taken === 'number' &&
    typeof seats === 'number'
    ? { seed, size: known, closesIn, taken, seats }
    : null
}
