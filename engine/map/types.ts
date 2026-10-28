// What the generator hands the simulation: the cells of the land, each with
// its neighbours and its shore, and the cells of the open sea.

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
