import { drawInt } from './numbers'
import type { GameState, Grid } from './types'

// The land's roughness (« la rugosité des terres », Concept, 29/10): each
// tile a little roughness, fixed, drawn from the map's seed, as an unseen
// relief, added to the order an army takes tiles in (war.ts), so that two
// fronts meet in a ragged line, as a coast, not a straight one. Smooth: drawn
// on a mesh of a few tiles and blended between its knots, so that it bends a
// front rather than fraying it. Each lord reads it shifted by his own
// offset, so that two fronts slowed on one tile do not cancel. Whole numbers
// only, as the rest of the engine.

/** The mesh's knots, and each lord's offset over it, in tiles. */
type Mesh = {
  cols: number
  rows: number
  knots: Uint8Array
  dx: Int32Array
  dy: Int32Array
}

/** The mesh of each land, drawn once: its knots' roughness. */
const meshes = new WeakMap<Grid, Mesh>()

function meshOf(state: GameState): Mesh {
  const known = meshes.get(state.grid)
  if (known) return known
  const { roughness, roughMesh } = state.rules
  const cols = Math.ceil(state.grid.width / roughMesh) + 1
  const rows = Math.ceil(state.grid.height / roughMesh) + 1
  const knots = new Uint8Array(cols * rows)
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++)
      knots[j * cols + i] = drawInt(state.seed, roughness + 1, 'rough', i, j)
  const lords = state.players.length
  const dx = new Int32Array(lords)
  const dy = new Int32Array(lords)
  for (let lord = 0; lord < lords; lord++) {
    dx[lord] = drawInt(state.seed, cols * roughMesh, 'rough-x', lord)
    dy[lord] = drawInt(state.seed, rows * roughMesh, 'rough-y', lord)
  }
  const mesh = { cols, rows, knots, dx, dy }
  meshes.set(state.grid, mesh)
  return mesh
}

/** A tile's roughness for a lord's armies, in tenths of a tile, from 0 to the rules' roughness. */
export function roughAt(state: GameState, lord: number, tile: number): number {
  const { cols, rows, knots, dx, dy } = meshOf(state)
  const m = state.rules.roughMesh
  const w = state.grid.width
  const x = (tile % w) + dx[lord]
  const y = Math.floor(tile / w) + dy[lord]
  const [i, j] = [Math.floor(x / m) % cols, Math.floor(y / m) % rows]
  const [i2, j2] = [(i + 1) % cols, (j + 1) % rows]
  const [fx, fy] = [x % m, y % m]
  const blend =
    knots[j * cols + i] * (m - fx) * (m - fy) +
    knots[j * cols + i2] * fx * (m - fy) +
    knots[j2 * cols + i] * (m - fx) * fy +
    knots[j2 * cols + i2] * fx * fy
  return Math.floor(blend / (m * m))
}
