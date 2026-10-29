import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SEATS } from '../net/protocol'
import type { FromRelay } from '../net/protocol'
import type * as Rooms from './rooms'

// The public room's minute, on a clock of the test's: one is always open,
// its land drawn as it opens; a minute later it starts with whoever sits, or
// at once when full; empty when its minute is up, another takes its place.

let rooms: typeof Rooms

/** A player who keeps every word of the relay. */
function player(name = '') {
  const heard: Array<FromRelay> = []
  return { name, send: (message: FromRelay) => heard.push(message), heard }
}

const begun = (heard: Array<FromRelay>) => heard.find((m) => m.t === 'begin')

beforeEach(async () => {
  vi.useFakeTimers()
  // Each test its own relay, its rooms and its clock.
  vi.resetModules()
  rooms = await import('./rooms')
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('the public room', () => {
  it('is always open, its land drawn as it opens', () => {
    const first = rooms.upcoming()
    expect(first).toMatchObject({
      size: 'standard',
      startsIn: rooms.PUBLIC_WAIT,
      taken: 0,
      seats: SEATS,
    })
    vi.advanceTimersByTime(20_000)
    expect(rooms.upcoming()).toMatchObject({
      seed: first.seed,
      startsIn: rooms.PUBLIC_WAIT - 20_000,
    })
  })

  it('gives way when its minute is up and no one sat: a new land, a new minute', () => {
    const first = rooms.upcoming()
    vi.advanceTimersByTime(rooms.PUBLIC_WAIT - 1)
    expect(rooms.upcoming()).toMatchObject({ seed: first.seed, startsIn: 1 })
    vi.advanceTimersByTime(1)
    const next = rooms.upcoming()
    expect(next.seed).not.toBe(first.seed)
    expect(next.startsIn).toBe(rooms.PUBLIC_WAIT)
  })

  it('starts a minute after it opened with whoever sits, on the land it showed', () => {
    const { seed } = rooms.upcoming()
    vi.advanceTimersByTime(45_000)
    const one = player('one')
    rooms.join(one, null)
    expect(one.heard.at(-1)).toMatchObject({
      t: 'lobby',
      lobby: { open: true, seed, size: 'standard', startsIn: 15_000 },
    })
    expect(rooms.upcoming()).toMatchObject({ seed, taken: 1 })
    vi.advanceTimersByTime(14_999)
    expect(begun(one.heard)).toBeUndefined()
    vi.advanceTimersByTime(1)
    expect(begun(one.heard)).toEqual({
      t: 'begin',
      seed,
      size: 'standard',
      level: 'normal',
      names: ['one'],
    })
    // The next is open at once, a new land and a minute of its own.
    const next = rooms.upcoming()
    expect(next.seed).not.toBe(seed)
    expect(next).toMatchObject({ startsIn: rooms.PUBLIC_WAIT, taken: 0 })
    vi.advanceTimersByTime(100)
    expect(one.heard.at(-1)).toMatchObject({ t: 'turn', n: 0 })
  })

  it('starts at once when full', () => {
    const { seed } = rooms.upcoming()
    const all = Array.from({ length: SEATS }, (_, i) => player(`p${i}`))
    for (const p of all) rooms.join(p, null)
    for (const p of all) expect(begun(p.heard)).toMatchObject({ seed })
    expect(rooms.upcoming()).toMatchObject({ taken: 0 })
    expect(rooms.upcoming().seed).not.toBe(seed)
  })

  it('keeps its minute when its players leave, then gives way', () => {
    const { seed } = rooms.upcoming()
    const one = player()
    const room = rooms.join(one, null)
    vi.advanceTimersByTime(10_000)
    if (room) rooms.leave(room, one)
    expect(rooms.upcoming()).toMatchObject({
      seed,
      startsIn: rooms.PUBLIC_WAIT - 10_000,
      taken: 0,
    })
    vi.advanceTimersByTime(rooms.PUBLIC_WAIT - 10_000)
    expect(begun(one.heard)).toBeUndefined()
    expect(rooms.upcoming().seed).not.toBe(seed)
  })
})

describe('a private room', () => {
  it('starts on its host’s word, on the land it was made with', () => {
    const host = player('host')
    const room = rooms.join(host, 'new')
    const told = host.heard.at(-1)
    if (!room || told?.t !== 'lobby') throw new Error('no room')
    expect(told.lobby).toMatchObject({ open: false, startsIn: null })
    const friend = player('friend')
    rooms.join(friend, told.lobby.room.toLowerCase())
    vi.advanceTimersByTime(rooms.PUBLIC_WAIT)
    expect(begun(friend.heard)).toBeUndefined()
    rooms.hear(room, host, { t: 'start' })
    expect(begun(friend.heard)).toMatchObject({
      seed: told.lobby.seed,
      names: ['host', 'friend'],
    })
  })
})
