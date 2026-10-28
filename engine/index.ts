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
export { ARMIES, RULES, WORKS } from './rules'
export type { Army, Work } from './rules'
export { NEUTRAL, NO_ONE } from './types'
export type { Caravan, GameState, Grid, Host, Order } from './types'
export {
  canStart,
  capOf,
  createGame,
  hasPicked,
  standing,
  worksOf,
} from './land'
export { nextDrop, step, victoryShare } from './step'

// What the screen and the bots ask of the rules.
export { costOf, entryFor, menFor } from './war'
export { canBuild, priceOf } from './works'
export { freeBarracks, marching, roadTo } from './muster'
export { isAllied, isFelon } from './diplomacy'

// The bots, players like the others.
export { createBot } from './bots/bot'
