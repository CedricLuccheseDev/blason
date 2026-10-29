import { UNIT, apart } from '../../engine'
import { makeCoupNews } from './coupNews'
import type { CoupNews } from './coupNews'
import type { GameState } from '../../engine'

// The news, as the player hears it, each where it happened (notes.ts lays
// it on the map, the HUD writes it there): a lord whose army comes for
// him, at the border it bites into, told once and again only after a
// while; the coups launched at him, his troublemaker stopped, a land risen
// (coupNews.ts); an offering given him, and how much gold, on the giver's
// land nearest his own; his alliances, offered to him, made, or come to
// their end, there too, though the map shows them (« continue les notifs
// même si on affiche les alliances sur la map »). And the one cry to all: a lord who broke an
// alliance, any alliance, and whom he betrayed (the HUD's banner). A work
// lost is struck out where it stood by the map itself (layers/tidings.ts).
// Read once a second by comparing the game with the second before.

export type News =
  | { kind: 'attacked'; lord: number; tile: number }
  | { kind: 'betrayed'; lord: number; victim: number }
  | { kind: 'offering'; lord: number; gold: number; tile: number }
  | { kind: 'pact'; lord: number; how: PactNews; tile: number }
  | CoupNews

/** What befell one of my alliances: offered to me, made, or come to its end (not broken: a betrayal is cried to all). */
export type PactNews = 'offered' | 'made' | 'ended'

/** Seconds a lord who struck may strike again before it is news once more. */
const AGAIN = 30

export function makeNews(state: GameState, me: number) {
  /** When each lord last had an army against me, in seconds read. */
  const struck = new Map<number, number>()
  let second = 0
  let alliances = [...state.alliances]
  let felons = state.players.map((p) => p.felonUntil)
  let given = new Set(state.offerings)
  let asked = new Set(state.requests)
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

  /**
   * The alliances gone since the last reading: whose breaker was marked a
   * traitor for it, cried to all; mine that came to their end unbroken. And
   * mine made since, and the offers made to me.
   */
  function bonds(news: Array<News>) {
    const now = new Set(state.alliances)
    const other = (a: number, b: number) => (a === me ? b : a)
    for (const alliance of alliances) {
      if (now.has(alliance)) continue
      const { a, b } = alliance
      const broke = (lord: number) =>
        state.players[lord].felonUntil > felons[lord]
      if (broke(a)) news.push({ kind: 'betrayed', lord: a, victim: b })
      else if (broke(b)) news.push({ kind: 'betrayed', lord: b, victim: a })
      else if (a === me || b === me) pact(news, other(a, b), 'ended')
    }
    const before = new Set(alliances)
    for (const { a, b } of state.alliances.filter((x) => !before.has(x)))
      if (a === me || b === me) pact(news, other(a, b), 'made')
    for (const r of state.requests)
      if (r.to === me && !asked.has(r)) pact(news, r.from, 'offered')
    alliances = [...state.alliances]
    felons = state.players.map((p) => p.felonUntil)
    asked = new Set(state.requests)
  }

  function pact(news: Array<News>, lord: number, how: PactNews) {
    if (me >= 0) news.push({ kind: 'pact', lord, how, tile: sentFrom(lord) })
  }

  /** A lord's tile nearest my standard, where what he sends me comes from; his own standard while I have none. */
  function sentFrom(lord: number): number {
    const home = state.players[me].standard
    if (home < 0) return state.players[lord].standard
    let best = -1
    let near = Infinity
    state.owner.forEach((owner, t) => {
      if (owner !== lord) return
      const d = apart(state.grid, t, home)
      if (d < near) [best, near] = [t, d]
    })
    return best
  }

  /** The offerings given me since the last reading, each where it comes from. */
  function gifts(news: Array<News>) {
    for (const o of state.offerings)
      if (!given.has(o) && o.to === me)
        news.push({
          kind: 'offering',
          lord: o.from,
          gold: Math.floor(o.gold / UNIT),
          tile: sentFrom(o.from),
        })
    given = new Set(state.offerings)
  }

  return {
    /** What happened since the last reading. */
    read(): Array<News> {
      const news: Array<News> = []
      second += 1
      bonds(news)
      if (me < 0) return news
      strikes(news)
      gifts(news)
      news.push(...coups.read())
      return news
    },
  }
}
