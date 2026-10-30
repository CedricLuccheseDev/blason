import { Countdown } from './Countdown'
import { LandPlate } from './LandPlate'
import { RoomTrouble, Seats } from './Seats'
import { atPublic } from './useRoom'
import { useUpcoming } from './useUpcoming'
import { Icon } from '../hud/Figure'
import type { ReactNode } from 'react'
import type { Room, RoomActions } from './useRoom'
import type { Land } from '../../../engine'
import { Act } from '~/components/hud/Act'
import { Inline, Panel, Stack } from '~/components/hud/Layout'
import { Heading, Note } from '~/components/hud/Text'
import { useMessages } from '~/i18n'

// The public game, the biggest thing on the home as on OpenFront's: a card
// whose body is the land of the game being planted now, drawn from its seed,
// with its title, the time left to join it and its seats laid on it as a
// map's cartouches, and Play on it too, at its corner; a click anywhere on
// the land plays as well. There is no room to wait in: the
// relay keeps one public game in its opening (server/rooms.ts), the home asks
// it about it while shown (useUpcoming.ts), and Play goes straight into that
// opening, to plant a standard. A game has no bot: one who came alone sees
// its opening begin again, and the card says a lord is waiting. When no one
// may come in any more, the next is shown, its land fading in. What failed
// says why, and Play tries again.

/** A cartouche laid on the land, at one of its corners; a click goes through it to the land. */
function Cartouche({
  at,
  children,
}: Readonly<{ at: string; children: ReactNode }>) {
  return (
    <div className={`pointer-events-none absolute ${at}`}>
      <Panel>
        <Inline gap="part">{children}</Inline>
      </Panel>
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
  const m = useMessages()
  const t = m.home
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
  // The public games turn through every map (server/rooms.ts): its own, or a random land at its size.
  const land: Land = game?.map
    ? { kind: 'real', map: game.map }
    : { kind: 'drawn', size: game?.size ?? 'standard' }
  const landName =
    land.kind === 'real' ? m.book.lands[land.map] : m.book.random[land.size]
  let word = t.public.play
  if (entering) word = t.public.entering
  else if (failed) word = t.room.retry
  return (
    <Panel gap="part">
      <LandPlate seed={game?.seed ?? null} land={land} label={t.public.land}>
        {/* The whole land is played on (« on peut cliquer sur la carte directement »); Play stays the button for the keyboard. */}
        {(ready || failed) && (
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            onClick={() => rooms.join(null)}
            className="absolute inset-0 cursor-pointer transition-colors duration-(--duration-hud-press) ease-hud hover:bg-gilt/10 motion-reduce:transition-none"
          />
        )}
        <Cartouche at="top-2 left-2">
          <h2>
            <Stack gap="hair">
              <Heading>{t.public.title}</Heading>
              {/* One alone in the last opening waits in this one: said even on a phone, it is why to play now. */}
              {game && game.waiting > 0 && <Note>{t.public.waiting}</Note>}
              {/* Its land's name (« écris le nom de la map sur partie publique »). */}
              {game && game.waiting === 0 && (
                <Note className="max-sm:hidden">{landName}</Note>
              )}
            </Stack>
          </h2>
        </Cartouche>
        {game && (
          <Cartouche at="top-2 right-2">
            <Note className="max-sm:hidden">{t.public.closesIn}</Note>
            <Countdown ms={game.startsIn} at={heard.at} />
          </Cartouche>
        )}
        <div aria-live="polite">
          {status && <Cartouche at="bottom-2 left-2">{status}</Cartouche>}
        </div>
        {/* Play on the land itself, at its corner (« fais le play dans la carte directement »). */}
        <div
          className={`absolute right-2 bottom-2 ${ready || failed ? '' : 'opacity-50'}`}
        >
          <Act call asleep={!ready && !failed} onClick={() => rooms.join(null)}>
            <Icon name="horn" size={20} />
            {word}
          </Act>
        </div>
      </LandPlate>
    </Panel>
  )
}
