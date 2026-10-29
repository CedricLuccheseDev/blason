import type { Link } from './link'
import type { GameSetup } from '../../engine'

// A game online, from the home where it began to the screen where it is
// played: the home hears the relay say `begin` and leaves the line here,
// still open and its turns waiting (link.ts keeps what no one listens to);
// the game screen takes it up, and closes the line when it ends. One at a
// time: going back home lets go of the last.

export type Online = {
  link: Link
  /** My seat: empty, or its bot's, until the turn the relay says I took it. */
  seat: number
  /** What the game is made of, as the relay sent it: the same on every browser. */
  setup: GameSetup
}

let held: Online | null = null

/** Leaves a game begun for the game screen to take; a game already left is closed. */
export function holdOnline(online: Online | null) {
  if (held && held !== online) held.link.close()
  held = online
}

/** The game begun online, if one is: it stays held until another is, or none. */
export function heldOnline(): Online | null {
  return held
}
