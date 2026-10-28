import { hash } from '../pen'
import { FOREST, HILLS, MOUNTAINS, PLAIN } from './terrain'
import type { Terrain } from './terrain'
import type { Weights } from './weights'
import type { Grid } from '../../../engine'

// What stands on the ground over a stretch of the map, from back to front:
// in the woods a grove at mid distance and every tree up close, broadleaf
// trees and a fir now and then, four places to a tile; on the hills a hill
// every other tile on staggered rows, on the mountains taller and steeper
// ones in close ranks; on the plain a lone tree here and
// there, and up close tufts of grass. Each as dense as its tile's weight
// allows. In map units, a tile 4 across as the boards'.

export type Ornament =
  | {
      kind: 'tree' | 'fir'
      x: number
      y: number
      r: number
      w: number
      h: number
    }
  | {
      kind: 'hill'
      x: number
      y: number
      bw: number
      hh: number
      w: number
      h: number
    }
  | { kind: 'tuft'; x: number; y: number; w: number }

/** The tiles of a box, in tiles, with the margin of what leans into it from around. */
export type Span = { c0: number; c1: number; r0: number; r1: number }

function woods(
  out: Array<Ornament>,
  c: number,
  r: number,
  w: number,
  k: number,
  detail: number,
) {
  for (let sub = 0; sub < 4; sub++) {
    const [sx, sy] = [c * 2 + (sub % 2), r * 2 + (sub >> 1)]
    if (hash(sx, sy, 11) > 0.85 * w) continue
    out.push({
      kind: hash(sx, sy, 12) < 0.3 ? 'fir' : 'tree',
      x: (sx + 0.5 + (hash(sx, sy, 14) - 0.5) * 0.7) * (k / 2),
      y: (sy + 0.5 + (hash(sx, sy, 15) - 0.5) * 0.6) * (k / 2) + 1.4 * (k / 4),
      r: ((detail === 2 ? 1.25 : 1.45) + 0.55 * hash(sx, sy, 16)) * (k / 4),
      w,
      h: hash(sx, sy, 17),
    })
  }
}

function hills(
  out: Array<Ornament>,
  c: number,
  r: number,
  w: number,
  k: number,
) {
  const lane = Math.floor(r / 2) % 2
  if (r % 2 !== 0 || (c + lane) % 2 !== 0 || hash(c, r, 21) > 0.85 * w) return
  const h = hash(c, r, 23)
  const bw = (1.05 + 0.75 * h) * k
  out.push({
    kind: 'hill',
    x: (c + 1 + (hash(c, r, 22) - 0.5) * 1.1) * k,
    y: (r + 1.5 + (hash(c, r, 25) - 0.5) * 0.8) * k,
    bw,
    hh: bw * (0.42 + 0.22 * hash(c, r, 24)),
    w,
    h,
  })
}

/** On the mountains, hills taller and steeper, crowded in ranks, one a tile and a half. */
function mountains(
  out: Array<Ornament>,
  c: number,
  r: number,
  w: number,
  k: number,
) {
  if (r % 2 !== 0 || (c + Math.floor(r / 2)) % 2 !== 0) return
  if (hash(c, r, 41) > 0.95 * w) return
  const h = hash(c, r, 43)
  const bw = (1.5 + 0.8 * h) * k
  out.push({
    kind: 'hill',
    x: (c + 1 + (hash(c, r, 42) - 0.5) * 0.8) * k,
    y: (r + 1.5 + (hash(c, r, 45) - 0.5) * 0.6) * k,
    bw,
    hh: bw * (0.75 + 0.25 * hash(c, r, 44)),
    w,
    h,
  })
}

function plain(
  out: Array<Ornament>,
  c: number,
  r: number,
  w: number,
  k: number,
  detail: number,
) {
  if (hash(c, r, 31) < 0.03 * w)
    out.push({
      kind: 'tree',
      x: (c + 0.5) * k,
      y: (r + 0.7) * k,
      r: 1.4 * (k / 4),
      w,
      h: hash(c, r, 32),
    })
  else if (detail === 2 && hash(c, r, 33) < 0.42 * w)
    out.push({
      kind: 'tuft',
      x: (c + hash(c, r, 35)) * k,
      y: (r + hash(c, r, 34)) * k,
      w,
    })
}

/** The ornaments over a span of tiles, sorted back to front. */
export function ornaments(
  grid: Grid,
  terrain: Terrain,
  weights: Weights,
  span: Span,
  detail: 1 | 2,
): Array<Ornament> {
  const out: Array<Ornament> = []
  const k = grid.size
  for (
    let r = Math.max(0, span.r0);
    r <= Math.min(grid.height - 1, span.r1);
    r++
  )
    for (
      let c = Math.max(0, span.c0);
      c <= Math.min(grid.width - 1, span.c1);
      c++
    ) {
      const t = r * grid.width + c
      const w = weights.deco[t]
      if (w <= 0) continue
      const b = terrain.biome[t]
      if (b === FOREST) woods(out, c, r, w, k, detail)
      else if (b === HILLS) hills(out, c, r, w, k)
      else if (b === MOUNTAINS) mountains(out, c, r, w, k)
      else if (b === PLAIN) plain(out, c, r, w, k, detail)
    }
  return out.sort((a, b) => a.y - b.y || a.x - b.x)
}
