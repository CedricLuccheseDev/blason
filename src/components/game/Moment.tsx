import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Act, actClass } from '../hud/Act'
import { Figure } from '../hud/Figure'
import { Rule, Sheet } from '../hud/Sheet'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

/** The opening and the end, under the race. */
export function Moment({
  summary,
  online = false,
}: Readonly<{ summary: Summary; online?: boolean }>) {
  const m = useMessages()
  const [dismissed, setDismissed] = useState(false)
  const { me, opening, winner } = summary
  if (opening !== null) {
    // The player before and after planting his standard; a spectator watches them planted.
    let [title, hint] = [m.game.others, '']
    if (me && !me.picked) [title, hint] = [m.game.choose, m.game.chooseHint]
    else if (me) [title, hint] = [m.game.planted, m.game.plantedHint]
    return (
      <Sheet className="flex items-center gap-4 px-6 py-4">
        <Figure size="xl">{opening}</Figure>
        <Rule />
        <div className="flex flex-col gap-1">
          <span className="hud-word text-hud-l">{title}</span>
          {hint && <span className="hud-note">{hint}</span>}
        </div>
      </Sheet>
    )
  }
  const fallen = me && !me.alive
  // Watching the end hides the fall, never the winner.
  if (!winner && (dismissed || !fallen)) return null
  let title = winner ? `${m.game.colors[winner]} ${m.game.winner}` : ''
  if (summary.won) title = m.game.victory
  else if (fallen) title = m.game.fallen
  return (
    <Sheet className="flex flex-col items-center gap-3 px-6 py-4">
      <span className="hud-word text-hud-xl" aria-live="polite">
        {title}
      </span>
      <div className="flex gap-2">
        <Link to={online ? '/' : '/play'} reloadDocument className={actClass()}>
          {m.game.playAgain}
        </Link>
        {fallen && !winner && (
          <Act tone="plain" onClick={() => setDismissed(true)}>
            {m.game.watchEnd}
          </Act>
        )}
      </div>
    </Sheet>
  )
}
