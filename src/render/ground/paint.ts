import { mixColor } from '../ease'
import { TONE } from '../palette'
import { hill, hillShadow } from '../art/hill'
import { css, lw, wob } from '../art/ink'
import { cast } from '../art/light'
import { fir, firShadow, tree, treeShadow, tuft } from '../art/trees'
import { hash } from '../pen'
import { fades } from './detail'
import { ornaments } from './ornaments'
import type { Pen } from '../art/ink'
import type { Field } from './fields'
import type { Ornament, Span } from './ornaments'
import type { Terrain } from './terrain'
import type { Weights } from './weights'
import type { Grid } from '../../../engine'

// A stretch of the ground's decoration painted on a canvas, to be laid over
// the lords' washes and multiplied into them: what is painted here is not a
// colour but how much it darkens and greens the wash under it, so that the
// ink of the decoration takes the hue of each land (some 45 % of it), a
// foliage stays the land's colour barely greened and darkened, and nothing
// needs painting again when a land changes hands. Its strokes stay under
// 1.6 pixels and 70 % of ink: less than half a border's weight. Up close it
// steps back a little more, its tones nearer white and its strokes fainter,
// so that it bears the washes up and never vies with the game's marks. What
// stands on it casts its shadow in the map's one light (art/light.ts).

/** What the decoration does to the wash under it, multiplied in. */
const SHADE = {
  /** The decoration's ink: the wash at some 55 %, its own hue. */
  ink: 0x958a7e,
  /** A broadleaf's crown, a fir's: the wash greened and darkened a little. */
  tree: 0xe0e5d8,
  fir: 0xd4d7cc,
  /** A hill hides what is behind it, and leaves the wash as it is. */
  hill: 0xffffff,
  /** The sea's line on its wash. */
  ripple: 0xb2c2ca,
  /** Wheat, greens, tilled earth. */
  crops: [0xf0e9da, 0xe6eadd, 0xeae2da],
}

/** Up close, how much nearer white the decoration's tones go, and how much fainter its strokes. */
const QUIET = { tone: 0.3, alpha: 0.12 }
/** The cast shadows: how dark where they fall, and how soft their edge, in map units. */
const SHADOW = { alpha: 0.17, soft: 0.55 }

type Shade = typeof SHADE

/** The decoration's tones, stepped back towards white by so much. */
function quieted(k: number): Shade {
  const q = (c: number) => mixColor(c, TONE.white, k)
  return {
    ink: q(SHADE.ink),
    tree: q(SHADE.tree),
    fir: q(SHADE.fir),
    hill: SHADE.hill,
    ripple: q(SHADE.ripple),
    crops: SHADE.crops.map(q),
  }
}

export type Ground = {
  grid: Grid
  terrain: Terrain
  weights: Weights
  /** The fields of the villages that reach a box, in map units. */
  fieldsNear: (x0: number, y0: number, x1: number, y1: number) => Array<Field>
}

export type Box = { x0: number; y0: number; x1: number; y1: number }

/** Up close, the sea's ripples away from the shore. */
function ripples(
  p: Pen,
  ground: Ground,
  box: Box,
  alpha: number,
  color: number,
) {
  const { grid, terrain } = ground
  const g = p.g
  g.beginPath()
  const k = grid.size
  for (let r = Math.floor(box.y0 / k); r <= box.y1 / k; r++)
    for (let c = Math.floor(box.x0 / k); c <= box.x1 / k; c++) {
      const t = r * grid.width + c
      if (c < 0 || r < 0 || c >= grid.width || r >= grid.height) continue
      if (grid.land[t] || terrain.shore[t] < 2 || hash(c, r, 41) > 0.35)
        continue
      const [x, y] = [(c + hash(c, r, 42)) * k, (r + hash(c, r, 43)) * k]
      g.moveTo(x - 1.2, y)
      g.quadraticCurveTo(x - 0.6, y - 0.55, x, y)
      g.quadraticCurveTo(x + 0.6, y - 0.55, x + 1.2, y)
    }
  g.lineWidth = lw(p, 0.8)
  g.strokeStyle = css(color, alpha)
  g.stroke()
}

/** The fields, each a patch of its crop, ruled with furrows close or wide. */
function fields(
  p: Pen,
  list: Array<Field>,
  [shown, close]: readonly [number, boolean],
  shade: Shade,
) {
  const g = p.g
  for (const fd of list) {
    wob(p, fd.corners, 0.25, fd.x)
    g.fillStyle = css(shade.crops[fd.crop], shown)
    g.fill()
    g.lineWidth = lw(p, 0.6)
    g.strokeStyle = css(shade.ink, 0.22 * shown)
    g.stroke()
    g.save()
    g.clip()
    g.beginPath()
    const [dx, dy] = fd.dir
    for (let o = -fd.half; o <= fd.half; o += close ? 0.85 : 1.7) {
      const [ax, ay] = [fd.x + fd.across[0] * o, fd.y + fd.across[1] * o]
      g.moveTo(ax - dx * 4, ay - dy * 4)
      g.lineTo(ax + dx * 4, ay + dy * 4)
    }
    g.lineWidth = lw(p, 0.55)
    g.strokeStyle = css(shade.ink, 0.32 * shown)
    g.stroke()
    g.restore()
  }
}

/** The shadows the ornaments cast, all in one pass. */
function shadows(p: Pen, list: Array<Ornament>) {
  cast(p, SHADOW.alpha, SHADOW.soft, (g) => {
    for (const it of list) {
      g.globalAlpha = it.w
      if (it.kind === 'tree') treeShadow(g, [it.x, it.y, it.r])
      else if (it.kind === 'fir') firShadow(g, [it.x, it.y, it.r])
      else if (it.kind === 'hill')
        hillShadow(g, [it.x, it.y, it.bw, it.hh], it.h)
    }
  })
}

/** The decoration of a box, painted for so many pixels per tile on screen. */
export function paint(p: Pen, ground: Ground, box: Box, perTile: number) {
  const f = fades(perTile)
  const detail = f.near > 0.5 ? 2 : 1
  const shade = quieted(QUIET.tone * f.near)
  const faint = 1 - QUIET.alpha * f.near
  const g = p.g
  if (f.near > 0) ripples(p, ground, box, 0.6 * f.near * faint, shade.ripple)
  if (f.fields > 0)
    fields(
      p,
      ground.fieldsNear(box.x0 - 8, box.y0 - 8, box.x1 + 8, box.y1 + 8),
      [f.fields * faint, detail === 2],
      shade,
    )
  const k = ground.grid.size
  const span = {
    c0: Math.floor(box.x0 / k) - 3,
    c1: Math.ceil(box.x1 / k) + 2,
    r0: Math.floor(box.y0 / k) - 3,
    r1: Math.ceil(box.y1 / k) + 4,
  } satisfies Span
  const list = ornaments(
    ground.grid,
    ground.terrain,
    ground.weights,
    span,
    detail,
  )
  shadows(p, list)
  for (const it of list) {
    g.globalAlpha = (0.55 + 0.45 * it.w) * faint
    if (it.kind === 'tree')
      tree(p, [it.x, it.y, it.r], shade.tree, shade.ink, detail, it.h)
    else if (it.kind === 'fir')
      fir(p, [it.x, it.y, it.r], shade.fir, shade.ink, detail)
    else if (it.kind === 'hill')
      hill(p, [it.x, it.y, it.bw, it.hh], shade.hill, shade.ink, detail, it.h)
    else {
      g.globalAlpha = 1
      tuft(p, it.x, it.y, shade.ink, 0.32 * f.near * it.w * faint)
    }
  }
  g.globalAlpha = 1
}
