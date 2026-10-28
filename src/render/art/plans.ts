import type { Pt } from './ink'

// Where each piece of a work stands on its ground, in local units: shared
// by the drawing of the work and by the shadows it casts (art/shadows.ts),
// so that a shadow always falls from what is drawn.

/** A house: its gable's foot centred at (x, y), its width, its walls' height, its depth going back. */
export type HousePlan = readonly [number, number, number, number, number]

/** How a depth goes back into the drawing: to the right and up. */
export const back = (d: number): Pt => [d * 0.62, -d * 0.42]

/** A house's roof ridge over its walls: its gable is so steep. */
export const RIDGE = 0.62

export const VILLAGE = {
  houses: [
    [-5.6, -2.4, 3.0, 2.0, 3.0],
    [4.6, -3.0, 2.8, 1.9, 2.6],
    [-1.0, -3.6, 2.6, 1.8, 2.6],
    [-7.4, 1.4, 3.2, 2.1, 3.0],
    [-3.2, 2.0, 3.4, 2.3, 3.2],
    [3.0, 1.2, 3.1, 2.1, 2.9],
    [6.8, 2.8, 2.8, 1.9, 2.6],
  ] as ReadonlyArray<HousePlan>,
  church: [0.6, -0.6] as Pt,
  mill: [11.2, 1.2] as Pt,
  /** The churchyard's tree: its foot and its crown. */
  yew: [-9.8, -1.6, 1.5] as const,
}

/** The church's parts round its tower's foot at (x, y). */
export const CHURCH = {
  nave: (x: number, y: number): HousePlan => [x + 1.6, y - 0.4, 3.4, 2.6, 6.5],
  tower: { w: 2.4, h: 6.2, back: [1.3, -0.85] as Pt, spire: 4.6 },
}

/** The windmill's tower: its foot's half width, its height, its cap's top over the foot. */
export const MILL = { half: 1.5, top: 1, h: 5.2, cap: 7 }

export const CASTLE = {
  keep: { x: -0.6, y: 1.2, w: 4.6, h: 9.4, back: [1.8, -1.2] as Pt },
  /** The curtain's corners, back left and right, front left and right, and its height. */
  corners: {
    BL: [-7, -1.2] as Pt,
    BR: [7, -1.2] as Pt,
    FL: [-8, 4.6] as Pt,
    FR: [8, 4.6] as Pt,
  },
  wall: 3.2,
  /** The towers at the back and at the front: their radius and height. */
  backTower: [1.4, 4.6] as const,
  frontTower: [1.75, 5.4] as const,
  /** A tower's cone over its drum, by its radius. */
  cone: 2.3,
  gate: { half: 2.2, front: 5, h: 5 },
}

/** The market's stalls (foot's middle, width), its heap of gold (foot, radius) and its crates. */
export const MARKET = {
  stalls: [
    [-5.4, -0.6, 4.6],
    [5.2, -1.4, 4.2],
    [6.4, 5.4, 4.0],
  ] as ReadonlyArray<readonly [number, number, number]>,
  heap: [-0.2, 2.6, 3] as const,
  crates: [-8.6, 5.2] as Pt,
}

/** A stall: how its counter goes back, how high it is, how high its awning. */
export const STALL = { back: [1.12, -0.72] as Pt, counter: 1.5, awning: 3.8 }
