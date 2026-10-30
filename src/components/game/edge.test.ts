import { describe, expect, it } from 'vitest'
import { COMPACT_INSET, placeOn, within } from './edge'

describe('the room kept clear of the HUD', () => {
  it('leaves a phone laid flat most of its height for the map', () => {
    const room = within(COMPACT_INSET, 844, 390)
    expect(room.top + room.bottom).toBeLessThanOrEqual(390 * 0.45 + 0.001)
    // A pennant in the middle of the screen stands where it belongs.
    expect(placeOn({ x: 422, y: 200 }, 844, 390, room).toward).toBeNull()
  })

  it('keeps the room as drawn where the screen has it', () => {
    expect(within(COMPACT_INSET, 1366, 900)).toEqual(COMPACT_INSET)
  })
})
