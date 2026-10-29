import { mixColor } from '../ease'
import { TONE } from '../palette'
import { church } from './church'
import { house } from './house'
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
import { MILL, RIDGE, VILLAGE, back } from './plans'
import { workShadows } from './shadows'
import { trodden } from './solid'
import { tree } from './trees'
import type { Detail } from './house'
import type { Pen, Pt } from './ink'

// A lord's village: houses gathered round the church, back to front, their
// roofs taking a little of their lord's colour (38 %), a windmill and a
// well, all standing in the map's one light on a patch of trodden earth,
// casting their shadows on it (art/shadows.ts). From afar, three gabled
// houses round a church tower and its spire, the spire the tell, cut out
// of the wash by a halo of parchment. Its mill's sails and its chimneys'
// smoke are the village's life, drawn apart (ground/life.ts). Local units,
// some 24 across.

const HOUSES = VILLAGE.houses
/** The mill's hub, where its sails turn. */
export const HUB: Pt = [VILLAGE.mill[0] - 0.1, VILLAGE.mill[1] - 5.9]

/** The tops of the chimneys that smoke, every other house's. */
export const CHIMNEYS: ReadonlyArray<Pt> = HOUSES.filter(
  (_, n) => n % 2 === 0,
).map(([x, y, w, h, d]) => {
  const o = back(d)
  const apex: Pt = [x, y - h - w * RIDGE]
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

/** A round body lit from the left: light on its left, shade deepening to its right. */
function litRound(p: Pen, x0: number, x1: number) {
  const wash = p.g.createLinearGradient(x0, 0, x1, 0)
  wash.addColorStop(0, css(TONE.white, 0.18))
  wash.addColorStop(0.45, css(TONE.ink, 0))
  wash.addColorStop(1, css(TONE.ink, 0.3))
  p.g.fillStyle = wash
  p.g.fill()
}

/** The windmill's tower and its cap; its sails turn apart. */
function mill(p: Pen, lod: Detail) {
  const [x, y] = VILLAGE.mill
  const { half, top, h, cap } = MILL
  const g = p.g
  const body: ReadonlyArray<Pt> = [
    [x - half, y],
    [x + half, y],
    [x + top, y - h],
    [x - top, y - h],
  ]
  wob(p, body, 0.05, 41)
  fillInk(p, TONE.wall, 1)
  poly(p, body)
  litRound(p, x - half, x + half)
  if (lod === 2) {
    g.save()
    poly(p, body)
    g.clip()
    g.beginPath()
    for (let k = 0; k < 7; k++) {
      g.moveTo(x + 0.5 + k * 0.18, y)
      g.lineTo(x + 0.3 + k * 0.12, y - h)
    }
    g.lineWidth = 0.5 / p.px
    g.strokeStyle = css(TONE.ink, 0.3)
    g.stroke()
    g.restore()
    g.beginPath()
    g.rect(x - 0.35, y - 1.4, 0.7, 1.4)
    fillInk(p, TONE.door, 0.5)
  }
  const roof: ReadonlyArray<Pt> = [
    [x - 1.4, y - h + 0.1],
    [x + 1.4, y - h + 0.1],
    [x + 0.2, y - cap],
  ]
  wob(p, roof, 0.04, 43)
  fillInk(p, THATCH, 1)
  poly(p, roof)
  litRound(p, x - 1.4, x + 1.4)
}

/** The village drawn, at mid distance (1) or up close (2). */
export function villageNear(p: Pen, color: number, lod: Detail) {
  const g = p.g
  trodden(p, [0.5, 1.6, 12.5, 5], 0.5)
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
  workShadows(p, 'village', lod)
  mill(p, lod)
  const items = [
    ...HOUSES.map((h, n) => ({ y: h[1], n })),
    { y: VILLAGE.church[1], n: -1 },
  ].sort((a, b) => a.y - b.y)
  for (const { n } of items) {
    if (n < 0) church(p, VILLAGE.church[0], VILLAGE.church[1], lod, 17)
    else
      house(p, HOUSES[n], roofOf(n, color), lod, n * 7 + 3, {
        doorLeft: n % 2 === 0,
      })
  }
  if (lod < 2) return
  // A tree in the churchyard, a well by the lane.
  tree(p, VILLAGE.yew, mixColor(TONE.page, 0x6b7a3a, 0.35), TONE.ink, 2, 0.4)
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
