import { CanvasSource, Texture, TilingSprite } from 'pixi.js'

// The parchment's grain, laid once over the whole page and multiplied into
// what lies under it, so that the map, its frame and the leaf round it read
// as one sheet. It lies on the page, not on the screen: it moves and grows
// with the map, as the skin of a real leaf would. Fine fibres over a slow
// mottling of the skin, soft at every zoom; no stains, which the leaf's
// foxing gives where they belong (leaf.ts).

const SIZE = 512
/** Map units a pixel of the grain covers: its fibres a pixel or so at the whole land's zoom. */
const PIXEL = 1.2

/** A repeatable value in [0, 1) for a cell of a lattice so many cells wide and high, wrapping round. */
function hash(x: number, y: number, wide: number, high = wide): number {
  const n = (((x % wide) + wide) % wide) + (((y % high) + high) % high) * 4099
  const v = Math.sin(n * 12.9898 + wide * 78.233 + high * 3.17) * 43758.5453
  return v - Math.floor(v)
}

/** Smooth noise over a lattice of cells so many pixels wide and high, wrapping at the tile's edge. */
function smooth(x: number, y: number, cell: number, tall = cell): number {
  const [wide, high] = [SIZE / cell, SIZE / tall]
  const [fx, fy] = [x / cell, y / tall]
  const [i, j] = [Math.floor(fx), Math.floor(fy)]
  const ease = (t: number) => t * t * (3 - 2 * t)
  const [u, v] = [ease(fx - i), ease(fy - j)]
  const at = (a: number, b: number) => hash(a, b, wide, high)
  const top = at(i, j) * (1 - u) + at(i + 1, j) * u
  const bottom = at(i, j + 1) * (1 - u) + at(i + 1, j + 1) * u
  return top * (1 - v) + bottom * v
}

function grain(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const g = canvas.getContext('2d')
  if (!g) return canvas
  const pixels = g.createImageData(SIZE, SIZE)
  const data = pixels.data
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      // The skin's slow mottling, its fibres, and a speck here and there.
      const mottle = smooth(x, y, 128) * 0.6 + smooth(x, y, 32) * 0.4
      const fibre = smooth(x, y, 2, 5) * 0.5 + hash(x, y, SIZE) * 0.5
      const shade = 1 - mottle * 0.04 - fibre * 0.03
      const k = (y * SIZE + x) * 4
      data[k] = 255 * shade
      data[k + 1] = 255 * shade * 0.988
      data[k + 2] = 255 * shade * 0.965
      data[k + 3] = 255
    }
  }
  g.putImageData(pixels, 0, 0)
  return canvas
}

/** The grain over the page, as far as `reach` map units round a map so large. */
export function makePaper(
  size: { width: number; height: number },
  reach: number,
) {
  const texture = new Texture({
    source: new CanvasSource({
      resource: grain(),
      addressMode: 'repeat',
      autoGenerateMipmaps: true,
    }),
  })
  const sprite = new TilingSprite({
    texture,
    width: (size.width + 2 * reach) / PIXEL,
    height: (size.height + 2 * reach) / PIXEL,
  })
  sprite.position.set(-reach, -reach)
  sprite.scale.set(PIXEL)
  sprite.blendMode = 'multiply'
  sprite.eventMode = 'none'
  return {
    sprite,
    destroy: () => texture.destroy(true),
  }
}
