import { mixColor } from '../ease'
import { TONE } from '../palette'
import { church, house } from './house'
import {
  EARTH,
  THATCH,
  WOOD_DARK,
  add,
  css,
  ellipse,
  fillInk,
  halo,
  lerp,
  line,
  poly,
  wob,
} from './ink'
import { tree } from './trees'
import type { Detail } from './house'
import type { Pen, Pt } from './ink'

// A lord's village: houses gathered round the church, back to front, their
// roofs taking a little of their lord's colour (38 %), a windmill and a
// well. From afar, three gabled houses round a church tower and its spire,
// the spire the tell, cut out of the wash by a halo of parchment. Its
// mill's sails and its chimneys' smoke are the village's life, drawn apart
// (ground/life.ts). Local units, some 24 across.

/** Each house: x, y, width, height, depth. */
const HOUSES: ReadonlyArray<readonly [number, number, number, number, number]> =
  [
    [-5.6, -2.4, 3.0, 2.0, 3.0],
    [4.6, -3.0, 2.8, 1.9, 2.6],
    [-1.0, -3.6, 2.6, 1.8, 2.6],
    [-7.4, 1.4, 3.2, 2.1, 3.0],
    [-3.2, 2.0, 3.4, 2.3, 3.2],
    [3.0, 1.2, 3.1, 2.1, 2.9],
    [6.8, 2.8, 2.8, 1.9, 2.6],
  ]
const CHURCH: Pt = [0.6, -0.6]
const MILL: Pt = [11.2, 1.2]
/** The mill's hub, where its sails turn. */
export const HUB: Pt = [MILL[0] - 0.1, MILL[1] - 5.9]

/** The tops of the chimneys that smoke, every other house's. */
export const CHIMNEYS: ReadonlyArray<Pt> = HOUSES.filter(
  (_, n) => n % 2 === 0,
).map(([x, y, w, h, d]) => {
  const o: Pt = [d * 0.62, -d * 0.42]
  const apex: Pt = [x, y - h - w * 0.62]
  const Bt: Pt = [x + w / 2, y - h]
  const r0 = add(apex, [0, -0.1])
  const r1 = add(add(apex, o), [0.1, -0.1])
  const r2 = add(add(Bt, o), [0.25, 0.15])
  const r3 = add(Bt, [0.25, 0.15])
  const base = lerp(lerp(r0, r1, 0.62), lerp(r3, r2, 0.62), 0.3)
  return [base[0], base[1] - 1.2]
})

const roofOf = (n: number, color: number) =>
  mixColor(TONE.roofs[n % TONE.roofs.length], color, 0.38)

/** The windmill's tower and its cap; its sails turn apart. */
function mill(p: Pen, lod: Detail) {
  const [x, y] = MILL
  const g = p.g
  ellipse(p, x + 0.8, y + 0.2, 2.6, 0.6)
  g.fillStyle = css(TONE.ink, 0.12)
  g.fill()
  const body: ReadonlyArray<Pt> = [
    [x - 1.5, y],
    [x + 1.5, y],
    [x + 1, y - 5.2],
    [x - 1, y - 5.2],
  ]
  wob(p, body, 0.05, 41)
  fillInk(p, TONE.wall, 1)
  if (lod === 2) {
    g.save()
    poly(p, body)
    g.clip()
    g.beginPath()
    for (let k = 0; k < 7; k++) {
      g.moveTo(x + 0.5 + k * 0.18, y)
      g.lineTo(x + 0.3 + k * 0.12, y - 5.2)
    }
    g.lineWidth = 0.5 / p.px
    g.strokeStyle = css(TONE.ink, 0.3)
    g.stroke()
    g.restore()
    g.beginPath()
    g.rect(x - 0.35, y - 1.4, 0.7, 1.4)
    fillInk(p, TONE.door, 0.5)
  }
  wob(
    p,
    [
      [x - 1.4, y - 5.1],
      [x + 1.4, y - 5.1],
      [x + 0.2, y - 7],
    ],
    0.04,
    43,
  )
  fillInk(p, THATCH, 1)
}

/** The village drawn, at mid distance (1) or up close (2). */
export function villageNear(p: Pen, color: number, lod: Detail) {
  const g = p.g
  ellipse(p, 0.5, 2.5, 11.5, 3.6)
  g.fillStyle = css(EARTH, 0.35)
  g.fill()
  if (lod === 2) {
    // A lane of beaten earth through the houses.
    g.beginPath()
    g.moveTo(-12, 4.6)
    g.quadraticCurveTo(-2, 0.4, 4, 4.2)
    g.quadraticCurveTo(8, 6.6, 12.5, 4)
    g.lineWidth = 1.4
    g.strokeStyle = css(EARTH, 0.8)
    g.lineCap = 'round'
    g.stroke()
  }
  mill(p, lod)
  const items = [
    ...HOUSES.map((h, n) => ({ y: h[1], n })),
    { y: CHURCH[1], n: -1 },
  ].sort((a, b) => a.y - b.y)
  for (const { n } of items) {
    if (n < 0) church(p, CHURCH[0], CHURCH[1], lod, 17)
    else
      house(p, HOUSES[n], roofOf(n, color), lod, n * 7 + 3, {
        doorLeft: n % 2 === 0,
      })
  }
  if (lod < 2) return
  // A tree in the churchyard, a well by the lane.
  tree(
    p,
    [-9.8, -1.6, 1.5],
    mixColor(TONE.page, 0x6b7a3a, 0.35),
    TONE.ink,
    2,
    0.4,
  )
  ellipse(p, 1.4, 5.2, 0.8, 0.35)
  fillInk(p, TONE.stone, 0.7)
  line(
    p,
    [
      [0.8, 5.1],
      [0.8, 3.6],
      [2, 3.6],
      [2, 5.1],
    ],
    0.7,
    WOOD_DARK,
  )
}

const gable = ([x, y, w, h]: readonly [
  number,
  number,
  number,
  number,
]): Array<Pt> => [
  [x - w / 2, y],
  [x - w / 2, y - h],
  [x, y - h - w * 0.55],
  [x + w / 2, y - h],
  [x + w / 2, y],
]

/** From afar: three gabled houses round a church tower and its spire; the spire the tell. */
export function villageFar(p: Pen, color: number) {
  const houses = [
    [-6.2, 2.6, 5.4, 3.4],
    [6.4, 2.2, 5.2, 3.2],
    [0.2, 4.6, 5.8, 3.6],
  ] as const
  const tower: ReadonlyArray<Pt> = [
    [-0.4, 1],
    [-0.4, -6.6],
    [3, -6.6],
    [3, 1],
  ]
  const spire: ReadonlyArray<Pt> = [
    [-0.8, -6.4],
    [1.3, -12.6],
    [3.4, -6.4],
  ]
  for (const shape of [tower, spire, ...houses.map(gable)]) {
    poly(p, shape)
    halo(p)
  }
  poly(p, tower)
  fillInk(p, TONE.stone, 1.3)
  poly(p, spire)
  fillInk(p, TONE.slate, 1.3)
  for (const hs of houses) {
    const [x, y, w, h] = hs
    poly(p, gable(hs))
    fillInk(p, TONE.wall, 1.3)
    const ridge = y - h - w * 0.62
    poly(p, [
      [x - w / 2 - 0.5, y - h + 0.2],
      [x, ridge],
      [x + w / 2 + 0.5, y - h + 0.2],
      [x + w / 2 - 0.4, y - h + 0.9],
      [x, ridge + 1.4],
      [x - w / 2 + 0.4, y - h + 0.9],
    ])
    fillInk(p, mixColor(0xa0553a, color, 0.35), 1.1)
    p.g.beginPath()
    p.g.rect(x - 0.6, y - 1.8, 1.2, 1.8)
    p.g.fillStyle = css(TONE.door)
    p.g.fill()
  }
}
