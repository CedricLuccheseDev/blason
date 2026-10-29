import { CanvasSource, Texture } from 'pixi.js'
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
// on (0, 0) in local units, a work some 22 across as the map's.

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

/** A work's span on the map, in map units, and the least it may show on screen, in pixels. */
export const WORK_SPAN = 22
const MIN_PX = 30
/** The level of detail of a work drawn so many pixels across: the silhouette, the drawing, the illustration. */
export function workLod(px: number): Lod {
  if (px < 64) return 0
  return px < 130 ? 1 : 2
}
/** A work's scale against the map, at so many pixels per map unit: never under 30 pixels on screen. */
export const workScale = (zoom: number) =>
  Math.max(1, MIN_PX / (WORK_SPAN * zoom))

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
