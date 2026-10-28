import {
  AdditiveBlending,
  CapsuleGeometry,
  CylinderGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Sprite,
  SpriteMaterial,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { BOARD, CANDLE_H, LID } from '../sizes'
import { blobShadow, shadowy } from './shared'
import type { Texture } from 'three'
import type { Assets } from '../assets'

// What stands on the table for good: the wood itself, the board with the
// live map on it, the box's lid, and the candle that lights it all.

export function makeTable(A: Assets) {
  const m = new Mesh(
    new PlaneGeometry(380, 260),
    new MeshStandardMaterial({
      color: 0x8c7462,
      map: A.wood,
      bumpMap: A.woodBump,
      bumpScale: 0.6,
      roughness: 0.58,
      metalness: 0,
    }),
  )
  m.rotation.x = -Math.PI / 2
  m.receiveShadow = true
  return m
}

/** The board: cardboard, its printed frame, and the map of a game on it. */
export function makeBoard(A: Assets, map: Texture) {
  const g = new Group()
  const side = new MeshStandardMaterial({ color: 0x2a0b08, roughness: 0.7 })
  const top = new MeshStandardMaterial({
    map: A.boardTop,
    roughness: 0.62,
    metalness: 0.05,
  })
  const box = new Mesh(
    new RoundedBoxGeometry(BOARD.w, BOARD.h, BOARD.d, 3, 0.22),
    [side, side, top, side, side, side],
  )
  box.position.y = BOARD.h / 2
  const sheet = new Mesh(
    new PlaneGeometry(BOARD.mapW, BOARD.mapD),
    new MeshStandardMaterial({ map, roughness: 0.82 }),
  )
  sheet.rotation.x = -Math.PI / 2
  sheet.position.y = BOARD.h + 0.012
  sheet.receiveShadow = true
  g.add(shadowy(box), sheet, blobShadow(A.blob, BOARD.w + 8, BOARD.d + 8, 0.7))
  return { root: g, sheet }
}

export function makeLid(A: Assets) {
  const g = new Group()
  const side = new MeshStandardMaterial({ map: A.lidSide, roughness: 0.55 })
  const top = new MeshStandardMaterial({
    map: A.lidTop,
    roughness: 0.42,
    metalness: 0.12,
    envMapIntensity: 0.6,
  })
  const bottom = new MeshStandardMaterial({ color: 0x0a1830 })
  const box = new Mesh(new RoundedBoxGeometry(LID.w, LID.h, LID.d, 3, 0.35), [
    side,
    side,
    top,
    bottom,
    side,
    side,
  ])
  box.position.y = LID.h / 2
  g.add(shadowy(box), blobShadow(A.blob, LID.w + 7, LID.d + 7, 0.75))
  return g
}

const STICK: Array<[number, number]> = [
  [0, 0],
  [5.6, 0],
  [5.9, 0.25],
  [5.7, 0.6],
  [4.6, 0.8],
  [1.4, 1.0],
  [1.0, 1.5],
  [0.85, 3.2],
  [1.2, 3.6],
  [0.9, 4.0],
  [1.0, 5.2],
  [1.9, 5.6],
  [2.1, 6.1],
  [1.6, 6.2],
  [0, 6.2],
]
const DRIPS: Array<[number, number]> = [
  [0.4, 2.4],
  [2.1, 1.4],
  [3.6, 3.2],
  [5.0, 1.8],
]
const FOOT = 6.2

/** A brass candlestick, the candle and its drips, the flame and its halo. */
export function makeCandle(A: Assets) {
  const g = new Group()
  const brass = new MeshStandardMaterial({
    color: 0xc9952a,
    metalness: 0.95,
    roughness: 0.3,
    envMapIntensity: 1,
  })
  const stick = new Mesh(
    new LatheGeometry(
      STICK.map(([x, y]) => new Vector2(x, y)),
      48,
    ),
    brass,
  )
  const handle = new Mesh(
    new TorusGeometry(1.3, 0.28, 10, 24, Math.PI * 1.3),
    brass,
  )
  handle.position.set(5.9, 0.9, 0)
  handle.rotation.set(Math.PI / 2, 0, -Math.PI * 0.65)
  const wax = new MeshStandardMaterial({
    color: 0xf3e6c8,
    roughness: 0.55,
    emissive: 0xffa040,
    emissiveIntensity: 0.06,
  })
  const candle = new Mesh(new CylinderGeometry(1.25, 1.3, CANDLE_H, 32, 1), wax)
  candle.position.y = FOOT + CANDLE_H / 2
  g.add(stick, handle, candle)
  for (const [a, l] of DRIPS) {
    const d = new Mesh(new CapsuleGeometry(0.28, l, 4, 8), wax)
    d.position.set(
      Math.cos(a) * 1.22,
      FOOT + CANDLE_H - l / 2 - 0.2,
      Math.sin(a) * 1.22,
    )
    g.add(d)
  }
  const wick = new Mesh(
    new CylinderGeometry(0.06, 0.07, 0.9, 6),
    new MeshBasicMaterial({ color: 0x1a120a }),
  )
  wick.position.y = FOOT + CANDLE_H + 0.4
  g.add(wick)
  shadowy(g, false, true)
  const additive = {
    blending: AdditiveBlending,
    depthWrite: false,
    transparent: true,
  }
  const flame = new Sprite(new SpriteMaterial({ map: A.flame, ...additive }))
  flame.scale.set(1.5, 3.0, 1)
  flame.position.y = FOOT + CANDLE_H + 1.7
  const glow = new Sprite(
    new SpriteMaterial({ map: A.glow, ...additive, opacity: 0.55 }),
  )
  glow.scale.set(16, 16, 1)
  glow.position.y = FOOT + CANDLE_H + 1.4
  g.add(flame, glow, blobShadow(A.blob, 15, 15, 0.6))
  return { root: g, flame, glow, top: new Vector3(0, FOOT + CANDLE_H + 1.5, 0) }
}
