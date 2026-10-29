import { ARMIES, COUPS, WORKS } from '../../engine'
import type { Army, Coup, Work } from '../../engine'

// The keyboard: 1 to 3 take an army in hand, 4 to 6 a work, 7 to 9 a coup,
// in the order the bar shows them; one more army, work or coup takes the
// next key. A digit is read by its place on the keyboard, not by what it
// types: on a French keyboard the key 1 types "&" unless shifted.

/** The key a press names: a digit of the top row or the keypad by its place, whatever the layout; any other by what it types. */
export function keyOf(press: { key: string; code: string }): string {
  const digit = /^(?:Digit|Numpad)(\d)$/.exec(press.code)
  return digit ? digit[1] : press.key
}

export const ARMY_KEYS: Partial<Record<string, Army>> = Object.fromEntries(
  ARMIES.map((army, i) => [String(i + 1), army]),
)

export const WORK_KEYS: Partial<Record<string, Work>> = Object.fromEntries(
  WORKS.map((work, i) => [String(ARMIES.length + i + 1), work]),
)

export const COUP_KEYS: Partial<Record<string, Coup>> = Object.fromEntries(
  COUPS.map((coup, i) => [String(ARMIES.length + WORKS.length + i + 1), coup]),
)
