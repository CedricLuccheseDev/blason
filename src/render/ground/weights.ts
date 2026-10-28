import type { Terrain } from './terrain'
import type { Grid } from '../../../engine'

// How much decoration each tile may carry, so that what the game must make
// read stays above it: none on a border's tile, thinning over a tile and a
// half from it; a clearing of three tiles round each work and village;
// none on a road; none at the water's edge, thinning inland. Read again
// with the lands, a few times a second.

export type Weights = {
  /** From 0 (bare) to 1 (as much as the ground holds). */
  deco: Float32Array
  /** Tiles from the nearest border's tile: 0 on it, 1 beside it, 2 farther. */
  border: Uint8Array
}

const sat = (v: number) => Math.max(0, Math.min(1, v))

/** Whether a land tile touches, up, down, left or right, land of another key. */
function onBorder(grid: Grid, keys: Int32Array, t: number): boolean {
  const { width, height, land } = grid
  const [c, r] = [t % width, Math.floor(t / width)]
  return (
    (c > 0 && land[t - 1] && keys[t - 1] !== keys[t]) ||
    (c < width - 1 && land[t + 1] && keys[t + 1] !== keys[t]) ||
    (r > 0 && land[t - width] && keys[t - width] !== keys[t]) ||
    (r < height - 1 && land[t + width] && keys[t + width] !== keys[t])
  )
}

/** Tiles from the borders, counted no farther than two. */
function borders(grid: Grid, keys: Int32Array): Uint8Array {
  const { width, height, land } = grid
  const d = new Uint8Array(land.length).fill(2)
  for (let t = 0; t < land.length; t++) {
    if (!land[t] || !onBorder(grid, keys, t)) continue
    d[t] = 0
    const [c, r] = [t % width, Math.floor(t / width)]
    for (let y = Math.max(0, r - 1); y <= Math.min(height - 1, r + 1); y++)
      for (let x = Math.max(0, c - 1); x <= Math.min(width - 1, c + 1); x++) {
        const n = y * width + x
        if (d[n] > 1) d[n] = 1
      }
  }
  return d
}

/** The clearings round the sites, 0 at a site, 1 from four and a half tiles. */
function clearings(grid: Grid, sites: Iterable<number>): Float32Array {
  const { width, height } = grid
  const open = new Float32Array(grid.land.length).fill(1)
  for (const s of sites) {
    const [sc, sr] = [s % width, Math.floor(s / width)]
    for (let y = Math.max(0, sr - 5); y <= Math.min(height - 1, sr + 5); y++)
      for (let x = Math.max(0, sc - 5); x <= Math.min(width - 1, sc + 5); x++) {
        const t = y * width + x
        open[t] = Math.min(
          open[t],
          sat((Math.hypot(x - sc, y - sr) - 2.8) / 1.6),
        )
      }
  }
  return open
}

export function weigh(
  grid: Grid,
  keys: Int32Array,
  terrain: Terrain,
  sites: Iterable<number>,
  roads: Uint8Array,
): Weights {
  const border = borders(grid, keys)
  const open = clearings(grid, sites)
  const deco = new Float32Array(grid.land.length)
  for (let t = 0; t < deco.length; t++) {
    if (!grid.land[t] || roads[t]) continue
    const edge = sat((border[t] - 0.5) / 1.5)
    const coast = sat((terrain.shore[t] + 0.8) / 1.2)
    deco[t] = edge * open[t] * coast
  }
  return { deco, border }
}
