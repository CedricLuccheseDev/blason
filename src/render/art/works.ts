import { CanvasSource, Texture } from 'pixi.js'
import { smoothstep } from '../ease'
import { TONE } from '../palette'
import { sharpest } from '../quality'
import { castleFar, castleNear } from './castle'
import { marketFar, marketNear } from './market'
import { villageFar, villageNear } from './village'
import type { Graphics } from 'pixi.js'
import type { Detail } from './house'
import type { Pen } from './ink'
import type { Work } from '../../../engine'

// The works as the close-up boards draw them, each at three levels of
// detail: 0 the silhouette from afar, a bold shape cut out of the wash by a
// halo of parchment; 1 the drawing at mid distance; 2 the illustration up
// close. Each drawn once per lord's colour and level into a texture, centred
// on (0, 0) in local units, a work some 22 across as the map's. Up close a
// work stands at the map's scale; from afar, where the map is the
// strategist's, it shrinks faster than the land to a small mark, so that
// the lands' colours, names and armies read first and there is room
// round them: another's market goes, the trade's roads standing for it,
// and another's work goes once it would be a speck; the player's own stay
// small marks.

export type Lod = 0 | Detail

const ART: Record<
  Work,
  {
    far: (p: Pen, color: number) => void
    near: (p: Pen, color: number, lod: Detail) => void
  }
> = {
  village: { far: villageFar, near: villageNear },
  castle: { far: castleFar, near: castleNear },
  market: { far: marketFar, near: marketNear },
}

/** A work's span on the map, in map units, and the size on screen from which it stands at the map's scale, in pixels. */
export const WORK_SPAN = 22
const FULL = 24
/** The least the player's own work shows, in pixels; under how many another's goes, and from how many it is whole. */
const MARK = 8
const SPECK = [5, 8] as const
/** The sizes over which another's market comes back, its roads standing for it from afar; what is told over the works, closer still. */
const MARKET = [15, 22] as const
const TOLD = [18, 26] as const

/** The level of detail of a work drawn so many pixels across: the silhouette, the drawing, the illustration. */
export function workLod(px: number): Lod {
  if (px < 64) return 0
  return px < 130 ? 1 : 2
}
/** A work's scale against the map, at so many pixels per map unit: the map's from 24 pixels up; under, it shrinks twice as fast as the map, some 14 pixels at the whole land's zoom; the player's own never under 8. */
export function workScale(zoom: number, mine = false): number {
  const span = WORK_SPAN * zoom
  const k = Math.min(1, span / FULL)
  return mine ? Math.max(k, MARK / span) : k
}
/** A work's size on screen at so many pixels per map unit, in pixels: another's; the player's own never under a mark. */
export const workPx = (zoom: number, mine = false) =>
  WORK_SPAN * zoom * workScale(zoom, mine)
/** How much of another's work shows when the map draws works so many pixels across: none once a speck, his market only closer. */
export function workShown(work: Work, px: number): number {
  const speck = smoothstep(...SPECK, px)
  return work === 'market' ? speck * smoothstep(...MARKET, px) : speck
}
/** How much of what is told over the works shows (a levy's seal, another's building), when they are drawn so many pixels across: none on the strategist's map, all from mid distance. */
export const toldShown = (px: number) => smoothstep(...TOLD, px)

/** The box every drawing fits in, in local units, and the screen pixels per unit each level is drawn for. */
export const BOX = { left: -15, top: -19, width: 32, height: 30 }
const SHARP: Record<Lod, number> = { 0: 2.2, 1: 4.4, 2: 9 }

type Frame = typeof BOX

/** A canvas drawn at so many pixels per local unit, over a box. */
export function canvasFor(
  px: number,
  draw: (p: Pen) => void,
  box: Frame = BOX,
): HTMLCanvasElement {
  const res = px * sharpest()
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(box.width * res)
  canvas.height = Math.ceil(box.height * res)
  const g = canvas.getContext('2d')
  if (!g) return canvas
  g.setTransform(res, 0, 0, res, -box.left * res, -box.top * res)
  draw({ g, px })
  return canvas
}

export const textureOf = (canvas: HTMLCanvasElement) =>
  new Texture({
    source: new CanvasSource({ resource: canvas, autoGenerateMipmaps: true }),
  })

const made = new Map<string, Texture>()

/** A work in a lord's colour at a level of detail, drawn the first time it is asked for; the texture spans BOX. */
export function workTexture(work: Work, color: number, lod: Lod): Texture {
  const key = `${work}:${color}:${lod}`
  let texture = made.get(key)
  if (!texture) {
    texture = textureOf(
      canvasFor(SHARP[lod], (p) =>
        lod === 0 ? ART[work].far(p, color) : ART[work].near(p, color, lod),
      ),
    )
    made.set(key, texture)
  }
  return texture
}

/** A work's silhouette laid in a graphics, centred on (0, 0) at the map's scale: the ghost of a work about to be built. */
export function drawWork(
  g: Graphics,
  work: Work,
  color: number = TONE.stoneDark,
): void {
  g.texture(
    workTexture(work, color, 0),
    0xffffff,
    BOX.left,
    BOX.top,
    BOX.width,
    BOX.height,
  )
}
