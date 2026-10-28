import {
  ARMIES,
  NO_ONE,
  UNIT,
  WORKS,
  capOf,
  costOf,
  hasPicked,
  isAllied,
  isFelon,
  menFor,
  nextDrop,
  priceOf,
  victoryShare,
  worksOf,
} from '../../engine'
import { PLAYERS } from './palette'
import type { Army, GameState, Work } from '../../engine'
import type { Heraldry } from './palette'

// What the HUD shows, read from the state once a second, as
// every figure of the game: they step, they do not run.

type Seat = { key: Heraldry; color: number; share: number }

export type Summary = {
  seconds: number
  opening: number | null
  /** Share of the land needed to win, in percent, and the seconds before it drops again. */
  needed: number
  dropIn: number | null
  /** The one lord ahead of all others; none while the first are tied. */
  leader: Seat | null
  winner: Heraldry | null
  me:
    | (Seat & {
        /** His peasants and what his villages feed, and how many are born a second; his gold. */
        peasants: number
        cap: number
        growth: number
        gold: number
        alive: boolean
        picked: boolean
        /** His villages with no army out: an attack leaves from one of them. */
        free: number
      })
    | null
  /** The army in hand, and the men each would take now and their gold. */
  army: Army
  armies: Array<{ army: Army; share: number; men: number; gold: number }>
  /** The work in hand, if any, and what each costs now. */
  work: Work | null
  works: Array<{ work: Work; price: number; can: boolean }>
  /** My allies, with the seconds left and whether I may renew now; the offers made to me; the lords I asked. */
  allies: Array<Lord & { left: number; renewable: boolean }>
  /** Every lord, as the card of the one aimed at shows him. */
  lords: Array<
    Lord & {
      share: number
      men: number
      alive: boolean
      felon: boolean
      allied: boolean
      atWar: boolean
    }
  >
  offers: Array<Lord & { left: number }>
  asked: Array<number>
}

type Lord = { seat: number; key: Heraldry; color: number }

const lordOf = (seat: number): Lord => ({
  seat,
  key: PLAYERS[seat].key,
  color: PLAYERS[seat].color,
})

/** Every lord: his share of the land, his men, and how he stands with the player. */
function lordsOf(state: GameState, me: number) {
  return state.players.map((p, seat) => ({
    ...lordOf(seat),
    share: Math.round((100 * p.tiles) / state.grid.area),
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
function pacts(state: GameState, me: number) {
  if (me < 0) return { allies: [], offers: [], asked: [] }
  const seconds = (ticks: number) => Math.max(0, Math.ceil(ticks / 10))
  const allies = state.alliances.flatMap((x) => {
    if (x.a !== me && x.b !== me) return []
    const left = x.expires - state.tick
    const done = x.a === me ? x.renewA : x.renewB
    return [
      {
        ...lordOf(x.a === me ? x.b : x.a),
        left: seconds(left),
        renewable: left <= state.rules.renewTicks && !done,
      },
    ]
  })
  const offers = state.requests
    .filter((r) => r.to === me && state.players[r.from].alive)
    .map((r) => ({ ...lordOf(r.from), left: seconds(r.expires - state.tick) }))
  const asked = state.requests.filter((r) => r.from === me).map((r) => r.to)
  return { allies, offers, asked }
}

export function summarize(
  state: GameState,
  me: number,
  hand: { army: Army; work: Work | null },
): Summary {
  const area = state.grid.area
  const share = (seat: number) =>
    Math.round((100 * state.players[seat].tiles) / area)
  const seat = (id: number): Seat => ({
    key: PLAYERS[id].key,
    color: PLAYERS[id].color,
    share: share(id),
  })
  const held = state.players.map((p) => p.tiles)
  const most = Math.max(...held)
  const left = state.rules.openingTicks - state.tick
  const drop = nextDrop(state)
  const lord = me >= 0 ? state.players[me] : null
  const cap = me >= 0 ? capOf(state, me) : 0
  const gold = lord ? Math.floor(lord.gold / UNIT) : 0
  return {
    seconds: Math.floor(state.tick / 10),
    opening: left > 0 ? Math.ceil(left / 10) : null,
    needed: victoryShare(state) / 10,
    dropIn: drop === null ? null : Math.ceil(drop / 10),
    leader:
      held.filter((n) => n === most).length === 1
        ? seat(held.indexOf(most))
        : null,
    winner: state.winner === NO_ONE ? null : PLAYERS[state.winner].key,
    me: lord && {
      ...seat(me),
      peasants: Math.floor(lord.peasants / UNIT),
      cap: Math.floor(cap / UNIT),
      growth:
        lord.peasants >= cap
          ? 0
          : Math.floor(cap / UNIT / state.rules.fillSeconds),
      gold,
      alive: lord.alive,
      picked: hasPicked(state, me),
      free:
        worksOf(state, me, 'village') -
        state.hosts.filter((h) => h.owner === me).length,
    },
    army: hand.army,
    armies: ARMIES.map((a) => {
      const men = me >= 0 ? menFor(state, me, a) : 0
      return {
        army: a,
        share: state.rules.armies[a],
        men: Math.floor(men / UNIT),
        gold: Math.floor(costOf(state, men) / UNIT),
      }
    }),
    work: hand.work,
    works: WORKS.map((w) => {
      const price = me >= 0 ? priceOf(state, me, w) : 0
      return { work: w, price, can: price <= gold }
    }),
    ...pacts(state, me),
    lords: lordsOf(state, me),
  }
}
