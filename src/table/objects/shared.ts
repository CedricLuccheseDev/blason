import { Mesh, MeshBasicMaterial, PlaneGeometry, Shape } from 'three'
import type { BufferGeometry, Object3D, Texture } from 'three'

// The shapes several things are cut from, and the soft shadow each one lays
// on the wood under the candle's sharper one.

/** A rectangle, its corners turned, centred. */
export function roundedRect(w: number, h: number, r: number): Shape {
  const s = new Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

/** Lays a texture flat across a shape's box. */
export function planarUV<TGeo extends BufferGeometry>(
  geo: TGeo,
  w: number,
  h: number,
): TGeo {
  const p = geo.attributes.position
  const uv = geo.attributes.uv
  for (let i = 0; i < p.count; i++)
    uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5)
  uv.needsUpdate = true
  return geo
}

/** A circle a little uneven, as wax poured. */
export function wobbly(r: number, n: number, seed: number, amp = 1): Shape {
  const s = new Shape()
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    const rr =
      r *
      (1 +
        amp *
          (0.05 * Math.sin(a * 5 + seed) +
            0.035 * Math.cos(a * 3 + seed * 2) +
            0.02 * Math.sin(a * 11 + seed * 3)))
    if (i === 0) s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr)
    else s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  return s
}

/** The soft shadow under a thing, as wide and deep as given. */
export function blobShadow(
  blob: Texture,
  w: number,
  d: number,
  opacity = 0.55,
) {
  const m = new Mesh(
    new PlaneGeometry(w, d),
    new MeshBasicMaterial({
      map: blob,
      transparent: true,
      depthWrite: false,
      opacity,
      color: 0x000000,
    }),
  )
  m.rotation.x = -Math.PI / 2
  m.position.y = 0.03
  m.renderOrder = 1
  // A shadow is never the thing itself: a pointer goes through it.
  m.userData.shade = true
  return m
}

/** Every mesh of a thing casts and takes the candle's shadow, or not. */
export function shadowy<TThing extends Object3D>(
  o: TThing,
  cast = true,
  receive = true,
): TThing {
  o.traverse((m) => {
    if (m instanceof Mesh) {
      m.castShadow = cast
      m.receiveShadow = receive
    }
  })
  return o
}
