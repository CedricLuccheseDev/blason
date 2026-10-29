import type { Coup, GameState, Strike } from '../../engine'

// The coups in the player's news (news.ts), each at the land it aims at:
// one launched at him, told the second it leaves, so that he has its flight
// or its walk to answer; his troublemaker stopped by the army of the lord he
// walked on; a land risen, his own against him or another's to his rebels.

export type CoupNews =
  | { kind: 'coup'; lord: number; coup: Coup; tile: number }
  | { kind: 'stopped'; lord: number; tile: number }
  | { kind: 'rose'; lord: number; mine: boolean; tile: number }

export function makeCoupNews(state: GameState, me: number) {
  let flying = new Set<Strike>(state.strikes)

  /** A troublemaker gone since the last reading, as the player hears of it, if he does. */
  function ended(s: Strike): CoupNews | null {
    if (!state.players[s.owner].alive || s.victim < 0) return null
    const fell = state.tick >= s.lands
    if (!fell)
      return s.owner === me
        ? { kind: 'stopped', lord: s.victim, tile: s.target }
        : null
    if (s.victim === me)
      return { kind: 'rose', lord: s.owner, mine: true, tile: s.target }
    if (s.owner === me)
      return { kind: 'rose', lord: s.victim, mine: false, tile: s.target }
    return null
  }

  return {
    /** What the coups did since the last reading. */
    read(): Array<CoupNews> {
      const news: Array<CoupNews> = []
      const now = new Set(state.strikes)
      for (const s of now)
        if (!flying.has(s) && s.victim === me && s.owner !== me)
          news.push({
            kind: 'coup',
            lord: s.owner,
            coup: s.coup,
            tile: s.target,
          })
      for (const s of flying) {
        const told = !now.has(s) && s.coup === 'troublemaker' ? ended(s) : null
        if (told) news.push(told)
      }
      flying = now
      return news
    },
  }
}
