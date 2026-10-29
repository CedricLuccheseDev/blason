import { Countdown } from './Countdown'
import { RoomTrouble, Seats } from './Seats'
import { atPublic } from './useRoom'
import { useUpcoming } from './useUpcoming'
import type { Heard } from './useUpcoming'
import type { Room, RoomActions } from './useRoom'
import { Act } from '~/components/hud/Act'
import { Sheet } from '~/components/hud/Sheet'
import { useMessages } from '~/i18n'

// The next public game, the biggest thing on the home as on OpenFront's:
// its clock always running, the seats taken, and one click to sit at it.
// The relay opens one every minute (server/rooms.ts); the home asks it
// about it while shown (useUpcoming.ts), and once seated hears its room
// live. It starts by itself, and the home then goes to the game. A room
// that failed says why, and the same button tries again.

type Shown = { startsIn: number | null; at: number; taken: number }

/** The public game the card shows: the room sat at, told live; else the next, as the relay tells it. */
function shownGame(room: Room, heard: Heard): Shown | null {
  if (room.status === 'seated' && room.lobby.open) {
    const { startsIn, names } = room.lobby
    return { startsIn, at: room.heardAt, taken: names.length }
  }
  if (!heard.game || heard.lost) return null
  return { ...heard.game, at: heard.at }
}

/** Under the game: its seats; or the seat being taken, or why it failed; or why there is no game to show. */
function Status({
  room,
  game,
  online,
  lost,
}: Readonly<{
  room: Room
  game: Shown | null
  online: boolean
  lost: boolean
}>) {
  const t = useMessages().home
  if (atPublic(room) && room.status !== 'seated')
    return <RoomTrouble room={room} />
  if (game) return <Seats taken={game.taken} />
  if (!online) return <p className="hud-note">{t.room.unavailable}</p>
  return lost ? <p className="hud-note">{t.public.lost}</p> : null
}

export function PublicCard({
  room,
  rooms,
  online,
}: Readonly<{
  room: Room
  rooms: RoomActions
  /** Whether a relay is there to play online at all. */
  online: boolean
}>) {
  const t = useMessages().home
  const heard = useUpcoming()
  const game = shownGame(room, heard)
  const here = atPublic(room)
  const sitting = here && room.status !== 'error'
  return (
    <Sheet className="flex flex-col gap-3 p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-caps text-hud-xl leading-none text-quill">
            {t.public.title}
          </h2>
          <p className="hud-note">{t.public.line}</p>
        </div>
        {game && game.startsIn !== null && (
          <span className="flex shrink-0 flex-col items-end">
            <span className="hud-note">{t.public.startsIn}</span>
            <Countdown startsIn={game.startsIn} at={game.at} size="xl" />
          </span>
        )}
      </header>
      <div aria-live="polite">
        <Status room={room} game={game} online={online} lost={heard.lost} />
      </div>
      <div className={online ? 'grid' : 'grid opacity-50'}>
        {sitting ? (
          <Act tone="plain" onClick={rooms.leave}>
            {t.public.leave}
          </Act>
        ) : (
          <Act asleep={!online} onClick={() => rooms.join(null)}>
            <span className="text-hud-l">
              {here ? t.room.retry : t.public.join}
            </span>
          </Act>
        )}
      </div>
    </Sheet>
  )
}
