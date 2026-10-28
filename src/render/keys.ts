import { ARMIES, WORKS } from '../../engine'
import type { Army, Work } from '../../engine'

// The keyboard: 1 to 3 take an army in hand, 4 to 6 a work, in the order
// the bar shows them; one more army or work takes the next key.

export const ARMY_KEYS: Partial<Record<string, Army>> = Object.fromEntries(
  ARMIES.map((army, i) => [String(i + 1), army]),
)

export const WORK_KEYS: Partial<Record<string, Work>> = Object.fromEntries(
  WORKS.map((work, i) => [String(ARMIES.length + i + 1), work]),
)
