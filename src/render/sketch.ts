import { landAhead } from './ahead'
import { css } from './art/ink'
import { DEAD } from './layers/lands'
import { mixColor } from './ease'
import { chain, simplify } from './geometry'
import { TONE } from './palette'
import { RULES, halfWidthAt } from '../../engine'
import type { Land, Point, World } from '../../engine'

// The land of a game to come, drawn small on a canvas for its card on the
// home: the very land the game will have, made from its seed and kept for
// it (ahead.ts). As the map shows it from afar at the opening: the sea's
// pale wash with lines along its shores, fading outwards (layers/lands.ts),
// the land parchment, its woods, hills and mountains a shade darker
// (ground/tones.ts), the high mountains in stone with a mount on each of
// their cells (layers/peaks.ts), the coast in ink; its lines measured in the card's
// pixels rather than the map's units, so they read at that size.

/** How much darker than the parchment each kind of land is: the plain bare. */
const DARKER: Partial<Record<World['land'][number]['biome'], number>> = {
  forest: 0.08,
  hills: 0.06,
  mountains: 0.13,
}
/** The lines along the shores: how many pixels out, and how strong against the sea's wash. */
const SHORES = [
  [2.5, 0.9],
  [5.5, 0.7],
  [9.5, 0.45],
  [14.5, 0.25],
] as const
/** The lines' width, and the coast's ink, in pixels. */
const [LINE, INK] = [0.8, 1.3]
/** Pixels of the page a pixel of the darker lands spans, stretched: how soft their edges. */
const SOFT = 3
/** Pixels of the page over which a map in a list fades into the sea at its frame. */
const FADE = 14
/** Canvas pixels drawn per pixel of the page, at most. */
const SHARPEST = 2

/** Draws the land of the game to come on the canvas, as sharp as the canvas is laid out. */
export function sketchGame(
  canvas: HTMLCanvasElement,
  seed: string,
  land: Land,
  /** The whole land in the sea round it, as a list of maps shows it; else covering the canvas. */
  whole = false,
): void {
  const world = landAhead(seed, land)
  const ratio = Math.min(SHARPEST, window.devicePixelRatio || 1)
  canvas.width = Math.round(canvas.clientWidth * ratio)
  canvas.height = Math.round(canvas.clientHeight * ratio)
  const g = canvas.getContext('2d')
  if (g) sketch(g, world, ratio, whole)
}

function sketch(
  g: CanvasRenderingContext2D,
  world: World,
  ratio: number,
  whole: boolean,
) {
  const { width, height } = g.canvas
  g.fillStyle = css(TONE.seaWash)
  g.fillRect(0, 0, width, height)
  // The land covering the canvas, in its middle: on a card of another
  // shape, cut at its sides rather than floating in the sea (« grossis en
  // hauteur l'area partie publique »); or, in a list of maps, its land in
  // play whole and in the middle, the rest of the map round it as far as
  // the card goes (« fais pas les rectangles sur les maps … rend ça mieux »).
  // In a list, the land whole, never cut (« je veux la map complète »), as
  // little as may be past the map's frame: a land cut by the frame showed a
  // straight edge there and a pale band beyond (« problème de trait »,
  // « bandes claires »); it fades into the sea at its frame (FADE).
  const frame = whole
    ? boundsOf(world)
    : { x: 0, y: 0, w: world.width, h: world.height }
  const cover = Math.max(width / world.width, height / world.height)
  const scale = whole ? Math.min(width / frame.w, height / frame.h) : cover
  // The land's middle, moved for the card to show as little past the frame as may be.
  const within = (middle: number, half: number, side: number) =>
    2 * half >= side ? side / 2 : Math.min(Math.max(middle, half), side - half)
  const [dx, dy] = [
    width / 2 -
      within(frame.x + frame.w / 2, width / 2 / scale, world.width) * scale,
    height / 2 -
      within(frame.y + frame.h / 2, height / 2 / scale, world.height) * scale,
  ]
  const at = new DOMMatrix([scale, 0, 0, scale, dx, dy])
  g.setTransform(at)
  // Nothing drawn past the frame: the lines along a shore the frame cuts
  // came round its ends there.
  g.beginPath()
  g.rect(0, 0, world.width, world.height)
  g.clip()
  /** A pixel of the page, in the map's units. */
  const px = ratio / scale
  const coast = new Path2D()
  for (const run of chain(world.coast)) trace(coast, simplify(run, px / 2))
  // Each line is the coast drawn wide in its colour, then a little less wide
  // in the sea's: what is left runs at that distance from every shore (the
  // land, laid over, hides the inner half).
  g.lineJoin = 'round'
  g.lineCap = 'round'
  for (const [out, strength] of [...SHORES].reverse()) {
    g.lineWidth = (2 * out + LINE) * px
    g.strokeStyle = css(mixColor(TONE.seaWash, TONE.seaLine, strength))
    g.stroke(coast)
    g.lineWidth = (2 * out - LINE) * px
    g.strokeStyle = css(TONE.seaWash)
    g.stroke(coast)
  }
  const land = cells(world.land)
  g.fillStyle = css(TONE.page)
  g.fill(land)
  // The dead land, others' than the map's own, brown-black (layers/lands.ts).
  if (world.dead.length > 0) {
    g.fillStyle = css(DEAD)
    g.fill(cells(world.dead))
  }
  // The darker lands washed in, kept within the coast.
  g.save()
  g.clip(land)
  g.resetTransform()
  g.imageSmoothingQuality = 'high'
  const soft = relief(world, at, [width, height], SOFT * ratio)
  g.drawImage(soft, 0, 0, width, height)
  g.restore()
  rivers(g, world, px)
  mountains(g, world, px)
  g.lineWidth = INK * px
  g.strokeStyle = css(TONE.ink)
  g.stroke(coast)
  // The map's edge, as its frame's inner rule: on a card wider than the
  // land, a land that runs to it is cut there, not in the open sea. In a
  // list of maps, none: the map runs on to the card's edge.
  if (!whole) g.strokeRect(0, 0, world.width, world.height)
  else fade(g, world, FADE * px)
}

/** The map's frame dissolved into the sea round it, over `soft` of the map's units: no land cut straight. */
function fade(g: CanvasRenderingContext2D, world: World, soft: number) {
  const { width: w, height: h } = world
  const sea = css(TONE.seaWash)
  const clear = css(TONE.seaWash, 0)
  const sides: Array<[number, number, number, number]> = [
    [0, 0, soft, 0],
    [w, 0, w - soft, 0],
    [0, 0, 0, soft],
    [0, h, 0, h - soft],
  ]
  for (const [x0, y0, x1, y1] of sides) {
    const wash = g.createLinearGradient(x0, y0, x1, y1)
    wash.addColorStop(0, sea)
    wash.addColorStop(1, clear)
    g.fillStyle = wash
    g.fillRect(0, 0, w, h)
  }
}

/** The land in play's bounds, a little sea round it, within the map's frame: what a card of a list shows whole. */
function boundsOf(world: World) {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const { outline } of world.land)
    for (const [x, y] of outline) {
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x)
      y1 = Math.max(y1, y)
    }
  const pad = Math.max(x1 - x0, y1 - y0) * 0.05
  x0 = Math.max(0, x0 - pad)
  y0 = Math.max(0, y0 - pad)
  x1 = Math.min(world.width, x1 + pad)
  y1 = Math.min(world.height, y1 + pad)
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

/** The high mountains, as the map draws them small (layers/peaks.ts): their ground in stone, and on each of their cells a mount in ink, `px` a pixel of the page in the map's units. */
/** A river's course in so many stretches, each one stroke as wide as its middle: a few strokes a river, as on the map (ground/rivers.ts). */
const STRETCHES = 3

/** The rivers, water as the sea's (engine/map/streams.ts): the sea's wash between the coast's ink, as wide as on the map, a line at least. */
function rivers(g: CanvasRenderingContext2D, world: World, px: number) {
  g.lineCap = 'round'
  g.lineJoin = 'round'
  for (const [extra, color] of [
    [INK * px, css(TONE.ink)],
    [0, css(TONE.seaWash)],
  ] as const)
    for (const river of world.rivers) {
      const n = river.length
      const step = Math.max(1, Math.ceil((n - 1) / STRETCHES))
      for (let from = 0; from < n - 1; from += step) {
        const to = Math.min(n - 1, from + step)
        const wide =
          (2 * halfWidthAt((from + to) / 2, n) + 0.4) * RULES.tileSize
        g.beginPath()
        g.moveTo(...river[from])
        for (let i = from + 1; i <= to; i++) g.lineTo(...river[i])
        g.lineWidth = Math.max(LINE * px, wide) + extra
        g.strokeStyle = color
        g.stroke()
      }
    }
}

function mountains(g: CanvasRenderingContext2D, world: World, px: number) {
  if (world.peaks.length === 0) return
  const ground = new Path2D()
  const mounts = new Path2D()
  for (const { outline } of world.peaks) {
    trace(ground, outline)
    ground.closePath()
    const xs = outline.map(([x]) => x)
    const ys = outline.map(([, y]) => y)
    const w = Math.max(...xs) - Math.min(...xs)
    const [x, y] = [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2,
    ]
    mounts.moveTo(x - w * 0.38, y + w * 0.22)
    mounts.lineTo(x, y - w * 0.3)
    mounts.lineTo(x + w * 0.38, y + w * 0.22)
  }
  g.fillStyle = css(TONE.stone)
  g.fill(ground)
  g.lineWidth = INK * px * 0.8
  g.strokeStyle = css(TONE.ink)
  g.stroke(mounts)
}

/**
 * The darker lands, on a canvas `coarse` times coarser than the sketch's:
 * stretched over it, their edges come soft, as a wash's, the cells' corners
 * lost (as the works' shadows are softened, art/shadows.ts).
 */
function relief(
  world: World,
  at: DOMMatrix,
  [width, height]: readonly [number, number],
  coarse: number,
): HTMLCanvasElement {
  const small = document.createElement('canvas')
  small.width = Math.ceil(width / coarse)
  small.height = Math.ceil(height / coarse)
  const g = small.getContext('2d')
  if (!g) return small
  const shrink = new DOMMatrix().scale(
    small.width / width,
    small.height / height,
  )
  g.setTransform(shrink.multiply(at))
  for (const [biome, k] of Object.entries(DARKER)) {
    g.fillStyle = css(mixColor(TONE.page, TONE.ink, k))
    g.fill(cells(world.land.filter((cell) => cell.biome === biome)))
  }
  return small
}

/** A line of points added to a path. */
function trace(path: Path2D, line: ReadonlyArray<Point>) {
  line.forEach(([x, y], i) => (i === 0 ? path.moveTo(x, y) : path.lineTo(x, y)))
}

/** Cells of land as one shape, filled at once so that no seam shows between two. */
function cells(land: ReadonlyArray<{ outline: Array<Point> }>): Path2D {
  const path = new Path2D()
  for (const { outline } of land) {
    trace(path, outline)
    path.closePath()
  }
  return path
}
