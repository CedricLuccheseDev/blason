import { BOARD, CARD, PAGE, RIBBON, SEAL_R, TAG } from './sizes'
import { pageY } from './objects/book'
import type { Object3D } from 'three'
import type { Stage } from './stage'

// Where each piece of HTML on the table is pinned (its `data-ov` names
// it): by four corners of a thing's face, by a disc over a round thing, or
// by a point beside it; shown while it should be, lifted while it hides
// what lies under it.

export type V3 = [number, number, number]
export type Spec = {
  obj: Object3D
  quad?: { w: number; h: number; corners: [V3, V3, V3, V3] }
  disc?: { r: number; at: V3 }
  point?: V3
  /** Shown only while this holds. */
  show?: () => boolean
  /** Lifted towards the eye while this holds: it hides what lies under it. */
  raise?: () => boolean
  pad?: number
}
export type View = { open: number | null; reading: boolean }

/** The pieces of HTML a table knows, by their name. */
export function overlaySpecs(S: Stage, view: View): Map<string, Spec> {
  const specs = new Map<string, Spec>()
  const [hw, hh, ft] = [CARD.w / 2, CARD.h / 2, CARD.t / 2 + 0.006]
  for (const c of S.cards) {
    specs.set(`front-${c.i}`, {
      obj: c.card,
      quad: {
        w: 200,
        h: 282,
        corners: [
          [-hw, hh, ft],
          [hw, hh, ft],
          [hw, -hh, ft],
          [-hw, -hh, ft],
        ],
      },
      show: () => c.openE <= 0.45,
    })
    specs.set(`back-${c.i}`, {
      obj: c.card,
      quad: {
        w: 266,
        h: 375,
        corners: [
          [hw, hh, -ft],
          [-hw, hh, -ft],
          [-hw, -hh, -ft],
          [hw, -hh, -ft],
        ],
      },
      show: () => c.openE > 0.8 && view.open === c.i,
      raise: () => c.openE > 0.05,
    })
  }
  const [rw, rd] = [RIBBON.w / 2 - RIBBON.notch - 0.5, RIBBON.d / 2 - 0.35]
  specs.set('play', {
    obj: S.ribbon,
    quad: {
      w: 300,
      h: 84,
      corners: [
        [-rw, 0.07, -rd],
        [rw, 0.07, -rd],
        [rw, 0.07, rd],
        [-rw, 0.07, rd],
      ],
    },
  })
  specs.set('seal', {
    obj: S.seal.root,
    disc: { r: SEAL_R + 0.8, at: [0, 1.6, 0] },
  })
  specs.set('die', { obj: S.die.root, disc: { r: 2.6, at: [0, 1.7, 0] } })
  specs.set('die-word', { obj: S.die.root, point: [0, 0, 3.4] })
  const [mw, md, my] = [BOARD.mapW / 2, BOARD.mapD / 2, BOARD.h + 0.02]
  specs.set('board', {
    obj: S.board,
    quad: {
      w: 500,
      h: 328,
      corners: [
        [-mw, my, -md],
        [mw, my, -md],
        [mw, my, md],
        [-mw, my, md],
      ],
    },
  })
  if (S.tag) {
    const [tw, td] = [TAG.w / 2, TAG.d / 2]
    specs.set('tag', {
      obj: S.tag,
      quad: {
        w: 300,
        h: 108,
        corners: [
          [-tw, 0.15, -td],
          [tw, 0.15, -td],
          [tw, 0.15, td],
          [-tw, 0.15, td],
        ],
      },
    })
  }
  const book = S.book
  if (book) {
    const [z0, z1, u0, u1] = [-PAGE.d / 2 + 1.3, PAGE.d / 2 - 1.3, 0.1, 0.92]
    const y = (u: number) => pageY(u) + 0.02
    const raise = () => book.readE > 0.05
    specs.set('page-l', {
      obj: book.body,
      raise,
      pad: 0.12,
      quad: {
        w: 250,
        h: 340,
        corners: [
          [-u1 * PAGE.w, y(u1), z0],
          [-u0 * PAGE.w, y(u0), z0],
          [-u0 * PAGE.w, y(u0), z1],
          [-u1 * PAGE.w, y(u1), z1],
        ],
      },
    })
    specs.set('page-r', {
      obj: book.body,
      raise,
      pad: 0.12,
      quad: {
        w: 250,
        h: 340,
        corners: [
          [u0 * PAGE.w, y(u0), z0],
          [u1 * PAGE.w, y(u1), z0],
          [u1 * PAGE.w, y(u1), z1],
          [u0 * PAGE.w, y(u0), z1],
        ],
      },
    })
  }
  return specs
}
