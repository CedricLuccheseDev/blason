import { ARMIES, COUPS, WORKS } from '../../engine'
import type { Army, Coup, Work } from '../../engine'

// The keyboard: 1 to 4 take an army in hand, 5 to 7 a work, 8, 9 and 0 a
// coup, in the order the bar shows them, the tenth key being 0 as on the
// keyboard's top row; one more army, work or coup takes the next key. A
// digit is read by its place on the keyboard, not by what it types: on a
// French keyboard the key 1 types "&" unless shifted.

/** The key a press names: a digit of the top row or the keypad by its place, whatever the layout; any other by what it types. */
export function keyOf(press: { key: string; code: string }): string {
  const digit = /^(?:Digit|Numpad)(\d)$/.exec(press.code)
  return digit ? digit[1] : press.key
}

/** The key of the bar's n-th piece, counted from 1: the digits in the top row's order, 1 to 9, then 0. */
export const keyAt = (n: number): string => String(n % 10)

export const ARMY_KEYS: Partial<Record<string, Army>> = Object.fromEntries(
  ARMIES.map((army, i) => [keyAt(i + 1), army]),
)

export const WORK_KEYS: Partial<Record<string, Work>> = Object.fromEntries(
  WORKS.map((work, i) => [keyAt(ARMIES.length + i + 1), work]),
)

export const COUP_KEYS: Partial<Record<string, Coup>> = Object.fromEntries(
  COUPS.map((coup, i) => [keyAt(ARMIES.length + WORKS.length + i + 1), coup]),
)
