import { StandingBadge } from '../hud/Emblem'
import { useCompact } from '../hud/useCompact'
import { Call, Word } from '../hud/Text'
import { PLAYERS } from '~/render/palette'
import { useMessages } from '~/i18n'

/**
 * A betrayal, the one cry to all: under the race, a banderole of gules cut
 * in a swallowtail, hemmed in gold, the felon's broken shield and who
 * betrayed whom, for a few seconds. On the map meanwhile the ribbon snaps
 * and the felon bears his badge, its ring the time he stays one.
 */
export function Banner({
  felon,
  victim,
}: Readonly<{ felon: number; victim: number }>) {
  const m = useMessages()
  // Smaller on a phone, under its compact race.
  const compact = useCompact()
  const name = (seat: number) => m.game.colors[PLAYERS[seat].key]
  return (
    <div className="hud-banner hud-life" role="status">
      <StandingBadge standing="felon" size={compact ? 's' : 'm'} />
      {compact ? (
        <Word className="text-current">
          {m.heralds.betrayed(name(felon), name(victim))}
        </Word>
      ) : (
        <Call className="text-current">
          {m.heralds.betrayed(name(felon), name(victim))}
        </Call>
      )}
    </div>
  )
}
