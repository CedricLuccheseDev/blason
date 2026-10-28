import { TICKS_PER_SECOND } from './units'

// The rules' figures: the land taken bit by bit, as in OpenFront, on a fine
// grid of small tiles. Every number of the rules lives here (docs/RULES.md).
// Men and gold are counted in thousandths (UNIT), so every rate stays an
// integer.

/** The three armies a lord may raise: a share of his peasants. */
export type Army = 'raid' | 'host' | 'ban'

/** What a lord may build anywhere on his land, one thing a place. */
export type Work = 'village' | 'market' | 'castle'

/** The armies and the works, in the order the bar shows them: one more is one more entry here. */
export const ARMIES: ReadonlyArray<Army> = ['raid', 'host', 'ban']
export const WORKS: ReadonlyArray<Work> = ['village', 'market', 'castle']

export type Rules = {
  /** Ticks during which each lord picks where he starts. */
  openingTicks: number
  /** A tile's side, in map units. */
  tileSize: number
  /** A lord's gold at the start, in gold. */
  startGold: number
  /** The peasants each village feeds, in men: no village, no peasants; the land alone feeds none. */
  peasants: { village: number }
  /** An empty gauge fills to its cap in so many seconds; none is born above it. */
  fillSeconds: number
  /** What a man raised costs, in thousandths of gold: 0 is OpenFront's free attack. */
  menPrice: number
  /** The share of the peasants each army takes, in percent. */
  armies: Readonly<Record<Army, number>>
  /** Tiles an army takes each tick at most, once at the front: its pace, whatever its size. */
  paceTiles: number
  /** How far an army marches each tick from its village to the front, in thousandths of a tile. */
  marchPace: number
  /**
   * What a fight costs the attacker for each man the other side loses, in
   * percent: a soldier is worth two peasants, so against peasants or a
   * militia he loses one for two; under a castle, one for one; army against
   * army, one for one; against an army defending under its castle, two for
   * one.
   */
  combat: { peasants: number; castle: number; army: number; castleArmy: number }
  /** Ticks an even battle between two armies lasts, and how near, in tiles, two armies must come to fight. */
  battleTicks: number
  meetTiles: number
  /** Men holding a free tile, in percent of a lord's tile, the mean of the lords standing: half as many; the gold each free tile taken brings, in thousandths. */
  neutralHold: number
  neutralGold: number
  /** The least men holding a free tile, in thousandths, so that a small army does not nibble for ever. */
  neutralFloor: number
  /** An army's band: so many tiles each side of its line, plus the square root of its men. */
  bandTiles: number
  /** One free domain for so many tiles, to start on. */
  villageEvery: number
  /** A castle: the land within so many tiles of it fights as the combat table says. */
  castleRadius: number
  /**
   * Price of each work, in gold, doubled for each one of its kind the lord
   * holds (so many times at most); the first of the kinds in `firstFree`
   * costs nothing, so that a lord can always start again from nothing.
   * Works stand a few tiles apart (workGap), castles further (castleGap).
   */
  workPrice: Record<Work, number>
  /** Ticks each work takes to build before it serves. */
  buildTicks: Record<Work, number>
  firstFree: ReadonlyArray<Work>
  priceDoublings: number
  castleGap: number
  /** Tiles kept between any two works, so that their drawings never lie on one another. */
  workGap: number
  /** An alliance lasts so long; both may renew it in its last moments; an offer waits so long. */
  allianceTicks: number
  renewTicks: number
  requestTicks: number
  /** A traitor's mark lasts so long, and his land holds so much the while, in percent. */
  felonTicks: number
  felonHold: number
  /** A market sends a caravan so often, which covers so many tiles a tick, in thousandths. */
  caravanTicks: number
  caravanPace: number
  /** Gold a caravan brings each of its two markets for each tile of its road, in thousandths; between allies, so much more, in percent. */
  caravanGold: number
  allyTrade: number
  /** Share of the land that wins, in thousandths, and how it falls with time. */
  victoryShare: number
  victoryDropStart: number
  victoryDropPerMinute: number
  victoryFloor: number
}

const SECOND = TICKS_PER_SECOND
const MINUTE = 60 * SECOND

export const RULES: Rules = {
  openingTicks: 10 * SECOND,
  tileSize: 4,
  startGold: 50,
  peasants: { village: 100 },
  fillSeconds: 60,
  menPrice: 0,
  armies: { raid: 10, host: 25, ban: 50 },
  paceTiles: 3,
  marchPace: 600,
  combat: { peasants: 50, castle: 100, army: 100, castleArmy: 200 },
  battleTicks: 40,
  meetTiles: 8,
  neutralHold: 50,
  neutralGold: 100,
  neutralFloor: 100,
  bandTiles: 6,
  villageEvery: 600,
  castleRadius: 12,
  workPrice: { village: 100, market: 100, castle: 200 },
  buildTicks: {
    village: 10 * SECOND,
    market: 10 * SECOND,
    castle: 20 * SECOND,
  },
  firstFree: ['village', 'market'],
  priceDoublings: 3,
  castleGap: 10,
  workGap: 4,
  allianceTicks: 5 * MINUTE,
  renewTicks: 30 * SECOND,
  requestTicks: 20 * SECOND,
  felonTicks: 30 * SECOND,
  felonHold: 50,
  caravanTicks: 10 * SECOND,
  caravanPace: 400,
  caravanGold: 150,
  allyTrade: 200,
  victoryShare: 800,
  victoryDropStart: 10 * MINUTE,
  victoryDropPerMinute: 50,
  victoryFloor: 500,
}
