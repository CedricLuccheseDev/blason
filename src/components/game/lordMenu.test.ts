import { describe, expect, it } from 'vitest'
import { allianceWith, menuOf } from './lordMenu'
import type { MenuSummary } from './lordMenu'

/** Me with a host of 33 men in hand and 21 gold to offer, bound to no one. */
function alone(): MenuSummary {
  return {
    army: 'host',
    armies: [
      { army: 'raid', at: 'village', share: 10, men: 13, gold: null, free: 1 },
      { army: 'host', at: 'village', share: 25, men: 33, gold: null, free: 1 },
    ],
    allies: [],
    offers: [],
    asked: [],
    offering: 21,
  }
}

const lord = (seat: number) => ({ seat, key: 'vert' as const, color: 0 })
const ally = (seat: number, closing = false, pressed = false) => ({
  ...lord(seat),
  left: closing ? 20 : 200,
  ring: 1,
  closing,
  pressed,
  theirs: false,
})

/** The pointer on a lord's land (none: free land), where the army in hand would enter, or beyond its reach. */
const on = (seat: number | null, reach = true) => ({
  lord: seat,
  entry: reach ? { x: 10, y: 10 } : null,
})

describe("the right click's menu", () => {
  it('on an enemy: attack with the army in hand, offer an alliance, an offering', () => {
    expect(menuOf(alone(), on(5))).toEqual([
      { act: 'attack', men: 33, can: true },
      { act: 'alliance', say: 'offer', can: true },
      { act: 'offering', gold: 21, can: true },
    ])
  })

  it('on an enemy beyond reach: the attack at half ink', () => {
    expect(menuOf(alone(), on(5, false))[0]).toEqual({
      act: 'attack',
      men: 33,
      can: false,
    })
  })

  it('on an ally: no attack, the alliance to break or, in its last moments, to renew', () => {
    const summary = { ...alone(), allies: [ally(5)] }
    expect(menuOf(summary, on(5, false))).toEqual([
      { act: 'alliance', say: 'break', can: true },
      { act: 'offering', gold: 21, can: true },
    ])
    expect(allianceWith({ ...alone(), allies: [ally(5, true)] }, 5)).toBe(
      'renew',
    )
    expect(allianceWith({ ...alone(), allies: [ally(5, true, true)] }, 5)).toBe(
      'break',
    )
  })

  it('says to accept his offer, and sleeps while mine waits', () => {
    const offered = {
      ...alone(),
      offers: [{ ...lord(5), left: 10, ring: 0.5 }],
    }
    expect(allianceWith(offered, 5)).toBe('accept')
    expect(menuOf({ ...alone(), asked: [5] }, on(5))[1]).toEqual({
      act: 'alliance',
      say: 'asked',
      can: false,
    })
  })

  it('sleeps the offering with no gold to give', () => {
    expect(menuOf({ ...alone(), offering: 0 }, on(5))[2]).toEqual({
      act: 'offering',
      gold: 0,
      can: false,
    })
  })

  it('is none on free land', () => {
    expect(menuOf(alone(), on(null))).toEqual([])
  })
})
