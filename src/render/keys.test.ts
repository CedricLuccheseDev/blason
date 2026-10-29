import { describe, expect, it } from 'vitest'
import { ARMY_KEYS, COUP_KEYS, WORK_KEYS, keyAt, keyOf } from './keys'

describe('the keyboard', () => {
  it('reads a digit by its place, whatever the layout types', () => {
    // A French keyboard's top row types "&" and "é" unshifted.
    expect(keyOf({ key: '&', code: 'Digit1' })).toBe('1')
    expect(keyOf({ key: 'é', code: 'Digit2' })).toBe('2')
    expect(keyOf({ key: '0', code: 'Numpad0' })).toBe('0')
    expect(ARMY_KEYS[keyOf({ key: '&', code: 'Digit1' })]).toBe('raid')
  })

  it('reads any other key by what it types', () => {
    expect(keyOf({ key: 'Escape', code: 'Escape' })).toBe('Escape')
  })

  it('takes the armies with 1 to 4, the works with 5 to 7, the coups with 8, 9 and 0', () => {
    expect(ARMY_KEYS['4']).toBe('mercenaries')
    expect(WORK_KEYS['5']).toBe('village')
    expect(WORK_KEYS['7']).toBe('castle')
    expect(COUP_KEYS['8']).toBe('troublemaker')
    // The tenth key is 0, as on the keyboard's top row, whatever it types.
    expect(COUP_KEYS[keyOf({ key: 'à', code: 'Digit0' })]).toBe('fire')
    expect(keyAt(10)).toBe('0')
  })
})
