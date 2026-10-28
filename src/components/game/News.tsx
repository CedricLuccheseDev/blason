import { WORKS } from '../../../engine'
import { LordSheet } from './LordSheet'
import type { News } from '~/render/client'
import { PLAYERS } from '~/render/palette'
import { useMessages } from '~/i18n'

/** What is told in gules: what the player lost, or is about to. */
const GULES = new Set<News['kind']>(['seized', 'coup'])

/** A piece of news on the screen, with when it came, so that it may go. */
export type Letter = News & { id: number }

/**
 * Top right, under the emissaries' letters: what just happened to the
 * player, a lord's shield and name over what he did, for a few seconds;
 * in gules what he lost or is about to: works taken, a coup launched at
 * him, his land risen against him.
 */
export function Letters({ letters }: Readonly<{ letters: Array<Letter> }>) {
  const m = useMessages()
  const say = (n: News) => {
    if (n.kind === 'seized') {
      const lost = WORKS.flatMap((w) => {
        const count = n.works[w] ?? 0
        return count > 0 ? [m.news.works[w](count)] : []
      })
      const list =
        lost.length > 1
          ? `${lost.slice(0, -1).join(', ')} ${m.news.and} ${lost.at(-1)}`
          : lost.join('')
      return `${m.news.seized} ${list}`
    }
    if (n.kind === 'attacked') return m.news.attacked
    if (n.kind === 'took') return m.news.took(n.tiles)
    if (n.kind === 'lost') return m.news.lost(n.tiles)
    if (n.kind === 'betrayed') return m.news.betrayed
    if (n.kind === 'coup') return m.news.coup[n.coup]
    if (n.kind === 'stopped') return m.news.stopped
    if (n.kind === 'rose') return n.mine ? m.news.roseAgainst : m.news.roseFrom
    return m.news.fell
  }
  return letters.map((letter) => (
    <LordSheet key={letter.id} lord={PLAYERS[letter.lord]}>
      <span
        className={`hud-note ${GULES.has(letter.kind) || (letter.kind === 'rose' && letter.mine) ? 'text-gules' : ''}`}
      >
        {say(letter)}
      </span>
    </LordSheet>
  ))
}
