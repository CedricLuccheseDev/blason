import type { GameState, Work } from '../../engine'

// The news, for the player's letters: who strikes him, who took one of his
// works (at once: a village, a market lost must never go unseen), an ally
// who broke faith, a lord who fell, and once a fight with a lord is over, what he took
// from him and lost to him in all; never the same letter every second. Read
// once a second by comparing the game with the second before.

export type News =
  | { kind: 'attacked'; lord: number }
  | { kind: 'took'; lord: number; tiles: number }
  | { kind: 'lost'; lord: number; tiles: number }
  | { kind: 'betrayed'; lord: number }
  | { kind: 'fell'; lord: number }
  | { kind: 'seized'; lord: number; works: Partial<Record<Work, number>> }

/** Below so many tiles in a fight, a change of hands is not news. */
const NOTABLE = 20
/** Seconds without a tile changing hands with a lord before the fight with him is told. */
const QUIET = 3
/** Seconds a lord who struck may strike again before it is news once more. */
const AGAIN = 30

export function makeNews(state: GameState, me: number) {
  let owner = Int32Array.from(state.owner)
  /** When each lord last had an army against me, in seconds read. */
  const struck = new Map<number, number>()
  /** Each running fight: the tiles taken and lost with a lord, and the seconds since one changed hands. */
  const fights = new Map<
    number,
    { took: number; lost: number; still: number }
  >()
  let second = 0
  let allies = new Set<number>()
  /** My works at the last reading, by their tile. */
  let held = new Map<number, Work>()
  let alive = state.players.map((p) => p.alive)

  const alliesOf = () =>
    new Set(
      state.alliances.flatMap((x) => {
        if (x.a === me) return [x.b]
        return x.b === me ? [x.a] : []
      }),
    )

  /** The lords whose armies come for me, told once, and again only after a while. */
  function strikes(news: Array<News>) {
    for (const host of state.hosts) {
      if (host.target !== me) continue
      const last = struck.get(host.owner)
      if (last === undefined || second - last > AGAIN)
        news.push({ kind: 'attacked', lord: host.owner })
      struck.set(host.owner, second)
    }
  }

  /** The tiles changing hands with each lord counted; a fight gone quiet told in all. */
  function exchanges(news: Array<News>) {
    for (const fight of fights.values()) fight.still += 1
    state.owner.forEach((o, t) => {
      const was = owner[t]
      const mine = o === me
      if (o === was || (!mine && was !== me)) return
      const lord = mine ? was : o
      if (lord < 0) return
      const fight = fights.get(lord) ?? { took: 0, lost: 0, still: 0 }
      if (mine) fight.took += 1
      else fight.lost += 1
      fight.still = 0
      fights.set(lord, fight)
    })
    owner = Int32Array.from(state.owner)
    for (const [lord, fight] of fights) {
      if (fight.still < QUIET) continue
      fights.delete(lord)
      if (fight.took >= NOTABLE)
        news.push({ kind: 'took', lord, tiles: fight.took })
      if (fight.lost >= NOTABLE)
        news.push({ kind: 'lost', lord, tiles: fight.lost })
    }
  }

  /** My works another lord took since the last reading, told at once, by lord. */
  function seizures(news: Array<News>) {
    const by = new Map<number, Partial<Record<Work, number>>>()
    for (const work of state.works) {
      const was = held.get(work.tile)
      if (was !== work.work || work.owner === me) continue
      const works = by.get(work.owner) ?? {}
      works[work.work] = (works[work.work] ?? 0) + 1
      by.set(work.owner, works)
    }
    for (const [lord, works] of by) news.push({ kind: 'seized', lord, works })
    held = new Map(
      state.works.filter((w) => w.owner === me).map((w) => [w.tile, w.work]),
    )
  }

  /** What happened since the last reading. */
  function read(): Array<News> {
    if (me < 0) return []
    const news: Array<News> = []
    second += 1
    seizures(news)
    strikes(news)
    exchanges(news)
    const bound = alliesOf()
    for (const lord of allies)
      if (!bound.has(lord) && state.players[lord].felonUntil > state.tick)
        news.push({ kind: 'betrayed', lord })
    allies = bound
    state.players.forEach((p, lord) => {
      if (alive[lord] && !p.alive && lord !== me)
        news.push({ kind: 'fell', lord })
    })
    alive = state.players.map((p) => p.alive)
    return news
  }

  return { read }
}
