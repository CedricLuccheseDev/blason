import { RULES, generateWorld, makeGrid } from '../../engine'
import type { Grid, MapSize, World } from '../../engine'

// The next game's land, made ahead while the player is still on the home
// page, so that the click on Play lands straight in the opening, as on
// OpenFront: the land and its tiles take about a second to make.

export type Land = { land: World; grid: Grid }
let prepared: Land | null = null

function makeLand(seed: string, size: MapSize = 'standard'): Land {
  const land = generateWorld(seed, { size })
  const grid = makeGrid(land.map, land.width, land.height, RULES.tileSize)
  return { land, grid }
}

export function randomSeed(): string {
  return crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
}

/** Makes the next game's land ahead of time; cheap to call twice. */
export function prepareGame(): void {
  prepared ??= makeLand(randomSeed())
}

/** The land for a seed asked for, or the one made ahead (standard), or a new one. */
export function takeLand(
  seed: string | null,
  size: MapSize = 'standard',
): Land {
  if (seed || size !== 'standard') return makeLand(seed ?? randomSeed(), size)
  const made = prepared ?? makeLand(randomSeed())
  prepared = null
  return made
}
