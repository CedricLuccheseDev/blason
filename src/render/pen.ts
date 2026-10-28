import type { Point } from '../../engine'

// The pen's hand: a line drawn by hand trembles a little. The tremble
// depends only on where a point lies, so a border shared by two lands
// trembles the same way on both sides.

/** A smooth, repeatable push in [-1, 1] at a place. */
export function tremble(x: number, y: number, phase: number): number {
  return (
    Math.sin(x * 0.31 + y * 0.17 + phase) * 0.6 +
    Math.sin(x * 0.07 - y * 0.23 + phase * 2.1) * 0.4
  )
}

function pushed([x, y]: Point, amount: number): Point {
  return [x + tremble(x, y, 0) * amount, y + tremble(x, y, 1.7) * amount]
}

/** The line as a pen draws it: cut into short steps, each pushed aside a little. */
export function penned(
  line: ReadonlyArray<Point>,
  amount = 0.45,
  step = 3,
): Array<Point> {
  const out: Array<Point> = []
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, ay] = line[i]
    const [bx, by] = line[i + 1]
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step))
    for (let k = 0; k < n; k++) {
      const t = k / n
      out.push(pushed([ax + (bx - ax) * t, ay + (by - ay) * t], amount))
    }
  }
  if (line.length) out.push(pushed(line[line.length - 1], amount))
  return out
}

/** The pen of the borders: a line laid along a border, in ink or in a colour, trembles as the border's ink does, so that the two lie on one another. */
export const alongBorder = (line: ReadonlyArray<Point>) =>
  penned(line, 0.35, 1.5)

/** A number from 0 to 1 drawn from a place, the same every time: what is scattered there looks the same each time it is drawn. */
export function hash(x: number, y: number, salt: number): number {
  const h = Math.sin(x * 12.9898 + y * 78.233 + salt * 37.719) * 43758.5453
  return h - Math.floor(h)
}
