// The engine: the game's simulation, pure TypeScript, the same in every
// browser and, later, on the server. Everything outside the engine reaches
// it through this file alone (.dependency-cruiser.cjs). Nothing in the engine
// may import React, Convex or a platform API, nor read the clock or draw an
// unseeded number (purity.test.ts): given the same seed and the same orders,
// every machine plays the same game, tick for tick (war.test.ts).

// The units and the land.
export { TICKS_PER_SECOND, UNIT } from './units'
export { generateWorld } from './map/generate'
export type { Generator, World } from './map/generate'
export type { Point } from './map/points'
export { apart, around, makeGrid } from './grid'

// A game: what it is made of, its rules, its state, the orders and the step
// that applies them.
export {
  aloneSetup,
  botsSetup,
  bookOf,
  hostSetup,
  landOf,
  publicSetup,
  readSetup,
  seatPersons,
  lordsFor,
  sizeOf,
  worldOf,
} from './setup'
export { ATLAS_MAPS } from './map/atlas'
export type { Atlas } from './map/atlas'
export type { Book } from './setup'
export { ARMIES, COUPS, MAP_SIZES, RULES, SETUP_LIMITS, WORKS } from './rules'
export type { Army, Coup, MapSize, Work } from './rules'
export { NEUTRAL, NO_ONE } from './types'
export type {
  Caravan,
  Ship,
  Warship,
  GameSetup,
  GameState,
  Grid,
  Host,
  Land,
  Order,
  Scar,
  Strike,
} from './types'
export {
  capOf,
  createGame,
  fedByLand,
  sicknessOf,
  standing,
  worksOf,
} from './land'
export { barredBy, canStart, hasPicked, takeSeat } from './opening'
export { nextDrop, stateHash, step, victoryShare, wonBy } from './step'

// What the screen and the bots ask of the rules.
export { courseFor, entryFor, wideOf } from './course'
export { reachOf } from './reach'
export type { Plan } from './reach'
export { afloat } from './crossing'
export { relayGold } from './relays'
export { isPort, reachesSea } from './ships'
export { warshipPrice, whereIs } from './warships'
export { canBuild, priceOf, roomFor } from './works'
export { coupPrice, journeyOf, launchSite, strikeAt } from './coups'
export { burnt, rebelled } from './scars'
export {
  costOf,
  freeWorks,
  marching,
  menFor,
  paceOf,
  positionOf,
} from './muster'
export {
  canRenew,
  isAllied,
  isFelon,
  isFriendly,
  isTeammate,
  offeringOf,
} from './diplomacy'
export { meet, wayBetween } from './battle'
export { shootsAt, underFire } from './volleys'
export { tradeLinks } from './network'
export type { Link } from './network'

// The bots, players like the others, at the level chosen.
export { createBot } from './bots/bot'
export { LEVELS } from './bots/levels'
export type { Level } from './bots/levels'
