import { LEVELS, SETUP_LIMITS, TICKS_PER_SECOND } from '../../../engine'
import { Act, Tap } from '../hud/Act'
import { Inline, Panel, Ruled, Spread, Stack, Veil } from '../hud/Layout'
import { Note } from '../hud/Text'
import { Head, Invite, Seats, Setting, stepped } from './BookParts'
import { MapList } from './MapList'
import type { ReactNode } from 'react'
import type { Book, Level } from '../../../engine'
import { useMessages } from '~/i18n'

// The book of the game (Concept, 29/10: « dans les 2 cas on est en game »,
// then « créer une partie doit envoyer directement dans le lobby »): one
// object, open on two pages over the game, a veil over the rest. Before the
// launch it is the host's lobby, open of itself: the land, its size or
// another one; the lords, his bots, their level, the teams, the planting;
// « Lancer la partie ». The land is one of a list of cards (MapList.tsx),
// each its own size (« Fais pas de mode carte moyenne grosse tout ça, chaque
// carte a sa propre taille »), the smallest first, its size and the lords it
// suits said under it, and whether it suits this game. After it, his menu: the same settings for the next
// land, « Recommencer », « Quitter ». The book's button (BookButton) opens
// it again.

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
  guest,
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
  /** A guest's book, to read: what his room says (waiting for the host, or why it failed), no setting his to change. */
  guest?: { status: string }
}>) {
  const m = useMessages().book
  const set = (part: Partial<Book>) => onChange({ ...book, ...part })
  const lobby = running === null
  const seconds = Math.round(book.opening / TICKS_PER_SECOND)
  // As many bots as the seats the guests leave.
  const bots = Array.from(
    { length: SETUP_LIMITS.seats.max - (book.guests ?? 0) },
    (_, i) => i,
  )
  // A guest reads the settings; the host sets them.
  const Choice = guest ? Fixed : Setting
  const hosts: ReactNode = lobby ? (
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
  const foot: ReactNode = guest ? (
    <Stack gap="part" align="center">
      <Note>{guest.status}</Note>
      <Inline gap="piece" justify="center">
        <Act tone="plain" onClick={onQuit}>
          {m.quit}
        </Act>
        <Act tone="plain" onClick={onClose}>
          {m.see}
        </Act>
      </Inline>
    </Stack>
  ) : (
    hosts
  )
  const kicker = lobby ? m.yours : m.going(running)
  return (
    <Veil onClose={onClose}>
      <Panel
        page
        scroll
        gap="piece"
        className="relative max-h-full w-full max-w-[calc(820px*var(--hud))]"
      >
        {!lobby && !guest && (
          <span className="absolute top-2 right-3">
            <Tap onClick={onClose}>
              <Note className="text-current">{m.close}</Note>
            </Tap>
          </span>
        )}
        <Spread
          left={
            <>
              <Head kicker={guest ? m.hostGame : kicker} title={m.land} />
              <MapList
                book={book}
                onPick={guest ? undefined : (land) => set({ land })}
              />
              {/* Another seed draws another invented land; the Earth's is the Earth's. */}
              {!guest && book.land.kind === 'drawn' && (
                <Inline justify="center">
                  <Note>{m.or}</Note>
                  <Act tone="plain" onClick={onAnother}>
                    {m.another}
                  </Act>
                </Inline>
              )}
            </>
          }
          right={
            <>
              <Head
                kicker={
                  guest
                    ? m.seatedGuest(book.bots, book.guests ?? 0)
                    : m.seated(book.bots, book.guests ?? 0)
                }
                title={m.lords}
              />
              <Seats book={book} />
              {code && <Invite code={code} />}
              <Choice
                name={m.bots}
                value={String(book.bots)}
                onStep={(by) => set({ bots: stepped(bots, book.bots, by) })}
              />
              <Choice
                name={m.level}
                value={m.levels[book.level]}
                onStep={(by) =>
                  set({ level: stepped<Level>(LEVELS, book.level, by) })
                }
              />
              <Choice
                name={m.teams}
                value={book.teams ? String(book.teams) : m.none}
                onStep={(by) =>
                  set({ teams: stepped<number>(TEAMS, book.teams, by) })
                }
              />
              <Choice
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

/** A setting as a guest reads it: its name and its value, no arrows. */
function Fixed({
  name,
  value,
}: Readonly<{ name: string; value: string; onStep?: unknown }>) {
  return <Setting name={name} value={value} />
}
