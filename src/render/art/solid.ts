import { TONE } from '../palette'
import { mixColor } from '../ease'
import { EARTH, css } from './ink'
import { LIGHT } from './light'
import type { Pen, Pt } from './ink'

// What a built thing does to the ground in the map's one light
// (art/light.ts): told by a few posts, points of its foot each with the
// height standing over it, it casts the shadow of its whole volume, the
// hull of its foot and of its top laid by the light; it darkens the ground
// right round its foot; and it stands in a patch of trodden earth, darker
// towards it. Local units.

/** A point of a solid's foot on the ground, and the height standing over it. */
export type Post = readonly [number, number, number]

const cross = (o: Pt, a: Pt, b: Pt) =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

/** The smallest convex outline round some points. */
function hull(points: Array<Pt>): Array<Pt> {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const half = (list: Array<Pt>) => {
    const out: Array<Pt> = []
    for (const q of list) {
      while (
        out.length >= 2 &&
        cross(out[out.length - 2], out[out.length - 1], q) <= 0
      )
        out.pop()
      out.push(q)
    }
    out.pop()
    return out
  }
  const upper = half([...pts].reverse())
  return [...half(pts), ...upper]
}

function outline(g: CanvasRenderingContext2D, pts: Array<Pt>) {
  const ring = hull(pts)
  g.beginPath()
  ring.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
  g.closePath()
}

/** Fills the shadow a solid casts on the ground: its foot and its top laid by the light, and all between. */
export function solid(g: CanvasRenderingContext2D, posts: ReadonlyArray<Post>) {
  outline(
    g,
    posts.flatMap(([x, y, h]): Array<Pt> => [
      [x, y],
      [x + h * LIGHT.across, y + h * LIGHT.down],
    ]),
  )
  g.fill()
}

/** Fills the ground a solid stands on, widened by so much: its contact shadow, once softened. */
export function footing(
  g: CanvasRenderingContext2D,
  posts: ReadonlyArray<Post>,
  margin: number,
) {
  outline(
    g,
    posts.map(([x, y]): Pt => [x + margin * 0.3, y + margin * 0.3]),
  )
  g.fill()
  g.lineWidth = margin * 2
  g.lineJoin = 'round'
  g.strokeStyle = g.fillStyle
  g.stroke()
}

/** The trodden earth round a work, an ellipse darker towards its middle and fading out. */
export function trodden(
  p: Pen,
  [x, y, rx, ry]: readonly [number, number, number, number],
  alpha: number,
) {
  const g = p.g
  const earth = mixColor(EARTH, TONE.ink, 0.22)
  g.save()
  g.translate(x, y)
  g.scale(1, ry / rx)
  const wash = g.createRadialGradient(0, 0, 0, 0, 0, rx)
  wash.addColorStop(0, css(earth, alpha))
  wash.addColorStop(0.55, css(earth, alpha * 0.75))
  wash.addColorStop(1, css(earth, 0))
  g.beginPath()
  g.arc(0, 0, rx, 0, Math.PI * 2)
  g.fillStyle = wash
  g.fill()
  g.restore()
}

/** A box's posts: its front edge from a to b on the ground, going back by `d`, so high. */
export function box(a: Pt, b: Pt, d: Pt, h: number): Array<Post> {
  return [a, b, [b[0] + d[0], b[1] + d[1]], [a[0] + d[0], a[1] + d[1]]].map(
    ([x, y]): Post => [x, y, h],
  )
}

/** A round tower's posts: its foot's ring, so high, and its cone's tip. */
export function drum(
  [x, y, r]: readonly [number, number, number],
  h: number,
  tip: number,
): Array<Post> {
  const posts: Array<Post> = [[x, y, tip]]
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2
    posts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 0.35, h])
  }
  return posts
}
