import { SEATS } from '../../../net/protocol'
import type { Room } from './useRoom'
import { Shield } from '~/components/hud/Emblem'
import { Figure } from '~/components/hud/Figure'
import { Inline } from '~/components/hud/Layout'
import { Note } from '~/components/hud/Text'
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
    <Inline gap="part" justify="between" wrap>
      <span className={brief ? 'max-sm:hidden' : ''} aria-hidden="true">
        <Inline gap="hair">
          {Array.from({ length: taken }, (_, i) => (
            <Shield key={i} size="s" color={seatColour(i)} />
          ))}
        </Inline>
      </span>
      <Inline>
        <Note>{t.seated}</Note>
        <Figure icon="soldier" size="l">
          {taken} / {SEATS}
        </Figure>
      </Inline>
    </Inline>
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
