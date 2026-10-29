// The line of an alliance between two lords' capitals: a cord bowed a
// little to one side, its ends kept clear of their names, as on the
// diplomacy board (direction A, "the heralds"). Only its shape, in map
// units: the cord that snaps when an alliance is broken is drawn from it
// (art/snap.ts).

/** A place of the map, in map units. */
export type Spot = { x: number; y: number }

export type Cord = {
  from: Spot
  control: Spot
  to: Spot
  /** Where its seal sits: the middle of the curve. */
  middle: Spot
}

/** How far the cord bows, against its length. */
const BOW = 0.1

/** The cord from `a` to `b`, cut `trimA` and `trimB` short of them; none when nothing would be left of it. */
export function cordBetween(
  a: Spot,
  b: Spot,
  trimA: number,
  trimB: number,
): Cord | null {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const length = Math.hypot(dx, dy)
  if (length <= trimA + trimB) return null
  const [ux, uy] = [dx / length, dy / length]
  const from = { x: a.x + ux * trimA, y: a.y + uy * trimA }
  const to = { x: b.x - ux * trimB, y: b.y - uy * trimB }
  const bow = (length - trimA - trimB) * BOW
  const control = {
    x: (from.x + to.x) / 2 - uy * bow,
    y: (from.y + to.y) / 2 + ux * bow,
  }
  return { from, control, to, middle: pointOn({ from, control, to }, 0.5) }
}

/** The point of a cord at `t`, from 0 at its start to 1 at its end. */
export function pointOn(
  cord: Pick<Cord, 'from' | 'control' | 'to'>,
  t: number,
): Spot {
  const [p, c, q] = [cord.from, cord.control, cord.to]
  const u = 1 - t
  return {
    x: u * u * p.x + 2 * u * t * c.x + t * t * q.x,
    y: u * u * p.y + 2 * u * t * c.y + t * t * q.y,
  }
}

/** Its length, near enough, in map units. */
export function lengthOf(cord: Cord): number {
  const { from, control, to } = cord
  return (
    (Math.hypot(control.x - from.x, control.y - from.y) +
      Math.hypot(to.x - control.x, to.y - control.y) +
      Math.hypot(to.x - from.x, to.y - from.y)) /
    2
  )
}
