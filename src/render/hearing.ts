import { NO_ONE, wonBy } from '../../engine'
import { makeArrivals } from './arrivals'
import type { Cue } from '../audio/cues'
import type { GameState } from '../../engine'
import type { News, PactNews } from './news'

// What the player hears of the game, and where (audio/cues.ts says how each
// sounds): the news, read once a second as the pennants read them, an army
// or a coup against him, a herald's letter, his alliances made or ended, a
// betrayal cried to all; and each tick, so that they sound with the gesture,
// his army leaving, his work laid, a caravan paying him, and the end of the
// game, won or lost, or his own fall.

/** A cue and the tile it comes from; -1 from nowhere in particular. */
export type Heard = { cue: Cue; tile: number }

const NEWS: Partial<Record<News['kind'], Cue>> = {
  attacked: 'alarm',
  coup: 'alarm',
  offering: 'herald',
  betrayed: 'betrayal',
}

const PACTS: Record<PactNews, Cue> = {
  offered: 'herald',
  made: 'pact',
  ended: 'parting',
}

/** The news heard, each from where it happened. */
export function heardIn(news: Array<News>): Array<Heard> {
  return news.flatMap((n) => {
    const cue = n.kind === 'pact' ? PACTS[n.how] : NEWS[n.kind]
    return cue ? [{ cue, tile: 'tile' in n ? n.tile : -1 }] : []
  })
}

/** What the player did or earned since the last tick, heard as it happens. */
export function makeHearing(state: GameState, me: number) {
  let hosts = new Set(state.hosts)
  let works = new Set(state.works)
  const arrivals = makeArrivals(me)
  let tick = state.tick
  let alive = me >= 0 && state.players[me].alive
  let ended = false

  /** The end, once: the game won or lost, or the player fallen before it. */
  function end(heard: Array<Heard>) {
    const fell = alive && !state.players[me].alive
    alive = state.players[me].alive
    if (ended || (state.winner === NO_ONE && !fell)) return
    ended = true
    heard.push({ cue: wonBy(state, me) ? 'victory' : 'defeat', tile: -1 })
  }

  return {
    watch(): Array<Heard> {
      if (me < 0) return []
      const heard: Array<Heard> = []
      for (const host of state.hosts)
        if (host.owner === me && !hosts.has(host))
          heard.push({ cue: 'muster', tile: host.from })
      // Laid, not taken: a work taken from another stands already.
      for (const work of state.works)
        if (work.owner === me && work.ready !== undefined && !works.has(work))
          heard.push({ cue: 'build', tile: work.tile })
      const paid = arrivals.read(state, state.tick - tick).at(0)
      if (paid) heard.push({ cue: 'gold', tile: paid.tile })
      hosts = new Set(state.hosts)
      works = new Set(state.works)
      tick = state.tick
      end(heard)
      return heard
    },
  }
}
