import { makeCoupNews } from './coupNews'
import type { CoupNews } from './coupNews'
import type { GameState } from '../../engine'

// The news, as the player hears it, each where it happened (notes.ts lays
// it on the map, the HUD writes it there): a lord whose army comes for
// him, at the border it bites into, told once and again only after a
// while; the coups launched at him, his troublemaker stopped, a land risen
// (coupNews.ts). And the one cry to all: a lord who broke an alliance, any
// alliance, and whom he betrayed (the HUD's banner). A work lost is struck
// out where it stood by the map itself (layers/tidings.ts). Read once a
// second by comparing the game with the second before.

export type News =
  | { kind: 'attacked'; lord: number; tile: number }
  | { kind: 'betrayed'; lord: number; victim: number }
  | CoupNews

/** Seconds a lord who struck may strike again before it is news once more. */
const AGAIN = 30

export function makeNews(state: GameState, me: number) {
  /** When each lord last had an army against me, in seconds read. */
  const struck = new Map<number, number>()
  let second = 0
  let alliances = [...state.alliances]
  let felons = state.players.map((p) => p.felonUntil)
  const coups = makeCoupNews(state, me)

  /** The lords whose armies come for me, where they enter, told once, and again only after a while. */
  function strikes(news: Array<News>) {
    for (const host of state.hosts) {
      if (host.target !== me) continue
      const last = struck.get(host.owner)
      if (last === undefined || second - last > AGAIN)
        news.push({ kind: 'attacked', lord: host.owner, tile: host.entry })
      struck.set(host.owner, second)
    }
  }

  /** The alliances gone since the last reading whose breaker was marked a traitor for it. */
  function betrayals(news: Array<News>) {
    const now = new Set(state.alliances)
    for (const alliance of alliances) {
      if (now.has(alliance)) continue
      const { a, b } = alliance
      const broke = (lord: number) =>
        state.players[lord].felonUntil > felons[lord]
      if (broke(a)) news.push({ kind: 'betrayed', lord: a, victim: b })
      else if (broke(b)) news.push({ kind: 'betrayed', lord: b, victim: a })
    }
    alliances = [...state.alliances]
    felons = state.players.map((p) => p.felonUntil)
  }

  return {
    /** What happened since the last reading. */
    read(): Array<News> {
      const news: Array<News> = []
      second += 1
      betrayals(news)
      if (me < 0) return news
      strikes(news)
      news.push(...coups.read())
      return news
    },
  }
}
