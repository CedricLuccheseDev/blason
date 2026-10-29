import { describe, expect, it } from 'vitest'
import { ARMY_KEYS, keyOf } from './keys'

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
})
