import {
  CanvasTexture,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three'

// The tools every painted surface of the table is made with: a canvas drawn
// once, its grain and its mottle, and the texture it becomes.

export type Pen = CanvasRenderingContext2D

/** A canvas of this size, drawn by `draw` (left blank where 2D is refused). */
export function paint(
  w: number,
  h: number,
  draw: (g: Pen, w: number, h: number) => void,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const g = canvas.getContext('2d')
  if (g) draw(g, w, h)
  return canvas
}

/** A canvas as a texture: a colour (sRGB) or data (a bump), tiled or not. */
export function texture(
  canvas: HTMLCanvasElement,
  { data = false, repeat }: { data?: boolean; repeat?: [number, number] } = {},
): CanvasTexture {
  const t = new CanvasTexture(canvas)
  t.colorSpace = data ? NoColorSpace : SRGBColorSpace
  t.anisotropy = 8
  if (repeat) {
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(repeat[0], repeat[1])
  }
  return t
}

/** A seeded stream of numbers in [0, 1): the same grain at every visit. */
export function stream(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

/** A fine grain of light and dark over the whole canvas. */
export function speckle(
  g: Pen,
  w: number,
  h: number,
  amount: number,
  seed = 7,
) {
  const img = g.getImageData(0, 0, w, h)
  const d = img.data
  const next = stream(seed)
  for (let i = 0; i < d.length; i += 4) {
    const v = (next() - 0.5) * 510 * amount
    d[i] += v
    d[i + 1] += v
    d[i + 2] += v
  }
  g.putImageData(img, 0, 0)
}

/** Soft blotches, dark and light, as on old stock. */
export function mottle(
  g: Pen,
  [w, h, n]: [number, number, number],
  [dark, light]: [string, string],
  seed = 3,
) {
  const next = stream(seed)
  for (let i = 0; i < n; i++) {
    const x = next() * w
    const y = next() * h
    const r = (0.04 + next() * 0.16) * w
    const gr = g.createRadialGradient(x, y, 0, x, y, r)
    gr.addColorStop(0, next() < 0.5 ? dark : light)
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = gr
    g.fillRect(x - r, y - r, r * 2, r * 2)
  }
}

/** A round glow from the middle out. */
export function radial(size: number, stops: Array<[number, string]>) {
  return paint(size, size, (g) => {
    const c = size / 2
    const gr = g.createRadialGradient(c, c, 0, c, c, c)
    for (const [at, colour] of stops) gr.addColorStop(at, colour)
    g.fillStyle = gr
    g.fillRect(0, 0, size, size)
  })
}

/** A rectangle, its corners turned, stroked. */
export function outline(
  g: Pen,
  [x, y, w, h, r]: [number, number, number, number, number],
  width: number,
  colour: string,
) {
  g.strokeStyle = colour
  g.lineWidth = width
  g.beginPath()
  g.roundRect(x, y, w, h, r)
  g.stroke()
}

/** An SVG drawing as an image of this size, or none if it will not load. */
export function svgImage(
  svg: string,
  w: number,
  h: number,
): Promise<HTMLImageElement | null> {
  const sized = svg
    .replace(/<svg([^>]*?)\swidth="[^"]*"/, '<svg$1')
    .replace(/<svg([^>]*?)\sheight="[^"]*"/, '<svg$1')
    .replace(
      '<svg',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"`,
    )
  return new Promise((done) => {
    const image = new Image()
    image.onload = () => done(image)
    image.onerror = () => done(null)
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sized)
  })
}
