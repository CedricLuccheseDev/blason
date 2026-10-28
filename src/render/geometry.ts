import type { Point } from '../../engine'

export function flatten(ring: ReadonlyArray<Point>): Array<number> {
  return ring.flatMap(([x, y]) => [x, y])
}
