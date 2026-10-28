import { CanvasSource, Container, Rectangle, Sprite, Texture } from 'pixi.js'
import { RES, anchorOf, cellOf, drawSheet } from './art/men/atlas'
import { LOOKS } from './art/men/looks'
import { FIGHT, WALK } from './art/men/pose'
import { TONE } from './palette'
import { css } from './art/ink'
import type { Layer } from './art/men/kit'
import type { Look } from './art/men/looks'
import type { Sheet } from './art/men/atlas'

// The men as the map lays them: each look's sheet (art/men/atlas.ts) made a
// texture once, every frame of it a sprite's texture; a man is two sprites,
// his dye tinted in his lord's colour under his base, standing on a soft
// shadow multiplied into the land. Drawn at the land's scale, a man about a
// tile tall.

export type { Look } from './art/men/looks'

/** Map units for a unit of the drawings: a man some four map units tall, about a tile. */
export const SIZE = 0.36

export type Figures = {
  /** Men of the look, the standard-bearer not counted; whether it has one. */
  men: number
  bearer: boolean
  texture: (man: number, face: 1 | -1, layer: Layer, frame: number) => Texture
  anchor: (face: 1 | -1) => { x: number; y: number }
  /** The shadow under a man, from his feet, in the drawings' units. */
  shadow: { x: number; rx: number; ry: number }
  /** Where the standard-bearer holds his pole, standing, from his feet, in the drawings' units. */
  pole: readonly [number, number]
}

const made = new Map<Look, Figures>()

function cut(sheet: Sheet, look: Look): Figures {
  const source = new CanvasSource({
    resource: sheet.canvas,
    autoGenerateMipmaps: true,
  })
  const cache = new Map<string, Texture>()
  return {
    men: sheet.bearer ? sheet.men - 1 : sheet.men,
    bearer: sheet.bearer,
    texture(man, face, layer, frame) {
      const key = `${man}:${face}:${layer}:${frame}`
      let t = cache.get(key)
      if (!t) {
        const c = cellOf(sheet, man, face, layer, frame)
        t = new Texture({ source, frame: new Rectangle(c.x, c.y, c.w, c.h) })
        cache.set(key, t)
      }
      return t
    },
    anchor: (face) => anchorOf(sheet.box, face),
    shadow: LOOKS[look].shadow,
    pole: LOOKS[look].pole,
  }
}

/** A look's figures, its sheet drawn the first time it is asked for. */
export function sheetOf(look: Look): Figures {
  let found = made.get(look)
  if (!found) {
    found = cut(drawSheet(look), look)
    made.set(look, found)
  }
  return found
}

/** Every look drawn ahead, one a moment, so that the first army of each never waits for its men. */
export function warmFigures() {
  const looks = Object.keys(LOOKS) as Array<Look>
  looks.forEach((look, i) => setTimeout(() => sheetOf(look), 200 * (i + 1)))
}

/** Fight loops a second: a blow a little more than a second long. */
const BLOWS = 0.9

/**
 * The frame a man shows: still; a step of his walk, by how far he has walked
 * and so many map units a stride; or a beat of his fight, each man on his own.
 */
export function frameAt(
  seconds: number,
  man: { seed: number; moving: boolean; paces: number },
  fighting: boolean,
  stride: number,
): number {
  const own = (man.seed * 0.618) % 1
  if (man.moving)
    return 1 + (Math.floor((man.paces / stride + own) * WALK) % WALK)
  if (!fighting) return 0
  const beat = Math.floor((seconds * BLOWS + own * 1.7) * FIGHT)
  return 1 + WALK + (beat % FIGHT)
}

/** A man as two sprites, his dye under his base, scaled from the sheet's pixels to the map. */
export function makeFigure() {
  const box = new Container()
  const dye = box.addChild(new Sprite())
  const base = box.addChild(new Sprite())
  return {
    box,
    show(
      figures: Figures,
      man: number,
      face: 1 | -1,
      frame: number,
      color: number,
    ) {
      const a = figures.anchor(face)
      dye.texture = figures.texture(man, face, 'dye', frame)
      base.texture = figures.texture(man, face, 'base', frame)
      dye.anchor.set(a.x, a.y)
      base.anchor.set(a.x, a.y)
      dye.tint = color
    },
    /** The base a shade darker or lighter, so that no two men are quite alike. */
    tone(tint: number) {
      base.tint = tint
    },
  }
}

/** Map units for a pixel of the sheets, at a man's own size. */
export const pixel = (size = 1) => (SIZE * size) / RES

let shadowTexture: Texture | null = null

/** The soft shadow every man and horse stands on: a dark ellipse, fading at its rim, multiplied into the land. */
export function shadowOf(): Texture {
  if (shadowTexture) return shadowTexture
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const g = canvas.getContext('2d')
  if (g) {
    const fade = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    fade.addColorStop(0, css(TONE.ink, 0.6))
    fade.addColorStop(0.55, css(TONE.ink, 0.4))
    fade.addColorStop(1, css(TONE.ink, 0))
    g.fillStyle = fade
    g.fillRect(0, 0, 64, 64)
  }
  shadowTexture = Texture.from(canvas)
  return shadowTexture
}
