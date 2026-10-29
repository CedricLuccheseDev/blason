import { landAhead } from './ahead'
import { css } from './art/ink'
import { mixColor } from './ease'
import { chain, simplify } from './geometry'
import { TONE } from './palette'
import type { MapSize, Point, World } from '../../engine'

// The land of a game to come, drawn small on a canvas for its card on the
// home: the very land the game will have, made from its seed and kept for
// it (ahead.ts). As the map shows it from afar at the opening: the sea's
// pale wash with lines along its shores, fading outwards (layers/lands.ts),
// the land parchment, its woods, hills and mountains a shade darker
// (ground/tones.ts), the coast in ink; its lines measured in the card's
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
/** Canvas pixels drawn per pixel of the page, at most. */
const SHARPEST = 2

/** Draws the land of the game to come on the canvas, as sharp as the canvas is laid out. */
export function sketchGame(
  canvas: HTMLCanvasElement,
  seed: string,
  size: MapSize,
): void {
  const world = landAhead(seed, size)
  const ratio = Math.min(SHARPEST, window.devicePixelRatio || 1)
  canvas.width = Math.round(canvas.clientWidth * ratio)
  canvas.height = Math.round(canvas.clientHeight * ratio)
  const g = canvas.getContext('2d')
  if (g) sketch(g, world, ratio)
}

function sketch(g: CanvasRenderingContext2D, world: World, ratio: number) {
  const { width, height } = g.canvas
  g.fillStyle = css(TONE.seaWash)
  g.fillRect(0, 0, width, height)
  // The whole land, as large as the canvas holds it, in its middle.
  const scale = Math.min(width / world.width, height / world.height)
  const [dx, dy] = [width - world.width * scale, height - world.height * scale]
  const at = new DOMMatrix([scale, 0, 0, scale, dx / 2, dy / 2])
  g.setTransform(at)
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
  // The darker lands washed in, kept within the coast.
  g.save()
  g.clip(land)
  g.resetTransform()
  g.imageSmoothingQuality = 'high'
  const soft = relief(world, at, [width, height], SOFT * ratio)
  g.drawImage(soft, 0, 0, width, height)
  g.restore()
  g.lineWidth = INK * px
  g.strokeStyle = css(TONE.ink)
  g.stroke(coast)
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
function cells(land: World['land']): Path2D {
  const path = new Path2D()
  for (const { outline } of land) {
    trace(path, outline)
    path.closePath()
  }
  return path
}
