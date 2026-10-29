import { coastline } from './coastline'
import { along, dome, dot, lengthwise, many, rim, tools, turn } from './bench'
import type { Bench, Spot } from './bench'
import type { ShapeKind } from './shapes'

// The families of lands, as the relief generator raises them: each a recipe
// of the sculptor's tools (sculpt.ts), its masses, its ranges, its gulfs and
// its peninsulas laid where the family wants them and drawn by the seed. The
// same six intentions as the first generator's shapes, a continent the sea
// rings round, a coast, an inland sea, two lands and a neck, a strip between
// two seas, a land the fjords cut, but raised as a land is, so that their
// coasts come out of their relief rather than out of a figure. The masses
// are rounded before the coast's own features are cut, so that a fjord or a
// narrow gulf keeps its edges. A family more is a recipe more.

type Recipe = {
  /** The share of the cells under the sea, the least and the most, in thousandths. */
  sea: readonly [number, number]
  raise: (b: Bench) => void
}

const RECIPES: Readonly<Record<ShapeKind, Recipe>> = {
  continent: {
    sea: [500, 580],
    raise(b) {
      const t = tools(b)
      const d = lengthwise(b)
      const middle: Spot = [b.rand(-0.1, 0.1) * b.aspect, b.rand(-0.05, 0.05)]
      dome(b, middle, d, b.rand(0.3, 0.45), b.rand(0.22, 0.3), 0.5)
      // Lobes of the land, some reaching far: its great peninsulas.
      for (let i = 0, n = Math.floor(b.rand(4, 7)); i < n; i++) {
        const h = b.heading()
        t.hill(
          along(middle, [h[0] * 1.6, h[1] * 0.8], b.rand(0.2, 0.38)),
          b.rand(0.4, 0.7),
          b.rand(0.1, 0.18),
        )
      }
      for (let i = 0, n = Math.floor(b.rand(1, 3)); i < n; i++) {
        const r = b.heading()
        const centre = along(middle, b.heading(), b.rand(0, 0.12))
        t.ridge(
          along(centre, r, -b.rand(0.18, 0.3)),
          along(centre, r, b.rand(0.18, 0.3)),
          b.rand(0.6, 0.8),
          0.055,
        )
      }
      rim(b, 0.18)
      t.round()
      coastline(b, Math.floor(b.rand(1, 3)), ['sound'])
      coastline(b, many(b, 7, 11), [
        'peninsula',
        'peninsula',
        'gulf',
        'bay',
        'cape',
      ])
    },
  },
  coast: {
    sea: [260, 350],
    raise(b) {
      const t = tools(b)
      const d = b.heading()
      const side = turn(d)
      // The land rises away from the sea, which lies towards d, to a plateau.
      b.lay((u, v) => Math.min(0.3, -(u * d[0] + v * d[1]) * 1.6))
      const shore = along([0, 0], d, b.rand(0.05, 0.15))
      for (let i = 0, n = Math.floor(b.rand(3, 5)); i < n; i++)
        t.hill(
          along(along(shore, d, -b.rand(0.1, 0.4)), side, b.rand(-0.6, 0.6)),
          b.rand(0.3, 0.5),
          b.rand(0.15, 0.25),
        )
      const ridge = along(shore, d, -b.rand(0.12, 0.22))
      t.ridge(
        along(ridge, side, -b.rand(0.4, 0.7)),
        along(ridge, side, b.rand(0.4, 0.7)),
        b.rand(0.65, 0.85),
        0.07,
      )
      if (b.rand(0, 1) < 0.6) {
        const inland = along(ridge, side, b.rand(-0.4, 0.4))
        t.ridge(inland, along(inland, d, -b.rand(0.3, 0.5)), 0.6, 0.06)
      }
      t.round()
      coastline(b, Math.floor(b.rand(0, 2)), ['sound'])
      coastline(b, many(b, 6, 9), ['peninsula', 'gulf', 'gulf', 'bay', 'cape'])
    },
  },
  inland: {
    sea: [200, 280],
    raise(b) {
      const t = tools(b)
      b.lay(() => 0.5)
      const middle: Spot = [b.rand(-0.12, 0.12) * b.aspect, b.rand(-0.06, 0.06)]
      t.hill(middle, -1.2, 0.3)
      for (let i = 0, n = Math.floor(b.rand(2, 4)); i < n; i++) {
        const d = b.heading()
        t.ridge(
          along(middle, d, 0.05),
          along(middle, d, b.rand(0.3, 0.45)),
          -b.rand(0.5, 0.8),
          0.05,
        )
      }
      for (let i = 0, n = Math.floor(b.rand(1, 3)); i < n; i++) {
        const d = b.heading()
        const start = along(middle, d, b.rand(0.3, 0.4))
        const way = b.rand(0, 1) < 0.5 ? -1 : 1
        t.ridge(
          start,
          along(start, turn(d), b.rand(0.35, 0.55) * way),
          b.rand(0.6, 0.8),
          0.06,
        )
      }
      t.round()
      coastline(b, many(b, 5, 8), ['peninsula', 'gulf', 'bay', 'cape'])
    },
  },
  isthmus: {
    sea: [440, 520],
    raise(b) {
      const t = tools(b)
      const d = lengthwise(b)
      const axis: Spot = [d[0] * b.aspect * 0.5, d[1] * 0.5]
      const reach = b.rand(0.5, 0.58)
      const lands = [along([0, 0], axis, -reach), along([0, 0], axis, reach)]
      for (const land of lands) {
        dome(b, land, b.heading(), b.rand(0.22, 0.28), b.rand(0.18, 0.24), 0.7)
        for (let i = 0, n = Math.floor(b.rand(2, 4)); i < n; i++)
          t.hill(along(land, b.heading(), b.rand(0.12, 0.22)), 0.45, 0.12)
        const r = b.heading()
        t.ridge(
          along(land, r, -0.17),
          along(land, r, 0.17),
          b.rand(0.6, 0.8),
          0.06,
        )
      }
      // The strait between the lands, and the neck over it.
      b.lay((u, v) => {
        const off = Math.abs(u * d[0] + v * d[1]) / 0.1
        return off < 1 ? -0.5 * (1 - off) : 0
      })
      rim(b, 0.12)
      t.round()
      t.spine(along(lands[0], d, 0.1), along(lands[1], d, -0.1), 1, 0.05)
      coastline(b, many(b, 6, 9), ['peninsula', 'gulf', 'bay', 'cape'])
    },
  },
  strip: {
    sea: [340, 420],
    raise(b) {
      const t = tools(b)
      const d = lengthwise(b)
      const long: Spot = [d[0] * b.aspect * 0.5, d[1] * 0.5]
      const middle: Spot = [b.rand(-0.08, 0.08), b.rand(-0.06, 0.06)]
      const side = turn(d)
      b.lay((u, v) => 0.4 - Math.abs(dot(u, v, middle, side)) * 3)
      t.ridge(
        along(middle, long, -1.1),
        along(middle, long, 1.1),
        b.rand(0.6, 0.75),
        0.06,
      )
      for (let i = 0, n = Math.floor(b.rand(2, 4)); i < n; i++)
        t.hill(along(middle, long, b.rand(-0.8, 0.8)), 0.35, 0.15)
      t.round()
      coastline(b, many(b, 7, 10), ['peninsula', 'gulf', 'cape'])
    },
  },
  fjords: {
    sea: [300, 380],
    raise(b) {
      const t = tools(b)
      const d = b.heading()
      const side = turn(d)
      b.lay((u, v) => Math.min(0.3, -(u * d[0] + v * d[1]) * 1.4))
      const shore = along([0, 0], d, b.rand(0.1, 0.2))
      const crest = along(shore, d, -0.14)
      t.ridge(
        along(crest, side, -0.8),
        along(crest, side, 0.8),
        b.rand(0.7, 0.9),
        0.08,
      )
      for (let i = 0, n = Math.floor(b.rand(2, 4)); i < n; i++)
        t.hill(
          along(along(shore, d, -b.rand(0.25, 0.45)), side, b.rand(-0.6, 0.6)),
          0.4,
          0.2,
        )
      t.round()
      coastline(b, many(b, 8, 11), ['fjord', 'fjord', 'fjord', 'peninsula'])
    },
  },
}

export function recipeOf(kind: ShapeKind): Recipe {
  return RECIPES[kind]
}
