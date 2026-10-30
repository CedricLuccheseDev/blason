import type { Point } from '../../engine'

export function flatten(ring: ReadonlyArray<Point>): Array<number> {
  return ring.flatMap(([x, y]) => [x, y])
}

const at = ([x, y]: Point) => `${x.toFixed(3)},${y.toFixed(3)}`

/**
 * Short runs joined end to end into long lines where one ends where another
 * begins: a coast given cell by cell, drawn as a few long lines, does not
 * pile a pen's round ends at every cell's corner.
 */
export function chain(
  runs: ReadonlyArray<ReadonlyArray<Point>>,
): Array<Array<Point>> {
  const starting = new Map<string, Array<number>>()
  runs.forEach((run, i) => {
    if (run.length < 2) return
    const k = at(run[0])
    starting.set(k, [...(starting.get(k) ?? []), i])
  })
  const used = new Uint8Array(runs.length)
  const lines: Array<Array<Point>> = []
  const take = (k: string) => {
    const list = starting.get(k) ?? []
    const i = list.find((j) => !used[j])
    if (i !== undefined) used[i] = 1
    return i
  }
  runs.forEach((run, i) => {
    if (used[i] || run.length < 2) return
    used[i] = 1
    const line = [...run]
    for (
      let next = take(at(line[line.length - 1]));
      next !== undefined;
      next = take(at(line[line.length - 1]))
    )
      line.push(...runs[next].slice(1))
    lines.push(line)
  })
  return lines
}

/**
 * A loop without the points that lie on a straight line between their two
 * neighbours: the same shape, fewer points to fill or stroke. A tiled
 * border's straight runs and even steps are such lines, traced and
 * smoothed; its curves keep every point.
 */
export function straighten(loop: ReadonlyArray<Point>): Array<Point> {
  const n = loop.length
  if (n < 4) return [...loop]
  const kept: Array<Point> = []
  for (let i = 0; i < n; i++) {
    const [ax, ay] = loop[(i + n - 1) % n]
    const [bx, by] = loop[i]
    const [cx, cy] = loop[(i + 1) % n]
    const [ux, uy, vx, vy] = [bx - ax, by - ay, cx - bx, cy - by]
    const turn = Math.abs(ux * vy - uy * vx)
    const ahead = ux * vx + uy * vy > 0
    if (!ahead || turn > 1e-6 * Math.hypot(ux, uy) * Math.hypot(vx, vy))
      kept.push(loop[i])
  }
  return kept.length >= 3 ? kept : [...loop]
}

/**
 * An open line with fewer points, none of those left out farther than
 * `within` from it (Douglas and Peucker): a line drawn wide away from what
 * it follows needs none of its smallest turns.
 */
export function simplify(
  line: ReadonlyArray<Point>,
  within: number,
): Array<Point> {
  const n = line.length
  if (n < 3) return [...line]
  const keep = new Uint8Array(n)
  keep[0] = keep[n - 1] = 1
  // Plain numbers all through, no list made a point: it runs on every
  // outline several times a second, and its garbage made the page stutter.
  const stack = new Int32Array(2 * n)
  let top = 0
  stack[top++] = 0
  stack[top++] = n - 1
  while (top > 0) {
    const b = stack[--top]
    const a = stack[--top]
    const ax = line[a][0]
    const ay = line[a][1]
    const dx = line[b][0] - ax
    const dy = line[b][1] - ay
    const length = Math.sqrt(dx * dx + dy * dy)
    let far = -1
    let gap = within
    for (let i = a + 1; i < b; i++) {
      const x = line[i][0]
      const y = line[i][1]
      const d =
        length > 0
          ? Math.abs(dx * (ay - y) - (ax - x) * dy) / length
          : Math.sqrt((x - ax) * (x - ax) + (y - ay) * (y - ay))
      if (d > gap) {
        far = i
        gap = d
      }
    }
    if (far < 0) continue
    keep[far] = 1
    stack[top++] = a
    stack[top++] = far
    stack[top++] = far
    stack[top++] = b
  }
  const kept: Array<Point> = []
  for (let i = 0; i < n; i++) if (keep[i] === 1) kept.push(line[i])
  return kept
}

/** A loop with fewer points, none of those left out farther than `within` from it. */
export function simplifyLoop(
  loop: ReadonlyArray<Point>,
  within: number,
): Array<Point> {
  if (loop.length < 4) return [...loop]
  const plain = simplify([...loop, loop[0]], within)
  plain.pop()
  return plain.length >= 3 ? plain : [...loop]
}
