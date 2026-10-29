import { SEATS } from '../../../net/protocol'
import type { Room } from './useRoom'
import { Shield } from '~/components/hud/Emblem'
import { Figure } from '~/components/hud/Figure'
import { useMessages } from '~/i18n'
import { PLAYERS } from '~/render/palette'

// A room's seats, as the public game and a private room show them: a shield
// for each one taken, in its lord's colour, and their count; and what a room
// that is not (or no longer) sat in says.

/** A seat's colour, as CSS. */
const seatColour = (seat: number) =>
  `#${PLAYERS[seat % PLAYERS.length].color.toString(16).padStart(6, '0')}`

/** The seats taken in a game, each a shield in its lord's colour, and their count; brief, the count alone on a phone. */
export function Seats({
  taken,
  brief = false,
}: Readonly<{ taken: number; brief?: boolean }>) {
  const t = useMessages().home.room
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span
        className={`flex gap-1 ${brief ? 'max-sm:hidden' : ''}`}
        aria-hidden="true"
      >
        {Array.from({ length: taken }, (_, i) => (
          <Shield key={i} size="s" color={seatColour(i)} />
        ))}
      </span>
      <span className="flex items-center gap-2">
        <span className="hud-note">{t.seated}</span>
        <Figure icon="soldier" size="l">
          {taken} / {SEATS}
        </Figure>
      </span>
    </div>
  )
}

/** What a room being joined, or that failed, says. */
export function RoomTrouble({ room }: Readonly<{ room: Room }>) {
  const t = useMessages().home.room
  if (room.status === 'error')
    return (
      <p className="hud-word" role="alert">
        {room.reason === 'lost' ? t.lost : t.errors[room.reason]}
      </p>
    )
  return (
    <p className="hud-note">
      {room.status === 'unavailable' ? t.unavailable : t.joining}
    </p>
  )
}
