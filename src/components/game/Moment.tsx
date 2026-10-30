import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Act, actClass } from '../hud/Act'
import { Figure } from '../hud/Figure'
import { Line, Panel, Ruled, Stack, Veil } from '../hud/Layout'
import { Heading, Note, Title } from '../hud/Text'
import { count, minutes } from './format'
import type { Summary } from '~/render/client'
import type { Deeds } from '~/render/record'
import { useMessages } from '~/i18n'

/**
 * The end, a sheet over the map under its veil (« fais une vrai modal avec
 * les stats de la partie »): the winner, or my fall, then my course through
 * the game in ruled lines, as the book's settings are (« Mon parcours »):
 * the time played, my land at its widest, my place, my peasants at their
 * most, the gold I gained; then play again, leave for the home page (« il
 * faut le bouton quitter »), or, fallen, watch the end.
 */
export function Moment({
  summary,
  online = false,
}: Readonly<{ summary: Summary; online?: boolean }>) {
  const m = useMessages()
  const [dismissed, setDismissed] = useState(false)
  const { me, opening, winner, record } = summary
  // The opening is told in the race's place (Race.tsx).
  if (opening !== null || dismissed) return null
  const fallen = me && !me.alive
  if (!winner && !fallen) return null
  let title = winner ? `${m.game.colors[winner]} ${m.game.winner}` : ''
  if (summary.won) title = m.game.victory
  else if (fallen) title = m.game.fallen
  const watch = () => setDismissed(true)
  return (
    <Veil onClose={fallen && !winner ? watch : undefined}>
      <Panel page gap="piece" className="w-full max-w-[calc(460px*var(--hud))]">
        <span aria-live="polite" className="text-center">
          <Title>{title}</Title>
        </span>
        {me && record && <Course deeds={record} />}
        <Ruled>
          <Link
            to={online ? '/' : '/play'}
            reloadDocument
            className={actClass()}
          >
            {m.game.playAgain}
          </Link>
          {!online && (
            <Link to="/" reloadDocument className={actClass('plain')}>
              {m.game.quit}
            </Link>
          )}
          {fallen && !winner && (
            <Act tone="plain" onClick={watch}>
              {m.game.watchEnd}
            </Act>
          )}
        </Ruled>
      </Panel>
    </Veil>
  )
}

/** My course through the game, a ruled line a figure. */
function Course({ deeds }: Readonly<{ deeds: Deeds }>) {
  const t = useMessages().game.deeds
  return (
    <Stack gap="hair">
      <Heading>{t.title}</Heading>
      <Line name={<Note>{t.played}</Note>}>
        <Figure icon="hourglass" size="m">
          {minutes(deeds.seconds)}
        </Figure>
      </Line>
      <Line name={<Note>{t.widest}</Note>}>
        <Figure size="m">{t.land(deeds.share, count(deeds.tiles))}</Figure>
      </Line>
      <Line name={<Note>{t.place}</Note>}>
        <Figure size="m">{t.rank(deeds.place, deeds.lords)}</Figure>
      </Line>
      <Line name={<Note>{t.peasants}</Note>}>
        <Figure icon="soldier" size="m">
          {count(deeds.peasants)}
        </Figure>
      </Line>
      <Line name={<Note>{t.gold}</Note>}>
        <Figure icon="coins" size="m">
          {count(deeds.gold)}
        </Figure>
      </Line>
    </Stack>
  )
}
