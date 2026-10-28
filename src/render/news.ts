import type { GameState } from '../../engine'

// The news of the last second, for the player's letters: who strikes him,
// what he took and lost and from whom, an ally who broke faith, a lord who
// fell. Read once a second by comparing the game with the second before.

export type News =
  | { kind: 'attacked'; lord: number }
  | { kind: 'took'; lord: number; tiles: number }
  | { kind: 'lost'; lord: number; tiles: number }
  | { kind: 'betrayed'; lord: number }
  | { kind: 'fell'; lord: number }

/** Below so many tiles in a second, a change of hands is not news. */
const NOTABLE = 20

export function makeNews(state: GameState, me: number) {
  let owner = Int32Array.from(state.owner)
  let attackers = new Set<number>()
  let allies = new Set<number>()
  let alive = state.players.map((p) => p.alive)

  const alliesOf = () =>
    new Set(
      state.alliances.flatMap((x) => {
        if (x.a === me) return [x.b]
        return x.b === me ? [x.a] : []
      }),
    )

  /** What happened since the last reading. */
  function read(): Array<News> {
    if (me < 0) return []
    const news: Array<News> = []
    const now = new Set(
      state.hosts.filter((h) => h.target === me).map((h) => h.owner),
    )
    for (const lord of now)
      if (!attackers.has(lord)) news.push({ kind: 'attacked', lord })
    attackers = now
    const took = new Map<number, number>()
    const lost = new Map<number, number>()
    state.owner.forEach((o, t) => {
      const was = owner[t]
      if (o === was) return
      if (o === me && was >= 0) took.set(was, (took.get(was) ?? 0) + 1)
      if (was === me && o >= 0) lost.set(o, (lost.get(o) ?? 0) + 1)
    })
    owner = Int32Array.from(state.owner)
    for (const [lord, tiles] of took)
      if (tiles >= NOTABLE) news.push({ kind: 'took', lord, tiles })
    for (const [lord, tiles] of lost)
      if (tiles >= NOTABLE) news.push({ kind: 'lost', lord, tiles })
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
