import { RULES, makeGrid, worldOf } from '../../engine'
import type { Grid, Land, World } from '../../engine'
import type { GameHooks } from './handle'

// The next game's land, made ahead while the player is still on the home
// page, so that the click on Play lands straight in the opening, as on
// OpenFront: the land and its tiles take about a second to make. The next
// public game's land is made ahead too, for its card (sketch.ts), and kept:
// when that game begins, its land is already made.

export type Made = { land: World; grid: Grid }

/** The invented land at the standard size, a game's unless another is asked for. */
export const STANDARD: Land = { kind: 'drawn', size: 'standard' }

let prepared: Made | null = null
/** The last land made for a game to come, kept for that game. */
let coming: World | null = null

/** Whether a world made is the land asked for, from that seed. */
const isOf = (world: World, seed: string, land: Land) =>
  world.seed === seed &&
  (land.kind === 'real'
    ? world.atlas === land.map
    : !world.atlas && world.size === land.size)

/** The land kept for that seed, if it is the one. */
const kept = (seed: string, land: Land) =>
  coming && isOf(coming, seed, land) ? coming : null

function makeLand(seed: string, land: Land = STANDARD): Made {
  const world = kept(seed, land) ?? worldOf(seed, land)
  const grid = makeGrid(
    world.map,
    world.width,
    world.height,
    RULES.tileSize,
    world.rivers,
  )
  return { land: world, grid }
}

export function randomSeed(): string {
  return crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
}

/** Makes the next game's land ahead of time; cheap to call twice. */
export function prepareGame(): void {
  prepared ??= makeLand(randomSeed())
}

/** The land of a game to come, for its seed: made once, and kept until another is asked for. */
export function landAhead(seed: string, land: Land): World {
  coming = kept(seed, land) ?? worldOf(seed, land)
  return coming
}

/** The land for a seed asked for, or the one made ahead (standard), or a new one. */
export function takeLand(seed: string | null, land: Land = STANDARD): Made {
  const standard = land.kind === 'drawn' && land.size === 'standard'
  if (seed || !standard) return makeLand(seed ?? randomSeed(), land)
  const made = prepared ?? makeLand(randomSeed())
  prepared = null
  return made
}

/** The land a game is played on: online the relay's, a save's own, else the one asked or the standard. */
export function landAsked(
  seed: string | null,
  { online, save, land }: Pick<GameHooks, 'online' | 'save' | 'land'>,
): { seed: string | null; land: Land } {
  if (online) return online.setup
  if (save) return { seed: save.seed, land: { kind: 'drawn', size: save.size } }
  return { seed, land: land ?? STANDARD }
}
