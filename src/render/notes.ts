import { siteOf } from './marks'
import type { GameState } from '../../engine'
import type { Anchor } from './heralds'
import type { News } from './news'

// The news laid on the map where it happened (news.ts says what and
// where), for the HUD to write there a few seconds (Pennant.tsx): a lord
// biting the player's border, a coup falling on his land, his troublemaker
// stopped, a land risen, an offering given him. A betrayal is not here: it
// is cried to all under the race; nor an alliance offered me, which the
// herald's letter already brings (« y'a 2x propose une alliance »).

/** Seconds a piece of news stays on the map. */
const LIFE = 4

/** News a herald's letter already brings to the map (Heralds.tsx). */
const lettered = (n: News) => n.kind === 'pact' && n.how === 'offered'

type Note = {
  id: number
  news: News
  at: { x: number; y: number }
  born: number
}

export function makeNotes(state: GameState) {
  const live: Array<Note> = []
  let next = 0

  return {
    /** The news just read; those with a place are laid there from `now`, in seconds. */
    tell(news: Array<News>, now: number) {
      for (const n of news)
        if ('tile' in n && n.tile >= 0 && !lettered(n))
          live.push({
            id: next++,
            news: n,
            at: siteOf(state, n.tile),
            born: now,
          })
    },
    /** The news still on the map at `now`, in seconds. */
    anchors(now: number): Array<Anchor> {
      while (live.length > 0 && now - live[0].born > LIFE) live.shift()
      return live.map(({ id, news, at }) => ({
        key: `note:${id}`,
        kind: 'note',
        lord: news.lord,
        at,
        news,
      }))
    },
  }
}
