import { drawInt } from '../numbers'
import { eachAround } from '../grid'
import { isAllied } from '../diplomacy'
import { isPort } from '../ships'
import { standing } from '../land'
import { warshipPrice } from '../warships'
import type { GameState, Order } from '../types'

// The bots' warships, fitted out as a person would: now and then, with a
// port of their own and gold to spare, one for so much land, three at most;
// sent off a port of a lord not their ally, to take his merchant ships and
// sink his boats, or, with none, kept off their own port.

/** Out of 100, how often a bot that could fit out a warship does, each time it thinks. */
const NERVE = 4
/** One warship for so many tiles a bot holds, beyond the first; so many at most. */
const [ROOM, MOST] = [600, 3]

/** The water by a port: the first tile of it round the port's. */
function offPort(state: GameState, port: number): number {
  let wet = -1
  eachAround(state.grid, port, (n) => {
    if (wet < 0 && state.grid.water[n]) wet = n
  })
  return wet
}

/** A warship fitted out, if it is time, sent off an enemy's port drawn by lot, or its own. */
export function navy(state: GameState, me: number): Array<Order> {
  const lord = state.players[me]
  const afloat = state.warships.filter((s) => s.owner === me).length
  if (afloat >= Math.min(MOST, 1 + Math.floor(lord.tiles / ROOM))) return []
  if (drawInt(state.seed, 100, 'navy', me, state.tick) >= NERVE) return []
  if (lord.gold < (warshipPrice(state, me) + 150) * 1000) return []
  const ports = state.works.filter((w) => isPort(w))
  // A port standing fits it out: one being built, or just taken, none yet.
  const own = ports.filter((w) => w.owner === me && standing(state, w))
  if (own.length === 0) return []
  const theirs = ports.filter(
    (w) => w.owner !== me && !isAllied(state, me, w.owner),
  )
  const marks = theirs.length > 0 ? theirs : own
  const mark = marks[drawInt(state.seed, marks.length, 'prey', me, state.tick)]
  const tile = offPort(state, mark.tile)
  return tile < 0 ? [] : [{ player: me, type: 'warship', tile }]
}
