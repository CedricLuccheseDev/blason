import { TONE } from '../../palette'
import { css, light, shade } from '../ink'

// The painter's kit for the men, little painted miniatures inked as the rest
// of the map. Each man is drawn twice: his base, everything but his lord's
// colour, and his dye, the parts in his lord's colour in greys only, laid
// under the base and tinted on the map; the base leaves a hole where the
// dye shows. So one drawing serves every lord. The light comes from the
// upper left of the screen, whichever way the man faces: each part is lit on
// that side and shaded on the other, its ink heavier on the shaded side.

export type Layer = 'base' | 'dye'

/** Where a man is being drawn: the canvas in his local units, which way he faces on screen, and which of his two layers. */
export type Sketch = {
  g: CanvasRenderingContext2D
  face: 1 | -1
  layer: Layer
}

/** What a part is painted in: a colour of its own, or the lord's. */
export type Tone = number | 'dye'

/** The dye's greys: lit, plain, shaded; tinted by the lord's colour on the map. */
const DYE = { lit: 0xffffff, plain: 0xe2e2e2, shade: 0x9a9a9a }
/** How far the shade and the light creep into a part, in local units. */
const SHADE = 0.55
const LIT = 0.4
/** The ink round a part, in local units, and how much heavier on the shaded side. */
export const INK = 0.32
const HEAVY = 0.14

/** The light falls from the screen's left: in local units, from behind a man facing right, from before one facing left. */
const toLight = (sk: Sketch) => -sk.face

/** A part filled, lit on the light's side and shaded on the other; in the dye's greys without a colour. */
function paint(sk: Sketch, path: Path2D, color: number | null) {
  const { g } = sk
  const lx = toLight(sk)
  const [lit, plain, dark] =
    color === null
      ? [DYE.lit, DYE.plain, DYE.shade]
      : [light(color, 0.22), color, shade(color, 0.32)]
  g.save()
  g.fillStyle = css(lit)
  g.fill(path)
  g.clip(path)
  const body = new Path2D()
  body.addPath(path, { e: -lx * LIT, f: LIT })
  g.fillStyle = css(plain)
  g.fill(body)
  const crescent = new Path2D()
  crescent.rect(-40, -40, 80, 80)
  crescent.addPath(path, { e: lx * SHADE, f: -SHADE * 0.8 })
  g.fillStyle = css(dark)
  g.fill(crescent, 'evenodd')
  g.restore()
}

/** The path's ink: a line all round, heavier on the shaded side, as a pen pressing down. */
export function inkOf(sk: Sketch, path: Path2D, width = INK) {
  if (sk.layer !== 'base') return
  const { g } = sk
  g.lineJoin = 'round'
  g.lineCap = 'round'
  g.strokeStyle = css(TONE.ink)
  g.lineWidth = width
  g.stroke(path)
  const heavy = new Path2D()
  heavy.addPath(path, { e: -toLight(sk) * HEAVY, f: HEAVY })
  g.stroke(heavy)
}

/** A part painted and inked: in its own colour on the base, or in the lord's on the dye and cut out of the base. */
export function part(sk: Sketch, path: Path2D, tone: Tone, width = INK) {
  const { g } = sk
  if (tone === 'dye') {
    if (sk.layer === 'dye') paint(sk, path, null)
    else {
      g.save()
      g.globalCompositeOperation = 'destination-out'
      g.fill(path)
      g.restore()
    }
  } else if (sk.layer === 'base') paint(sk, path, tone)
  if (width > 0) inkOf(sk, path, width)
}

/** A line of so many units wide in a colour, inked round: a shaft, a limb, a strap. Base only. */
export function stick(
  sk: Sketch,
  pts: ReadonlyArray<readonly [number, number]>,
  width: number,
  color: number,
  edge = INK * 0.8,
) {
  if (sk.layer !== 'base' || pts.length < 2) return
  const path = new Path2D()
  path.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1])
  const { g } = sk
  g.lineJoin = 'round'
  g.lineCap = 'round'
  if (edge > 0) {
    g.strokeStyle = css(TONE.ink)
    g.lineWidth = width + edge * 2
    g.stroke(path)
  }
  g.strokeStyle = css(color)
  g.lineWidth = width
  g.stroke(path)
}

/** A fine line of ink or of a colour, uninked: a seam, a trim, a strand. Base only. */
export function hair(
  sk: Sketch,
  path: Path2D,
  width: number,
  color: number = TONE.ink,
  alpha = 1,
) {
  if (sk.layer !== 'base') return
  const { g } = sk
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.strokeStyle = css(color, alpha)
  g.lineWidth = width
  g.stroke(path)
}

/** A path of straight sides through these points. */
export function shape(pts: ReadonlyArray<readonly [number, number]>): Path2D {
  const path = new Path2D()
  path.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1])
  path.closePath()
  return path
}

export function oval(x: number, y: number, rx: number, ry: number, turn = 0) {
  const path = new Path2D()
  path.ellipse(x, y, rx, ry, turn, 0, Math.PI * 2)
  return path
}

export type Pt = readonly [number, number]

/** A point so far from another along an angle measured from straight down, turning forward. */
export const swing = (from: Pt, length: number, angle: number): Pt => [
  from[0] + Math.sin(angle) * length,
  from[1] + Math.cos(angle) * length,
]
