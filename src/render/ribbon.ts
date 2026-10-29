import { MeshSimple, Texture } from 'pixi.js'
import { tremble } from './pen'
import type { Point } from '../../engine'

// A border's line as a ribbon of ink: its width swells and thins along it
// as a quill's does, by a tremble of the place so that a line shared by two
// lands swells the same way on both. Laid as a strip of triangles round
// the line, so that it can be widened for the zoom without being traced
// again.

export type Ribbon = {
  mesh: MeshSimple
  /** Widens the ribbon to so many map units, on average. */
  widen: (width: number) => void
}

/** The ribbon round some open lines, in a colour, so strong. */
export function makeRibbon(
  lines: Array<Array<Point>>,
  color: number,
  alpha: number,
): Ribbon {
  const count = lines.reduce(
    (sum, l) => sum + (l.length >= 2 ? l.length : 0),
    0,
  )
  const centre = new Float32Array(count * 2)
  /** Each point's normal, scaled by the quill's swell there. */
  const across = new Float32Array(count * 2)
  const indices: Array<number> = []
  let v = 0
  for (const pts of lines) {
    const n = pts.length
    if (n < 2) continue
    for (let i = 0; i < n; i++) {
      const [ax, ay] = pts[Math.max(0, i - 1)]
      const [bx, by] = pts[Math.min(n - 1, i + 1)]
      const [x, y] = pts[i]
      const d = Math.hypot(bx - ax, by - ay) || 1
      const swell = 0.72 + 0.56 * (0.5 + 0.5 * tremble(x * 0.45, y * 0.45, 3.1))
      const k = (v + i) * 2
      centre[k] = x
      centre[k + 1] = y
      across[k] = (-(by - ay) / d) * swell * 0.5
      across[k + 1] = ((bx - ax) / d) * swell * 0.5
      if (i > 0) {
        const [a, b] = [(v + i - 1) * 2, (v + i) * 2]
        indices.push(a, a + 1, b, a + 1, b + 1, b)
      }
    }
    v += n
  }
  const vertices = new Float32Array(count * 4)
  const mesh = new MeshSimple({
    texture: Texture.WHITE,
    vertices,
    uvs: new Float32Array(count * 4),
    indices: new Uint32Array(indices),
  })
  mesh.tint = color
  mesh.alpha = alpha
  mesh.eventMode = 'none'
  mesh.autoUpdate = false
  const widen = (width: number) => {
    for (let i = 0; i < count; i++) {
      const [x, y] = [centre[i * 2], centre[i * 2 + 1]]
      const [nx, ny] = [across[i * 2] * width, across[i * 2 + 1] * width]
      vertices[i * 4] = x + nx
      vertices[i * 4 + 1] = y + ny
      vertices[i * 4 + 2] = x - nx
      vertices[i * 4 + 3] = y - ny
    }
    mesh.vertices = vertices
    mesh.geometry.getBuffer('aPosition').update()
  }
  return { mesh, widen }
}
