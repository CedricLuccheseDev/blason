import { CanvasSource, Texture, TilingSprite } from 'pixi.js'
import { hash } from '../pen'
import type { World } from '../../../engine'

// The wash pooled unevenly, as watercolour dries: soft blooms and a fine
// granulation, multiplied into the lords' washes so that a land reads as
// laid by a brush, the same tone throughout, never another hue.

const SIZE = 256
/** Map units a pixel of the blooms covers. */
const PIXEL = 0.55

/** Smooth noise over a lattice of cells so many pixels wide, wrapping at the tile's edge. */
function valueNoise(x: number, y: number, cell: number): number {
  const wide = SIZE / cell
  const [fx, fy] = [x / cell, y / cell]
  const [i, j] = [Math.floor(fx), Math.floor(fy)]
  const e = (t: number) => t * t * (3 - 2 * t)
  const [u, v] = [e(fx - i), e(fy - j)]
  const at = (a: number, b: number) =>
    hash(((a % wide) + wide) % wide, ((b % wide) + wide) % wide, cell)
  return (
    (at(i, j) * (1 - u) + at(i + 1, j) * u) * (1 - v) +
    (at(i, j + 1) * (1 - u) + at(i + 1, j + 1) * u) * v
  )
}

function blooms(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SIZE
  const g = canvas.getContext('2d')
  if (!g) return canvas
  const pixels = g.createImageData(SIZE, SIZE)
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const bloom =
        valueNoise(x, y, 64) * 0.55 +
        valueNoise(x, y, 32) * 0.3 +
        valueNoise(x, y, 8) * 0.15
      const s = 1 - Math.max(0, bloom - 0.35) * 0.16 - hash(x, y, 7) * 0.025
      const k = (y * SIZE + x) * 4
      pixels.data.set([255 * s, 255 * s * 0.99, 255 * s * 0.975, 255], k)
    }
  g.putImageData(pixels, 0, 0)
  return canvas
}

let texture: Texture | null = null

/** The blooms over the whole land, multiplied into what lies under them; the texture is kept for the next game. */
export function makeBlooms(world: World): TilingSprite {
  texture ??= new Texture({
    source: new CanvasSource({
      resource: blooms(),
      addressMode: 'repeat',
      autoGenerateMipmaps: true,
    }),
  })
  const sprite = new TilingSprite({
    texture,
    width: world.width / PIXEL,
    height: world.height / PIXEL,
  })
  sprite.scale.set(PIXEL)
  sprite.blendMode = 'multiply'
  sprite.eventMode = 'none'
  return sprite
}
