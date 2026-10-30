import { TICKS_PER_SECOND } from './units'
import { isAllied } from './diplomacy'
import { SEA } from './types'
import { seize, setOwner } from './land'
import { rebelled } from './scars'
import type { GameState } from './types'

// Encircled land: a piece of a lord's land, or of the free land, that
// touches one lord alone all round, no sea and no edge of the map, is his:
// it passes to him whole, with its works, as on OpenFront. A small piece,
// under so many tiles, free or a lord's, is his even with the sea round the
// rest (« quand on entoure même par de la mer des zones grises ça les prend
// automatiquement, sinon c'est trop chiant d'aller récupérer les
// micro-parcelles »); a great free island is taken tile by tile. A lord wholly ringed by one other loses
// everything. Allies never take each other's land
// so, and land held by rebels is never taken so. Read once a second.

/** The tiles of the piece being read, kept from one reading to the next: the reading makes no list of its own (it walks the whole land once a second). */
let queue = new Int32Array(0)

/** A piece of land held by one owner, its tiles the first `size` of `queue`, and who borders it: a lord, several, or the open (-2). */
function pieceOf(state: GameState, start: number, seen: Uint8Array) {
  const { width, height } = state.grid
  const last = (height - 1) * width
  const owner = state.owner[start]
  if (queue.length < state.owner.length)
    queue = new Int32Array(state.owner.length)
  const borders = new Set<number>()
  let size = 0
  queue[size++] = start
  seen[start] = 1
  // Each tile beside, in the order of grid.ts's around.
  const visit = (n: number) => {
    const o = state.owner[n]
    if (o !== owner) borders.add(o)
    else if (!seen[n]) {
      seen[n] = 1
      queue[size++] = n
    }
  }
  for (let i = 0; i < size; i++) {
    const t = queue[i]
    const x = t % width
    if (x === 0 || t < width || x === width - 1 || t >= last) borders.add(SEA)
    if (x > 0) visit(t - 1)
    if (x < width - 1) visit(t + 1)
    if (t >= width) visit(t - width)
    if (t < last) visit(t + width)
  }
  return { owner, size, borders }
}

/** The land encircled by a lord passes to him. */
export function enclose(state: GameState): void {
  if (state.tick % TICKS_PER_SECOND !== 0) return
  const seen = new Uint8Array(state.owner.length)
  state.owner.forEach((owner, start) => {
    if (owner === SEA || seen[start]) return
    const piece = pieceOf(state, start, seen)
    // The sea is no wall round a small piece, free or a lord's (« oui pour
    // 3 »): one lord beside it is enough; never round a whole coastal realm,
    // nor a great free island where one boat landed (« Ok », 30/10).
    if (piece.size < state.rules.seaWalled) piece.borders.delete(SEA)
    if (piece.borders.size !== 1) return
    const tiles = Array.from(queue.subarray(0, piece.size))
    // Rebels are never encircled: they must be fought for.
    if (tiles.some((t) => rebelled(state, t))) return
    const [lord] = piece.borders
    if (lord < 0 || (owner >= 0 && isAllied(state, owner, lord))) return
    const taken = new Set(tiles)
    for (const t of tiles) setOwner(state, t, lord)
    for (const work of state.works)
      if (taken.has(work.tile)) seize(state, work, lord)
  })
}
