// Where a piece laid on the map stands on the screen (Heralds.tsx): where
// it belongs when that is in view, clear of the HUD's corners; else it
// waits at the edge of the view, on the line from its middle to where it
// belongs, and says which way that is.

export type Inset = { top: number; right: number; bottom: number; left: number }

/** Where it stands, and the way to where it belongs when it waits at the edge (radians, 0 to the right). */
export type Placed = {
  x: number
  y: number
  toward: number | null
  /** The edge it waits at, if it does. */
  side?: 'top' | 'right' | 'bottom' | 'left'
}

/** Kept clear of the HUD: the race and the lords at the top, the bar at the bottom, as drawn at the HUD's scale 1. */
export const INSET: Inset = { top: 112, right: 64, bottom: 216, left: 64 }
export const COMPACT_INSET: Inset = {
  top: 96,
  right: 56,
  bottom: 270,
  left: 56,
}

export function placeOn(
  at: { x: number; y: number },
  width: number,
  height: number,
  inset: Inset,
): Placed {
  const [left, right] = [inset.left, width - inset.right]
  const [top, bottom] = [inset.top, height - inset.bottom]
  if (at.x >= left && at.x <= right && at.y >= top && at.y <= bottom)
    return { ...at, toward: null }
  const [cx, cy] = [(left + right) / 2, (top + bottom) / 2]
  const [dx, dy] = [at.x - cx, at.y - cy]
  const across = reach(dx, cx, left, right)
  const down = reach(dy, cy, top, bottom)
  const s = Math.min(across, down)
  let side: Placed['side'] = dy > 0 ? 'bottom' : 'top'
  if (across < down) side = dx > 0 ? 'right' : 'left'
  return { x: cx + dx * s, y: cy + dy * s, toward: Math.atan2(dy, dx), side }
}

/** How far along a step of `d` from `c` the line meets the side it heads for, `low` or `high`. */
function reach(d: number, c: number, low: number, high: number): number {
  if (d === 0) return Infinity
  return ((d > 0 ? high : low) - c) / d
}

/**
 * Pieces pushed apart so that none hides another: those waiting at the
 * edge along it, on each side in their order, each at least so many pixels
 * past the one before, across (their words under them are wide) or down;
 * those on the map side by side.
 */
export function spread(
  placed: Array<Placed>,
  gap: { x: number; y: number },
): Array<Placed> {
  const out = placed.map((p) => ({ ...p }))
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    const along = side === 'top' || side === 'bottom' ? 'x' : 'y'
    const row = out
      .filter((p) => p.side === side)
      .sort((a, b) => a[along] - b[along])
    for (let i = 1; i < row.length; i++)
      row[i][along] = Math.max(row[i][along], row[i - 1][along] + gap[along])
  }
  // On the map, those that would lie on one another side by side.
  const laid = out.filter((p) => !p.side).sort((a, b) => a.x - b.x)
  laid.forEach((p, i) => {
    for (const q of laid.slice(0, i))
      if (Math.abs(p.y - q.y) < gap.y && Math.abs(p.x - q.x) < gap.x)
        p.x = q.x + gap.x
  })
  return out
}
