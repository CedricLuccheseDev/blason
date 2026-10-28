import { pointOn } from './roads'
import type { Spot } from './fronts'

// The men drawn for a side of a fight: an army's soldiers, or the peasants
// holding the land before it. Each man is kept from frame to frame, with his
// own place in the side, and runs to it, never set down elsewhere: in a
// column on the road, or in ranks facing the enemy, the first rank in front,
// as wide as the side was when it formed. When the side loses men, a man of
// the first rank falls where he stands and the last man of the rear steps
// into his place; the others keep theirs. A fresh man comes in at the back
// while the side is big enough for him. A few men stand for many, more for a
// greater side.

export type Kind = 'soldier' | 'peasant'

export type Man = {
  x: number
  y: number
  /** His place in the side: in ranks, the first rank first and its middle first; on the road, from the head back. */
  slot: number
  /** Faded in, 0 to 1; which way he looks; whether he runs; his own beat. */
  alpha: number
  facing: 1 | -1
  moving: boolean
  seed: number
}

export type Squad = {
  kind: Kind
  color: number
  men: Array<Man>
  /** Men a rank, set when the side forms; the side faded in or out as a whole; the men lost not yet shown falling. */
  wide: number
  alpha: number
  owed: number
}

/** How a side stands: in ranks behind a point, facing a way, or in a column on a road, its head so far along. */
export type Shape =
  | { line: 'ranks'; at: Spot; facing: Spot }
  | { line: 'column'; path: Array<Spot>; head: number }

/** Room between two men of a rank and between the ranks, between two men of a column, in map units. */
const ROOM = 3.6
const DEPTH = 3.4
const STRIDE = 4
/** A man's pace to his place, in map units a second: the armies' march (6 tiles a second), however far he is; nearer than so much, he stands. */
const RUN = 24
const STAND = 1.5
/** Men lost for each man shown falling, and men shown falling a tick at most. */
const PER_FALL = 10
const FALLS = 1

let beats = 0

/** Men shown for so many: a few for a skirmish, a dozen for a great army. */
export function figuresOf(men: number): number {
  return Math.max(
    3,
    Math.min(13, 2 + Math.floor(1.5 * Math.log2(1 + men / 20))),
  )
}

export function makeSquad(kind: Kind, color: number): Squad {
  return { kind, color, men: [], wide: 0, alpha: 0, owed: 0 }
}

/** Where a place of the side stands, as the side stands now. */
function placeOf(squad: Squad, slot: number, shape: Shape): Spot {
  if (shape.line === 'column')
    return pointOn(shape.path, shape.head - (slot * STRIDE) / 4)
  const { at, facing } = shape
  const { wide } = squad
  const across = { x: -facing.y, y: facing.x }
  const j = slot % wide
  const k = j % 2 === 0 ? j / 2 : -(j + 1) / 2
  const lateral = (k + (wide % 2 === 0 ? 0.5 : 0)) * ROOM
  const depth = Math.floor(slot / wide) * DEPTH
  return {
    x: at.x + across.x * lateral - facing.x * depth,
    y: at.y + across.y * lateral - facing.y * depth,
  }
}

/** The side as many men strong as it shows now: newcomers take the first places free, walking in faded out. */
function muster(squad: Squad, n: number, shape: Shape) {
  if (squad.wide === 0) squad.wide = Math.max(2, Math.ceil(n / 2))
  const taken = new Set(squad.men.map((m) => m.slot))
  let slot = 0
  while (squad.men.length < n) {
    while (taken.has(slot)) slot++
    taken.add(slot)
    const at = placeOf(squad, slot, shape)
    squad.men.push({
      ...at,
      slot,
      alpha: 0,
      facing: 1,
      moving: false,
      seed: beats++,
    })
  }
}

/** A man falls; the last man of the rear steps into his place. */
function strike(squad: Squad, man: Man, fall: (man: Man) => void) {
  squad.men = squad.men.filter((m) => m !== man)
  fall(man)
  const last = squad.men.reduce<Man | null>(
    (back, m) => (!back || m.slot > back.slot ? m : back),
    null,
  )
  if (last && last.slot > man.slot) last.slot = man.slot
}

/** Men lost: some of the first rank fall, as many as their worth says; the side shows fewer if it is smaller now. */
export function lose(
  squad: Squad,
  lost: number,
  n: number,
  fall: (man: Man) => void,
) {
  squad.owed += lost
  const front = () =>
    squad.men.reduce((a, m) => (m.slot < a.slot ? m : a), squad.men[0])
  for (let falls = 0; squad.owed >= PER_FALL && falls < FALLS; falls++) {
    if (squad.men.length === 0) break
    squad.owed -= PER_FALL
    strike(squad, front(), fall)
  }
  while (squad.men.length > n) {
    const last = squad.men.reduce(
      (a, m) => (m.slot > a.slot ? m : a),
      squad.men[0],
    )
    squad.men = squad.men.filter((m) => m !== last)
    fall(last)
  }
}

/** The side a frame further: as many men as it shows, each running to his place, facing where he runs, or the enemy once there. */
export function rally(squad: Squad, n: number, shape: Shape, dt: number) {
  muster(squad, n, shape)
  const ahead =
    shape.line === 'ranks'
      ? shape.facing
      : {
          x:
            pointOn(shape.path, shape.head + 1).x -
            pointOn(shape.path, shape.head).x,
          y: 0,
        }
  const look: 1 | -1 = ahead.x >= 0 ? 1 : -1
  for (const man of squad.men) {
    const to = placeOf(squad, man.slot, shape)
    const dx = to.x - man.x
    const dy = to.y - man.y
    const d = Math.hypot(dx, dy)
    const step = Math.min(d, RUN * dt)
    if (d > 0) {
      man.x += (dx / d) * step
      man.y += (dy / d) * step
    }
    man.moving = d > STAND
    const running: 1 | -1 = dx > 0 ? 1 : -1
    man.facing = man.moving && Math.abs(dx) > STAND / 2 ? running : look
    man.alpha = Math.min(1, man.alpha + dt / 0.4)
  }
}

/** The middle of a side's men; none while it has none. */
export function middle(men: Array<Man>): Spot | null {
  if (men.length === 0) return null
  let [x, y] = [0, 0]
  for (const man of men) {
    x += man.x
    y += man.y
  }
  return { x: x / men.length, y: y / men.length }
}
