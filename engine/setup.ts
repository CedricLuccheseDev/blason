import { makeGrid } from './grid'
import { generateWorld } from './map/generate'
import { MAP_SIZES, RULES, SETUP_LIMITS } from './rules'
import { LEVELS } from './bots/levels'
import type { Generator, World } from './map/generate'
import type { Level } from './bots/levels'
import type { MapSize } from './rules'
import type { GameSetup, Grid, Seat } from './types'

// What a game is made of, in one object (GameSetup, types.ts): its seed and
// the land drawn from it, how it is won, its opening, its seats. The host's
// book fills it, the relay passes it on without reading it, and every
// machine makes the same game from it (createGame, land.ts). It is checked
// where it comes in (readSetup) and trusted past there.

const MODES: ReadonlyArray<GameSetup['mode']> = ['conquest']
const SIZES = Object.keys(MAP_SIZES) as Array<MapSize>

/** A setup on a land drawn from the seed, its lords each for himself. */
const drawn = (
  seed: string,
  size: MapSize,
  opening: number,
  seats: Array<Seat>,
): GameSetup => ({
  v: 1,
  seed,
  land: { kind: 'drawn', size },
  mode: 'conquest',
  opening,
  seats,
})

/** So many seats alike, each a lord for himself. */
const many = (lords: number, bot: Level | null): Array<Seat> =>
  Array.from({ length: lords }, () => ({ team: -1, bot, person: false }))

/** A game of bots, a bot of the level at every seat: the scripts' and the tests' games, and a game online's until a person takes a seat. */
export function botsSetup({
  seed,
  size = 'standard',
  level = 'normal',
  lords = SETUP_LIMITS.seats.max,
  opening = SETUP_LIMITS.opening.alone,
}: {
  seed: string
  size?: MapSize
  level?: Level
  lords?: number
  opening?: number
}): GameSetup {
  return drawn(seed, size, opening, many(lords, level))
}

/** A game alone: the player at the first seat from the first turn, a bot of the level chosen at every other. */
export function aloneSetup(o: {
  seed: string
  size: MapSize
  level: Level
}): GameSetup {
  const player: Seat = { team: -1, bot: null, person: true }
  const bots = many(SETUP_LIMITS.seats.max - 1, o.level)
  return drawn(o.seed, o.size, SETUP_LIMITS.opening.alone, [player, ...bots])
}

/** What the host's book sets: his land, his bots and their level, his teams (0: each for himself), the opening's length in ticks. */
export type Book = {
  seed: string
  size: MapSize
  bots: number
  level: Level
  teams: number
  opening: number
}

/**
 * The host's game as his book sets it (« créer une partie », solo being one
 * with no guest): him at the first seat, so many bots of the level after
 * him, the other seats empty; the lords in play dealt into the teams in
 * turn, or each for himself.
 */
export function hostSetup(book: Book): GameSetup {
  const { max } = SETUP_LIMITS.seats
  const bots = Math.max(0, Math.min(max - 1, book.bots))
  const teams = book.teams >= 2 ? Math.min(SETUP_LIMITS.teams, book.teams) : 0
  const seats = Array.from({ length: max }, (_, i): Seat => ({
    team: teams && i <= bots ? i % teams : -1,
    bot: i > 0 && i <= bots ? book.level : null,
    person: i === 0,
  }))
  const { min, max: most } = SETUP_LIMITS.opening
  const opening = Math.max(min, Math.min(most, book.opening))
  return drawn(book.seed, book.size, opening, seats)
}

/** The public game the relay keeps in its opening: the standard land and no bot, every seat empty until a person takes it, an opening long enough for players to come. */
export function publicSetup(seed: string): GameSetup {
  const seats = many(SETUP_LIMITS.seats.max, null)
  return drawn(seed, 'standard', SETUP_LIMITS.opening.public, seats)
}

/** The land a setup is played on, and its tiles; the arena may draw it with another generator. */
export function landOf(
  setup: GameSetup,
  generator?: Generator,
): { world: World; grid: Grid } {
  const world = generateWorld(setup.seed, {
    size: setup.land.size,
    generator,
  })
  const grid = makeGrid(world.map, world.width, world.height, RULES.tileSize)
  return { world, grid }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/** A whole number within the bounds. */
const within = (
  value: unknown,
  { min, max }: { min: number; max: number },
): value is number =>
  Number.isInteger(value) &&
  (value as number) >= min &&
  (value as number) <= max

const among = <T>(list: ReadonlyArray<T>, value: unknown): T | undefined =>
  list.find((known) => known === value)

function readSeat(value: unknown): Seat | null {
  if (!isRecord(value)) return null
  const { team, bot, person } = value
  const level = bot === null ? null : among(LEVELS, bot)
  const teams = { min: -1, max: SETUP_LIMITS.teams - 1 }
  if (!within(team, teams) || level === undefined) return null
  return typeof person === 'boolean' ? { team, bot: level, person } : null
}

function readSeats(value: unknown): Array<Seat> | null {
  if (!Array.isArray(value) || !within(value.length, SETUP_LIMITS.seats))
    return null
  const seats = value.map(readSeat)
  return seats.every((seat): seat is Seat => seat !== null) ? seats : null
}

function readLand(value: unknown): GameSetup['land'] | null {
  if (!isRecord(value) || value.kind !== 'drawn') return null
  const size = among(SIZES, value.size)
  return size ? { kind: 'drawn', size } : null
}

/** A setup as it came down the wire, checked and bounded (SETUP_LIMITS), or none: the relay reads the host's, the browser the relay's. Only what a setup holds is kept. */
export function readSetup(value: unknown): GameSetup | null {
  if (!isRecord(value) || value.v !== 1) return null
  const { seed, opening } = value
  const land = readLand(value.land)
  const mode = among(MODES, value.mode)
  const seats = readSeats(value.seats)
  const named =
    typeof seed === 'string' && within(seed.length, SETUP_LIMITS.seed)
  if (!named || !land || !mode || !seats) return null
  if (!within(opening, SETUP_LIMITS.opening)) return null
  return { v: 1, seed, land, mode, opening, seats }
}
