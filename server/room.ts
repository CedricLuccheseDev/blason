import { fingerprints } from './checks'
import type { Fingerprints } from './checks'
import type { FromRelay, Turn } from '../net/protocol'
import type { GameSetup, Order } from '../engine'

// One game at the relay (rooms.ts runs them): what it is made of, its seats
// and the persons in them, and the turn being gathered, sent to all every
// 100 ms; the relay computes nothing of the game.

export type Player = {
  name: string
  send: (message: FromRelay) => void
  /** Whether he answered the relay's last asking (relay.ts): a watcher sees who is gone without a word. */
  answers?: () => boolean
}

/** A game at the relay, and the room its players gather in before it. */
export type Room = {
  code: string
  /** What the game is made of, sent whole to each player as it begins for him: the relay reads nothing of it. */
  setup: GameSetup
  /** By seat, the persons; a seat without one is its bot's, as the setup gives it, or empty. */
  players: Array<Player | null>
  turn: number
  /** What the next turn will carry. */
  pending: Array<Order>
  joined: Array<number>
  left: Array<number>
  /** The turns played, kept while players may come in, to catch them up; none once no one may. */
  played: Array<Turn> | null
  prints: Fingerprints
  timer: ReturnType<typeof setInterval> | null
  /** By seat, the last standard planted in the opening: the one a lone player keeps when it begins again. */
  planted: Map<number, Order>
  /** A private room's host's book before its game, passed on to his guests unread. */
  book?: unknown
  /** Who sat through an opening alone and waits in this one. */
  waited: Set<Player>
}

export function makeRoom(code: string, setup: GameSetup): Room {
  return {
    code,
    setup,
    players: [],
    turn: 0,
    pending: [],
    joined: [],
    left: [],
    played: null,
    prints: fingerprints(),
    timer: null,
    planted: new Map(),
    waited: new Set(),
  }
}

export const started = (room: Room) => room.timer !== null
export const seated = (room: Room) => room.players.filter(Boolean).length

export function broadcast(room: Room, message: FromRelay) {
  for (const p of room.players) p?.send(message)
}

/** The game as a player begins it, from his seat. */
export function beginning(room: Room, seat: number): FromRelay {
  return { t: 'begin', seat, setup: room.setup }
}

/** An order for the next turn; a standard planted is kept, for a lone player's opening begun again. */
export function order(room: Room, move: Order) {
  room.pending.push(move)
  if (move.type === 'pickStart') room.planted.set(move.player, move)
}

/** The turn gathered, sent now: the next begins empty. Kept while players may come in. */
export function nextTurn(room: Room): Turn {
  const { turn: n, pending: orders, joined, left } = room
  const turn: Turn = { t: 'turn', n, orders, joined, left }
  room.turn += 1
  room.pending = []
  room.joined = []
  room.left = []
  room.played?.push(turn)
  return turn
}
