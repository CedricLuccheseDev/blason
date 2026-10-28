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
