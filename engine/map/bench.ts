import { hill, range, smooth } from './sculpt'
import type { Clay } from './sculpt'
import type { Point } from './points'

// The bench a recipe works at (recipes.ts): the clay, the frame measured in
// heights of the map from its middle, so that a recipe's lands keep their
// proportions whatever the map's size, and the sculptor's tools taking
// their places and reaches in those heights.

/** What a recipe works with: the clay, and the frame measured in heights of the map from its middle. */
export type Bench = {
  clay: Clay
  aspect: number
  /** Cells across one height of the map. */
  across: number
  /** How many times the standard map's side this one's is: its coast is as much longer. */
  side: number
  /** A point given in heights of the map from its middle, in map units. */
  at: (u: number, v: number) => Point
  /** A number drawn between two. */
  rand: (low: number, high: number) => number
  /** A direction drawn among sixteen. */
  heading: () => Spot
  /** Adds a height of its place to each cell. */
  lay: (lift: (u: number, v: number) => number) => void
  /** The cells along the coast the sea would draw now, and the way out to sea from each. */
  shore: () => Array<{ at: Spot; out: Spot }>
}

/** A point or a direction of the bench, in heights from the middle. */
export type Spot = readonly [number, number]

export const along = (p: Spot, d: Spot, k: number): Spot => [
  p[0] + d[0] * k,
  p[1] + d[1] * k,
]
/** The direction a quarter turn from another. */
export const turn = (d: Spot): Spot => [-d[1], d[0]]
export const dot = (u: number, v: number, p: Spot, d: Spot) =>
  (u - p[0]) * d[0] + (v - p[1]) * d[1]

/** The bench's tools taking spots and reaches in heights of the map, the reaches `fine` times smaller. */
export function tools(b: Bench, fine = 1) {
  const p = (s: Spot) => b.at(s[0], s[1])
  const cells = (reach: number) => reach * fine * b.across
  return {
    hill: (s: Spot, lift: number, reach: number) =>
      hill(b.clay, p(s), lift, cells(reach)),
    /** A range from one spot to another; a trough, below 0. */
    ridge: (s: Spot, t: Spot, lift: number, reach: number) =>
      range(b.clay, p(s), p(t), lift, cells(reach)),
    /** A low land's spine, as a peninsula's or a neck's: no high mountains on it. */
    spine: (s: Spot, t: Spot, lift: number, reach: number) =>
      range(b.clay, p(s), p(t), lift, cells(reach), false),
    /** Rounds the masses, before the fine features are cut. */
    round: () => smooth(b.clay, 2, 0.5),
  }
}

/** So many of the coast's features, more on a larger map as its coast is longer: more, not larger. */
export const many = (b: Bench, low: number, high: number) =>
  Math.floor(b.rand(low, high + 1) * b.side)

/** A direction nearer the frame's length than its height: room for a long land. */
export function lengthwise(b: Bench): Spot {
  const d = b.heading()
  return Math.abs(d[0]) >= 0.7 ? d : turn(d)
}

/** The sea round the frame, deepening over so wide a band: the coast keeps off the edge, and does not follow it. */
export function rim(b: Bench, width: number) {
  b.lay((u, v) => {
    const edge = Math.min(0.5 - Math.abs(v), b.aspect / 2 - Math.abs(u))
    const k = edge < width ? (width - edge) / width : 0
    return -k * k * 2.4
  })
}

/** A dome round a middle, longer along one direction than across it. */
export function dome(
  b: Bench,
  middle: Spot,
  d: Spot,
  long: number,
  wide: number,
  lift: number,
) {
  const side = turn(d)
  b.lay((u, v) => {
    const a = dot(u, v, middle, d) / long
    const c = dot(u, v, middle, side) / wide
    return Math.max(-0.8, lift * (1 - a * a - c * c))
  })
}
