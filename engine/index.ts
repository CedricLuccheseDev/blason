// The engine: the game's simulation, pure TypeScript, the same in every
// browser and, later, on the server. Everything outside the engine reaches
// it through this file alone (.dependency-cruiser.cjs). Nothing in the engine
// may import React, Convex or a platform API, nor read the clock or draw an
// unseeded number (purity.test.ts): given the same seed and the same orders,
// every machine plays the same game, tick for tick (war.test.ts).

// The units and the land.
export { TICKS_PER_SECOND, UNIT } from './units'
export { generateWorld } from './map/generate'
export type { World } from './map/generate'
export type { Point } from './map/points'
export { apart, around, makeGrid } from './grid'

// A game: its rules, its state, the orders and the step that applies them.
export { ARMIES, COUPS, RULES, WORKS } from './rules'
export type { Army, Coup, Work } from './rules'
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
  canStart,
  capOf,
  createGame,
  hasPicked,
  sicknessOf,
  standing,
  worksOf,
} from './land'
export { nextDrop, stateHash, step, victoryShare } from './step'

// What the screen and the bots ask of the rules.
export { costOf, entryFor, menFor, paceOf } from './war'
export { canBuild, priceOf } from './works'
export { coupPrice, journeyOf, launchSite, strikeAt } from './coups'
export { burnt, rebelled } from './scars'
export { freeVillages, marching, roadTo } from './muster'
export { isAllied, isFelon } from './diplomacy'
export { meet } from './battle'
export { tradeLinks } from './network'
export type { Link } from './network'

// The bots, players like the others, at the level chosen.
export { createBot } from './bots/bot'
export { LEVELS } from './bots/levels'
export type { Level } from './bots/levels'
