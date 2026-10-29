import { Countdown } from './Countdown'
import { LandPlate } from './LandPlate'
import { RoomTrouble, Seats } from './Seats'
import { atPublic } from './useRoom'
import { useUpcoming } from './useUpcoming'
import type { ReactNode } from 'react'
import type { Room, RoomActions } from './useRoom'
import { Act } from '~/components/hud/Act'
import { Sheet } from '~/components/hud/Sheet'
import { useMessages } from '~/i18n'

// The public game, the biggest thing on the home as on OpenFront's: a card
// whose body is the land of the game being planted now, drawn from its seed,
// with its title, the time left to join it and its seats laid on it as a
// map's cartouches, and across it, Play. There is no room to wait in: the
// relay keeps one public game in its opening (server/rooms.ts), the home asks
// it about it while shown (useUpcoming.ts), and Play goes straight into that
// opening, to plant a standard. When no one may come in any more, the next
// is shown, its land fading in. What failed says why, and Play tries again.

/** A cartouche laid on the land, at one of its corners. */
function Cartouche({
  at,
  children,
}: Readonly<{ at: string; children: ReactNode }>) {
  return (
    <div className={`absolute ${at}`}>
      <Sheet className="flex items-center gap-3 px-3 py-2">{children}</Sheet>
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
  const game = heard.lost ? null : heard.game
  const here = atPublic(room)
  const entering = here && room.status === 'joining'
  const failed = here && room.status === 'error'
  const ready = online && game !== null && !entering
  // Under the land, the seats taken; or what failed, or why no game is shown.
  let status: ReactNode = game && <Seats taken={game.taken} brief />
  if (failed) status = <RoomTrouble room={room} />
  else if (!online) status = <p className="hud-note">{t.room.unavailable}</p>
  else if (heard.lost) status = <p className="hud-note">{t.public.lost}</p>
  let word = t.public.play
  if (entering) word = t.public.entering
  else if (failed) word = t.room.retry
  return (
    <Sheet className="flex flex-col gap-3 p-3">
      <LandPlate
        seed={game?.seed ?? null}
        size={game?.size ?? 'standard'}
        label={t.public.land}
      >
        <Cartouche at="top-2 left-2">
          <h2 className="flex flex-col gap-1">
            <span className="font-caps text-hud-l leading-none text-quill">
              {t.public.title}
            </span>
            {game && (
              <span className="hud-note max-sm:hidden">{t.public.live}</span>
            )}
          </h2>
        </Cartouche>
        {game && (
          <Cartouche at="top-2 right-2">
            <span className="hud-note max-sm:hidden">{t.public.closesIn}</span>
            <Countdown ms={game.closesIn} at={heard.at} />
          </Cartouche>
        )}
        <div aria-live="polite">
          {status && <Cartouche at="bottom-2 left-2">{status}</Cartouche>}
        </div>
      </LandPlate>
      <div className={ready || failed ? 'grid' : 'grid opacity-50'}>
        <Act asleep={!ready && !failed} onClick={() => rooms.join(null)}>
          <span className="text-hud-l">{word}</span>
        </Act>
      </div>
    </Sheet>
  )
}
