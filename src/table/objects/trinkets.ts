import {
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
  Vector2,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { TAG } from '../sizes'
import { blobShadow, shadowy } from './shared'
import type { Assets } from '../assets'

// The player's things: his pawn in his colour, and his card (purse.ts
// holds his gold).

const DEG = Math.PI / 180

export function makePawn(A: Assets, colour: number) {
  const pts: Array<[number, number]> = [
    [0, 0],
    [2.15, 0],
    [2.25, 0.15],
    [2.25, 0.55],
    [2.05, 0.78],
    [1.55, 0.92],
    [1.2, 1.35],
    [1.0, 2.3],
    [0.88, 3.5],
    [0.95, 3.95],
    [1.75, 4.15],
    [1.8, 4.38],
    [1.1, 4.58],
    [0.72, 4.95],
    [0.66, 5.15],
  ]
  for (let a = -64; a <= 90; a += 8)
    pts.push([
      Math.max(0, 1.45 * Math.cos(a * DEG)),
      6.35 + 1.45 * Math.sin(a * DEG),
    ])
  pts.push([0, 7.8])
  const body = new Mesh(
    new LatheGeometry(
      pts.map(([x, y]) => new Vector2(x, y)),
      56,
    ),
    new MeshStandardMaterial({
      color: colour,
      roughness: 0.24,
      metalness: 0.05,
      envMapIntensity: 1.1,
    }),
  )
  const band = new Mesh(
    new TorusGeometry(1.78, 0.09, 8, 48),
    new MeshStandardMaterial({
      color: 0xd9a41e,
      metalness: 0.9,
      roughness: 0.3,
    }),
  )
  band.rotation.x = Math.PI / 2
  band.position.y = 4.27
  const g = new Group()
  g.add(body, band)
  shadowy(g)
  g.scale.setScalar(1.25)
  g.add(blobShadow(A.blob, 7, 7, 0.75))
  return g
}

export function makeTag(A: Assets) {
  const top = new MeshStandardMaterial({ map: A.tag, roughness: 0.65 })
  const edge = new MeshStandardMaterial({ color: 0xd9c49a, roughness: 0.7 })
  const box = new Mesh(new RoundedBoxGeometry(TAG.w, 0.14, TAG.d, 2, 0.06), [
    edge,
    edge,
    top,
    edge,
    edge,
    edge,
  ])
  box.position.y = 0.07
  const g = new Group()
  g.add(shadowy(box), blobShadow(A.blob, TAG.w + 3, TAG.d + 3, 0.5))
  return g
}
