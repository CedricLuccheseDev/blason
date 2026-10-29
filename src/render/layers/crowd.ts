import type { BitmapText, Container, Graphics } from 'pixi.js'

// The lords' words among the rest of the screen: off his works, moved aside
// on his land; two that would lie on each other, the smaller land's giving
// way; those under the HUD's bottom row faded there (labels.ts lays them).

/** A lord's words as labels.ts lays them. */
export type Label = {
  box: Container
  name: BitmapText
  army: BitmapText
  mark: Graphics
  size: number
  /** His land's side, in map units. */
  reach: number
  at: { x: number; y: number }
  /** How far it is moved off his works at this zoom (crowd.ts). */
  nudge: { x: number; y: number }
  /** Where it is drawn now, gliding towards `at` and its nudge. */
  shown: { x: number; y: number } | null
  /** The army as counted at the last beat. */
  count: number
}

/** What the words keep clear of: each lord's works where they stand and how far they reach at this zoom, in map units; whether a point is on his land. */
export type Ground = {
  worksOf: (lord: number) => Array<{ x: number; y: number }>
  reach: (lord: number) => number
  holds: (lord: number, x: number, y: number) => boolean
}

/** The steps tried round a name's place, rings of eight, each its box's size further. */
const RINGS = 3
const AROUND = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
] as const

/** A label's box round its place, in map units, from its words as laid. */
function extent(l: Label) {
  const half = Math.max(l.name.width, l.army.width * 1.4) / 2
  return {
    half,
    top: l.name.y - l.name.height / 2,
    bottom: l.army.y + l.army.height / 2,
  }
}

/**
 * A lord's words moved off his works (« essaye de pas superposer les choses,
 * le nom/unités des royaumes essaye de les décaler quand ils sont sur un
 * bâtiment »): if his name and figure would lie over one of his works as
 * drawn at this zoom, the nearest place round it, on his land, that lies
 * over none; where it was if none does.
 */
export function offWorks(labels: Map<number, Label>, ground: Ground) {
  for (const [lord, l] of labels)
    if (l.box.visible) l.nudge = clearOf(lord, l, ground)
}

/** How far a lord's words go from their place to lie over none of his works: none if they lie over none there, or nowhere round it does. */
function clearOf(lord: number, l: Label, ground: Ground) {
  const works = ground.worksOf(lord)
  const r = ground.reach(lord)
  const box = extent(l)
  const covers = (x: number, y: number) =>
    works.some(
      (w) =>
        w.x > x - box.half - r &&
        w.x < x + box.half + r &&
        w.y > y + box.top - r &&
        w.y < y + box.bottom + r,
    )
  if (!covers(l.at.x, l.at.y)) return { x: 0, y: 0 }
  const step = { x: box.half, y: (box.bottom - box.top) / 2 }
  for (let ring = 1; ring <= RINGS; ring++)
    for (const [dx, dy] of AROUND) {
      const [x, y] = [dx * step.x * ring, dy * step.y * ring]
      if (ground.holds(lord, l.at.x + x, l.at.y + y))
        if (!covers(l.at.x + x, l.at.y + y)) return { x, y }
    }
  return { x: 0, y: 0 }
}

/** The words of two lords that would lie on each other: the smaller land's give way, mine never (« les textes ne se chevauchent pas sur la map »). */
export function apart(labels: Map<number, Label>, me: number) {
  const shown = [...labels.entries()].filter(
    ([, l]) => l.box.visible && l.box.alpha > 0 && l.shown,
  )
  const boxOf = (l: Label) => {
    const { x, y } = l.shown ?? l.at
    const { half, top, bottom } = extent(l)
    return { l: x - half, r: x + half, t: y + top, b: y + bottom }
  }
  for (const [i, [lord, a]] of shown.entries())
    for (const [other, b] of shown.slice(i + 1)) {
      if (a.box.alpha === 0 || b.box.alpha === 0) continue
      const [p, q] = [boxOf(a), boxOf(b)]
      if (p.r < q.l || q.r < p.l || p.b < q.t || q.b < p.t) continue
      // Mine stays; else the larger land's.
      const yields = lord === me || (other !== me && a.reach >= b.reach)
      const gone = yields ? b : a
      gone.box.alpha = 0
      gone.box.renderable = false
    }
}

/** The words under the HUD's bottom row fade there, that nothing lies under its pieces; read each frame, as the camera moves. */
export function fadeUnder(labels: Map<number, Label>, bottom: number) {
  for (const label of labels.values()) {
    if (!label.box.renderable) continue
    const at = label.box.getGlobalPosition()
    label.name.alpha =
      label.army.alpha =
      label.mark.alpha =
        at.y > bottom ? 0.15 : 1
  }
}
