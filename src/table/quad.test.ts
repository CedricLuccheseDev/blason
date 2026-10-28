import { describe, expect, it } from 'vitest'
import { quadMatrix } from './quad'

// The words on the table land on the corners they are given.

const apply = (m: string, x: number, y: number) => {
  const v = m.slice('matrix3d('.length, -1).split(',').map(Number)
  const X = v[0] * x + v[4] * y + v[12]
  const Y = v[1] * x + v[5] * y + v[13]
  const W = v[3] * x + v[7] * y + v[15]
  return [X / W, Y / W]
}

describe('quadMatrix', () => {
  it('maps a rectangle onto a skewed quad, corner by corner', () => {
    const q: Array<[number, number]> = [
      [10, 20],
      [210, 40],
      [190, 260],
      [-5, 230],
    ]
    const m = quadMatrix(300, 100, [q[0], q[1], q[2], q[3]])
    const corners = [
      apply(m, 0, 0),
      apply(m, 300, 0),
      apply(m, 300, 100),
      apply(m, 0, 100),
    ]
    corners.forEach(([x, y], i) => {
      expect(x).toBeCloseTo(q[i][0], 1)
      expect(y).toBeCloseTo(q[i][1], 1)
    })
  })
})
