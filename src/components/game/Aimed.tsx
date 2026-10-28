import { StandingBadge } from '../hud/Emblem'
import { Figure } from '../hud/Figure'
import { count } from './format'
import { LordSheet } from './LordSheet'
import { standingsOf } from './standing'
import type { Standing } from '../hud/Emblem'

import type { Aim, Summary } from '~/render/client'
import { useMessages } from '~/i18n'

/** The word beside each badge, in its colour. */
const TONES: Record<Standing, string> = {
  ally: 'text-pact',
  foe: 'text-gules',
  felon: 'text-gules-deep',
}

/**
 * Bottom left, the lord under the pointer: his shield and name, his share of
 * the land and his men, and how he stands with the player (ally, at war,
 * traitor).
 */
export function Aimed({
  aim,
  summary,
}: Readonly<{ aim: Aim | null; summary: Summary }>) {
  const m = useMessages()
  const lord = aim?.lord == null ? null : summary.lords[aim.lord]
  if (!lord || !lord.alive) return null
  return (
    <LordSheet
      lord={lord}
      aside={
        <Figure size="s" tone="dim">
          {m.game.percent(lord.share)}
        </Figure>
      }
    >
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Figure icon="soldier" size="s">
          {count(lord.men)}
        </Figure>
        {standingsOf(lord, m).map(({ standing, label }) => (
          <span
            key={standing}
            className={`hud-note flex items-center gap-1 ${TONES[standing]}`}
          >
            <StandingBadge standing={standing} />
            {label}
          </span>
        ))}
      </span>
    </LordSheet>
  )
}
