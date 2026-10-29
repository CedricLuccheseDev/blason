import {
  LEVELS,
  MAP_SIZES,
  SETUP_LIMITS,
  TICKS_PER_SECOND,
} from '../../../engine'
import { Act } from '../hud/Act'
import { Sheet } from '../hud/Sheet'
import { Head, Seats, Setting, stepped } from './BookParts'
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
  running,
  onChange,
  onAnother,
  onLaunch,
  onClose,
  onRestart,
  onQuit,
}: Readonly<{
  book: Book
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
      <Act onClick={onLaunch}>
        <span className="px-8 text-hud-l">{m.launch}</span>
      </Act>
    </>
  ) : (
    <>
      <Act tone="plain" onClick={onQuit}>
        {m.quit}
      </Act>
      <Act onClick={onRestart}>
        <span className="px-8 text-hud-l">{m.restart}</span>
      </Act>
    </>
  )
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-quill/50 p-3">
      <Sheet className="flex max-h-full w-full max-w-[calc(820px*var(--hud))] flex-col gap-4 overflow-y-auto px-6 py-5 max-sm:px-4">
        {!lobby && (
          <button
            type="button"
            onClick={onClose}
            className="hud-note hud-press absolute top-3 right-4 min-h-11 cursor-pointer"
          >
            {m.close}
          </button>
        )}
        <div className="grid gap-6 sm:grid-cols-[1fr_auto_1fr]">
          <section className="flex min-w-0 flex-col gap-3">
            <Head kicker={lobby ? m.yours : m.going(running)} title={m.land} />
            <LandPlate seed={book.seed} size={book.size} label={m.land} />
            <Setting
              name={m.size}
              value={m.sizes[book.size]}
              onStep={(by) => set({ size: stepped(SIZES, book.size, by) })}
            />
            <div className="flex items-center justify-center gap-2">
              <span className="hud-note">{m.or}</span>
              <Act tone="plain" onClick={onAnother}>
                {m.another}
              </Act>
            </div>
          </section>
          <span aria-hidden="true" className="w-px bg-quill/35 max-sm:hidden" />
          <section className="flex min-w-0 flex-col gap-3">
            <Head kicker={m.seated(book.bots)} title={m.lords} />
            <Seats book={book} />
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
            {!lobby && <p className="hud-note text-center">{m.next}</p>}
          </section>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 border-t border-gilt/50 pt-3">
          {foot}
        </div>
      </Sheet>
    </div>
  )
}
