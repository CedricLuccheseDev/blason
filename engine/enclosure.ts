import { TICKS_PER_SECOND } from './units'
import { around } from './grid'
import { isAllied } from './diplomacy'
import { SEA } from './types'
import { setOwner } from './land'
import type { GameState } from './types'

// Encircled land: a piece of a lord's land, or of the free land, that
// touches one lord alone all round, no sea and no edge of the map, is his:
// it passes to him whole, with its works, as on OpenFront. A lord wholly
// ringed by one other loses everything. Allies never take each other's land
// so. Read once a second.

/** A piece of land held by one owner, and who borders it: a lord, several, or the open (-2). */
function pieceOf(state: GameState, start: number, seen: Uint8Array) {
  const { width, height } = state.grid
  const owner = state.owner[start]
  const tiles = [start]
  const borders = new Set<number>()
  seen[start] = 1
  for (const t of tiles) {
    const [x, y] = [t % width, Math.floor(t / width)]
    if (x === 0 || y === 0 || x === width - 1 || y === height - 1)
      borders.add(SEA)
    for (const n of around(state.grid, t)) {
      const o = state.owner[n]
      if (o !== owner) borders.add(o)
      else if (!seen[n]) {
        seen[n] = 1
        tiles.push(n)
      }
    }
  }
  return { owner, tiles, borders }
}

/** The land encircled by a lord passes to him. */
export function enclose(state: GameState): void {
  if (state.tick % TICKS_PER_SECOND !== 0) return
  const seen = new Uint8Array(state.owner.length)
  state.owner.forEach((owner, start) => {
    if (owner === SEA || seen[start]) return
    const piece = pieceOf(state, start, seen)
    if (piece.borders.size !== 1) return
    const [lord] = piece.borders
    if (lord < 0 || (owner >= 0 && isAllied(state, owner, lord))) return
    const taken = new Set(piece.tiles)
    for (const t of piece.tiles) setOwner(state, t, lord)
    for (const work of state.works) if (taken.has(work.tile)) work.owner = lord
  })
}
