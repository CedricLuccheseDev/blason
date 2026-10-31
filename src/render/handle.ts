import type { Heralds } from './heralds'
import type { Aim } from './aiming'
import type { News } from './news'
import type { Online } from './online'
import type { Save } from './save'
import type { Summary } from './summary'
import type { Army, Book, Coup, Land, Level, Work } from '../../engine'

// What the page holds of a game on screen (client.ts): its orders, its
// camera, and where the HUD lays its pieces on the map.

/** What the page gives a game it mounts: where it tells what happens, and what the game is. */
export type GameHooks = {
  onSummary: (summary: Summary) => void
  /** The pointer over land a click would strike, or another lord's land right clicked, for his menu; none elsewhere. */
  onAim: (aim: Aim | null) => void
  /** What happened in the last second that the player should read. */
  onNews?: (news: Array<News>) => void
  names: Array<string>
  /** The bots' level, chosen at the home; normal if none. */
  level?: Level
  /** The land: the standard invented one if none. Online, the relay's. */
  land?: Land
  /** A game online (online.ts): its land, its turns and my seat come from the relay. */
  online?: Online
  /** The host's game, held while he sets it in his book (« créer une partie »), its land the one asked. */
  book?: Book
  /** A saved game (save.ts), held still at its tick: its land, my seat and the camera come from it. */
  save?: Save
}

export type GameHandle = {
  destroy: () => void
  choose: (army: Army) => void
  hold: (work: Work | null) => void
  /** A coup taken in hand, or put down. */
  aim: (coup: Coup | null) => void
  /** A warship to fit out taken in hand, or put down. */
  fit: (fleet: boolean) => void
  /** The pointer gone far from the right click's menu: it closes, and a click on the map just after only finishes closing it. */
  leave: () => void
  /** From the right click's menu: the army in hand sent at the land right clicked, as a left click there would. */
  attack: () => void
  /** From the right click's menu on my land: the work built on the tile right clicked. */
  build: (work: Work) => void
  /** From the right click's menu on the water: a warship fitted out for the tile right clicked, from my nearest port. */
  fitOut: () => void
  /** An order about another lord: to offer or accept an alliance, renew it, or break it, or to give him an offering. */
  treat: (type: 'ally' | 'breakAlliance' | 'offering', target: number) => void
  /** The camera: one step closer (1) or farther (-1), back to the player's land. */
  zoom: (step: 1 | -1) => void
  home: () => void
  /** Where the HUD lays its pieces on the map, told each time they move; the call returned stops it. */
  heralds: (listener: (heralds: Heralds) => void) => () => void
  /** The land of a lord pointed at in the list of lords, lit on the map; none. */
  light: (lord: number | null) => void
  /** The camera brought to a lord's land, where his name is written: from his line in the list. */
  seekLord: (lord: number) => void
  /** A lord's menu opened, as a right click on his land would: from his line in the list. */
  menu: (lord: number, x: number, y: number) => void
  /** The camera brought to an army of mine, by the village or market it left from (« si on clique sur l'étendard en bas ça centre sur l'unité »). */
  seek: (from: number) => void
  /** An army of mine pointed at in the campaigns, grown on the map; none. */
  spot: (from: number | null) => void
  /** The host's game launched, as his book set it, on the land it shows. */
  launch: (book: Book) => void
}
