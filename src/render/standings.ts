import { UNIT, canRenew, isAllied, isFelon, isTeammate } from '../../engine'
import { PLAYERS } from './palette'
import type { GameState } from '../../engine'
import type { Heraldry } from './palette'

// How the lords stand, as the HUD reads them once a second (summary.ts):
// each lord's share, men and badges; the player's alliances, the offers
// made to him and those he made.

export type Lord = { seat: number; key: Heraldry; color: number }

const lordOf = (seat: number): Lord => ({
  seat,
  key: PLAYERS[seat].key,
  color: PLAYERS[seat].color,
})

/** Every lord: his share of the land, his men, and how he stands with the player. */
export function lordsOf(state: GameState, me: number) {
  return state.players.map((p, seat) => ({
    ...lordOf(seat),
    share: Math.round((100 * p.tiles) / state.grid.area),
    land: p.tiles,
    men: Math.floor(p.peasants / UNIT),
    alive: p.alive,
    felon: isFelon(state, seat),
    allied: me >= 0 && isAllied(state, me, seat),
    atWar: state.hosts.some(
      (h) =>
        (h.owner === me && h.target === seat) ||
        (h.owner === seat && h.target === me),
    ),
  }))
}

/** Where the player stands with the other lords. */
export function pacts(state: GameState, me: number) {
  if (me < 0) return { allies: [], offers: [], asked: [] }
  const seconds = (ticks: number) => Math.max(0, Math.ceil(ticks / 10))
  const { allianceTicks, renewTicks } = state.rules
  const allies = state.alliances.flatMap((x) => {
    if (x.a !== me && x.b !== me) return []
    const left = x.expires - state.tick
    const closing = canRenew(state, x)
    return [
      {
        ...lordOf(x.a === me ? x.b : x.a),
        left: seconds(left),
        ring: Math.max(0, left / (closing ? renewTicks : allianceTicks)),
        closing,
        pressed: x.a === me ? x.renewA : x.renewB,
        theirs: x.a === me ? x.renewB : x.renewA,
        team: false,
      },
    ]
  })
  // My teammates, allies for good: no time running, nothing to renew (« on
  // est en équipe pourtant il est pas affiché comme dans mon alliance »).
  const team = state.players.flatMap((p, seat) =>
    p.alive && isTeammate(state, me, seat)
      ? [
          {
            ...lordOf(seat),
            left: 0,
            ring: 1,
            closing: false,
            pressed: false,
            theirs: false,
            team: true,
          },
        ]
      : [],
  )
  const offers = state.requests
    .filter((r) => r.to === me && state.players[r.from].alive)
    .map((r) => ({
      ...lordOf(r.from),
      left: seconds(r.expires - state.tick),
      ring: Math.max(0, (r.expires - state.tick) / state.rules.requestTicks),
    }))
  const asked = state.requests.filter((r) => r.from === me).map((r) => r.to)
  return { allies: [...team, ...allies], offers, asked }
}
