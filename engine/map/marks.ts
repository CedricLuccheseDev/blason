import { drawInt } from '../numbers'
import { DIRECTIONS } from './noise'

// The coast's own features, laid over the family's lines: a peninsula
// reaching far out to sea, a bay bitten into the land, a cape. Each is set
// on the coast the ground already draws and turned to face the open sea, so
// that none is lost in the middle of the land or of the sea. Positions are
// in heights of the map from its middle, as the shapes' are.

/** A height at a point, in heights of the map from its middle. */
type Relief = (x: number, y: number) => number

type Kind = 'peninsula' | 'bay' | 'cape'

/** The kinds, as often as they are drawn: peninsulas and bays the most. */
const KINDS: ReadonlyArray<Kind> = [
  'peninsula',
  'peninsula',
  'bay',
  'bay',
  'cape',
]

/**
 * Each kind's length and width (the least, and how much more at most), how
 * it lifts the ground (below 0 it digs), and where its middle lies from the
 * coast along its axis, in lengths: out to sea above 0, into the land below.
 */
const FORM: Readonly<
  Record<
    Kind,
    {
      long: readonly [number, number]
      wide: readonly [number, number]
      lift: number
      out: number
    }
  >
> = {
  peninsula: { long: [0.13, 0.12], wide: [0.03, 0.025], lift: 1.4, out: 0.7 },
  bay: { long: [0.06, 0.07], wide: [0.05, 0.05], lift: -1.4, out: -0.5 },
  cape: { long: [0.05, 0.04], wide: [0.04, 0.03], lift: 1.1, out: 0.35 },
}

type Mark = {
  x: number
  y: number
  dx: number
  dy: number
  long: number
  wide: number
  lift: number
}

/** A value in [0, 1] from the seed. */
const unit = (seed: string, ...keys: Array<string | number>) =>
  drawInt(seed, 1001, 'mark', ...keys) / 1000

/** The height the sea will rise to, near enough: the share of a lattice of points below it. */
function levelOf(ground: Relief, aspect: number, share: number): number {
  const samples: Array<number> = []
  for (let i = 0; i < 48; i++)
    for (let j = 0; j < 28; j++)
      samples.push(
        ground(((i + 0.5) / 48 - 0.5) * aspect, (j + 0.5) / 28 - 0.5),
      )
  samples.sort((a, b) => a - b)
  return samples[Math.floor((samples.length * share) / 1000)]
}

/** Of the sixteen directions, the one the ground falls fastest towards: the open sea. */
function seaward(
  ground: Relief,
  x: number,
  y: number,
): readonly [number, number] {
  const e = 0.02
  const gx = ground(x + e, y) - ground(x - e, y)
  const gy = ground(x, y + e) - ground(x, y - e)
  let best = DIRECTIONS[0]
  for (const d of DIRECTIONS)
    if (-(gx * d[0] + gy * d[1]) > -(gx * best[0] + gy * best[1])) best = d
  return best
}

/** Of a few points drawn, the one nearest the coast and not too near the marks already set. */
function onCoast(
  seed: string,
  i: number,
  ground: Relief,
  level: number,
  aspect: number,
  set: Array<Mark>,
): readonly [number, number] {
  let best: readonly [number, number] = [0, 0]
  let score = Infinity
  for (let c = 0; c < 24; c++) {
    const x = (unit(seed, 'x', i, c) - 0.5) * (aspect - 0.12)
    const y = (unit(seed, 'y', i, c) - 0.5) * 0.88
    const crowd = set.some(
      (m) => (m.x - x) * (m.x - x) + (m.y - y) * (m.y - y) < 0.03,
    )
    const s = Math.abs(ground(x, y) - level) + (crowd ? 1 : 0)
    if (s < score) [best, score] = [[x, y], s]
  }
  return best
}

/**
 * So many features on the coast of this ground, whose sea takes so much of
 * the land in thousandths; `fine` shrinks them on larger maps, which have
 * more of them, so that their coasts stay as detailed.
 */
export function coastMarks(
  seed: string,
  ground: Relief,
  share: number,
  aspect: number,
  count: number,
  fine: number,
): Relief {
  const level = levelOf(ground, aspect, share)
  const marks: Array<Mark> = []
  for (let i = 0; i < count; i++) {
    const kind = KINDS[drawInt(seed, KINDS.length, 'mark kind', i)]
    const form = FORM[kind]
    const long = (form.long[0] + form.long[1] * unit(seed, 'long', i)) * fine
    const wide = (form.wide[0] + form.wide[1] * unit(seed, 'wide', i)) * fine
    const [cx, cy] = onCoast(seed, i, ground, level, aspect, marks)
    const [dx, dy] = seaward(ground, cx, cy)
    const x = cx + dx * long * form.out
    const y = cy + dy * long * form.out
    marks.push({ x, y, dx, dy, long, wide, lift: form.lift })
  }
  return (x, y) => {
    let sum = 0
    for (const m of marks) {
      const along = (x - m.x) * m.dx + (y - m.y) * m.dy
      const across = (x - m.x) * m.dy - (y - m.y) * m.dx
      const dome =
        1 -
        (along * along) / (m.long * m.long) -
        (across * across) / (m.wide * m.wide)
      if (dome > 0) sum += m.lift * dome
    }
    return sum
  }
}
