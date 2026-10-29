import { HASH_EVERY } from '../net/protocol'
import type { Move } from '../net/protocol'

// What the relay checks of what the players send it, computing nothing of
// the game: that an order looks like one, the engine checking the rest; and
// the fingerprints they tell of their states every so many turns
// (protocol.ts): the same game gives the same fingerprint, so two that differ
// name the turn where two browsers parted. Only the first is said: after it,
// the game is no longer one.

/** Whether something sent as an order looks like one. */
export function isMove(move: unknown): move is Move {
  return (
    typeof move === 'object' &&
    move !== null &&
    'type' in move &&
    typeof move.type === 'string'
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

/** A fingerprint told for a turn; whether the game parts there, said once. */
export function tell(
  prints: Fingerprints,
  seat: number,
  turn: number,
  hash: string,
): boolean {
  if (turn % HASH_EVERY !== 0 || prints.parted) return false
  const told = prints.told.get(turn) ?? new Map<number, string>()
  told.set(seat, hash)
  prints.told.set(turn, told)
  for (const old of prints.told.keys())
    if (old < turn - 10 * HASH_EVERY) prints.told.delete(old)
  prints.parted = new Set(told.values()).size > 1
  return prints.parted
}
