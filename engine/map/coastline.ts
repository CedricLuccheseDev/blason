import { along, tools, turn } from './bench'
import type { Bench, Spot } from './bench'

// The coast's own features, set by a recipe once its masses are rounded:
// each stands on the coast the masses draw at the sea's share and is turned
// out to sea from there, so that none is lost inland or at sea. On a larger
// map they keep their size in map units, smaller in its heights, and there
// are more of them (bench.ts, many). A feature more is a line of this table.

/** The coast's own features, each turned out to sea from where it stands. */
export type Feature = 'peninsula' | 'gulf' | 'sound' | 'bay' | 'cape' | 'fjord'

/** Each draws its feature at a spot of the coast, `out` the way to sea and `side` along the coast, both `fine` long. */
const FEATURES: Readonly<
  Record<
    Feature,
    (b: Bench, at: Spot, out: Spot, side: Spot, fine: number) => void
  >
> = {
  // A low ridge reaching out to sea, a little bent.
  peninsula(b, at, out, side, fine) {
    const bend = along(out, side, b.rand(-0.35, 0.35))
    tools(b, fine).spine(
      along(at, out, -0.05),
      along(at, bend, b.rand(0.12, 0.26)),
      b.rand(0.45, 0.6),
      0.045,
    )
  },
  // A trough from the sea into the land, opening on a bay at its end.
  gulf(b, at, out, side, fine) {
    const t = tools(b, fine)
    const end = along(
      along(at, out, -b.rand(0.1, 0.2)),
      side,
      b.rand(-0.06, 0.06),
    )
    t.ridge(along(at, out, 0.08), end, -b.rand(0.45, 0.65), 0.05)
    if (b.rand(0, 1) < 0.5) t.hill(end, -b.rand(0.3, 0.45), 0.06)
  },
  // A great gulf, deep into the land, widening at its end: a sound.
  sound(b, at, out, side, fine) {
    const t = tools(b, fine)
    const end = along(
      along(at, out, -b.rand(0.22, 0.32)),
      side,
      b.rand(-0.1, 0.1),
    )
    t.ridge(along(at, out, 0.08), end, -b.rand(0.5, 0.7), 0.07)
    t.hill(end, -b.rand(0.4, 0.55), b.rand(0.08, 0.12))
  },
  bay(b, at, out, _, fine) {
    tools(b, fine).hill(
      along(at, out, -0.03),
      -b.rand(0.45, 0.6),
      b.rand(0.06, 0.09),
    )
  },
  cape(b, at, out, _, fine) {
    tools(b, fine).hill(along(at, out, 0.03), b.rand(0.35, 0.5), 0.05)
  },
  // Long and narrow, cut deep into the land.
  fjord(b, at, out, side, fine) {
    tools(b, fine).ridge(
      along(at, out, 0.1),
      along(along(at, out, -b.rand(0.2, 0.36)), side, b.rand(-0.08, 0.08)),
      -b.rand(0.75, 1),
      0.02,
    )
  },
}

/**
 * So many features along the coast the masses draw, each drawn among the
 * kinds given, on a stretch of coast away from the others.
 */
export function coastline(
  b: Bench,
  count: number,
  kinds: ReadonlyArray<Feature>,
) {
  const shore = b.shore()
  if (shore.length === 0) return
  const fine = 1 / b.side
  const placed: Array<Spot> = []
  const crowded = (p: Spot) =>
    placed.some(
      (q) =>
        (p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]) <
        0.01 * fine * fine,
    )
  for (let i = 0; i < count; i++) {
    let pick = shore[Math.floor(b.rand(0, 1) * shore.length)]
    for (let k = 0; k < 8 && crowded(pick.at); k++)
      pick = shore[Math.floor(b.rand(0, 1) * shore.length)]
    placed.push(pick.at)
    const kind = kinds[Math.floor(b.rand(0, 1) * kinds.length)]
    const out: Spot = [pick.out[0] * fine, pick.out[1] * fine]
    FEATURES[kind](b, pick.at, out, turn(out), fine)
  }
}
