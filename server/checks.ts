import { HASH_EVERY } from '../net/protocol'
import type { Move } from '../net/protocol'

// What the relay checks of what the players send it, computing nothing of
// the game: that an order looks like one, the engine checking the rest; and
// the fingerprints they tell of their states every so many turns
// (protocol.ts): the same game gives the same fingerprint, so two that differ
// name the turn where two browsers parted. Only the first is said: after it,
// the game is no longer one.

/** The longest order the relay passes on, as its JSON: an order is a type and a few figures. */
const MOVE_MAX = 512

/** Whether something sent as an order looks like one, and is no larger than one. */
export function isMove(move: unknown): move is Move {
  return (
    typeof move === 'object' &&
    move !== null &&
    'type' in move &&
    typeof move.type === 'string' &&
    JSON.stringify(move).length <= MOVE_MAX
  )
}

export type Fingerprints = {
  /** By turn, by seat, the fingerprint told. */
  told: Map<number, Map<number, string>>
  parted: boolean
}

export const fingerprints = (): Fingerprints => ({
  told: new Map(),
  parted: false,
})

/** Turns back a fingerprint may be told for, and kept. */
const KEPT = 10 * HASH_EVERY

/** A fingerprint told for a turn played lately, `now` the game's turn; whether the game parts there, said once. Any other is not heard. */
export function tell(
  prints: Fingerprints,
  seat: number,
  turn: unknown,
  hash: unknown,
  now: number,
): boolean {
  if (typeof turn !== 'number' || !Number.isInteger(turn)) return false
  if (turn % HASH_EVERY !== 0 || turn > now || turn < now - KEPT) return false
  if (typeof hash !== 'string' || hash.length > 64 || prints.parted)
    return false
  const told = prints.told.get(turn) ?? new Map<number, string>()
  told.set(seat, hash)
  prints.told.set(turn, told)
  for (const old of prints.told.keys())
    if (old < now - KEPT) prints.told.delete(old)
  prints.parted = new Set(told.values()).size > 1
  return prints.parted
}
