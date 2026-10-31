import {
  ARMIES,
  COUPS,
  UNIT,
  WORKS,
  coupPrice,
  priceOf,
  warshipPrice,
} from '../../engine'
import type { Army, Coup, GameState, Work } from '../../engine'

// The keyboard: 1 to 4 take an army in hand, 5 to 7 a work, 8, 9 and 0 a
// coup, in the order the bar shows them, the tenth key being 0 as on the
// keyboard's top row; one more army, work or coup takes the next key. The
// digits all taken, a letter: B a warship (« bateau », and boat), P a port. A
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

/** The works taken by a letter rather than a digit. */
const LETTERS: Partial<Record<Work, string>> = { port: 'p' }
/** The works taken by a digit, after the armies. */
const DIGITS = WORKS.filter((work) => !LETTERS[work])

/** The key that takes a work in hand. */
export const workKey = (work: Work): string =>
  LETTERS[work] ?? keyAt(ARMIES.length + DIGITS.indexOf(work) + 1)

/** The key that takes a coup in hand, after the works' digits. */
export const coupKey = (coup: Coup): string =>
  keyAt(ARMIES.length + DIGITS.length + COUPS.indexOf(coup) + 1)

export const WORK_KEYS: Partial<Record<string, Work>> = Object.fromEntries(
  WORKS.map((work) => [workKey(work), work]),
)

/** The key that takes a warship to fit out in hand. */
export const FLEET_KEY = 'b'

export const COUP_KEYS: Partial<Record<string, Coup>> = Object.fromEntries(
  COUPS.map((coup) => [coupKey(coup), coup]),
)

/** Whether a key may take what it names in hand: a work or a coup only if it can be paid, refused with its sound if not; anything to put down, or any other key. */
export function affordable(
  state: GameState,
  me: number,
  hand: Readonly<{ work: Work | null; coup: Coup | null; fleet: boolean }>,
  refuse: () => void,
) {
  return (key: string) => {
    if (me < 0) return true
    const work = WORK_KEYS[key.toLowerCase()]
    const coup = COUP_KEYS[key]
    // Put down, it is let go whatever it costs.
    let price = 0
    if (work) price = hand.work === work ? 0 : priceOf(state, me, work)
    else if (coup) price = hand.coup === coup ? 0 : coupPrice(state, me, coup)
    else if (key.toLowerCase() === FLEET_KEY)
      price = hand.fleet ? 0 : warshipPrice(state, me)
    if (price <= Math.floor(state.players[me].gold / UNIT)) return true
    refuse()
    return false
  }
}
