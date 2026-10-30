import { smoothstep } from './ease'
import { FOREST, HILLS, MOUNTAINS } from './ground/terrain'
import { siteOf } from './marks'
import type { Bed, Hearing } from '../audio/beds'
import type { Box } from './camera'
import type { Terrain } from './ground/terrain'
import type { GameState, Scar, Work } from '../../engine'

// The beds of the land as the screen has them (Concept, « La carte qu'on
// entend »), read once a second: each bed as loud as what makes it holds of
// the screen, and from the side it lies on. The ground sampled on a grid of
// points (the sea, the woods, the heights where the wind blows), the rivers
// by their courses, and every element of the game by where it stands (« Je
// veux que chaque élément du jeu a son son »): each work its life, the
// caravans on the roads, the armies marching or fighting, the lands burnt
// or risen. From afar only the wind and the sea, low; the rest comes as the
// camera does. Typed on the engine's lists, so that a work or a scar more
// does not compile without its bed.

/** The bed of each work, standing or rising. */
const WORKS: Record<Work, Bed> = {
  village: 'village',
  market: 'market',
  castle: 'castle',
}
/** The bed of each scar a coup leaves. */
const SCARS: Record<Scar['kind'], Bed> = { rebels: 'riot', ash: 'fire' }

/** How many of each make a bed sound at its fullest; one less loud. */
const FULL: Partial<Record<Bed, number>> = {
  village: 3,
  market: 2,
  castle: 2,
  caravan: 3,
  march: 3,
  battle: 2,
  fire: 2,
  riot: 2,
}
/** Every bed, for the tallies. */
const BED_LIST: ReadonlyArray<Bed> = [
  'sea',
  'wind',
  'river',
  'wood',
  'village',
  'market',
  'castle',
  'caravan',
  'march',
  'battle',
  'fire',
  'riot',
]
/** The points sampled across the screen, by columns and rows. */
const COLUMNS = 16
const ROWS = 10
/** The pixels a tile covers over which the land comes close (ground/detail.ts's levels), and over which its life is heard (as spectacle.ts's world). */
const CLOSE = [9, 26] as const
const HEARD = [5, 14] as const
/** Tiles from the shore within which the sea is heard whole: the waves break there. */
const SURF = 3
/** River points on screen for a river heard at its fullest. */
const STREAM = 24
/** How far a bed at the screen's edge leans to its side, 0 to 1. */
const LEAN = 0.8

/** The rivers' courses, in map units. */
export type Rivers = ReadonlyArray<ReadonlyArray<readonly [number, number]>>

/** So much of a bed, and the sum of where across the screen, -1 to 1. */
type Tally = { n: number; across: number }
type Tallies = Record<Bed, Tally>

/** Where a point of the map lies across a view, -1 (left) to 1 (right); null off it. */
function acrossOf(view: Box, x: number, y: number): number | null {
  if (x < view.left || x > view.right || y < view.top || y > view.bottom)
    return null
  return ((x - view.left) / (view.right - view.left)) * 2 - 1
}

const add = (t: Tallies, bed: Bed, n: number, across: number) => {
  t[bed].n += n
  t[bed].across += n * across
}

/** The tile under a point of the map, in map units; -1 off it. */
function tileAt(grid: GameState['grid'], x: number, y: number) {
  const col = Math.floor(x / grid.size)
  const row = Math.floor(y / grid.size)
  const off = col < 0 || row < 0 || col >= grid.width || row >= grid.height
  return off ? -1 : row * grid.width + col
}

/** The ground under the screen's points: the sea (a coast whole, open water less), the land for the wind, more on the heights, the woods. */
function ground(state: GameState, terrain: Terrain, view: Box, t: Tallies) {
  const { grid } = state
  for (let i = 0; i < COLUMNS * ROWS; i++) {
    const across = (((i % COLUMNS) + 0.5) / COLUMNS) * 2 - 1
    const x = view.left + ((across + 1) / 2) * (view.right - view.left)
    const y =
      view.top +
      ((Math.floor(i / COLUMNS) + 0.5) / ROWS) * (view.bottom - view.top)
    const tile = tileAt(grid, x, y)
    if (tile < 0) continue
    if (!grid.land[tile]) {
      add(t, 'sea', terrain.shore[tile] <= SURF ? 1 : 0.4, across)
      continue
    }
    const biome = terrain.biome[tile]
    const high = biome === HILLS || biome === MOUNTAINS
    add(t, 'wind', high ? 2 : 0.5, across)
    if (biome === FOREST) add(t, 'wood', 1, across)
  }
}

/** The tile an army or a caravan stands on along its road. */
const alongOf = (road: ReadonlyArray<number>, along: number) =>
  road[Math.min(road.length - 1, Math.floor(along / 1000))]

/** The rivers' points on the screen, each where it is. */
function streams(view: Box, rivers: Rivers, t: Tallies) {
  for (const course of rivers)
    for (const [x, y] of course) {
      const across = acrossOf(view, x, y)
      if (across !== null) add(t, 'river', 1, across)
    }
}

/** What stands or moves on the screen, each where it is. */
function elements(state: GameState, view: Box, t: Tallies) {
  const at = (bed: Bed, tile: number) => {
    const { x, y } = siteOf(state, tile)
    const across = acrossOf(view, x, y)
    if (across !== null) add(t, bed, 1, across)
  }
  for (const work of state.works) at(WORKS[work.work], work.tile)
  for (const caravan of state.caravans)
    at('caravan', alongOf(caravan.road, caravan.along))
  for (const host of state.hosts) {
    if (host.men <= 0) continue
    if (host.edge.length > 0 && host.closing <= 0) at('battle', host.edge[0])
    else if (host.road.length > 0) at('march', alongOf(host.road, host.along))
  }
  for (const scar of state.scars) at(SCARS[scar.kind], scar.tile)
}

export function bedsOf(
  state: GameState,
  terrain: Terrain,
  rivers: Rivers,
  view: Box,
  perTile: number,
): Hearing {
  const t = {} as Tallies
  for (const bed of BED_LIST) t[bed] = { n: 0, across: 0 }
  ground(state, terrain, view, t)
  streams(view, rivers, t)
  elements(state, view, t)
  const near = smoothstep(CLOSE[0], CLOSE[1], perTile)
  const heard = smoothstep(HEARD[0], HEARD[1], perTile)
  const points = COLUMNS * ROWS
  const share = {
    sea: Math.min(1, (t.sea.n / points) * 2) * (0.4 + 0.6 * near),
    // The far bed: over the land always, more on the heights, a little lower up close.
    wind: Math.min(1, t.wind.n / points) * (1 - 0.4 * near),
    river: Math.min(1, t.river.n / STREAM) * heard,
    wood: Math.min(1, (t.wood.n / points) * 2.5) * heard,
  } as Record<Bed, number>
  for (const [bed, full] of Object.entries(FULL) as Array<[Bed, number]>)
    share[bed] = Math.min(1, t[bed].n / full) * heard
  const beds = {} as Hearing['beds']
  for (const bed of BED_LIST) {
    const { n, across } = t[bed]
    beds[bed] = { level: share[bed], pan: n > 0 ? (across / n) * LEAN : 0 }
  }
  return { beds, near }
}
