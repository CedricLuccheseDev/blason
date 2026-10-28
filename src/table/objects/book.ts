import {
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { PAGE } from '../sizes'
import { blobShadow, shadowy } from './shared'
import type { Assets } from '../assets'

// The journal, lying open: two leather covers, two blocks of pages curving
// down into the gutter, a ribbon marking the page.

/** The height of a page's top at a share u of its width from the gutter. */
export const pageY = (u: number) =>
  0.42 + 0.85 * (1 - Math.exp(-u * 10)) - 0.12 * u

const N = 36

/** One half of the journal, on the side s (-1 the left, 1 the right). */
function half(A: Assets, s: 1 | -1, leather: MeshStandardMaterial) {
  const g = new Group()
  const cover = new Mesh(
    new RoundedBoxGeometry(PAGE.w + 0.7, 0.32, PAGE.d + 1.1, 2, 0.12),
    leather,
  )
  cover.position.set(s * (PAGE.w / 2 + 0.3), 0.16, 0)
  const top = new PlaneGeometry(PAGE.w, PAGE.d, N, 1)
  top.rotateX(-Math.PI / 2)
  const p = top.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + PAGE.w / 2
    p.setX(i, s > 0 ? x : x - PAGE.w)
    p.setY(i, pageY(s > 0 ? x / PAGE.w : 1 - x / PAGE.w))
  }
  top.computeVertexNormals()
  const pages = new Mesh(
    top,
    new MeshStandardMaterial({ map: A.pages[s > 0 ? 1 : 0], roughness: 0.85 }),
  )
  // The near edge of the block, and its outer edge.
  const sh = new Shape()
  sh.moveTo(0, 0.3)
  for (let i = 0; i <= N; i++) sh.lineTo((s * i * PAGE.w) / N, pageY(i / N))
  sh.lineTo(s * PAGE.w, 0.3)
  sh.closePath()
  const edge = new MeshStandardMaterial({
    map: A.pageEdge,
    roughness: 0.9,
    side: DoubleSide,
  })
  const near = new Mesh(new ShapeGeometry(sh), edge)
  near.position.z = PAGE.d / 2
  const outer = new Mesh(new PlaneGeometry(PAGE.d, pageY(1) - 0.3), edge)
  outer.rotation.y = Math.PI / 2
  outer.position.set(s * PAGE.w, 0.3 + (pageY(1) - 0.3) / 2, 0)
  g.add(cover, pages, near, outer)
  return g
}

/** The silk ribbon, from the page down over the edge onto the table. */
function bookmark() {
  const rg = new PlaneGeometry(0.9, 8, 1, 16)
  rg.rotateX(-Math.PI / 2)
  const p = rg.attributes.position
  for (let i = 0; i < p.count; i++) {
    const s = (p.getZ(i) + 4) / 8
    const z = PAGE.d / 2 - 2.2 + s * 7.4
    p.setZ(i, z)
    p.setY(
      i,
      z < PAGE.d / 2
        ? pageY(0.05) + 0.03
        : Math.max(0.04, pageY(0.05) - (z - PAGE.d / 2) * 0.55),
    )
    p.setX(i, p.getX(i) + 0.5 + s * 0.6)
  }
  rg.computeVertexNormals()
  return new Mesh(
    rg,
    new MeshStandardMaterial({
      color: 0xa3281f,
      roughness: 0.6,
      side: DoubleSide,
    }),
  )
}

export function makeBook(A: Assets) {
  const g = new Group()
  const body = new Group()
  g.add(body)
  const leather = new MeshStandardMaterial({
    color: 0x5b2416,
    roughness: 0.7,
    bumpMap: A.leather,
    bumpScale: 0.6,
  })
  body.add(half(A, -1, leather), half(A, 1, leather), bookmark())
  shadowy(body)
  g.add(blobShadow(A.blob, PAGE.w * 2 + 6, PAGE.d + 6, 0.75))
  return { root: g, body }
}
