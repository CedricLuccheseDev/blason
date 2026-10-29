import { useNow } from './useNow'
import type { Size } from '~/components/hud/tokens'
import { minutes } from '~/components/game/format'
import { Figure } from '~/components/hud/Figure'

// The public game's clock, running every second, and only here: the ms it
// starts in as heard at a moment, less the time gone since.

export function Countdown({
  startsIn,
  at,
  size = 'l',
}: Readonly<{ startsIn: number; at: number; size?: Size }>) {
  const now = useNow()
  // A second's tick older than the answer counts nothing gone.
  const left = Math.max(0, startsIn - Math.max(0, now - at))
  return (
    <Figure icon="hourglass" size={size}>
      {minutes(Math.ceil(left / 1000))}
    </Figure>
  )
}
