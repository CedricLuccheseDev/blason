import { Figure } from '../hud/Figure'
import { count } from './format'
import { LordSheet } from './LordSheet'
import type { Aim, Summary } from '~/render/client'
import { useMessages } from '~/i18n'

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
  const status = [
    lord.allied && m.lord.allied,
    lord.atWar && m.lord.atWar,
    lord.felon && m.lord.felon,
  ].filter(Boolean)
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
        {status.map((word) => (
          <span key={String(word)} className="hud-note">
            {word}
          </span>
        ))}
      </span>
    </LordSheet>
  )
}
