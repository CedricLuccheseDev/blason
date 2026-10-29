import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Act, actClass } from '../hud/Act'
import { Inline, Panel } from '../hud/Layout'
import { Title } from '../hud/Text'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

/** The end, under the race: the winner, my fall. */
export function Moment({
  summary,
  online = false,
}: Readonly<{ summary: Summary; online?: boolean }>) {
  const m = useMessages()
  const [dismissed, setDismissed] = useState(false)
  const { me, opening, winner } = summary
  // The opening is told in the race's place (Race.tsx).
  if (opening !== null) return null
  const fallen = me && !me.alive
  // Watching the end hides the fall, never the winner.
  if (!winner && (dismissed || !fallen)) return null
  let title = winner ? `${m.game.colors[winner]} ${m.game.winner}` : ''
  if (summary.won) title = m.game.victory
  else if (fallen) title = m.game.fallen
  return (
    <Panel page gap="part" className="items-center">
      <span aria-live="polite">
        <Title>{title}</Title>
      </span>
      <Inline>
        <Link to={online ? '/' : '/play'} reloadDocument className={actClass()}>
          {m.game.playAgain}
        </Link>
        {fallen && !winner && (
          <Act tone="plain" onClick={() => setDismissed(true)}>
            {m.game.watchEnd}
          </Act>
        )}
      </Inline>
    </Panel>
  )
}
