import { Texture, TilingSprite } from 'pixi.js'
import type { Application } from 'pixi.js'

// The parchment's grain over the whole screen, laid once and multiplied
// into what lies under it: fine fibres and a few soft stains, so that the
// map and the page read as one sheet. It stays still while the map moves,
// like the light on a page.

const SIZE = 512

/** A repeatable value in [0, 1) for a number: the grain is the same on every load. */
function hash(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

function grain(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const g = canvas.getContext('2d')
  if (!g) return canvas
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, SIZE, SIZE)
  // Soft stains, wrapped round the tile's edges so the tiling never shows.
  for (let i = 0; i < 14; i++) {
    const x = hash(i * 3) * SIZE
    const y = hash(i * 3 + 1) * SIZE
    const r = 60 + hash(i * 3 + 2) * 140
    for (const [dx, dy] of [
      [0, 0],
      [SIZE, 0],
      [-SIZE, 0],
      [0, SIZE],
      [0, -SIZE],
    ]) {
      const stain = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r)
      stain.addColorStop(0, 'rgba(176, 140, 82, 0.13)')
      stain.addColorStop(1, 'rgba(176, 140, 82, 0)')
      g.fillStyle = stain
      g.fillRect(0, 0, SIZE, SIZE)
    }
  }
  const pixels = g.getImageData(0, 0, SIZE, SIZE)
  const data = pixels.data
  for (let i = 0; i < data.length; i += 4) {
    const fibre = 1 - hash(i + 101) * 0.075
    data[i] *= fibre
    data[i + 1] *= fibre * 0.985
    data[i + 2] *= fibre * 0.96
  }
  g.putImageData(pixels, 0, 0)
  return canvas
}

export function makePaper(app: Application) {
  const sprite = new TilingSprite({
    texture: Texture.from(grain()),
    width: app.screen.width,
    height: app.screen.height,
  })
  sprite.blendMode = 'multiply'
  sprite.eventMode = 'none'
  return {
    sprite,
    resize() {
      sprite.width = app.screen.width
      sprite.height = app.screen.height
    },
  }
}
