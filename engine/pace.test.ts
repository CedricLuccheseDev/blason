import { describe, expect, it } from 'vitest'
import { attack, endow, field, hold, muster, playing, run } from './testing'

describe('the armies’ pace', () => {
  it('a small troop rides half again as fast as the troop, the large troop at half its pace', () => {
    const state = playing(field(40))
    hold(
      state,
      0,
      Array.from({ length: 20 }, (_, t) => t),
    )
    muster(state, 0, 0)
    hold(state, 1, [39])
    endow(state, 0, 4000)
    const along = (army: 'raid' | 'host' | 'ban') => {
      const s = structuredClone(state)
      run(s, 10, [attack(0, 25, army)])
      return s.hosts[0].along
    }
    expect(along('raid')).toBe(Math.floor(along('host') * 1.5))
    expect(along('ban')).toBe(Math.floor(along('host') * 0.5))
  })
})
