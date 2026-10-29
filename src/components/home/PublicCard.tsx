import { Countdown } from './Countdown'
import { LandPlate } from './LandPlate'
import { RoomTrouble, Seats } from './Seats'
import { atPublic } from './useRoom'
import { useUpcoming } from './useUpcoming'
import type { ReactNode } from 'react'
import type { MapSize } from '../../../engine'
import type { Heard } from './useUpcoming'
import type { Room, RoomActions } from './useRoom'
import { Act } from '~/components/hud/Act'
import { Sheet } from '~/components/hud/Sheet'
import { useMessages } from '~/i18n'

// The next public game, the biggest thing on the home as on OpenFront's: a
// card whose body is the game's land, drawn from its seed, its title and its
// clock laid on it as a map's cartouches; under it the seats taken, and one
// click to sit. The relay opens one every minute (server/rooms.ts), the
// home asks it about it while shown (useUpcoming.ts), and once seated hears
// its room live; it starts by itself, and the home then goes to the game.
// A room that failed says why, and the same button tries again.

type Shown = {
  seed: string
  size: MapSize
  startsIn: number | null
  at: number
  taken: number
}

/** The public game the card shows, as the relay tells it. */
function shownGame(heard: Heard): Shown | null {
  if (!heard.game || heard.lost) return null
  return { ...heard.game, startsIn: heard.game.closesIn, at: heard.at }
}

/** Under the land: its seats; or the seat being taken, or why it failed; or why there is no game to show. */
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
  if (atPublic(room)) return <RoomTrouble room={room} />
  if (game) return <Seats taken={game.taken} />
  if (!online) return <p className="hud-note">{t.room.unavailable}</p>
  return lost ? <p className="hud-note">{t.public.lost}</p> : null
}

/** A cartouche laid on the land, at one of its corners. */
function Cartouche({
  at,
  children,
}: Readonly<{ at: string; children: ReactNode }>) {
  return (
    <div className={`absolute ${at}`}>
      <Sheet className="flex items-baseline gap-2 px-3 py-2">{children}</Sheet>
    </div>
  )
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
  const game = shownGame(heard)
  const here = atPublic(room)
  const sitting = here && room.status !== 'error'
  const title = (
    <h2 className="font-caps text-hud-l leading-none text-quill">
      {t.public.title}
    </h2>
  )
  return (
    <Sheet className="flex flex-col gap-3 p-3">
      {online ? (
        <LandPlate
          seed={game?.seed ?? null}
          size={game?.size ?? 'standard'}
          label={t.public.land}
        >
          <Cartouche at="top-2 left-2">{title}</Cartouche>
          {game && game.startsIn !== null && (
            <Cartouche at="right-2 bottom-2">
              <span className="hud-note">{t.public.startsIn}</span>
              <Countdown startsIn={game.startsIn} at={game.at} />
            </Cartouche>
          )}
        </LandPlate>
      ) : (
        title
      )}
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
