import {
  LEVELS,
  MAP_SIZES,
  SETUP_LIMITS,
  TICKS_PER_SECOND,
} from '../../../engine'
import { Act, Tap } from '../hud/Act'
import { Inline, Panel, Ruled, Spread, Veil } from '../hud/Layout'
import { Note } from '../hud/Text'
import { Head, Invite, Seats, Setting, stepped } from './BookParts'
import type { ReactNode } from 'react'
import type { Book, Level, MapSize } from '../../../engine'
import { LandPlate } from '~/components/home/LandPlate'
import { useMessages } from '~/i18n'

// The book of the game (Concept, 29/10: « dans les 2 cas on est en game »,
// then « créer une partie doit envoyer directement dans le lobby »): one
// object, open on two pages over the game, a veil over the rest. Before the
// launch it is the host's lobby, open of itself: the land, its size or
// another one; the lords, his bots, their level, the teams, the planting;
// « Lancer la partie ». After it, his menu: the same settings for the next
// land, « Recommencer », « Quitter ». The book's button (BookButton) opens
// it again.

const SIZES = Object.keys(MAP_SIZES) as Array<MapSize>
const TEAMS = [0, 2, 3, 4] as const
/** The plantings offered, in seconds, within the setup's bounds. */
const OPENINGS = [10, 20, 30, 45, 60] as const

export function GameBook({
  book,
  code,
  running,
  onChange,
  onAnother,
  onLaunch,
  onClose,
  onRestart,
  onQuit,
}: Readonly<{
  book: Book
  /** The room's code to give friends; none without a relay. */
  code: string | null
  /** The game's minutes, once launched; the lobby before. */
  running: number | null
  onChange: (book: Book) => void
  onAnother: () => void
  onLaunch: () => void
  onClose: () => void
  onRestart: () => void
  onQuit: () => void
}>) {
  const m = useMessages().book
  const set = (part: Partial<Book>) => onChange({ ...book, ...part })
  const lobby = running === null
  const seconds = Math.round(book.opening / TICKS_PER_SECOND)
  const bots = Array.from({ length: SETUP_LIMITS.seats.max }, (_, i) => i)
  const foot: ReactNode = lobby ? (
    <>
      <Act tone="plain" onClick={onClose}>
        {m.see}
      </Act>
      <Act call onClick={onLaunch}>
        {m.launch}
      </Act>
    </>
  ) : (
    <>
      <Act tone="plain" onClick={onQuit}>
        {m.quit}
      </Act>
      <Act call onClick={onRestart}>
        {m.restart}
      </Act>
    </>
  )
  return (
    <Veil onClose={onClose}>
      <Panel
        page
        gap="piece"
        className="relative max-h-full w-full max-w-[calc(820px*var(--hud))] overflow-y-auto"
      >
        {!lobby && (
          <span className="absolute top-2 right-3">
            <Tap onClick={onClose}>
              <Note className="text-current">{m.close}</Note>
            </Tap>
          </span>
        )}
        <Spread
          left={
            <>
              <Head
                kicker={lobby ? m.yours : m.going(running)}
                title={m.land}
              />
              <LandPlate seed={book.seed} size={book.size} label={m.land} />
              <Setting
                name={m.size}
                value={m.sizes[book.size]}
                onStep={(by) => set({ size: stepped(SIZES, book.size, by) })}
              />
              <Inline justify="center">
                <Note>{m.or}</Note>
                <Act tone="plain" onClick={onAnother}>
                  {m.another}
                </Act>
              </Inline>
            </>
          }
          right={
            <>
              <Head
                kicker={m.seated(book.bots, book.guests ?? 0)}
                title={m.lords}
              />
              <Seats book={book} />
              {code && <Invite code={code} />}
              <Setting
                name={m.bots}
                value={String(book.bots)}
                onStep={(by) => set({ bots: stepped(bots, book.bots, by) })}
              />
              <Setting
                name={m.level}
                value={m.levels[book.level]}
                onStep={(by) =>
                  set({ level: stepped<Level>(LEVELS, book.level, by) })
                }
              />
              <Setting
                name={m.teams}
                value={book.teams ? String(book.teams) : m.none}
                onStep={(by) =>
                  set({ teams: stepped<number>(TEAMS, book.teams, by) })
                }
              />
              <Setting
                name={m.opening}
                value={m.seconds(seconds)}
                onStep={(by) =>
                  set({
                    opening:
                      stepped<number>(OPENINGS, seconds, by) * TICKS_PER_SECOND,
                  })
                }
              />
              {!lobby && <Note className="text-center">{m.next}</Note>}
            </>
          }
        />
        <Ruled>{foot}</Ruled>
      </Panel>
    </Veil>
  )
}
