import { Container, Graphics } from 'pixi.js'
import { flatten } from '../geometry'
import { hash } from '../pen'
import { TONE } from '../palette'
import type { Point, World } from '../../../engine'

// The high mountains (« des montagnes qui obstruent », Concept, 29/10): no
// one's land, closed to armies and caravans as the sea is, drawn as the old
// maps draw a range. Their ground washed in stone and ringed in ink on its
// outer edge alone; on each of their cells a mount standing in the map's
// light, its flank on the right in shadow and hatched, the lower ones laid
// over the higher; and at each pass, where the land goes through, two short
// strokes facing each other. Drawn once, in map units.

/** A mount against its cell's width: its half width, its height. */
const [HALF, HIGH] = [0.48, 0.8]

const key = ([x, y]: Point) => `${x.toFixed(2)},${y.toFixed(2)}`

/** The sides of the cells that border no other mountain cell: the range's outer edge. */
function rim(peaks: World['peaks']): Array<[Point, Point]> {
  const seen = new Map<string, [Point, Point] | null>()
  for (const { outline } of peaks)
    outline.forEach((a, i) => {
      const b = outline[(i + 1) % outline.length]
      const [p, q] = [key(a), key(b)]
      const side = p < q ? `${p}|${q}` : `${q}|${p}`
      seen.set(side, seen.has(side) ? null : [a, b])
    })
  return [...seen.values()].filter((s) => s !== null)
}

/** A cell's middle and its width. */
function bounds(outline: Array<Point>) {
  const xs = outline.map(([x]) => x)
  const ys = outline.map(([, y]) => y)
  const [left, right] = [Math.min(...xs), Math.max(...xs)]
  const [top, bottom] = [Math.min(...ys), Math.max(...ys)]
  return { x: (left + right) / 2, y: (top + bottom) / 2, width: right - left }
}

/** A mount with its foot's middle at (x, y), so wide each side and so high, its crest a little off by its own number `h`. */
function mount(
  g: Graphics,
  x: number,
  y: number,
  half: number,
  high: number,
  h: number,
) {
  const crest: Point = [x - half * 0.1 + (h - 0.5) * half * 0.3, y - high]
  const [left, right]: Array<Point> = [
    [x - half, y],
    [x + half, y],
  ]
  // The face in the light, then the flank turned from it.
  g.poly(flatten([left, crest, right])).fill(TONE.wall)
  const under: Point = [crest[0] + half * 0.18, y]
  g.poly(flatten([crest, right, under])).fill(TONE.stoneDark)
  // Hatches down the shadowed flank.
  for (let k = 1; k <= 3; k++) {
    const t = k / 4
    const [ax, ay] = [
      crest[0] + (right[0] - crest[0]) * t,
      crest[1] + (right[1] - crest[1]) * t,
    ]
    g.moveTo(ax, ay).lineTo(ax - half * 0.12, ay + high * 0.22)
  }
  g.stroke({ width: Math.max(0.5, half * 0.06), color: TONE.ink, alpha: 0.55 })
  // The contour, over the crest.
  g.moveTo(...left)
    .lineTo(...crest)
    .lineTo(...right)
  g.stroke({
    width: Math.max(0.8, half * 0.1),
    color: TONE.ink,
    join: 'round',
    cap: 'round',
  })
}

/** A pass: two short strokes bowed away from each other, across the way through. */
function pass(g: Graphics, [x, y]: Point, size: number) {
  for (const side of [-1, 1]) {
    const sx = x + side * size * 0.45
    g.moveTo(sx, y - size * 0.6).quadraticCurveTo(
      sx + side * size * 0.35,
      y,
      sx,
      y + size * 0.6,
    )
  }
  g.stroke({ width: size * 0.16, color: TONE.ink, cap: 'round' })
}

export function makePeaks(world: World) {
  const container = new Container()
  const g = container.addChild(new Graphics())
  if (world.peaks.length === 0) return { container }
  for (const { outline } of world.peaks) g.poly(flatten(outline))
  g.fill(TONE.stone)
  for (const [a, b] of rim(world.peaks)) g.moveTo(...a).lineTo(...b)
  g.stroke({ width: 1.6, color: TONE.ink, join: 'round', cap: 'round' })
  const cells = world.peaks.map(({ outline }) => bounds(outline))
  const width = cells.reduce((sum, c) => sum + c.width, 0) / cells.length
  // The lower ones last, laid over those behind them.
  for (const c of [...cells].sort((p, q) => p.y - q.y)) {
    const h = hash(c.x, c.y, 7)
    const size = c.width * (0.85 + h * 0.3)
    mount(g, c.x, c.y + size * HIGH * 0.35, size * HALF, size * HIGH, h)
  }
  for (const at of world.passes) pass(g, at, width * 0.5)
  return { container }
}
