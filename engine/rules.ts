import { TICKS_PER_SECOND } from './units'

// The rules' figures: the land taken bit by bit, as in OpenFront, on a fine
// grid of small tiles. Every number of the rules lives here (docs/RULES.md).
// Men and gold are counted in thousandths (UNIT), so every rate stays an
// integer.

import type { Army, Coup, Work } from './kinds'

export type { Army, Coup, MapSize, Work } from './kinds'
export { ARMIES, COUPS, MAP_SIZES, WORKS } from './kinds'

/**
 * A coup's figures: its first price in gold; how far from its lord's border
 * it may strike, in tiles (none: anywhere a walk over land reaches); the
 * radius it strikes, in tiles; the ticks before it falls (none: it walks
 * there at the armies' pace).
 */
type CoupRule = {
  price: number
  reach: number | null
  radius: number
  flight: number | null
}

export type Rules = {
  /** Ticks during which each lord picks where he starts: the setup's opening, laid over the rules as the game is made (createGame). */
  openingTicks: number
  /** In the opening, how near another lord's standard none may be planted, in tiles; when it ends, how far round his standard a lord's start reaches, in tiles. */
  standardGap: number
  startRadius: number
  /** A tile's side, in map units. */
  tileSize: number
  /** A lord's gold at the start, in gold. */
  startGold: number
  /**
   * The peasants a lord's land and villages feed, in men: his land `land` of
   * them on `tiles` of it, more as it grows but fewer by the tile, as the
   * square root of its size (four times the land, twice the peasants); each
   * village built `village` more.
   */
  peasants: { land: number; tiles: number; village: number }
  /** An empty gauge fills to its cap in so many seconds; none is born above it. */
  fillSeconds: number
  /** Of the peasants over what the land and villages feed, so many in a hundred die of sickness a second. */
  sickness: number
  /** What a man raised costs, in thousandths of gold: 0 is OpenFront's free attack. */
  menPrice: number
  /** The share each army takes, in percent: of the peasants for those levied at a village, of the cap for the mercenaries. */
  armies: Readonly<Record<Army, number>>
  /** Where each army is raised: at a village, out of the peasants; at a market, hired for gold, the peasants left at home. */
  raisedAt: Readonly<Record<Army, 'village' | 'market'>>
  /** What a mercenary costs, in thousandths of gold. */
  mercenaryPrice: number
  /** Tiles an army takes each tick at most, once at the front: its pace, whatever its size. */
  paceTiles: number
  /** How fast it takes free land against its pace on a lord's, in percent: the free land hardly holds (« je sais pas si l'assaut de zone vide est satisfaisant, ça peut être long », 31/10). */
  freePace: number
  /** How fast each army goes, on the march and at the front, in percent of the host's pace: a raid rides half again as fast, the levy at half the pace (« Essaye le -50 +50% », 30/10). */
  armySpeed: Readonly<Record<Army, number>>
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
  /** The least a lord's tile costs the army that takes it, in thousandths of a man, however thin his land: an army is never unending (« la frontiere adverse augmente alors que y'a pas d'unité c'est infini »). */
  leastCost: number
  /** An army's pace in the woods, in percent of its own, on the march and at its front (« la foret doit donner un malus de vitesses aux troupes »). */
  forestPace: number
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
  /** A castle: the land within so many tiles of it fights as the combat table says, and its arrows fall there. */
  castleRadius: number
  /** A castle looses a volley so many ticks apart, from the tick it stands, at each enemy army fighting within its radius, which loses so many of its men in a hundred, one at least. */
  volleyTicks: number
  volleyToll: number
  /**
   * Price of each work, in gold, doubled for each one of its kind the lord
   * holds (so many times at most); the first of the kinds in `firstFree`
   * costs nothing, so that a lord can always start again from nothing.
   * Works stand a few tiles apart (workGap), castles further (castleGap).
   */
  workPrice: Record<Work, number>
  /** Ticks each work takes to build before it serves. */
  buildTicks: Record<Work, number>
  /** Ticks a work taken from another lord, or with free land, stands idle before it serves its new lord: no levy, no trade, no volley, so that a fight does not turn at once on what it took (« quand une construction est prise, il faut qu'elle soit inactive pendant 5/10s »). */
  seizedTicks: number
  firstFree: ReadonlyArray<Work>
  priceDoublings: number
  castleGap: number
  /** Tiles kept between any two works, so that their drawings never lie on one another. */
  workGap: number
  /** An alliance lasts so long; both may renew it in its last moments; an offer waits so long. */
  allianceTicks: number
  renewTicks: number
  requestTicks: number
  /** An offering gives so much of the giver's gold, in percent; it is remembered so long, a bot that received it leaving the giver in peace the while and taking his alliance more readily. */
  offeringShare: number
  offeringMemory: number
  /** A traitor's mark lasts so long, and his land holds so much the while, in percent. */
  felonTicks: number
  felonHold: number
  /** A market may send a caravan so often, which covers so many tiles a tick, in thousandths; with so many of its lord's on the roads, it sends one time in two. */
  caravanTicks: number
  caravanPace: number
  caravanCrowd: number
  /** How far a market reaches, in tiles: two markets within it of each other are joined by a road. */
  tradeRange: number
  /** Gold a caravan brings each of its two markets for each tile of its road, in thousandths; between allies, so much more, in percent; between two markets of one lord, so much, paid once. */
  caravanGold: number
  /** A village within so many tiles of a caravan's road is a relay (« les villages sur les chemins des marchands comme sur openfront »): once a caravan, it pays its lord and the caravan's so much, in thousandths, as OpenFront's stations do: the same lord's less, allies' more. */
  /** A port may send a ship so often, which sails so many thousandths of a tile a tick; with so many of its lord's at sea, it sends one time in two; it brings each port so much gold a tile of its way, in thousandths (ships.ts). */
  shipTicks: number
  shipPace: number
  shipCrowd: number
  shipGold: number
  /** A warship (warships.ts): its price, in gold, doubling with each afloat; it sails so many thousandths of a tile a tick, patrols within so many tiles of its post, shoots within so many, every so many ticks, and sinks at so many shots. */
  warshipPrice: number
  warshipPace: number
  warshipPatrol: number
  warshipReach: number
  warshipReload: number
  warshipHull: number
  relayReach: number
  relayGold: { self: number; other: number; ally: number }
  allyTrade: number
  homeTrade: number
  /** A piece of land under so many tiles, free or a lord's, ringed by one lord and the sea, passes to him as if ringed all round. */
  seaWalled: number
  /** The fewest tiles an island keeps to be in the game: a speck the water touches, a shore's crumb cut off by the dead land, is not. */
  isle: number
  /** Share of the land that wins, in thousandths, and how it falls with time. */
  /** The land's roughness (rough.ts): at most so many tenths of a tile added to the order an army takes a tile in, smooth over a mesh of so many tiles. */
  roughness: number
  roughMesh: number
  victoryShare: number
  victoryDropStart: number
  victoryDropPerMinute: number
  victoryFloor: number
  /** The coups; how many times a coup's price doubles at most, with each launched; the share of its men a volley of arrows kills, in percent; how much better rebels hold their land than free land, in percent; how long burnt land may not be built on. */
  coups: Readonly<Record<Coup, CoupRule>>
  coupDoublings: number
  arrowToll: number
  rebelHold: number
  ashTicks: number
}

const SECOND = TICKS_PER_SECOND
const MINUTE = 60 * SECOND

/**
 * What a game's setup may be (setup.ts): two to twenty lords (64 later); a
 * seat's team from 0 to 3, or none; an opening of 5 seconds to a minute,
 * 10 alone and 30 in the public game, the time for players to come into it
 * while the lords plant their standards (Concept, 29/10); a seed of 64
 * letters at most.
 */
export const SETUP_LIMITS = {
  seats: { min: 2, max: 24 },
  teams: 4,
  opening: {
    min: 5 * SECOND,
    max: 60 * SECOND,
    alone: 10 * SECOND,
    public: 30 * SECOND,
    /** No one comes into the public game in its last seconds: the time for the last come to plant his standard (« plus personne n'entre dans les 5 dernières secondes »). */
    lastCall: 5 * SECOND,
  },
  seed: { min: 1, max: 64 },
} as const

export const RULES: Rules = {
  openingTicks: SETUP_LIMITS.opening.alone,
  standardGap: 20,
  startRadius: 14,
  tileSize: 4,
  startGold: 50,
  peasants: { land: 40, tiles: 600, village: 60 },
  fillSeconds: 60,
  sickness: 10,
  menPrice: 0,
  armies: { raid: 10, host: 25, ban: 50, mercenaries: 25 },
  raisedAt: {
    raid: 'village',
    host: 'village',
    ban: 'village',
    mercenaries: 'market',
  },
  mercenaryPrice: 2000,
  paceTiles: 3,
  freePace: 200,
  armySpeed: { raid: 150, host: 100, ban: 50, mercenaries: 100 },
  marchPace: 600,
  combat: { peasants: 50, castle: 100, army: 100, castleArmy: 200 },
  leastCost: 100,
  forestPace: 60,
  battleTicks: 40,
  meetTiles: 8,
  neutralHold: 50,
  neutralGold: 100,
  neutralFloor: 100,
  bandTiles: 6,
  castleRadius: 12,
  volleyTicks: 3 * SECOND,
  volleyToll: 5,
  workPrice: { village: 100, market: 100, castle: 200, port: 150 },
  buildTicks: {
    village: 10 * SECOND,
    market: 10 * SECOND,
    castle: 20 * SECOND,
    port: 10 * SECOND,
  },
  seizedTicks: 8 * SECOND,
  firstFree: ['village', 'market'],
  priceDoublings: 3,
  castleGap: 10,
  workGap: 4,
  allianceTicks: 5 * MINUTE,
  renewTicks: 30 * SECOND,
  requestTicks: 20 * SECOND,
  offeringShare: 25,
  offeringMemory: 2 * MINUTE,
  felonTicks: 30 * SECOND,
  felonHold: 50,
  caravanTicks: 10 * SECOND,
  caravanPace: 400,
  caravanCrowd: 6,
  tradeRange: 40,
  caravanGold: 150,
  shipTicks: 15 * SECOND,
  shipPace: 800,
  shipCrowd: 4,
  shipGold: 150,
  warshipPrice: 200,
  warshipPace: 600,
  warshipPatrol: 12,
  warshipReach: 3,
  warshipReload: 2 * SECOND,
  warshipHull: 4,
  relayReach: 2,
  relayGold: { self: 1000, other: 2500, ally: 3500 },
  allyTrade: 200,
  homeTrade: 50,
  seaWalled: 200,
  isle: 20,
  roughness: 30,
  roughMesh: 5,
  victoryShare: 800,
  victoryDropStart: 10 * MINUTE,
  victoryDropPerMinute: 50,
  victoryFloor: 500,
  coups: {
    troublemaker: { price: 300, reach: null, radius: 6, flight: null },
    archers: { price: 200, reach: 5, radius: 4, flight: 2 * SECOND },
    trebuchet: { price: 1000, reach: null, radius: 12, flight: 8 * SECOND },
  },
  coupDoublings: 3,
  arrowToll: 30,
  rebelHold: 200,
  ashTicks: MINUTE,
}
