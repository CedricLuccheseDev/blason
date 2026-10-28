import type { Heralds } from './heralds'
import type { Army, Coup, Work } from '../../engine'

// What the page holds of a game on screen (client.ts): its orders, its
// camera, and where the HUD lays its pieces on the map.

export type GameHandle = {
  destroy: () => void
  choose: (army: Army) => void
  hold: (work: Work | null) => void
  /** A coup taken in hand, or put down. */
  aim: (coup: Coup | null) => void
  close: () => void
  /** An order about another lord: to offer or accept an alliance, renew it, or break it. */
  treat: (type: 'ally' | 'breakAlliance', target: number) => void
  /** The camera: one step closer (1) or farther (-1), back to the player's land. */
  zoom: (step: 1 | -1) => void
  home: () => void
  /** Where the HUD lays its pieces on the map, told each time they move; the call returned stops it. */
  heralds: (listener: (heralds: Heralds) => void) => () => void
}
