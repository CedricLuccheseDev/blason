import type { ShapeKind } from './shapes'

// What the generator hands the simulation: the cells of the land, each with
// its neighbours and its shore, and the cells of the open sea; and what each
// generator makes of the cells, its ground.

/** A cell of land: fixed for the whole game, rebuilt from the seed. */
type LandCell = {
  x: number
  y: number
  neighbors: Array<number>
  /** The sea cells along its coast. */
  shore: Array<number>
}

/** A cell of the open sea, held by no one. */
type SeaCell = {
  x: number
  y: number
  neighbors: Array<number>
  /** The cells of land along it. */
  coast: Array<number>
}

export type GameMap = { land: Array<LandCell>; sea: Array<SeaCell> }

/** The family a generator draws, and how much its sea takes of the frame, in thousandths. */
export type Plan = { kind: ShapeKind; seaShare: number }

/** What a generator makes of the cells. */
export type Ground = {
  /** The sea's cells and the lakes'. */
  water: Array<boolean>
  /** Each cell's height, about 0 on the shore to 1 on the highest; −1 under water. */
  heights: Array<number>
}
