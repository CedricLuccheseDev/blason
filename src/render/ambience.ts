import { smoothstep } from './ease'
import { FOREST, HILLS, MOUNTAINS } from './ground/terrain'
import type { Hearing } from '../audio/beds'
import type { Box } from './camera'
import type { Terrain } from './ground/terrain'
import type { GameState } from '../../engine'

// The beds of the land as the screen has them (Concept, « La carte qu'on
// entend »), read once a second: the screen sampled on a grid of points,
// each bed as loud as the share it holds. From afar, only the wind over the
// land and the sea, low; coming closer, the waves on a coast, the birds in
// a wood, the life of the villages on screen, and the highs come back
// (audio/beds.ts). Read from the drawn ground (ground/terrain.ts), which the
// simulation knows nothing of.

/** The points sampled across the screen, by columns and rows. */
const COLUMNS = 16
const ROWS = 10
/** The pixels a tile covers over which the land comes close, from afar to up close (as ground/detail.ts's levels). */
const CLOSE = [9, 26] as const
/** Villages on screen for a village's life at its fullest. */
const HAMLETS = 3
/** Tiles from the shore within which the sea is heard whole: the waves break there. */
const SURF = 3

/** How close the camera is, 0 (far) to 1 (up close), by the pixels a tile covers. */
const nearOf = (perTile: number) =>
  smoothstep(CLOSE[0], CLOSE[1], perTile)

/** The tile under a point of the map, in map units; -1 off it. */
function tileAt(grid: GameState['grid'], x: number, y: number) {
  const col = Math.floor(x / grid.size)
  const row = Math.floor(y / grid.size)
  const off = col < 0 || row < 0 || col >= grid.width || row >= grid.height
  return off ? -1 : row * grid.width + col
}

/** The screen's points, counted: on the sea (a coast whole, open water less), on land, in a wood, on the heights. */
function sample(state: GameState, terrain: Terrain, view: Box) {
  const { grid } = state
  const count = { sea: 0, land: 0, wood: 0, high: 0 }
  const w = view.right - view.left
  const h = view.bottom - view.top
  for (let i = 0; i < COLUMNS * ROWS; i++) {
    const x = view.left + (((i % COLUMNS) + 0.5) / COLUMNS) * w
    const y = view.top + ((Math.floor(i / COLUMNS) + 0.5) / ROWS) * h
    const tile = tileAt(grid, x, y)
    if (tile < 0) continue
    if (!grid.land[tile]) {
      count.sea += terrain.shore[tile] <= SURF ? 1 : 0.4
      continue
    }
    count.land += 1
    const biome = terrain.biome[tile]
    if (biome === FOREST) count.wood += 1
    if (biome === HILLS || biome === MOUNTAINS) count.high += 1
  }
  return count
}

export function bedsOf(
  state: GameState,
  terrain: Terrain,
  view: Box,
  perTile: number,
): Hearing {
  const { grid } = state
  const { sea, land, wood, high } = sample(state, terrain, view)
  const n = COLUMNS * ROWS
  const villages = state.works.filter(
    (w) =>
      w.work === 'village' &&
      within(
        view,
        (w.tile % grid.width) + 0.5,
        Math.floor(w.tile / grid.width) + 0.5,
        grid.size,
      ),
  ).length
  const near = nearOf(perTile)
  return {
    near,
    levels: {
      sea: Math.min(1, (sea / n) * 2) * (0.4 + 0.6 * near),
      // The far bed: some always over the land, more on the heights, a little lower up close.
      wind: Math.min(1, (land / n) * 0.5 + (high / n) * 1.5) * (1 - 0.4 * near),
      wood: Math.min(1, (wood / n) * 2.5) * near,
      village: Math.min(1, villages / HAMLETS) * near,
    },
  }
}

/** Whether a tile's middle, in tiles, lies in a view, in map units. */
function within(view: Box, x: number, y: number, size: number) {
  return (
    x * size >= view.left &&
    x * size <= view.right &&
    y * size >= view.top &&
    y * size <= view.bottom
  )
}
