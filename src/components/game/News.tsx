import { LordSheet } from './LordSheet'
import type { News } from '~/render/client'
import { PLAYERS } from '~/render/palette'
import { useMessages } from '~/i18n'

/** A piece of news on the screen, with when it came, so that it may go. */
export type Letter = News & { id: number }

/**
 * Top right, under the emissaries' letters: what just happened to the
 * player, a lord's shield and name over what he did, for a few seconds.
 */
export function Letters({ letters }: Readonly<{ letters: Array<Letter> }>) {
  const m = useMessages()
  const say = (n: News) => {
    if (n.kind === 'attacked') return m.news.attacked
    if (n.kind === 'took') return m.news.took(n.tiles)
    if (n.kind === 'lost') return m.news.lost(n.tiles)
    if (n.kind === 'betrayed') return m.news.betrayed
    return m.news.fell
  }
  return letters.map((letter) => (
    <LordSheet key={letter.id} lord={PLAYERS[letter.lord]}>
      <span className="hud-note">{say(letter)}</span>
    </LordSheet>
  ))
}
