import { drawInt } from '../numbers'
import { DIRECTIONS, makeNoise } from './noise'

// The shape of the land, drawn by the seed among a few families and warped
// by noise, so that no two maps look alike: a continent the sea rings round,
// a coast on any side, an inland sea, two lands joined by a neck, a strip
// between two seas, a land the fjords cut into. The sea always takes the
// lowest ground; how much of it is the shape's to say.

export type ShapeKind =
  'continent' | 'coast' | 'inland' | 'isthmus' | 'strip' | 'fjords'

/** Higher is drier; the sea level is set afterwards, by share of the cells. */
export type Relief = (x: number, y: number) => number

export type Shape = {
  kind: ShapeKind
  /** Share of the cells under the sea, in thousandths. */
  seaShare: number
}

const KINDS: ReadonlyArray<ShapeKind> = [
  'continent',
  'coast',
  'inland',
  'isthmus',
  'strip',
  'fjords',
]

/** For each family, the least and the most of sea it takes, in thousandths. */
const SEA: Readonly<Record<ShapeKind, readonly [number, number]>> = {
  continent: [380, 460],
  coast: [220, 340],
  inland: [170, 250],
  isthmus: [420, 500],
  strip: [330, 410],
  fjords: [260, 340],
}

/** How strongly the noise bends each family's lines. */
const ROUGH: Readonly<Record<ShapeKind, number>> = {
  continent: 2,
  coast: 2,
  inland: 1.6,
  isthmus: 1.2,
  strip: 1.6,
  fjords: 1.2,
}

export function pickShape(seed: string): Shape {
  const kind = KINDS[drawInt(seed, KINDS.length, 'shape')]
  const [low, high] = SEA[kind]
  return { kind, seaShare: low + drawInt(seed, high - low + 1, 'sea share') }
}

/** A value from the seed, evenly spread in [−1, 1]. */
function spread(seed: string, key: string): number {
  return drawInt(seed, 2001, 'shape', key) / 1000 - 1
}

/** 1 at the centre of an ellipse, 0 on its rim, below 0 outside. */
function dome(x: number, y: number, rx: number, ry: number): number {
  return 1 - (x * x) / (rx * rx) - (y * y) / (ry * ry)
}

/**
 * The family's lines, before the noise: x and y are measured from the middle
 * of the map in heights, so a circle stays a circle.
 */
function base(seed: string, kind: ShapeKind, aspect: number): Relief {
  const [dx, dy] = DIRECTIONS[drawInt(seed, DIRECTIONS.length, 'axis')]
  const ox = spread(seed, 'ox') * 0.12 * aspect
  const oy = spread(seed, 'oy') * 0.08
  switch (kind) {
    case 'continent':
      return (x, y) => dome(x - ox, y - oy, 0.55 * aspect, 0.42)
    case 'coast':
      return (x, y) => -(x * dx + y * dy) * 2.2
    case 'inland':
      return (x, y) => -0.45 * dome(x - ox, y - oy, 0.34 * aspect, 0.24)
    case 'isthmus':
      return isthmus(dx, dy, aspect)
    case 'strip':
      return (x, y) => 0.3 - Math.abs((x - ox) * dy - (y - oy) * dx) * 2
    case 'fjords':
      return (x, y) => 0.5 - Math.max(Math.abs(x) / aspect, Math.abs(y) * 2)
  }
}

/** Two lands either side of the middle, and a narrow neck between them. */
function isthmus(dx: number, dy: number, aspect: number): Relief {
  const reach = 0.22 + 0.2 * Math.abs(dx) * aspect
  const r = 0.34
  return (x, y) => {
    const along = x * dx + y * dy
    const across = x * dy - y * dx
    const sideA = dome(along - reach, across, r, r)
    const sideB = dome(along + reach, across, r, r)
    const neck = Math.abs(along) < reach ? 0.6 - (across * across) / 0.0064 : -1
    return Math.max(sideA, sideB, neck)
  }
}

/**
 * A few gulfs and capes thrown on the map, the same for every family: a bay
 * bitten out of a coast, a headland pushed into the sea, a lake grown into
 * an inner sea.
 */
function landmarks(seed: string, aspect: number): Relief {
  const count = 2 + drawInt(seed, 3, 'landmarks')
  const marks = Array.from({ length: count }, (_, i) => ({
    x: spread(seed, `mark x ${i}`) * 0.8 * aspect,
    y: spread(seed, `mark y ${i}`) * 0.45,
    r: 0.08 + drawInt(seed, 120, 'mark r', i) / 1000,
    lift: (drawInt(seed, 2, 'mark sign', i) * 2 - 1) * 1.1,
  }))
  return (x, y) =>
    marks.reduce(
      (sum, m) => sum + m.lift * Math.max(0, dome(x - m.x, y - m.y, m.r, m.r)),
      0,
    )
}

/**
 * The relief of a map of this size: the family's lines, bent by a warp of
 * the ground and roughened by noise. The fjords add narrow valleys, which
 * the sea fills from the edges.
 */
export function makeRelief(
  seed: string,
  shape: Shape,
  width: number,
  height: number,
): Relief {
  const aspect = width / height
  const lines = base(seed, shape.kind, aspect)
  const marks = landmarks(seed, aspect)
  const noise = makeNoise(`${seed}|relief`)
  const warpX = makeNoise(`${seed}|warp x`)
  const warpY = makeNoise(`${seed}|warp y`)
  const valleys = makeNoise(`${seed}|valleys`)
  const ox = drawInt(seed, 100000, 'ox') / 1000
  const oy = drawInt(seed, 100000, 'oy') / 1000
  const rough = ROUGH[shape.kind]
  return (px, py) => {
    const x0 = (px - width / 2) / height
    const y0 = (py - height / 2) / height
    const x = x0 + 0.26 * warpX(ox + x0 * 1.6, oy + y0 * 1.6)
    const y = y0 + 0.26 * warpY(oy + x0 * 1.6, ox + y0 * 1.6)
    const ground =
      lines(x, y) + rough * noise(ox + x * 2, oy + y * 2) + marks(x, y)
    if (shape.kind !== 'fjords') return ground
    const valley = Math.abs(valleys(ox + x * 3.2, oy + y * 3.2))
    return ground + Math.min(1, valley * 6) - 0.5
  }
}
