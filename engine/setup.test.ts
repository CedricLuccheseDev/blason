import { describe, expect, it } from 'vitest'
import { createGame } from './land'
import { RULES, SETUP_LIMITS } from './rules'
import {
  aloneSetup,
  bookOf,
  botsSetup,
  hostSetup,
  publicSetup,
  readSetup,
  seatPersons,
} from './setup'
import { stateHash } from './step'
import { field, setupOf } from './testing'
import type { Level } from './bots/levels'
import type { GameSetup } from './types'

// What a game is made of: the presets, the setup read from the wire, and
// the game made from it.

/** A setup sent through the wire and read back, changed on the way. */
const sent = (setup: GameSetup, change: Record<string, unknown> = {}) =>
  readSetup(JSON.parse(JSON.stringify({ ...setup, ...change })))

describe('a game set up', () => {
  it('alone: the player at the first seat, a bot of the level at every other', () => {
    const setup = aloneSetup({ seed: 's', size: 'large', level: 'hard' })
    expect(setup.seats).toHaveLength(SETUP_LIMITS.seats.max)
    expect(setup.seats[0]).toEqual({ team: -1, bot: null, person: true })
    expect(setup.seats.slice(1).every((s) => s.bot === 'hard')).toBe(true)
    expect(setup.land).toEqual({ kind: 'drawn', size: 'large' })
    expect(setup.opening).toBe(SETUP_LIMITS.opening.alone)
  })

  it('in public: no bot, every seat empty until a person takes it, a longer opening', () => {
    const setup = publicSetup('s')
    expect(setup.seats.every((s) => !s.bot && !s.person)).toBe(true)
    expect(setup.opening).toBe(SETUP_LIMITS.opening.public)
  })

  it('makes its game: a lord a seat, their teams, its seed and its opening', () => {
    const setup = { ...setupOf(4, { teams: [0, 0, 1, -1] }), opening: 70 }
    const state = createGame(field(10), setup)
    expect(state.players).toHaveLength(4)
    expect(state.teams).toEqual([0, 0, 1, -1])
    expect(state.seed).toBe('test')
    expect(state.rules.openingTicks).toBe(70)
    expect(state.rules.startGold).toBe(RULES.startGold)
  })

  it('is no part of the fingerprint: what moves is', () => {
    const a = createGame(field(10), setupOf(2))
    const other: GameSetup = {
      ...setupOf(2),
      land: { kind: 'drawn', size: 'huge' },
      seats: [
        { team: -1, bot: null, person: true },
        { team: -1, bot: 'easy', person: false },
      ],
    }
    const b = createGame(field(10), other)
    expect(stateHash(a)).toBe(stateHash(b))
  })
})

describe('a setup read from the wire', () => {
  it('is the setup sent, and only what a setup holds', () => {
    for (const setup of [
      publicSetup('s'),
      aloneSetup({ seed: 's', size: 'huge', level: 'easy' }),
      setupOf(8, { teams: [0, 0, 1, 1, 2, 2, 3, 3] }),
    ])
      expect(sent(setup, { more: 1 })).toEqual(setup)
  })

  it('refuses another version, an unknown land, mode or level, figures out of bounds', () => {
    const setup = botsSetup({ seed: 's' })
    const seat = setup.seats[0]
    for (const change of [
      { v: 2 },
      { seed: '' },
      { seed: 'x'.repeat(SETUP_LIMITS.seed.max + 1) },
      { land: { kind: 'drawn', size: 'vast' } },
      { land: { kind: 'map', size: 'standard' } },
      { mode: 'cathedral' },
      { opening: SETUP_LIMITS.opening.max + 1 },
      { opening: 99.5 },
      { seats: [seat] },
      { seats: botsSetup({ seed: 's', lords: 25 }).seats },
      { seats: [seat, { ...seat, team: SETUP_LIMITS.teams }] },
      { seats: [seat, { ...seat, bot: 'cunning' }] },
      { seats: [seat, { ...seat, person: 'yes' }] },
    ])
      expect(sent(setup, change)).toBeNull()
    expect(readSetup('setup')).toBeNull()
  })
})

describe('the host’s setup', () => {
  const book = {
    seed: 'host',
    land: { kind: 'drawn' as const, size: 'standard' as const },
    bots: 5,
    level: 'hard' as const,
    teams: 2,
    opening: 300,
  }

  it('seats the host first, so many bots after him, the rest empty, dealt into teams in turn', () => {
    const { seats, opening } = hostSetup(book)
    expect(seats).toHaveLength(SETUP_LIMITS.seats.max)
    expect(seats[0]).toEqual({ team: 0, bot: null, person: true })
    expect(seats.slice(1, 6).map((s) => [s.team, s.bot])).toEqual([
      [1, 'hard'],
      [0, 'hard'],
      [1, 'hard'],
      [0, 'hard'],
      [1, 'hard'],
    ])
    expect(
      seats.slice(6).every((s) => !s.bot && !s.person && s.team === -1),
    ).toBe(true)
    expect(opening).toBe(300)
  })

  it('keeps each for himself without teams, and its figures within their bounds', () => {
    const { seats, opening } = hostSetup({
      ...book,
      bots: 99,
      teams: 0,
      opening: 1,
    })
    expect(seats.every((s) => s.team === -1)).toBe(true)
    expect(seats.filter((s) => s.bot)).toHaveLength(SETUP_LIMITS.seats.max - 1)
    expect(opening).toBe(SETUP_LIMITS.opening.min)
  })
})

describe('a host’s book read back', () => {
  it('gives back the book its setup was made from', () => {
    const book = {
      seed: 'back',
      land: { kind: 'drawn' as const, size: 'large' as const },
      guests: 2,
      bots: 5,
      level: 'hard' as const,
      teams: 3,
      opening: 200,
    }
    expect(bookOf(hostSetup(book))).toMatchObject(book)
    const alone = { ...book, guests: 0, bots: 0, teams: 0 }
    expect(bookOf(hostSetup(alone))).toMatchObject({
      ...alone,
      level: 'normal',
    })
  })

  it('gives back each seat’s team and each bot’s level as the host set them, so that a guest reads the same game', () => {
    const book = {
      seed: 'moved',
      land: { kind: 'drawn' as const, size: 'standard' as const },
      bots: 3,
      level: 'normal' as const,
      teams: 2,
      opening: 200,
      // Every lord moved into the first team, one bot made hard.
      teamOf: [0, 0, 0, 0],
      levels: ['normal', 'hard', 'normal', 'easy'] as Array<Level>,
    }
    const setup = hostSetup(book)
    expect(hostSetup(bookOf(setup))).toEqual(setup)
  })
})

describe('a host’s setup fitted to who sits', () => {
  const book = {
    seed: 'fit',
    land: { kind: 'drawn' as const, size: 'standard' as const },
    guests: 1,
    bots: 3,
    level: 'hard' as const,
    teams: 2,
    opening: 200,
  }

  it('gives a bot’s seat to a guest come since the launch', () => {
    const seats = seatPersons(hostSetup(book), 3).seats.slice(0, 5)
    expect(seats.map((s) => [s.person, s.bot])).toEqual([
      [true, null],
      [true, null],
      [true, null],
      [false, 'hard'],
      [false, 'hard'],
    ])
  })

  it('leaves the seat of a guest gone empty, no lord, his land and teams kept', () => {
    const fitted = seatPersons(hostSetup(book), 1)
    expect(fitted.seats[1]).toEqual({
      ...hostSetup(book).seats[1],
      person: false,
    })
    expect(fitted.seed).toBe('fit')
  })
})
