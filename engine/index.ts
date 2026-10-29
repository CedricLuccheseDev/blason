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

// A game: its rules, its state, the orders and the step that applies them.
export {
  ARMIES,
  COUPS,
  MAP_SIZES,
  ONLINE_OPENING_TICKS,
  RULES,
  WORKS,
} from './rules'
export type { Army, Coup, MapSize, Work } from './rules'
export { NEUTRAL, NO_ONE } from './types'
export type {
  Caravan,
  GameState,
  Grid,
  Host,
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
export { barredBy, canStart, hasPicked } from './opening'
export { nextDrop, stateHash, step, victoryShare, wonBy } from './step'

// What the screen and the bots ask of the rules.
export { entryFor, paceOf } from './war'
export { canBuild, priceOf } from './works'
export { coupPrice, journeyOf, launchSite, strikeAt } from './coups'
export { burnt, rebelled } from './scars'
export {
  costOf,
  freeWorks,
  marching,
  menFor,
  positionOf,
  roadTo,
} from './muster'
export { canRenew, isAllied, isFelon, offeringOf } from './diplomacy'
export { groundOf, meet } from './battle'
export { shootsAt, underFire } from './volleys'
export { tradeLinks } from './network'
export type { Link } from './network'

// The bots, players like the others, at the level chosen.
export { createBot } from './bots/bot'
export { LEVELS } from './bots/levels'
export type { Level } from './bots/levels'
