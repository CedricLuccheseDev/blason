import {
  CatmullRomCurve3,
  CylinderGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three'
import { blobShadow, shadowy } from './shared'
import type { Assets } from '../assets'

// The player's gold: his purse and a stack of coins beside it, struck with
// the shield (no figure on them: there are no accounts yet).

const coinMaterials = new WeakMap<Assets, Array<MeshStandardMaterial>>()
const COIN = new CylinderGeometry(1.35, 1.35, 0.22, 40)

function coin(A: Assets) {
  let mats = coinMaterials.get(A)
  if (!mats) {
    const face = new MeshStandardMaterial({
      map: A.coin,
      bumpMap: A.coinBump,
      bumpScale: 3,
      metalness: 1,
      roughness: 0.3,
      envMapIntensity: 1.3,
    })
    mats = [
      new MeshStandardMaterial({
        color: 0xe8b84c,
        metalness: 1,
        roughness: 0.32,
        envMapIntensity: 1.3,
      }),
      face,
      face,
    ]
    coinMaterials.set(A, mats)
  }
  const m = new Mesh(COIN, mats)
  m.castShadow = m.receiveShadow = true
  return m
}

const PURSE: Array<[number, number]> = [
  [0.01, 0],
  [2.6, 0.06],
  [4.3, 0.6],
  [5.1, 1.8],
  [5.2, 3.2],
  [4.7, 4.6],
  [3.5, 5.8],
  [2.0, 6.55],
  [1.7, 6.95],
  [2.3, 7.45],
  [3.1, 8.0],
  [3.35, 8.35],
  [2.9, 8.45],
  [2.0, 8.0],
]

/** The purse: soft leather pinched at the neck by a gilt cord, coins at its mouth. */
export function makePurse(A: Assets) {
  const geo = new LatheGeometry(
    PURSE.map(([x, y]) => new Vector2(x, y)),
    72,
  )
  const p = geo.attributes.position
  for (let i = 0; i < p.count; i++) {
    const [x, y, z] = [p.getX(i), p.getY(i), p.getZ(i)]
    const a = Math.atan2(z, x)
    let k =
      1 +
      0.05 * Math.sin(a * 5 + y * 0.9) +
      0.035 * Math.sin(a * 9 - y * 1.4) +
      0.02 * Math.sin(a * 17 + y * 3)
    if (y > 6.4) k += 0.16 * Math.sin(a * 11) * Math.min(1, y - 6.4)
    p.setXYZ(
      i,
      x * k + Math.max(0, y - 6) * 0.12,
      y * (1 + 0.04 * Math.cos(a * 3)),
      z * k * 0.86,
    )
  }
  geo.computeVertexNormals()
  const bag = new Mesh(
    geo,
    new MeshStandardMaterial({
      color: 0x7a5434,
      roughness: 0.92,
      bumpMap: A.leather,
      bumpScale: 1.5,
    }),
  )
  const cordM = new MeshStandardMaterial({
    color: 0xc99a34,
    roughness: 0.55,
    metalness: 0.3,
  })
  const cord = new Mesh(new TorusGeometry(1.95, 0.2, 10, 48), cordM)
  cord.rotation.x = Math.PI / 2
  cord.position.set(0.1, 6.85, 0)
  cord.scale.set(1, 0.86, 1)
  const end = (dir: number) =>
    new Mesh(
      new TubeGeometry(
        new CatmullRomCurve3(
          [
            [1.9, 6.85, 0.3],
            [3.4, 5.4, 1.4],
            [4.6, 2.6, 2.4],
            [5.6, 0.4, 3.3],
            [7.4, 0.2, 3.6],
          ].map(([x, y, z]) => new Vector3(x, y, z * dir)),
        ),
        30,
        0.17,
        8,
      ),
      cordM,
    )
  const c1 = coin(A)
  c1.position.set(-0.4, 8.25, 0.4)
  c1.rotation.set(0.5, 0, 0.35)
  const c2 = coin(A)
  c2.position.set(0.9, 8.1, -0.3)
  c2.rotation.set(-0.3, 0, -0.5)
  const g = new Group()
  g.add(bag, cord, end(1), end(-1), c1, c2)
  shadowy(g)
  g.add(blobShadow(A.blob, 15, 13, 0.8))
  return g
}

/** A stack of coins and a few strewn round it. */
export function makeCoins(A: Assets) {
  const g = new Group()
  for (let i = 0; i < 6; i++) {
    const m = coin(A)
    m.position.set(
      Math.sin(i * 2.1) * 0.14,
      0.11 + i * 0.23,
      Math.cos(i * 1.7) * 0.14,
    )
    m.rotation.y = i
    g.add(m)
  }
  for (const [x, z, rx] of [
    [3.4, 1.0, 0],
    [-3.0, 2.2, 0],
    [1.4, 3.6, 0],
    [-1.0, -3.1, 0.18],
  ]) {
    const m = coin(A)
    m.position.set(x, 0.11 + (rx ? 0.3 : 0), z)
    m.rotation.set(rx, x, 0)
    g.add(m)
  }
  g.add(blobShadow(A.blob, 10, 10, 0.5))
  return g
}
