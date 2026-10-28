import { hash } from '../pen'
import { PLAIN } from './terrain'
import type { Terrain } from './terrain'
import type { Weights } from './weights'
import type { Grid } from '../../../engine'

// The fields round a lord's village, from mid distance: patches of crops
// laid on a slanted lattice between three and some six tiles out, each a
// little turned and stretched, furrowed one way or the other; only on the
// open plain of the village's own lord, never on a border, a road or the
// shore. In map units.

type P = [number, number]

export type Field = {
  x: number
  y: number
  corners: Array<P>
  /** Along the furrows, and across them. */
  dir: P
  across: P
  half: number
  /** Wheat, greens or tilled earth. */
  crop: number
}

/** The lattice's step, in map units. */
const STEP = 6.4

/** A patch centred at (cx, cy) on a lattice turned along u. */
function patch(cx: number, cy: number, [ux, uy]: P): Field {
  const h = hash(cx, cy, 8)
  const half = (STEP / 2 - 0.35) * (0.72 + 0.28 * hash(cx, cy, 10))
  const turn = (hash(cx, cy, 11) - 0.5) * 0.35
  const [cu, su] = [Math.cos(turn), Math.sin(turn)]
  const a: P = [ux * cu - uy * su, ux * su + uy * cu]
  const b: P = [-a[1], a[0]]
  const stretch = 0.8 + 0.4 * hash(cx, cy, 12)
  const corner = (si: number, sj: number): P => [
    cx + (a[0] * si * stretch + b[0] * sj) * half,
    cy + (a[1] * si * stretch + b[1] * sj) * half,
  ]
  const along = h < 0.57
  return {
    x: cx,
    y: cy,
    corners: [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)],
    dir: along ? a : b,
    across: along ? b : a,
    half,
    crop: Math.floor(hash(cx, cy, 9) * 3),
  }
}

type Under = {
  grid: Grid
  keys: Int32Array
  terrain: Terrain
  weights: Weights
  roads: Uint8Array
}

/** Whether a field may lie at a point: on the open plain of its lord, off a border and a road. */
function tillable(x: number, y: number, owner: number, under: Under) {
  const { grid, keys, terrain, weights, roads } = under
  const [c, r] = [Math.floor(x / grid.size), Math.floor(y / grid.size)]
  if (c < 0 || r < 0 || c >= grid.width || r >= grid.height) return false
  const t = r * grid.width + c
  const open = grid.land[t] && terrain.biome[t] === PLAIN && !roads[t]
  return open && keys[t] === owner && weights.border[t] >= 1
}

/** The fields of the village on a tile, its lord's. */
export function fieldsOf(
  village: number,
  owner: number,
  under: Under,
): Array<Field> {
  const { width, size } = under.grid
  const [vc, vr] = [village % width, Math.floor(village / width)]
  const [wx, wy] = [(vc + 0.5) * size, (vr + 0.5) * size]
  const angle = hash(vc, vr, 3) * Math.PI
  const u: P = [Math.cos(angle), Math.sin(angle)]
  const out: Array<Field> = []
  for (let i = -6; i <= 6; i++)
    for (let j = -6; j <= 6; j++) {
      const cx = wx + (u[0] * i - u[1] * j) * STEP
      const cy = wy + (u[1] * i + u[0] * j) * STEP
      const d = Math.hypot(cx - wx, cy - wy) / size
      if (d < 3.1 || d > 5.6 + hash(i, j, 5) * 1.6) continue
      if (tillable(cx, cy, owner, under) && hash(cx, cy, 8) >= 0.3)
        out.push(patch(cx, cy, u))
    }
  return out
}

/** How far a village's fields reach from its middle, in tiles. */
export const FIELDS_REACH = 8
