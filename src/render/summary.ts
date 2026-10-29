import {
  ARMIES,
  COUPS,
  NO_ONE,
  TICKS_PER_SECOND,
  UNIT,
  WORKS,
  capOf,
  costOf,
  coupPrice,
  hasPicked,
  menFor,
  nextDrop,
  offeringOf,
  priceOf,
  sicknessOf,
  victoryShare,
  wonBy,
  worksOf,
} from '../../engine'
import { PLAYERS } from './palette'
import { lordsOf, pacts } from './standings'
import type { Lord } from './standings'
import type { Army, Coup, GameState, Work } from '../../engine'
import type { Hand } from './hand'
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
  /** Whether the player's side won: himself, or his team. */
  won: boolean
  me:
    | (Seat & {
        /** His peasants and what his land and villages feed, and how many are born a second, or die of sickness when there are too many (below zero); his gold, and all he has gained since the start, the purse's "+" read from it. */
        peasants: number
        cap: number
        growth: number
        gold: number
        earned: number
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
  /** The coup in hand, if any, and what each costs now: dearer with each launched. */
  coup: Coup | null
  coups: Array<{ coup: Coup; price: number; can: boolean }>
  /**
   * My allies: the seconds left and the share of its time still to run, of
   * the whole or, in its last moments, of them; whether those have come,
   * and whether I and he pressed the seal to renew. The offers made to me,
   * with the share of their time left too; the lords I asked.
   */
  allies: Array<
    Lord & {
      left: number
      ring: number
      closing: boolean
      pressed: boolean
      theirs: boolean
    }
  >
  /** Every lord, as the card of the one aimed at shows him. */
  lords: Array<
    Lord & {
      share: number
      /** His tiles, for what is drawn to the scale of his land. */
      land: number
      men: number
      alive: boolean
      felon: boolean
      allied: boolean
      atWar: boolean
    }
  >
  offers: Array<Lord & { left: number; ring: number }>
  asked: Array<number>
  /** The gold an offering of mine would give now: a share of my gold (the right click's menu). */
  offering: number
}

export function summarize(
  state: GameState,
  me: number,
  hand: Hand,
  /** All the gold the player has gained, in thousandths (earnings.ts). */
  earned = 0,
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
    won: me >= 0 && wonBy(state, me),
    me: lord && {
      ...seat(me),
      peasants: Math.floor(lord.peasants / UNIT),
      cap: Math.floor(cap / UNIT),
      growth:
        lord.peasants >= cap
          ? -Math.ceil((sicknessOf(state, me) * TICKS_PER_SECOND) / UNIT)
          : Math.floor(cap / UNIT / state.rules.fillSeconds),
      gold,
      earned: Math.floor(earned / UNIT),
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
        gold: Math.floor(costOf(state, men, a) / UNIT),
      }
    }),
    work: hand.work,
    works: WORKS.map((w) => {
      const price = me >= 0 ? priceOf(state, me, w) : 0
      return { work: w, price, can: price <= gold }
    }),
    coup: hand.coup,
    coups: COUPS.map((c) => {
      const price = me >= 0 ? coupPrice(state, me, c) : 0
      return { coup: c, price, can: price <= gold }
    }),
    ...pacts(state, me),
    offering: me >= 0 ? Math.floor(offeringOf(state, me) / UNIT) : 0,
    lords: lordsOf(state, me),
  }
}
