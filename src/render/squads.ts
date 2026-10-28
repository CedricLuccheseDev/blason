import { pointOn } from './roads'
import type { Spot } from './fronts'

// The men drawn for a side of a fight: an army's soldiers, or the peasants
// holding the land before it. Each man is kept from frame to frame and runs
// to his place, never set down elsewhere: in a column on the road, or in two
// ranks facing the enemy, the first rank in front. When the side loses men,
// a man of the first rank falls where he stands and those behind step up; a
// fresh man comes in at the back while the side is big enough for him. A
// few men stand for many, more for a greater side.

export type Kind = 'soldier' | 'peasant'

export type Man = {
  x: number
  y: number
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
  /** The side faded in or out as a whole, and the men lost not yet shown falling. */
  alpha: number
  owed: number
}

/** Room between two men of a rank and between the ranks, between two men of a column, in map units. */
const ROOM = 3.6
const DEPTH = 3.4
const STRIDE = 4
/** A man's pace when he runs to his place, in map units a second, faster the farther he is. */
const RUN = 26
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
  return { kind, color, men: [], alpha: 0, owed: 0 }
}

/** Places in two ranks behind a point, facing a way: the first rank first, the middle of each rank first. */
export function ranks(at: Spot, facing: Spot, n: number): Array<Spot> {
  const across = { x: -facing.y, y: facing.x }
  const wide = Math.ceil(n / 2)
  return Array.from({ length: n }, (_, i) => {
    const row = i < wide ? 0 : 1
    const j = row === 0 ? i : i - wide
    const k = j % 2 === 0 ? j / 2 : -(j + 1) / 2
    const lateral = (k + (wide % 2 === 0 ? 0.5 : 0)) * ROOM
    const depth = row * DEPTH
    return {
      x: at.x + across.x * lateral - facing.x * depth,
      y: at.y + across.y * lateral - facing.y * depth,
    }
  })
}

/** Places one behind the other on a road, from its head back. */
export function column(
  path: Array<Spot>,
  head: number,
  n: number,
): Array<Spot> {
  return Array.from({ length: n }, (_, i) =>
    pointOn(path, head - (i * STRIDE) / 4),
  )
}

/** As many men as the side shows now: newcomers walk in at the back, faded out. */
export function muster(squad: Squad, n: number, places: Array<Spot>) {
  while (squad.men.length < n) {
    const at = places.at(squad.men.length) ?? places.at(-1) ?? { x: 0, y: 0 }
    squad.men.push({ ...at, alpha: 0, facing: 1, moving: false, seed: beats++ })
  }
}

/** Men lost: some of the first rank fall, as many as their worth says, and the side shows fewer if it is smaller now. */
export function lose(
  squad: Squad,
  lost: number,
  n: number,
  fall: (man: Man) => void,
) {
  squad.owed += lost
  let falls = 0
  while (squad.owed >= PER_FALL && falls < FALLS && squad.men.length > 0) {
    squad.owed -= PER_FALL
    falls += 1
    fall(squad.men.shift() as Man)
  }
  while (squad.men.length > n) fall(squad.men.shift() as Man)
}

/** Every man a frame closer to his place, facing where he runs, or the enemy once there. */
export function move(
  squad: Squad,
  places: Array<Spot>,
  facing: Spot,
  dt: number,
) {
  const look: 1 | -1 = facing.x >= 0 ? 1 : -1
  squad.men.forEach((man, i) => {
    const to = places.at(i) ?? places.at(-1) ?? man
    const dx = to.x - man.x
    const dy = to.y - man.y
    const d = Math.hypot(dx, dy)
    const step = Math.min(d, Math.max(RUN, d * 3) * dt)
    if (d > 0) {
      man.x += (dx / d) * step
      man.y += (dy / d) * step
    }
    man.moving = d > 0.6
    const running: 1 | -1 = dx > 0 ? 1 : -1
    man.facing = man.moving && Math.abs(dx) > 0.3 ? running : look
    man.alpha = Math.min(1, man.alpha + dt / 0.4)
  })
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
