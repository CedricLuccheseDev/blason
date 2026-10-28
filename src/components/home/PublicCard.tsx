import { RoomTrouble, Seats } from './Seats'
import { atPublic, clock, leftOf } from './useRoom'
import type { Room, RoomActions } from './useRoom'
import { Act } from '~/components/hud/Act'
import { Figure } from '~/components/hud/Figure'
import { Sheet } from '~/components/hud/Sheet'
import { useMessages } from '~/i18n'

// The next public game, the biggest thing on the home as on OpenFront's:
// what it is, and one click to sit at it. Once seated, the room live: who
// sits and when it starts; it starts by itself (server/rooms.ts), and the
// home then goes to the game. A room that failed says why, and the same
// button tries again.

export function PublicCard({
  room,
  rooms,
  online,
  now,
}: Readonly<{
  room: Room
  rooms: RoomActions
  /** Whether a relay is there to play online at all. */
  online: boolean
  now: number
}>) {
  const t = useMessages().home
  const here = atPublic(room)
  const seated = here && room.status === 'seated' ? room.lobby : null
  const left = leftOf(room, now)
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
        {seated && left !== null && (
          <span className="flex shrink-0 flex-col items-end">
            <span className="hud-note">{t.public.startsIn}</span>
            <Figure icon="hourglass" size="xl">
              {clock(left)}
            </Figure>
          </span>
        )}
      </header>
      <div aria-live="polite">
        {seated && <Seats taken={seated.names.length} />}
        {here && !seated && <RoomTrouble room={room} />}
        {!here && (
          <p className="hud-note">
            {online ? t.public.when : t.room.unavailable}
          </p>
        )}
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
