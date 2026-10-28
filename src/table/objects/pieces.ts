import {
  AdditiveBlending,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RingGeometry,
  ShapeGeometry,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { CARD, RIBBON, SEAL_R } from '../sizes'
import { blobShadow, planarUV, roundedRect, shadowy, wobbly } from './shared'
import type { Assets } from '../assets'

// The pieces one plays with: the cards of the modes, the wax seal that plays
// the card turned, the ribbon under it, and the die.

/** A card: a thin gilt-edged board, its face and the common back. */
export function makeCard(A: Assets, i: number) {
  const root = new Group()
  const card = new Group()
  root.add(card)
  const shape = () => roundedRect(CARD.w, CARD.h, CARD.r)
  const edge = new MeshStandardMaterial({
    color: 0xc9952a,
    metalness: 0.7,
    roughness: 0.38,
    envMapIntensity: 0.7,
  })
  const body = new Mesh(
    new ExtrudeGeometry(shape(), {
      depth: CARD.t,
      bevelEnabled: false,
      curveSegments: 6,
    }),
    edge,
  )
  body.position.z = -CARD.t / 2
  const flat = planarUV(new ShapeGeometry(shape(), 6), CARD.w, CARD.h)
  const front = new Mesh(
    flat,
    new MeshStandardMaterial({ map: A.fronts[i], roughness: 0.6 }),
  )
  front.position.z = CARD.t / 2 + 0.004
  const back = new Mesh(
    flat,
    new MeshStandardMaterial({ map: A.back, roughness: 0.5, metalness: 0.05 }),
  )
  back.rotation.y = Math.PI
  back.position.z = -CARD.t / 2 - 0.004
  card.add(body, front, back)
  shadowy(card)
  return { root, card }
}

/** The wax seal: a poured blob, its puddle, the shield pressed into it, a ring to ripple out. */
export function makeSeal(A: Assets) {
  const g = new Group()
  const press = new Group()
  g.add(press)
  const bevel = 1.0
  const span = (SEAL_R + bevel + 0.3) * 2
  const geo = new ExtrudeGeometry(wobbly(SEAL_R, 72, 2), {
    depth: 0.55,
    bevelEnabled: true,
    bevelThickness: 1.05,
    bevelSize: bevel,
    bevelSegments: 7,
    curveSegments: 72,
  })
  planarUV(geo, span, span)
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, 1.05, 0)
  const wax = new MeshStandardMaterial({
    map: A.seal,
    bumpMap: A.sealBump,
    bumpScale: 6,
    roughness: 0.3,
    metalness: 0,
    envMapIntensity: 0.9,
    emissive: 0xffc860,
    emissiveMap: A.sealGlow,
    emissiveIntensity: 0,
  })
  press.add(new Mesh(geo, wax))
  const pud = new ExtrudeGeometry(wobbly(SEAL_R * 1.17, 60, 7, 1.8), {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.32,
    bevelSize: 0.55,
    bevelSegments: 4,
    curveSegments: 60,
  })
  pud.rotateX(-Math.PI / 2)
  pud.translate(0, 0.32, 0)
  g.add(
    new Mesh(
      pud,
      new MeshStandardMaterial({
        color: 0x1f4f8f,
        roughness: 0.34,
        envMapIntensity: 0.8,
      }),
    ),
  )
  shadowy(g)
  const ring = new Mesh(
    new RingGeometry(0.92, 1, 72),
    new MeshBasicMaterial({
      color: 0xffd27a,
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.06
  g.add(ring, blobShadow(A.blob, SEAL_R * 3.1, SEAL_R * 3.1, 0.8))
  return { root: g, press, wax, ring }
}

/** The ribbon under the seal, its ends curling up off the wood. */
export function makeRibbon(A: Assets) {
  const geo = new PlaneGeometry(RIBBON.w, RIBBON.d, 48, 2)
  geo.rotateX(-Math.PI / 2)
  const p = geo.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const f = Math.max(0, (Math.abs(x) - RIBBON.w * 0.33) / (RIBBON.w * 0.17))
    p.setY(i, 0.06 + 0.5 * f * f + 0.12 * Math.sin(p.getZ(i) * 0.6 + x) * f)
  }
  geo.computeVertexNormals()
  const m = new Mesh(
    geo,
    new MeshStandardMaterial({
      map: A.ribbon,
      alphaTest: 0.5,
      side: DoubleSide,
      roughness: 0.75,
    }),
  )
  m.receiveShadow = true
  const g = new Group()
  g.add(m, blobShadow(A.blob, RIBBON.w + 2, RIBBON.d + 2, 0.45))
  return g
}

export function makeDie(A: Assets) {
  const g = new Group()
  const spin = new Group()
  const faces = A.die.map(
    (map) =>
      new MeshStandardMaterial({ map, roughness: 0.35, envMapIntensity: 0.7 }),
  )
  spin.add(new Mesh(new RoundedBoxGeometry(3.4, 3.4, 3.4, 4, 0.5), faces))
  spin.position.y = 1.7
  g.add(spin, blobShadow(A.blob, 6.5, 6.5, 0.7))
  shadowy(spin)
  return { root: g, spin }
}
