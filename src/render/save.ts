import { createGame } from '../../engine'
import { PLAYERS } from './palette'
import type { GameState, Grid, Level, MapSize } from '../../engine'

// A saved game: a game's state at a tick, as plain data, to come back to
// it on screen (`/play?save=…`, still.ts) without playing up to it. What
// the seed makes again is left out: the land and its tiles, the rules, and
// whatever the game has not changed since it began (the free domains drawn
// at the start, say); an array over every tile, the lords' land, is kept as
// runs of one value, and a road from tile to tile (a caravan's, an army's)
// as its first tile and its steps, three to a letter. The maquette's
// moments are saved so, from games of bots played without a screen
// (scripts/maquette.ts), and served with the site (public/saves).

/** Where the camera stands: the whole land, the player's own land, or a tile at the middle, so many pixels a tile. */
export type Shot = 'land' | 'home' | { tile: number; perTile: number }

export type Save = {
  /** The land: its seed and size make it again, and the game's start with it. */
  seed: string
  size: MapSize
  /** The bots' level, should the game be played on. */
  level: Level
  /** The seat the game is seen from, and the camera. */
  me: number
  camera: Shot
  /** The state's fields that a new game on the seed has otherwise: those over every tile in runs (`$runs`), the roads as walks (`$path`). */
  state: Record<string, unknown>
}

/** An array over every tile, as runs: each value, then how many tiles in a row have it. */
function toRuns(values: Array<number>): Array<number> {
  const runs: Array<number> = []
  for (let i = 0; i < values.length;) {
    let j = i + 1
    while (j < values.length && values[j] === values[i]) j++
    runs.push(values[i], j - i)
    i = j
  }
  return runs
}

function fromRuns(runs: Array<number>): Array<number> {
  const values: Array<number> = []
  for (let i = 0; i < runs.length; i += 2)
    for (let n = 0; n < runs[i + 1]; n++) values.push(runs[i])
  return values
}

/** A walk over the tiles: its first tile, how many steps, and the steps, three a letter. */
type Path = [number, number, string]

/** The four ways a step goes, up, right, down and left, two bits each. */
const ways = (width: number) => [-width, 1, width, -1]
const LETTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

/** Tiles as a walk, each the neighbour of the one before; none if they are not one. */
function toPath(tiles: Array<number>, width: number): Path | null {
  if (tiles.length < 8) return null
  const steps: Array<number> = []
  for (let i = 1; i < tiles.length; i++) {
    const way = ways(width).indexOf(tiles[i] - tiles[i - 1])
    if (way < 0) return null
    steps.push(way)
  }
  let letters = ''
  for (let i = 0; i < steps.length; i += 3) {
    const [a, b = 0, c = 0] = steps.slice(i, i + 3)
    letters += LETTERS[(a << 4) | (b << 2) | c]
  }
  return [tiles[0], steps.length, letters]
}

function fromPath([first, count, letters]: Path, width: number) {
  const tiles = [first]
  for (let i = 0; i < count; i++) {
    const letter = LETTERS.indexOf(letters[Math.floor(i / 3)])
    const way = (letter >> (4 - 2 * (i % 3))) & 3
    tiles.push(tiles[i] + ways(width)[way])
  }
  return tiles
}

const integers = (values: Array<unknown>): values is Array<number> =>
  values.every((v) => Number.isInteger(v))

/** Any value of the state, its arrays over every tile in runs and its walks as paths, the rest as it is. */
function pack(value: unknown, grid: Grid): unknown {
  if (Array.isArray(value)) {
    if (!integers(value)) return value.map((v) => pack(v, grid))
    if (value.length === grid.width * grid.height)
      return { $runs: toRuns(value) }
    const path = toPath(value, grid.width)
    return path ? { $path: path } : value
  }
  if (typeof value !== 'object' || value === null) return value
  return Object.fromEntries(
    Object.entries(value).map(([key, v]) => [key, pack(v, grid)]),
  )
}

function unpack(value: unknown, grid: Grid): unknown {
  if (Array.isArray(value)) return value.map((v) => unpack(v, grid))
  if (typeof value !== 'object' || value === null) return value
  if ('$runs' in value) return fromRuns(value.$runs as Array<number>)
  if ('$path' in value) return fromPath(value.$path as Path, grid.width)
  return Object.fromEntries(
    Object.entries(value).map(([key, v]) => [key, unpack(v, grid)]),
  )
}

/** Fields a save never holds: the seed's, the land's tiles and the rules. */
const REMADE = new Set(['seed', 'grid', 'rules'])

/** A game's state saved at its tick, seen from a seat; `grid` is the land's tiles as made from the seed, before the game began. */
export function saveGame(
  state: GameState,
  grid: Grid,
  view: Omit<Save, 'seed' | 'state'>,
): Save {
  const fresh: Record<string, unknown> = createGame(
    grid,
    state.players.length,
    state.seed,
    state.rules,
  )
  const kept: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(state)) {
    if (REMADE.has(key)) continue
    if (JSON.stringify(value) === JSON.stringify(fresh[key])) continue
    kept[key] = pack(value, grid)
  }
  return { seed: state.seed, ...view, state: kept }
}

/** The game a save holds: a new game on its land, its saved fields laid over it. */
export function restoreGame(grid: Grid, save: Save): GameState {
  const state = createGame(grid, PLAYERS.length, save.seed)
  const fields: Record<string, unknown> = state
  for (const [key, value] of Object.entries(save.state))
    fields[key] = unpack(value, grid)
  return state
}

/** A save served with the site (public/saves), by its name. */
export async function fetchSave(name: string): Promise<Save> {
  const response = await fetch(`/saves/${encodeURIComponent(name)}.json`)
  if (!response.ok) throw new Error(`No save named ${name}`)
  return (await response.json()) as Save
}
