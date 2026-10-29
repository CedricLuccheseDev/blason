import { RULES, generateWorld, makeGrid } from '../../engine'
import type { Grid, MapSize, World } from '../../engine'

// The next game's land, made ahead while the player is still on the home
// page, so that the click on Play lands straight in the opening, as on
// OpenFront: the land and its tiles take about a second to make. The next
// public game's land is made ahead too, for its card (sketch.ts), and kept:
// when that game begins, its land is already made.

export type Land = { land: World; grid: Grid }
let prepared: Land | null = null
/** The last land made for a game to come, kept for that game. */
let coming: World | null = null

/** The land kept for that seed and size, if it is the one. */
const kept = (seed: string, size: MapSize) =>
  coming?.seed === seed && coming.size === size ? coming : null

function makeLand(seed: string, size: MapSize = 'standard'): Land {
  const land = kept(seed, size) ?? generateWorld(seed, { size })
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

/** The land of a game to come, for its seed and size: made once, and kept until another is asked for. */
export function landAhead(seed: string, size: MapSize): World {
  coming = kept(seed, size) ?? generateWorld(seed, { size })
  return coming
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
