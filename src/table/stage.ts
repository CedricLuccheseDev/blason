import { Euler, PerspectiveCamera, Quaternion, Vector3 } from 'three'
import { CARD, LAYOUTS } from './sizes'
import { MODES } from './modes'
import { lights, makeRenderer, makeScene } from './room'
import { makeBoard, makeCandle, makeLid, makeTable } from './objects/furniture'
import { makeCard, makeDie, makeRibbon, makeSeal } from './objects/pieces'
import { makePawn, makeTag } from './objects/trinkets'
import { makeCoins, makePurse } from './objects/purse'
import { makeBook } from './objects/book'
import { blobShadow } from './objects/shared'
import type { Group, Object3D, Texture } from 'three'
import type { Assets } from './assets'
import type { Spot, Variant } from './sizes'

// The table set: the room (room.ts), the camera at the player's seat, the
// candle for light, and every thing laid where the layout says.

const DEG = Math.PI / 180
const qAxis = (x: number, y: number, z: number, a: number) =>
  new Quaternion().setFromAxisAngle(new Vector3(x, y, z), a)

/** What can be touched on the table. */
export type Pick =
  | { kind: 'card'; i: number }
  | { kind: 'seal' }
  | { kind: 'die' }
  | { kind: 'book' }
  | { kind: 'board' }

export type Card = {
  i: number
  root: Group
  card: Group
  base: Vector3
  qFlat: Quaternion
  shadow: Object3D & { material: { opacity: number } }
  hoverE: number
  openE: number
}

export function setStage(
  A: Assets,
  variant: Variant,
  map: Texture,
  player: number,
) {
  const L = LAYOUTS[variant]
  const renderer = makeRenderer()
  const scene = makeScene(renderer)
  const camera = new PerspectiveCamera(L.cam.fov, 1, 1, 600)
  const place = <TThing extends Object3D>(
    o: TThing,
    [x, z, turn = 0]: Spot,
  ): TThing => {
    o.position.set(x, 0, z)
    o.rotation.y = turn * DEG
    scene.add(o)
    return o
  }
  scene.add(makeTable(A))
  const board = makeBoard(A, map)
  place(board.root, L.board)
  place(makeLid(A), L.lid)
  const candle = makeCandle(A)
  place(candle.root, L.candle)
  const key = lights(
    scene,
    candle.top.clone().add(candle.root.position),
    L.light,
  )

  const C = L.cards
  const cards: Array<Card> = MODES.map((_, i) => {
    const { root, card } = makeCard(A, i)
    const off = i - 1
    const yaw = -off * C.turn * DEG
    root.position.set(
      C.at[0] + off * C.step,
      0.06 + i * 0.012,
      C.at[1] + Math.abs(off) * 1.4,
    )
    root.scale.setScalar(C.k)
    const qFlat = new Quaternion()
      .setFromEuler(new Euler(0, yaw, 0))
      .multiply(qAxis(1, 0, 0, -Math.PI / 2))
    root.quaternion.copy(qFlat)
    root.userData.pick = { kind: 'card', i }
    const shadow = blobShadow(A.blob, CARD.w * C.k + 3, CARD.h * C.k + 3, 0.45)
    shadow.position.set(root.position.x, 0.025, root.position.z)
    shadow.rotation.z = yaw
    scene.add(root, shadow)
    return {
      i,
      root,
      card,
      base: root.position.clone(),
      qFlat,
      shadow,
      hoverE: 0,
      openE: 0,
    }
  })

  const seal = makeSeal(A)
  place(seal.root, [L.seal.at[0], L.seal.at[1]]).scale.setScalar(L.seal.k)
  seal.root.userData.pick = { kind: 'seal' }
  const ribbon = place(makeRibbon(A), L.ribbon)
  ribbon.scale.setScalar(L.seal.k)
  ribbon.position.y = 0.01
  place(makePawn(A, player), L.pawn)
  const die = makeDie(A)
  place(die.root, L.die)
  die.root.userData.pick = { kind: 'die' }
  die.spin.quaternion.setFromEuler(new Euler(-0.15, 0.5, 0.08))
  board.root.userData.pick = { kind: 'board' }
  const tag = L.tag ? place(makeTag(A), L.tag) : null
  if (L.purse) place(makePurse(A), L.purse).scale.setScalar(1.3)
  if (L.coins) place(makeCoins(A), L.coins)
  const made = L.book ? makeBook(A) : null
  const book =
    made && L.book ? { ...made, root: place(made.root, L.book) } : null
  if (book) book.root.userData.pick = { kind: 'book' }

  const picks: Array<Object3D> = [
    ...cards.map((c) => c.root),
    seal.root,
    die.root,
    board.root,
  ]
  if (book) picks.push(book.root)
  return {
    variant,
    L,
    renderer,
    scene,
    camera,
    key,
    candle,
    cards,
    picks,
    ribbon,
    tag,
    board: board.root,
    seal: { ...seal, hoverE: 0, pressT: -1 },
    die: { ...die, hoverE: 0, roll: null as Roll | null },
    book: book && {
      ...book,
      base: book.root.position.clone(),
      qBase: book.root.quaternion.clone(),
      hoverE: 0,
      readE: 0,
    },
  }
}

export type Roll = {
  t0: number
  q0: Quaternion
  q1: Quaternion
  axis: Vector3
  done: () => void
}
export type Stage = ReturnType<typeof setStage>
