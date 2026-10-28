// The sizes of the things on the table, in centimetres, and where each one
// lies on a desk's table and on a phone's: one scene, two layouts.

export const BOARD = { w: 56, d: 38, h: 1.2, mapW: 50, mapD: 32.8 }
export const LID = { w: 30, d: 21, h: 3.6 }
export const CARD = { w: 11, h: 15.5, r: 0.75, t: 0.09 }
export const PAGE = { w: 15, d: 21 }
export const TAG = { w: 15, d: 5.4 }
export const RIBBON = { w: 22, d: 6.2, notch: 1.4 }
export const SEAL_R = 5.2
/** The height of the candle's wax. */
export const CANDLE_H = 8.5

/** The map's canvas on the board, in pixels: the board's map in proportion. */
export const MAP_PX = { w: 1280, h: 840 }

/** A place on the table: x, z, and a turn in degrees. */
export type Spot = [number, number, number?]

export type Layout = {
  cam: {
    fov: number
    pos: [number, number, number]
    look: [number, number, number]
  }
  board: Spot
  lid: Spot
  candle: Spot
  book: Spot | null
  purse: Spot | null
  coins: Spot | null
  pawn: Spot
  tag: Spot | null
  cards: { at: [number, number]; step: number; turn: number; k: number }
  seal: { at: [number, number]; k: number }
  ribbon: Spot
  die: Spot
  /** Where a turned card is held: its place on screen (x, y in -1..1) and its share of the height. */
  open: { ndc: [number, number]; frac: number }
  /** Where the journal is held to be read, likewise; none on a phone. */
  read: { ndc: [number, number]; frac: number } | null
  /** The candle's power. */
  light: number
  /** The width the words on the table were drawn for, in pixels. */
  width: number
}

export type Variant = 'desk' | 'phone'

export const LAYOUTS: Record<Variant, Layout> = {
  desk: {
    cam: { fov: 30, pos: [0, 106, 102], look: [1, 0, 3] },
    board: [0, -14],
    lid: [-47, -4, 14],
    candle: [-22, -34],
    book: [40, 15, -11],
    purse: [46, -26],
    coins: [37, -11],
    pawn: [-40, 19],
    tag: [-41, 37, 6],
    cards: { at: [-11, 31], step: 12.6, turn: 5, k: 1 },
    seal: { at: [19, 26], k: 1 },
    ribbon: [19, 35, -3],
    die: [44, 36],
    open: { ndc: [-0.2, 0.1], frac: 0.47 },
    read: { ndc: [0.04, 0.06], frac: 0.66 },
    light: 9000,
    width: 1440,
  },
  phone: {
    cam: { fov: 34, pos: [0, 172, 108], look: [0, 0, 7] },
    board: [0, -11],
    lid: [0, -45, 3],
    candle: [-30, -50],
    book: null,
    purse: null,
    coins: null,
    pawn: [21, 19],
    tag: null,
    cards: { at: [0, 49], step: 14.8, turn: 6, k: 1.22 },
    seal: { at: [0, 19], k: 1.25 },
    ribbon: [0, 29, 0],
    die: [-21, 21],
    open: { ndc: [0, 0.37], frac: 0.74 },
    read: null,
    light: 11000,
    width: 390,
  },
}

/** The layout a frame of this shape takes: the phone's when it stands upright and narrow. */
export function variantOf(width: number, height: number): Variant {
  return width < 700 && height > width ? 'phone' : 'desk'
}
