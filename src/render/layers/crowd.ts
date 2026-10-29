import type { Label } from './labels'

// The lords' words among the rest of the screen: two that would lie on each
// other, the smaller land's giving way; those under the HUD's bottom row
// faded there (labels.ts lays them).

/** The words of two lords that would lie on each other: the smaller land's give way, mine never (« les textes ne se chevauchent pas sur la map »). */
export function apart(labels: Map<number, Label>, me: number) {
  const shown = [...labels.entries()].filter(
    ([, l]) => l.box.visible && l.box.alpha > 0 && l.shown,
  )
  const boxOf = (l: Label) => {
    const { x, y } = l.shown ?? l.at
    const half = Math.max(l.name.width, l.army.width * 1.4) / 2
    return {
      l: x - half,
      r: x + half,
      t: y + l.name.y - l.name.height / 2,
      b: y + l.army.y + l.army.height / 2,
    }
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
