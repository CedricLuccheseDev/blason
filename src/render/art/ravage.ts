import { flatten } from '../geometry'
import { hash } from '../pen'
import { TONE } from '../palette'
import type { Graphics } from 'pixi.js'
import type { Point } from '../../../engine'

// A border ravaged by war, as an old map shows a land put to the torch: the
// border inked again in red over a wash of red, broken here and there where
// the land was breached; on the side just taken, blots of char where the
// fields burnt; in each breach an ember still glowing. At the land's scale,
// in map units, and drawn from where each thing lies, so that a border
// traced again is ravaged the same way.

/** Out of a hundred points of the line, those where it is breached; the points a breach takes. */
const BREACH = 3
const GAP = 3
/** Out of a hundred, the points scorched on the taken side; a blot's size, and how far from the line it lies at most. */
const SCORCH = 16
const BLOT = 1
const REACH = 2.4
/** An ember's size. */
const EMBER = 0.5
/** The wash's width against the line's; the wash's strength and the char's. */
const GLOW = 3.2
const WASH = 0.2
const CHAR = 0.26

export type Ravage = {
  /** The whole line, for the wash; the pieces its breaches leave of it, for the red ink. */
  line: Array<number>
  pieces: Array<Array<number>>
  /** Each blot of char, as a polygon; each ember: where, and its phase. */
  blots: Array<Array<number>>
  embers: Array<[number, number, number]>
}

/** Across the line at one of its points, towards the side just taken: the land still held lies on the right of its course. */
function outward(line: Array<Point>, i: number): Point {
  const a = line[Math.max(0, i - 1)]
  const b = line[Math.min(line.length - 1, i + 1)]
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  return [(b[1] - a[1]) / d, -(b[0] - a[0]) / d]
}

/** A blot of char: seven points round a place, each pushed in or out. */
function blot(x: number, y: number): Array<number> {
  const size = BLOT * (0.6 + hash(x, y, 3))
  const turn = hash(x, y, 6) * Math.PI
  return Array.from({ length: 7 }, (_, k) => {
    const a = turn + (k * 2 * Math.PI) / 7
    const r = size * (0.65 + 0.7 * hash(x, y, 10 + k))
    return [x + Math.cos(a) * r, y + Math.sin(a) * r]
  }).flat()
}

/** A line along a border as war leaves it: where it is breached, where it burnt. */
export function ravage(line: Array<Point>): Ravage {
  const out: Ravage = { line: flatten(line), pieces: [], blots: [], embers: [] }
  let piece: Array<number> = []
  let gap = 0
  line.forEach(([x, y], i) => {
    const [nx, ny] = outward(line, i)
    if (hash(x, y, 1) * 100 < SCORCH) {
      const far = REACH * hash(x, y, 2)
      out.blots.push(blot(x + nx * far, y + ny * far))
    }
    const inner = i > 0 && i < line.length - 1
    if (gap === 0 && inner && hash(x, y, 4) * 100 < BREACH) {
      gap = GAP
      out.embers.push([x + nx * 0.4, y + ny * 0.4, hash(x, y, 5) * 2 * Math.PI])
    }
    if (gap === 0) piece.push(x, y)
    else {
      gap--
      if (piece.length >= 4) out.pieces.push(piece)
      piece = []
    }
  })
  if (piece.length >= 4) out.pieces.push(piece)
  return out
}

/** The ravaged border, as fresh as its fight: the wash, the char, the red ink, the embers flickering with the tick. */
export function drawRavage(
  g: Graphics,
  r: Ravage,
  fresh: number,
  width: number,
  tick: number,
) {
  g.poly(r.line, false).stroke({
    width: width * GLOW,
    color: TONE.fight,
    alpha: WASH * fresh,
    cap: 'round',
    join: 'round',
  })
  for (const b of r.blots) g.poly(b)
  if (r.blots.length > 0) g.fill({ color: TONE.char, alpha: CHAR * fresh })
  for (const piece of r.pieces) g.poly(piece, false)
  if (r.pieces.length > 0)
    g.stroke({ width, color: TONE.fight, alpha: fresh, join: 'round' })
  for (const [x, y, phase] of r.embers) {
    const glow = 0.55 + 0.45 * Math.sin(tick * 0.8 + phase)
    g.circle(x, y, EMBER).fill({ color: TONE.ember, alpha: fresh * glow })
  }
}
