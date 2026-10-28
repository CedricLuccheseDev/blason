import { TICKS_PER_SECOND } from './units'

// The rules' figures: the land taken bit by bit, as in OpenFront, on a fine
// grid of small tiles. Every number of the rules lives here (docs/RULES.md).
// Men and gold are counted in thousandths (UNIT), so every rate stays an
// integer.

/** The three armies a lord may raise: a share of his peasants. */
export type Army = 'raid' | 'host' | 'ban'

/** What a lord may build anywhere on his land, one thing a place. */
export type Work = 'village' | 'market' | 'barracks' | 'castle'

/** The armies and the works, in the order the bar shows them: one more is one more entry here. */
export const ARMIES: ReadonlyArray<Army> = ['raid', 'host', 'ban']
export const WORKS: ReadonlyArray<Work> = [
  'village',
  'market',
  'barracks',
  'castle',
]

export type Rules = {
  /** Ticks during which each lord picks where he starts. */
  openingTicks: number
  /** A tile's side, in map units. */
  tileSize: number
  /** A lord's gold at the start, in gold. */
  startGold: number
  /** Gold each market brings by itself each second, in thousandths: no market, no gold; its caravans bring more. */
  marketGold: number
  /** The peasants each village feeds, in men: no village, no peasants; the land alone feeds none. */
  peasants: { village: number }
  /** An empty gauge fills to its cap in so many seconds; none is born above it. */
  fillSeconds: number
  /** What a man raised costs, in thousandths of gold: 0 is OpenFront's free attack. */
  menPrice: number
  /** The share of the peasants each army takes, in percent. */
  armies: Readonly<Record<Army, number>>
  /** Tiles an army takes each tick at most: its pace, whatever its size. */
  paceTiles: number
  /** Men holding a free tile, in thousandths, and one round a free village, within so many tiles of it. */
  militia: number
  villageMilitia: number
  villageRadius: number
  /** One free village for so many tiles, and the gold its taker carries off. */
  villageEvery: number
  villageGold: number
  /** A castle: the land within so many tiles of it holds so many times better, in percent. */
  castleRadius: number
  castleHold: number
  /**
   * Price of each work, in gold, doubled for each one of its kind the lord
   * holds (so many times at most); the first of the kinds in `firstFree`
   * costs nothing, so that a lord can always start again from nothing.
   * Works stand side by side, castles alone kept so many tiles apart.
   */
  workPrice: Record<Work, number>
  firstFree: ReadonlyArray<Work>
  priceDoublings: number
  castleGap: number
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
  marketGold: 5000,
  peasants: { village: 250 },
  fillSeconds: 60,
  menPrice: 0,
  armies: { raid: 10, host: 25, ban: 50 },
  paceTiles: 3,
  militia: 200,
  villageMilitia: 1000,
  villageRadius: 3,
  villageEvery: 600,
  villageGold: 50,
  castleRadius: 12,
  castleHold: 300,
  workPrice: { village: 100, market: 100, barracks: 150, castle: 200 },
  firstFree: ['village', 'market', 'barracks'],
  priceDoublings: 3,
  castleGap: 10,
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
