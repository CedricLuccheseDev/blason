import type { Point } from './points'
import type { ShapeKind } from './shapes'

// What the generator hands the simulation: the cells of the land, each with
// its neighbours and its shore, the cells of the open sea, and those of the
// high mountains; and what each generator makes of the cells, its ground.

/** A cell of land: fixed for the whole game, rebuilt from the seed. */
type LandCell = {
  x: number
  y: number
  neighbors: Array<number>
  /** The sea cells along its coast. */
  shore: Array<number>
  /** Its woods, which slow the armies (« la foret doit donner un malus de vitesses aux troupes »). */
  wood?: boolean
}

/** A cell of the open sea, held by no one. */
type SeaCell = {
  x: number
  y: number
  neighbors: Array<number>
  /** The cells of land along it. */
  coast: Array<number>
}

/** A cell of the high mountains: no one's, as the sea, but dry. */
type PeakCell = { x: number; y: number }

export type GameMap = {
  land: Array<LandCell>
  sea: Array<SeaCell>
  peaks: Array<PeakCell>
  /** The cells of the dead land: another's on a map of some lands only (atlas.ts), drawn, but no one's to take. */
  dead: Array<PeakCell>
}

/** The family a generator draws, and how much its sea takes of the frame and its high mountains of the land, in thousandths. */
export type Plan = { kind: ShapeKind; seaShare: number; peakShare: number }

/** What a generator makes of the cells. */
export type Ground = {
  /** The sea's cells and the lakes'. */
  water: Array<boolean>
  /** The high mountains' cells, which no one crosses. */
  peaks: Array<boolean>
  /** Each cell's height, about 0 on the shore to 1 on the highest; −1 under water. */
  heights: Array<number>
  /** The middle of each pass over the high mountains. */
  passes: Array<Point>
  /** The dead land's cells, which no one enters: other lands than a map's own; none on an invented land. */
  dead?: Array<boolean>
}
