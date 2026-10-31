import type { Cells } from './cells'
import type { Ground } from './types'

// The land a map of some lands only leaves out (generate.ts).

/**
 * The dead land of a ground: what is not water there, its high mountains
 * with it (« y'a des zones pas dead sur France », the Pyrenees on Spain's
 * side), and the pockets of land it closes round; its high mountains, those
 * left in play.
 */
export function deadOf(cells: Cells, ground: Ground) {
  const { water } = ground
  const dead = cells.sites.map(
    (_, c) => (ground.dead?.[c] ?? false) && !water[c],
  )
  const peaks = ground.peaks.map((p, c) => p && !dead[c])
  if (ground.dead) deadPockets(cells, water, peaks, dead)
  return { dead, peaks }
}

/**
 * The pockets of land in play the dead land closes round, made dead: a
 * piece of land that is not the greatest and touches no water, which no
 * army reaches on foot nor by boat, was drawn as land on a map of some
 * lands only.
 */
function deadPockets(
  cells: Cells,
  water: Array<boolean>,
  peaks: Array<boolean>,
  dead: Array<boolean>,
) {
  const open = (c: number) => !water[c] && !peaks[c] && !dead[c]
  const piece = new Int32Array(water.length).fill(-1)
  const pieces: Array<{ cells: Array<number>; wet: boolean }> = []
  water.forEach((_, start) => {
    if (!open(start) || piece[start] >= 0) return
    const found = { cells: [start], wet: false }
    piece[start] = pieces.length
    for (const at of found.cells)
      for (const n of cells.neighbors[at]) {
        if (water[n]) found.wet = true
        if (!open(n) || piece[n] >= 0) continue
        piece[n] = pieces.length
        found.cells.push(n)
      }
    pieces.push(found)
  })
  const most = Math.max(0, ...pieces.map((p) => p.cells.length))
  for (const p of pieces)
    if (!p.wet && p.cells.length < most) for (const c of p.cells) dead[c] = true
}
