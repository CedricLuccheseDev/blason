import { cast } from './light'
import {
  CASTLE,
  CHURCH,
  MARKET,
  MILL,
  RIDGE,
  STALL,
  VILLAGE,
  back,
} from './plans'
import { box, drum, footing, solid } from './solid'
import { treeShadow } from './trees'
import type { Detail } from './house'
import type { Pen, Pt } from './ink'
import type { HousePlan } from './plans'
import type { Post } from './solid'

// The shadows the works cast in the map's one light (art/light.ts), from
// their plans (art/plans.ts): each house, the church, the mill, the keep,
// the curtain and its towers, the stalls and the heap of gold cast the
// shadow of their volume to the lower right, softened, and darken the
// ground right round their foot. Laid on a work's ground before what stands
// on it is drawn, so that they fall on the ground only. Local units.

/** The long shadows: how dark, how soft; the contact at the foot: how dark, how soft, how wide. */
const CAST = { alpha: 0.34, soft: 0.6 }
const CONTACT = { alpha: 0.34, soft: 0.3, margin: 0.3 }

function house([x, y, w, h, d]: HousePlan): Array<Post> {
  const o = back(d)
  const ridge = h + w * RIDGE
  return [
    ...box([x - w / 2, y], [x + w / 2, y], o, h),
    [x, y, ridge],
    [x + o[0], y + o[1], ridge],
  ]
}

function church([x, y]: Pt): Array<Array<Post>> {
  const { w, h, back: o, spire } = CHURCH.tower
  return [
    house(CHURCH.nave(x, y)),
    [
      ...box([x - w / 2, y], [x + w / 2, y], o, h),
      [x + o[0] / 2, y + o[1] / 2, h + spire + o[1] / 2],
    ],
  ]
}

function village(): Array<Array<Post>> {
  const [mx, my] = VILLAGE.mill
  return [
    ...VILLAGE.houses.map(house),
    ...church(VILLAGE.church),
    drum([mx, my, (MILL.half + MILL.top) / 2], MILL.h, MILL.cap),
  ]
}

/** A run of curtain wall, thin, with its merlons. */
const wall = (a: Pt, b: Pt): Array<Post> =>
  box(a, b, [0, -0.4], CASTLE.wall + 0.7)

function castle(): Array<Array<Post>> {
  const { keep, corners, backTower, frontTower, cone, gate } = CASTLE
  const { BL, BR, FL, FR } = corners
  const tower = ([x, y]: Pt, [r, h]: readonly [number, number]) =>
    drum([x, y, r], h, h + r * cone)
  return [
    [wall(BL, BR), wall(BL, FL), wall(FR, BR), wall(FL, FR)].flat(),
    box(
      [keep.x - keep.w / 2, keep.y],
      [keep.x + keep.w / 2, keep.y],
      keep.back,
      keep.h + 0.9,
    ),
    box([-gate.half, gate.front], [gate.half, gate.front], [0, -0.6], gate.h),
    tower(BL, backTower),
    tower(BR, backTower),
    tower(FL, frontTower),
    tower(FR, frontTower),
  ]
}

function market(): Array<Array<Post>> {
  const [hx, hy, hr] = MARKET.heap
  const [cx, cy] = MARKET.crates
  const { back: o, counter, awning } = STALL
  // A stall: its counter, and its awning over it, higher at the back.
  const stall = ([x, y, w]: readonly [number, number, number]) => {
    const [a, b]: [Pt, Pt] = [
      [x - w / 2, y],
      [x + w / 2, y],
    ]
    return [
      ...box(a, b, o, counter),
      ...box(a, b, o, awning).slice(0, 2),
      ...box(a, b, o, awning + 1.6).slice(2),
    ]
  }
  return [
    ...MARKET.stalls.map(stall),
    drum([hx, hy, hr], 0, hr * 0.95),
    box([cx - 2.2, cy + 0.2], [cx + 3.2, cy + 0.3], [0.4, -0.4], 1.6),
  ]
}

const PLANS = { village, castle, market }

/** The shadows of a work, laid on its ground before it is drawn. */
export function workShadows(p: Pen, work: keyof typeof PLANS, lod: Detail) {
  const solids = PLANS[work]()
  cast(p, CAST.alpha, CAST.soft, (g) => {
    for (const posts of solids) solid(g, posts)
    if (work === 'village' && lod === 2) treeShadow(g, VILLAGE.yew)
  })
  cast(p, CONTACT.alpha, CONTACT.soft, (g) => {
    for (const posts of solids) footing(g, posts, CONTACT.margin)
  })
}
