import { apart, around } from '../grid'
import { courseFor } from '../course'
import { NEUTRAL } from '../types'
import type { GameState } from '../types'

// The free land a bot reaches only by boat (« les fleuves … traverser »,
// 31/10): a piece of it the sea and a river close round, which no lord's land
// borders, was never taken (an arena game left 662 tiles of it free at 20
// minutes). With no free land at its border, a bot sails to the shore of
// the free land nearest its standard, if an army can get there.

/** The free tiles by the water, found again every so many ticks: the free land shrinks slowly. */
const EVERY = 100
const found = new WeakMap<GameState, { at: number; shores: Array<number> }>()

function shoresOf(state: GameState): Array<number> {
  const known = found.get(state)
  const at = Math.floor(state.tick / EVERY)
  if (known?.at === at) return known.shores
  const { grid } = state
  const shores: Array<number> = []
  state.owner.forEach((o, t) => {
    if (o !== NEUTRAL || !grid.land[t]) return
    if (around(grid, t).some((n) => grid.water[n])) shores.push(t)
  })
  found.set(state, { at, shores })
  return shores
}

/** The free land's shore nearest the bot's standard that its army can reach, by land or by boat; none. */
export function freeAfar(state: GameState, me: number): Array<number> | null {
  const home = state.players[me].standard
  if (home < 0) return null
  let [best, near] = [-1, Infinity]
  for (const t of shoresOf(state)) {
    const gap = apart(state.grid, home, t)
    if (gap < near) [best, near] = [t, gap]
  }
  if (best < 0 || !courseFor(state, me, best, 'host')) return null
  return [best]
}
