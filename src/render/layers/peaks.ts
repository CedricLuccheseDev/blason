import { Container, Graphics } from 'pixi.js'
import { flatten } from '../geometry'
import { hash } from '../pen'
import { TONE } from '../palette'
import type { Point, World } from '../../../engine'

// The high mountains (« des montagnes qui obstruent », Concept, 29/10): no
// one's land, closed to armies and caravans as the sea is, drawn as the old
// maps draw a range. Their ground washed in stone and ringed in ink on its
// outer edge alone; over it a chain of small mounts in staggered rows, of
// sizes drawn from their place (« les montagnes … énormes triangles », 30/10,
// one mount a cell came out too big), each standing in the map's light, its
// flank on the right in shadow and hatched, the tallest capped with snow, the
// lower ones laid over the higher. A pass is the gap the range leaves, no sign on it: two
// strokes facing each other read as brackets (« Y'a des parenthèses sur la
// carte »). Drawn once, in map units.

/** A mount against the room between two: its half width, its height. */
const [HALF, HIGH] = [0.62, 0.95]
/** The room between two mounts, against a cell's width (the median); between two rows, against that room. */
const [STEP, ROWS] = [0.5, 0.6]
/** The most mounts drawn: past it, the range is drawn in fewer, larger ones. */
const MOST = 6000
/** The mounts tall enough for snow, by their own number: the tallest third. */
const SNOWY = 0.62

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
): Point {
  const crest: Point = [x - half * 0.1 + (h - 0.5) * half * 0.3, y - high]
  const [left, right]: Array<Point> = [
    [x - half, y],
    [x + half, y],
  ]
  // The face in the light, then the flank turned from it.
  g.poly(flatten([left, crest, right])).fill(TONE.wall)
  const under: Point = [crest[0] + half * 0.18, y]
  g.poly(flatten([crest, right, under])).fill(TONE.stoneShade)
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
  return crest
}

/** Whether a point lies inside a cell's outline. */
function inside([x, y]: Point, ring: Array<Point>): boolean {
  let within = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [[xi, yi], [xj, yj]] = [ring[i], ring[j]]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      within = !within
  }
  return within
}

/** A snow cap on a mount's crest, down to a quarter of its height, its lower edge broken. */
function snow(g: Graphics, crest: Point, half: number, high: number) {
  const [cx, cy] = crest
  const [dx, dy] = [half * 0.28, high * 0.28]
  g.poly(
    flatten([
      crest,
      [cx + dx, cy + dy],
      [cx + half * 0.08, cy + dy - high * 0.06],
      [cx - half * 0.06, cy + dy + high * 0.02],
      [cx - dx, cy + dy],
    ]),
  ).fill(TONE.snow)
}

type Cell = ReturnType<typeof bounds> & { outline: Array<Point> }
type Foot = { x: number; y: number; h: number }

/** The mounts' feet over the range: a lattice of rows each set half a step aside, every foot shaken a little, kept where it falls in a cell. */
function feetOf(cells: Array<Cell>, step: number): Array<Foot> {
  const feet: Array<Foot> = []
  const rise = step * ROWS
  for (const c of cells) {
    const ys = c.outline.map(([, y]) => y)
    const [left, right] = [c.x - c.width / 2, c.x + c.width / 2]
    for (
      let row = Math.floor(Math.min(...ys) / rise);
      row * rise <= Math.max(...ys);
      row++
    )
      for (let col = Math.floor(left / step) - 1; col * step <= right; col++) {
        const h = hash(col, row, 11)
        const x = (col + (row % 2) * 0.5 + (h - 0.5) * 0.5) * step
        const y = (row + (hash(row, col, 5) - 0.5) * 0.5) * rise
        if (inside([x, y], c.outline)) feet.push({ x, y, h })
      }
  }
  return feet
}

export function makePeaks(world: World) {
  const container = new Container()
  const g = container.addChild(new Graphics())
  if (world.peaks.length === 0) return { container }
  for (const { outline } of world.peaks) g.poly(flatten(outline))
  g.fill(TONE.stone)
  for (const [a, b] of rim(world.peaks)) g.moveTo(...a).lineTo(...b)
  g.stroke({ width: 1.6, color: TONE.ink, join: 'round', cap: 'round' })
  const cells = world.peaks.map(({ outline }) => ({
    outline,
    ...bounds(outline),
  }))
  const widths = cells.map((c) => c.width).sort((a, b) => a - b)
  let step = widths[Math.floor(widths.length / 2)] * STEP
  let feet = feetOf(cells, step)
  // The great ranges of the world's maps in fewer, larger mounts, drawn at once.
  if (feet.length > MOST) {
    step *= Math.sqrt(feet.length / MOST)
    feet = feetOf(cells, step)
  }
  // The lower ones last, laid over those behind them.
  feet.sort((p, q) => p.y - q.y)
  for (const f of feet) {
    const size = step * (0.7 + f.h * 0.7)
    const [half, high] = [size * HALF, size * HIGH]
    const crest = mount(g, f.x, f.y, half, high, f.h)
    if (f.h > SNOWY) snow(g, crest, half, high)
  }
  return { container }
}
