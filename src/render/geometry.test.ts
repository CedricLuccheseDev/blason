import { describe, expect, it } from 'vitest'
import { simplify, simplifyLoop, straighten } from './geometry'
import { smooth } from './trace'
import type { Point } from '../../engine'

/** Whether a point lies on the loop's line, between two of its points. */
function onLoop(p: Point, loop: Array<Point>) {
  return loop.some((q, i) => {
    const r = loop[(i + 1) % loop.length]
    const cross = (r[0] - q[0]) * (p[1] - q[1]) - (r[1] - q[1]) * (p[0] - q[0])
    const along = (p[0] - q[0]) * (r[0] - p[0]) + (p[1] - q[1]) * (r[1] - p[1])
    return Math.abs(cross) < 1e-6 && along >= -1e-9
  })
}

describe('straighten', () => {
  it('keeps only the corners of a square traced tile by tile', () => {
    const square: Array<Point> = []
    for (let x = 0; x < 4; x++) square.push([x, 0])
    for (let y = 0; y < 4; y++) square.push([4, y])
    for (let x = 4; x > 0; x--) square.push([x, 4])
    for (let y = 4; y > 0; y--) square.push([0, y])
    expect(straighten(square)).toEqual([
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ])
  })

  it('keeps every point of a curve', () => {
    const circle: Array<Point> = Array.from({ length: 40 }, (_, i) => [
      Math.cos((i / 40) * 2 * Math.PI) * 10,
      Math.sin((i / 40) * 2 * Math.PI) * 10,
    ])
    expect(straighten(circle)).toHaveLength(40)
  })

  it('leaves a smoothed border its shape, with fewer points', () => {
    // A staircase and a straight run, traced round, smoothed as the washes are.
    const loop: Array<Point> = [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
      [3, 2],
      [3, 3],
      [3, 6],
      [0, 6],
    ]
    const round = smooth(loop, 4)
    const kept = straighten(round)
    expect(kept.length).toBeLessThan(round.length)
    for (const p of round) expect(onLoop(p, kept)).toBe(true)
  })
})

describe('simplify', () => {
  /** How far a point lies from a line made of segments. */
  const away = ([x, y]: Point, line: Array<Point>) =>
    Math.min(
      ...line.slice(1).map(([bx, by], i) => {
        const [ax, ay] = line[i]
        const [dx, dy] = [bx - ax, by - ay]
        const t = Math.max(
          0,
          Math.min(
            1,
            ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1),
          ),
        )
        return Math.hypot(x - ax - t * dx, y - ay - t * dy)
      }),
    )

  it('leaves out the small wiggles of a line, never straying farther than asked', () => {
    const line: Array<Point> = Array.from({ length: 200 }, (_, i) => [
      i,
      Math.sin(i * 1.7) * 0.1 + Math.sin(i / 30) * 10,
    ])
    const plain = simplify(line, 0.5)
    expect(plain.length).toBeLessThan(line.length / 4)
    expect(plain[0]).toEqual(line[0])
    expect(plain[plain.length - 1]).toEqual(line[line.length - 1])
    for (const p of line) expect(away(p, plain)).toBeLessThanOrEqual(0.5)
  })

  it('closes a loop as it was, its first point kept', () => {
    const circle: Array<Point> = Array.from({ length: 400 }, (_, i) => [
      Math.cos((i / 400) * 2 * Math.PI) * 10,
      Math.sin((i / 400) * 2 * Math.PI) * 10,
    ])
    const plain = simplifyLoop(circle, 0.05)
    expect(plain[0]).toEqual(circle[0])
    expect(plain.length).toBeLessThan(100)
    expect(plain.length).toBeGreaterThan(20)
  })
})
