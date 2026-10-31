// What the game is made of: the armies a lord may send, the works he may
// build, the coups he may launch, the sizes a land may be drawn at; each a
// name, so that a table typed on it (the rules, the bar, the sounds) does not
// compile without its entry. One more is one more name here.

/** The armies a lord may send: three levied at a village, a share of his peasants; the mercenaries hired at a market for gold. */
export type Army = 'raid' | 'host' | 'ban' | 'mercenaries'

/** What a lord may build on his land, one thing a place: anywhere, but a port only by the water. */
export type Work = 'village' | 'market' | 'castle' | 'port'

/** The coups that may turn a game, each its own deed: take land, kill troops, ruin an economy. */
export type Coup = 'archers' | 'troublemaker' | 'trebuchet'

/** The sizes a map may be drawn at. */
export type MapSize = 'small' | 'standard' | 'large' | 'huge'

/**
 * Each size's land, so many times the standard one's area (some 53,000
 * tiles): its tiles and cells the same size, more of them.
 */
export const MAP_SIZES: Readonly<Record<MapSize, number>> = {
  small: 0.5,
  standard: 1,
  large: 2,
  huge: 4,
}

/** The armies, the works and the coups, in the order the bar shows them: one more is one more entry here. */
export const ARMIES: ReadonlyArray<Army> = [
  'raid',
  'host',
  'ban',
  'mercenaries',
]
export const WORKS: ReadonlyArray<Work> = [
  'village',
  'market',
  'castle',
  'port',
]
export const COUPS: ReadonlyArray<Coup> = [
  'archers',
  'troublemaker',
  'trebuchet',
]
