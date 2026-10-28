import { Container, Sprite, Texture } from 'pixi.js'
import { TONE } from '../palette'
import type { World } from '../../../engine'

// The leaf of parchment round the map, painted once into two textures. The
// parchment browns as it goes out from the frame, unevenly, as a page
// handled for years, until it has the tone of the page's edge, which goes on
// past it (the canvas's own background). Foxing is scattered over the margin,
// small rust spots in a soft halo and a few wide pale tide marks, more of
// them the farther out. Coarse, as stains are: what is laid over the map is
// hidden by it.

/** How far out the leaf browns, and how many map units a pixel of it covers. */
const AGE = 1600
const AGE_PIXEL = 12
/** How far out the foxing goes, a pixel of it, and how many spots. */
const FOX = 700
const FOX_PIXEL = 3
const SPOTS = 180
/** Where the leaf begins: the frame's outer rule, in map units past the map. */
const RIM = 14

/** A repeatable stream of values in [0, 1) for a seed: the same leaf for the same land. */
function stream(seed: string) {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) + 0x6d2b79f5
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

/** How far a point is outside the frame, in map units; 0 within it. */
function outside(world: World, x: number, y: number) {
  const dx = Math.max(-RIM - x, 0, x - world.width - RIM)
  const dy = Math.max(-RIM - y, 0, y - world.height - RIM)
  return Math.hypot(dx, dy)
}

function canvasOf(world: World, reach: number, pixel: number) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil((world.width + 2 * reach) / pixel)
  canvas.height = Math.ceil((world.height + 2 * reach) / pixel)
  return { canvas, g: canvas.getContext('2d') }
}

/** The parchment browning outwards, a slow unevenness over it so that it never reads as a gradient. */
function age(world: World, next: () => number): HTMLCanvasElement {
  const { canvas, g } = canvasOf(world, AGE, AGE_PIXEL)
  if (!g) return canvas
  const pixels = g.createImageData(canvas.width, canvas.height)
  const waves = [0, 1, 2].map(() => ({
    a: next() * Math.PI * 2,
    f: 0.002 + next() * 0.003,
    p: next() * Math.PI * 2,
  }))
  const from = [TONE.page >> 16, (TONE.page >> 8) & 0xff, TONE.page & 0xff]
  const to = [TONE.edge >> 16, (TONE.edge >> 8) & 0xff, TONE.edge & 0xff]
  for (let j = 0; j < canvas.height; j++) {
    for (let i = 0; i < canvas.width; i++) {
      const x = (i + 0.5) * AGE_PIXEL - AGE
      const y = (j + 0.5) * AGE_PIXEL - AGE
      const d = Math.min(1, outside(world, x, y) / AGE)
      let n = 0
      for (const w of waves)
        n += Math.sin((x * Math.cos(w.a) + y * Math.sin(w.a)) * w.f + w.p)
      // Eased in and out, the unevenness strongest halfway: plain page at
      // the frame, plain edge at the end, so that both meet without a seam.
      const s = d * d * (3 - 2 * d)
      const t = Math.max(0, Math.min(1, s + (n / 3) * 0.9 * s * (1 - s)))
      const k = (j * canvas.width + i) * 4
      for (let c = 0; c < 3; c++)
        pixels.data[k + c] = from[c] + (to[c] - from[c]) * t
      pixels.data[k + 3] = 255
    }
  }
  g.putImageData(pixels, 0, 0)
  return canvas
}

/** The foxing: rust spots, the small ones many, and a few wide faint tide marks. */
function foxing(world: World, next: () => number): HTMLCanvasElement {
  const { canvas, g } = canvasOf(world, FOX, FOX_PIXEL)
  if (!g) return canvas
  for (let n = 0; n < SPOTS; n++) {
    const tide = n % 12 === 0
    const r = tide ? 40 + next() * 60 : 2 + 9 * next() ** 3
    const x = next() * (world.width + 2 * FOX) - FOX
    const y = next() * (world.height + 2 * FOX) - FOX
    const d = outside(world, x, y) - r * 2.4
    // Clear of the frame; thicker farther out, thinning before the end.
    const room = FOX - r * 2.4 - d
    if (d < 12 || room < 0 || next() > 0.3 + d / FOX) continue
    const alpha = tide ? 0.05 + next() * 0.04 : 0.1 + next() * 0.18
    const [cx, cy] = [(x + FOX) / FOX_PIXEL, (y + FOX) / FOX_PIXEL]
    const halo = (r * 2.4) / FOX_PIXEL
    const spot = g.createRadialGradient(cx, cy, 0, cx, cy, halo)
    spot.addColorStop(0, `rgba(138, 88, 38, ${alpha})`)
    spot.addColorStop(0.38, `rgba(138, 88, 38, ${alpha * 0.85})`)
    spot.addColorStop(0.45, `rgba(150, 104, 52, ${alpha * 0.35})`)
    spot.addColorStop(1, 'rgba(150, 104, 52, 0)')
    g.fillStyle = spot
    g.fillRect(cx - halo, cy - halo, 2 * halo, 2 * halo)
  }
  return canvas
}

export function makeLeaf(world: World) {
  const next = stream(world.seed)
  const container = new Container()
  const layers: Array<[HTMLCanvasElement, number, number]> = [
    [age(world, next), AGE, AGE_PIXEL],
    [foxing(world, next), FOX, FOX_PIXEL],
  ]
  const sprites = layers.map(([canvas, reach, pixel]) => {
    const sprite = container.addChild(new Sprite(Texture.from(canvas)))
    sprite.position.set(-reach, -reach)
    sprite.scale.set(pixel)
    return sprite
  })
  return {
    container,
    /** The leaf's textures, which the game's end does not take with it. */
    destroy() {
      for (const sprite of sprites) sprite.texture.destroy(true)
    },
  }
}
