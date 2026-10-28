import { Quaternion, Vector3 } from 'three'
import { BOARD, CARD, LAYOUTS, PAGE } from './sizes'
import { DEG, clamp, near, qAxis, smooth, still } from './ease'
import { moveDie, moveSeal } from './press'
import type { Pick, Stage } from './stage'
import type { View } from './pins'

// Each frame of the table: the camera's slow drift (or its dive into the
// board), the flame's flicker, and every thing easing towards where the
// player's touch wants it: a card lifted, turned and held up; the seal
// pressed; the die rolling; the journal raised to be read. Under reduced
// motion everything is where it goes at once, and nothing drifts.

export type Feel = View & { hover: Pick | null; zoom: boolean }

const p = new Vector3()
const d = new Vector3()
const q = new Quaternion()
const look = new Vector3()
const dive = new Vector3()

/** The camera at the player's seat, wide enough for the layout on any screen; or diving onto the board. */
function moveCamera(S: Stage, t: number, zoomE: number) {
  const cam = S.camera
  const L = S.L
  // The layout was drawn for its own shape: a narrower screen widens the lens to keep its sides.
  const drawn = S.variant === 'phone' ? 390 / 844 : 1440 / 900
  const half = Math.tan((L.cam.fov * DEG) / 2)
  cam.fov =
    (2 * Math.atan(cam.aspect < drawn ? (half * drawn) / cam.aspect : half)) /
    DEG
  cam.position.set(...L.cam.pos)
  look.set(...L.cam.look)
  if (!still())
    cam.position.add(
      p.set(
        Math.sin(t * 0.13) * 2.4,
        Math.sin(t * 0.09 + 1) * 1.4,
        Math.cos(t * 0.11) * 1.8,
      ),
    )
  if (zoomE > 0) {
    const tan = Math.tan((cam.fov * DEG) / 2)
    const high =
      Math.max(BOARD.mapD / 2 / tan, BOARD.mapW / 2 / (tan * cam.aspect)) +
      BOARD.h
    const [bx, bz] = L.board
    const e = smooth(zoomE)
    cam.position.lerp(dive.set(bx, high, bz + 0.01), e)
    look.lerp(dive.set(bx, 0, bz), e)
  }
  cam.lookAt(look)
  cam.updateProjectionMatrix()
  cam.updateMatrixWorld()
}

function flicker(S: Stage, t: number) {
  const f = still()
    ? 1
    : 0.86 +
      0.07 * Math.sin(t * 7.3) +
      0.05 * Math.sin(t * 13.1 + 1.3) +
      0.03 * Math.sin(t * 23.7 + 2.1)
  S.key.intensity = S.L.light * f
  S.candle.flame.scale.set(1.5 * (1.04 - (f - 0.86) * 0.4), 3.0 * f, 1)
  S.candle.flame.material.rotation = still() ? 0 : Math.sin(t * 2.3) * 0.06
  S.candle.glow.material.opacity = 0.42 + (f - 0.86) * 1.2
}

/** Where a thing held up to the eye goes: at a place on screen, so big. */
function heldUp(
  S: Stage,
  [x, y, frac]: [number, number, number],
  size: number,
  wide: boolean,
  extra?: Quaternion,
) {
  const cam = S.camera
  const tanH = Math.tan((cam.fov * DEG) / 2)
  const dist = wide
    ? size / (frac * 2 * tanH * cam.aspect)
    : size / (frac * 2 * tanH)
  d.set(x, y, 0.5).unproject(cam).sub(cam.position).normalize()
  const forward = cam.getWorldDirection(new Vector3())
  const at = cam.position
    .clone()
    .addScaledVector(d, dist / Math.max(0.5, d.dot(forward)))
  const turn = cam.quaternion.clone()
  if (extra) turn.multiply(extra)
  return { at, turn }
}

function moveCards(S: Stage, feel: Feel, dt: number) {
  const L = S.L
  const phone = S.variant === 'phone'
  for (const c of S.cards) {
    const hovered =
      feel.hover?.kind === 'card' && feel.hover.i === c.i && feel.open !== c.i
    const open = feel.open === c.i ? 1 : 0
    c.hoverE += ((hovered ? 1 : 0) - c.hoverE) * near(12, dt)
    c.openE += (open - c.openE) * near(open ? 5.5 : 7, dt)
    const h = smooth(clamp(c.hoverE))
    const oe = smooth(clamp(c.openE))
    p.copy(c.base).add(d.set(0, 3.4 * h, 1.6 * h))
    q.copy(c.qFlat).multiply(qAxis(1, 0, 0, 30 * DEG * h))
    let scale = L.cards.k
    if (c.openE > 0.001) {
      const pose = heldUp(
        S,
        [...L.open.ndc, L.open.frac],
        phone ? CARD.w : CARD.h,
        phone,
      )
      p.lerp(pose.at, oe)
      p.y += Math.sin(Math.PI * oe) * 6
      q.slerp(pose.turn, oe).multiply(qAxis(0, 1, 0, Math.PI * oe))
      scale += (1 - L.cards.k) * oe
    }
    c.root.scale.setScalar(scale)
    c.root.position.copy(p)
    c.root.quaternion.copy(q)
    c.shadow.material.opacity = 0.45 * (1 - Math.max(h * 0.5, oe))
  }
}

function moveBook(S: Stage, feel: Feel, dt: number) {
  const b = S.book
  const read = LAYOUTS[S.variant].read
  if (!b || !read) return
  b.hoverE +=
    ((feel.hover?.kind === 'book' && !feel.reading ? 1 : 0) - b.hoverE) *
    near(12, dt)
  b.readE += ((feel.reading ? 1 : 0) - b.readE) * near(5.5, dt)
  const r = smooth(clamp(b.readE))
  p.copy(b.base)
  p.y += 0.8 * b.hoverE
  q.copy(b.qBase)
  if (r > 0.001) {
    const pose = heldUp(
      S,
      [...read.ndc, read.frac],
      PAGE.w * 2 + 1.4,
      true,
      qAxis(1, 0, 0, Math.PI / 2),
    )
    p.lerp(pose.at, r)
    p.y += Math.sin(Math.PI * r) * 5
    q.slerp(pose.turn, r)
  }
  b.root.position.copy(p)
  b.root.quaternion.copy(q)
}

/** Where every thing that casts a shadow stands, in one number: when it changes, the shadows must be drawn again. */
function stance(S: Stage) {
  let sum = S.seal.hoverE + S.seal.pressT + S.die.hoverE + (S.die.roll ? 1 : 0)
  for (const c of S.cards) sum += c.hoverE * 3 + c.openE * 7
  if (S.book) sum += S.book.hoverE + S.book.readE * 5
  return sum
}

/** Moves everything for this frame; says whether a thing that casts a shadow moved. */
export function move(
  S: Stage,
  feel: Feel,
  [t, now, dt]: [number, number, number],
  zoomE: number,
) {
  const before = stance(S)
  moveCamera(S, t, zoomE)
  flicker(S, t)
  moveCards(S, feel, dt)
  moveSeal(S, feel, now, dt)
  moveDie(S, feel, now, dt)
  moveBook(S, feel, dt)
  return stance(S) !== before || S.die.roll !== null || S.seal.pressT > 0
}

export { still } from './ease'
