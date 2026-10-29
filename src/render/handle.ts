import type { Heralds } from './heralds'
import type { Army, Book, Coup, Work } from '../../engine'

// What the page holds of a game on screen (client.ts): its orders, its
// camera, and where the HUD lays its pieces on the map.

export type GameHandle = {
  destroy: () => void
  choose: (army: Army) => void
  hold: (work: Work | null) => void
  /** A coup taken in hand, or put down. */
  aim: (coup: Coup | null) => void
  /** The pointer gone far from the right click's menu: it closes, and a click on the map just after only finishes closing it. */
  leave: () => void
  /** From the right click's menu: the army in hand sent at the land right clicked, as a left click there would. */
  attack: () => void
  /** An order about another lord: to offer or accept an alliance, renew it, or break it, or to give him an offering. */
  treat: (type: 'ally' | 'breakAlliance' | 'offering', target: number) => void
  /** The camera: one step closer (1) or farther (-1), back to the player's land. */
  zoom: (step: 1 | -1) => void
  home: () => void
  /** Where the HUD lays its pieces on the map, told each time they move; the call returned stops it. */
  heralds: (listener: (heralds: Heralds) => void) => () => void
  /** The land of a lord pointed at in the list of lords, lit on the map; none. */
  light: (lord: number | null) => void
  /** An army of mine called home, by the village or market it left from. */
  recall: (from: number) => void
  /** The host's game launched, as his book set it, on the land it shows. */
  launch: (book: Book) => void
}
